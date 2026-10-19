/* <vyom-rive> — the inline Vyom on the hosted design pages, drawn from the app's own `vyom.riv`.
   Installed by scripts/import-design.mjs in place of the design package's loader of the same name.

   The package's loader drew a separate 1000×1000 mascot artboard, fitted into the host box. Vyom has
   one file in this app: the screen-sized `VyomCanvas` artboard the stage uses, positioned through its
   ViewModel. So this element gives that artboard a canvas of its own, parks him at its centre, and
   sizes him with the artboard's two scale triggers instead of a second drawing:

     <vyom-rive scale="small">   scaleSmall — the dock-sized Vyom (~85px)
     <vyom-rive scale="full">    scaleFull  — the hero-sized Vyom (~160px)

   Left unset, the host box decides: 90px and up is `full`, smaller is `small`. The host keeps the
   box the page laid out for it; the canvas is larger and centred on it, so the character and his
   idle motion have room around the box. The scale trigger goes out first, while he is still hidden,
   and `appear` follows a beat later — a trigger sent into a running animation is swallowed.

   Same element API as the package's loader otherwise: `class` mirrored from React's `classname`,
   the PNG fallback if the runtime or file cannot load, pause when off screen. */
(function () {
  if (customElements.get('vyom-rive')) return;

  var __R = (typeof window !== 'undefined' && window.__resources) || {};
  var RUNTIME = __R.riveRuntime || 'https://cdn.jsdelivr.net/npm/@rive-app/canvas@2.44.0/+esm';
  var SRC = __R.vyomRiv || '/characters/vyom.riv';
  var FALLBACK = __R.vyomPng || 'vyom-mascot.png';
  var ARTBOARD = 'VyomCanvas', STATE_MACHINE = 'Canvas';
  /* Canvas side per scale: the character plus room for his idle and entrance. */
  var CANVAS = { small: 150, full: 260 };
  /* Host boxes this wide and up take the full-size Vyom. */
  var FULL_FROM = 90;
  /* Between the scale trigger and `appear`: enough for the scale change to settle. */
  var SCALE_SETTLE_MS = 450;
  /* The entrance, after which he stands where he will stay and can be measured. */
  var APPEAR_MS = 2600;

  var runtime = null;
  function loadRuntime() {
    /* The CDN's ESM build puts the API on its default export. */
    if (!runtime) runtime = import(RUNTIME).then(function (m) { return m.default && m.default.Rive ? m.default : m; });
    return runtime;
  }

  var io = null, watched = new Map();
  function observe(el) {
    if (!('IntersectionObserver' in window)) { el._vyomEnter(); return; }
    if (!io) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          var t = watched.get(e.target);
          if (!t) return;
          if (e.isIntersecting) t._vyomEnter();
          else t._vyomExit();
        });
      }, { rootMargin: '200px' });
    }
    watched.set(el, el);
    io.observe(el);
  }
  function unobserve(el) { if (io) { io.unobserve(el); watched.delete(el); } }

  class VyomRive extends HTMLElement {
    static get observedAttributes() { return ['classname']; }
    attributeChangedCallback(name, _old, val) {
      if (name === 'classname') this.setAttribute('class', val == null ? '' : val);
    }

    connectedCallback() {
      this._dead = false;
      var cs = getComputedStyle(this);
      if (cs.display === 'inline') this.style.display = 'inline-block';
      /* The wrapper is positioned against the host, so the host positions itself. */
      if (cs.position === 'static') this.style.position = 'relative';
      if (this._built) { observe(this); return; }
      this._built = true;

      /* Out of flow: the hosted pages' template engine re-renders a host with a copy of whatever
         it found inside, and an in-flow copy would push the live wrapper down by the host's
         height. The copies are also removed as they appear (below). */
      this._wrap = document.createElement('div');
      this._wrap.style.cssText = 'position:absolute;inset:0;';
      this.appendChild(this._wrap);
      this._purge();
      this._mo = new MutationObserver(this._purge.bind(this));
      this._mo.observe(this, { childList: true });

      this._img = document.createElement('img');
      this._img.src = FALLBACK;
      this._img.alt = 'Vyom';
      this._img.decoding = 'async';
      this._img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:contain;pointer-events:none;opacity:0;visibility:hidden;';
      this._wrap.appendChild(this._img);

      this._canvas = document.createElement('canvas');
      this._canvas.setAttribute('aria-label', 'Vyom');
      this._canvas.style.cssText = 'position:absolute;display:block;opacity:0;visibility:hidden;pointer-events:none;';
      this._wrap.appendChild(this._canvas);

      this._ro = new ResizeObserver(function () {
        if (this._dead) return;
        this._layout();
        if (this._rive) { try { this._rive.resizeDrawingSurfaceToCanvas(); } catch { /* best effort */ } }
        this._place();
      }.bind(this));
      this._ro.observe(this);

      observe(this);
      clearTimeout(this._kick);
      this._kick = setTimeout(function () {
        if (!this._dead && !this._loading && !this._rive) this._vyomEnter();
      }.bind(this), 400);
    }

    /* Only the live wrapper stays inside the host. */
    _purge() {
      if (this._dead) return;
      var kids = Array.prototype.slice.call(this.children);
      for (var i = 0; i < kids.length; i++) if (kids[i] !== this._wrap) kids[i].remove();
    }

    disconnectedCallback() {
      this._dead = true;
      if (this._mo) this._mo.disconnect();
      unobserve(this);
      clearTimeout(this._kick);
      clearTimeout(this._appearT);
      clearTimeout(this._centreT);
      if (this._ro) this._ro.disconnect();
      this._vyomExit();
      var r = this._rive; this._rive = null;
      if (r) try { r.cleanup(); } catch { /* best effort */ }
    }

    /* Which Vyom this box gets. */
    _scale() {
      var attr = this.getAttribute('scale');
      if (attr === 'small' || attr === 'full') return attr;
      return this.getBoundingClientRect().width >= FULL_FROM ? 'full' : 'small';
    }

    /* The canvas is a fixed square centred on the host, whatever the host's own size — shifted,
       once he has been measured, so that it is the drawn character that sits at the host's centre
       rather than the canvas (the artboard draws him off the canvas centre, and a host at the foot
       of a page would otherwise have him hanging below the viewport). */
    _layout() {
      var side = CANVAS[this._scale()];
      var box = this.getBoundingClientRect();
      var shift = this._shift || { x: 0, y: 0 };
      var left = (box.width - side) / 2 - shift.x, top = (box.height - side) / 2 - shift.y;
      this._canvas.style.width = side + 'px';
      this._canvas.style.height = side + 'px';
      this._canvas.style.left = left + 'px';
      this._canvas.style.top = top + 'px';
      this._side = side;
    }

    /* Where he is drawn: the centre of the painted pixels, relative to the canvas centre, in CSS
       px. Read once his entrance has played; applied to the layout above. */
    _centre() {
      if (this._dead || !this._rive) return;
      var cv = this._canvas, ctx;
      try { ctx = cv.getContext('2d'); } catch { return; }
      if (!ctx || !cv.width || !cv.height) return;
      var data;
      try { data = ctx.getImageData(0, 0, cv.width, cv.height).data; } catch { return; }
      var x0 = cv.width, y0 = cv.height, x1 = -1, y1 = -1;
      for (var y = 0; y < cv.height; y += 2) {
        for (var x = 0; x < cv.width; x += 2) {
          if (data[(y * cv.width + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        }
      }
      if (x1 < 0) return;
      var k = this._side / cv.width;
      var next = { x: ((x0 + x1) / 2) * k - this._side / 2, y: ((y0 + y1) / 2) * k - this._side / 2 };
      /* Applied only once two readings agree: a reading taken while he is still arriving (or while
         a throttled tab plays his entrance in slow motion) would park him off to one side. */
      var prev = this._read; this._read = next;
      this._centreTries = (this._centreTries || 0) + 1;
      if (prev && Math.abs(prev.x - next.x) <= 2 && Math.abs(prev.y - next.y) <= 2) {
        this._shift = next; this._layout(); return;
      }
      if (this._centreTries < 12) this._centreT = setTimeout(this._centre.bind(this), 500);
    }

    /* Both of the artboard's position slots sit at the canvas centre: whichever one the state
       machine reads, he is in the middle. Fit.Layout at scale factor 1 makes one artboard unit one
       CSS pixel, the same as on the app's stage. */
    _place() {
      var vi = this._rive && this._rive.viewModelInstance;
      if (!vi) return;
      var c = this._side / 2;
      ['learnWindowX', 'chatposX', 'lookAtX'].forEach(function (n) { try { vi.number(n).value = c; } catch { /* best effort */ } });
      ['learnWindowY', 'chatposY', 'lookAtY'].forEach(function (n) { try { vi.number(n).value = c; } catch { /* best effort */ } });
    }

    _fire(name) {
      var vi = this._rive && this._rive.viewModelInstance;
      if (!vi) return;
      try { vi.trigger(name).trigger(); } catch { /* best effort */ }
    }

    _vyomEnter() {
      if (this._dead) return;
      if (this._rive) { try { this._rive.play(); } catch { /* best effort */ } return; }
      if (this._loading) return;
      this._loading = true;
      var self = this;
      this._layout();
      loadRuntime().then(function (R) {
        if (!self.isConnected || self._dead) { self._loading = false; return; }
        var r = new R.Rive({
          src: SRC,
          canvas: self._canvas,
          artboard: ARTBOARD,
          stateMachines: STATE_MACHINE,
          autoplay: true,
          autoBind: true,
          layout: new R.Layout({ fit: R.Fit.Layout, layoutScaleFactor: 1 }),
          onLoad: function () {
            if (self._dead) return;
            self._rive = r;
            try { r.resizeDrawingSurfaceToCanvas(); } catch { /* not sized yet; the observer retries */ }
            self._place();
            /* Size first, then show: the scale change plays while he is hidden. */
            self._fire(self._scale() === 'small' ? 'scaleSmall' : 'scaleFull');
            self._reveal();
            self._appearT = setTimeout(function () { if (!self._dead) self._fire('appear'); }, SCALE_SETTLE_MS);
            self._centreT = setTimeout(function () { self._centre(); }, SCALE_SETTLE_MS + APPEAR_MS);
          },
          onLoadError: function () { self._loading = false; self._fallback(); }
        });
        setTimeout(function () { if (!self._revealed) self._fallback(); }, 8000);
      }).catch(function () { self._loading = false; self._fallback(); });
    }

    _fallback() {
      if (this._dead || this._revealed) return;
      this._img.style.visibility = 'visible';
      this._img.style.opacity = '1';
    }

    _reveal() {
      if (this._dead || this._revealed) return;
      this._revealed = true;
      this._canvas.style.visibility = 'visible';
      this._canvas.style.opacity = '1';
      this._img.style.opacity = '0';
      this._img.style.visibility = 'hidden';
    }

    _vyomExit() { if (!this._dead && this._rive) { try { this._rive.pause(); } catch { /* already torn down */ } } }
  }

  customElements.define('vyom-rive', VyomRive);

  /* Warm both fetches now rather than behind the first intersection. */
  loadRuntime().catch(function () {});
  try {
    var pre = document.createElement('link');
    pre.rel = 'preload'; pre.as = 'fetch'; pre.href = SRC; pre.crossOrigin = 'anonymous';
    document.head.appendChild(pre);
  } catch {
    /* A preload is a courtesy; the fetch happens either way. */
  }
})();

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
      if (this._built) { observe(this); return; }
      this._built = true;

      this._wrap = document.createElement('div');
      this._wrap.style.cssText = 'position:relative;width:100%;height:100%;';
      this.appendChild(this._wrap);

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

    disconnectedCallback() {
      this._dead = true;
      unobserve(this);
      clearTimeout(this._kick);
      clearTimeout(this._appearT);
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

    /* The canvas is a fixed square centred on the host, whatever the host's own size. */
    _layout() {
      var side = CANVAS[this._scale()];
      var box = this.getBoundingClientRect();
      var left = (box.width - side) / 2, top = (box.height - side) / 2;
      this._canvas.style.width = side + 'px';
      this._canvas.style.height = side + 'px';
      this._canvas.style.left = left + 'px';
      this._canvas.style.top = top + 'px';
      this._side = side;
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

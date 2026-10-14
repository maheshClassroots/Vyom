/* <vyom-rive> — Vyom mascot as a live Rive animation.
   Drop-in replacement for <img src="vyom-mascot.png">: fills its own box,
   honours width/height/filter set via style, falls back to the PNG offline. */
(function () {
  if (customElements.get('vyom-rive')) return;

  var __R = (typeof window !== 'undefined' && window.__resources) || {};
  var RIVE_URL = __R.riveRuntime || 'https://unpkg.com/@rive-app/canvas@2.26.4';
  var SRC = __R.vyomRiv || 'vyom.riv';
  var FALLBACK = __R.vyomPng || 'vyom-mascot.png';
  /* The .riv artboard is 1000x1000 with ~30% transparent padding baked in on
     every side, so Fit.contain fits the padding, not the mascot. Inflating the
     canvas past the host by this factor makes the painted art fill roughly the
     same box the PNG silhouette used to. Override per-slot with art-scale="". */
  var ART_SCALE = 2.5;
  var runtime = null;

  function loadRuntime() {
    if (runtime) return runtime;
    runtime = new Promise(function (res, rej) {
      if (window.rive && window.rive.Rive) return res(window.rive);
      var s = document.createElement('script');
      s.src = RIVE_URL;
      s.onload = function () { window.rive ? res(window.rive) : rej(new Error('rive missing')); };
      s.onerror = rej;
      document.head.appendChild(s);
    });
    return runtime;
  }

  var io = null, watched = new Map();
  function observe(el) {
    if (!('IntersectionObserver' in window)) { el._vyomEnter(); return; }
    if (!io) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          var t = watched.get(e.target);
          if (t) e.isIntersecting ? t._vyomEnter() : t._vyomExit();
        });
      }, { rootMargin: '200px' });
    }
    watched.set(el, el);
    io.observe(el);
  }
  function unobserve(el) { if (io) { io.unobserve(el); watched.delete(el); } }

  class VyomRive extends HTMLElement {
    /* React (18) does not map a `className` prop onto a custom element's `class` attribute — it writes a
       literal lowercase `classname="…"` attribute instead. Every template that drives this element's
       class through a binding (max-hidden, cel-vyom…) therefore had no effect. Mirror it. */
    static get observedAttributes() { return ['classname']; }
    attributeChangedCallback(name, _old, val) {
      if (name === 'classname') this.setAttribute('class', val == null ? '' : val);
    }
    connectedCallback() {
      this._dead = false;
      // Re-applied on every (re)connect, not just the first: the host's own inline `style` is owned by
      // the page's template/renderer, and a later re-render can replace it wholesale — silently
      // dropping a `position:relative` we'd set imperatively here, which then lets the absolutely
      // positioned canvas escape to the next positioned ANCESTOR (the card, the page…) instead of
      // sizing against this element. Cheap and idempotent, so it's safe to redo every time.
      var cs = getComputedStyle(this);
      if (cs.display === 'inline') this.style.display = 'inline-block';
      if (this._built) { observe(this); return; }
      this._built = true;

      // Everything below lives on a wrapper WE own and the page's renderer never touches (it isn't in
      // any template), so its position:relative can never be clobbered the way the host's can.
      this._wrap = document.createElement('div');
      this._wrap.style.cssText = 'position:relative;width:100%;height:100%;';
      this.appendChild(this._wrap);

      this._img = document.createElement('img');
      this._img.src = FALLBACK;
      this._img.alt = 'Vyom';
      this._img.decoding = 'async';
      /* Hidden by default. The PNG is an OLDER drawing of Vyom, so flashing it while the .riv
         loads reads as a second, wrong character. It is only revealed if Rive genuinely fails
         (runtime blocked, file missing) — see _fallback(). */
      this._img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:contain;pointer-events:none;opacity:0;visibility:hidden;';
      this._wrap.appendChild(this._img);

      this._canvas = document.createElement('canvas');
      this._canvas.setAttribute('aria-label', 'Vyom');
      var k = parseFloat(this.getAttribute('art-scale')) || ART_SCALE;
      var pct = (k * 100).toFixed(2), off = ((1 - k) / 2 * 100).toFixed(2);
      this._canvas.style.cssText = 'position:absolute;left:' + off + '%;top:' + off + '%;width:' + pct + '%;height:' + pct + '%;display:block;opacity:0;visibility:hidden;pointer-events:none;';
      this._wrap.appendChild(this._canvas);

      this._ro = new ResizeObserver(function () {
        if (this._dead || !this._rive) return;
        try { this._rive.resizeDrawingSurfaceToCanvas(); } catch (e) {}
      }.bind(this));
      this._ro.observe(this);

      observe(this);
      /* Safety net: the IO callback can fail to fire for an element that is already on screen at
         upgrade time (zero-size at observe(), a hidden ancestor that later shows, a throttled
         first frame). Without this the mascot silently never loads. */
      clearTimeout(this._kick);
      this._kick = setTimeout(function () {
        if (!this._dead && !this._loading && !this._rive) this._vyomEnter();
      }.bind(this), 400);
    }

    disconnectedCallback() {
      // Set FIRST — every async callback below (RO, reveal poll, the runtime-load promise) checks this
      // before touching this._rive, so none of them can call a method on an instance that cleanup() has
      // already torn down (that throws Rive's own "used after cleanup", which was surfacing as a render
      // error and cascading into a mismatched removeChild during the next React reconcile).
      this._dead = true;
      unobserve(this);
      clearTimeout(this._kick);
      if (this._pollT) { clearInterval(this._pollT); this._pollT = null; }
      if (this._ro) this._ro.disconnect();
      this._vyomExit();
      var r = this._rive; this._rive = null;
      if (r) try { r.cleanup(); } catch (e) {}
    }

    _vyomEnter() {
      if (this._dead) return;
      if (this._rive) { try { this._rive.play(); } catch (e) {} return; }
      if (this._loading) return;
      this._loading = true;
      var self = this;
      loadRuntime().then(function (rive) {
        if (!self.isConnected || self._dead) { self._loading = false; return; }
        self._rive = new rive.Rive({
          src: SRC,
          canvas: self._canvas,
          autoplay: true,
          stateMachines: self.getAttribute('state-machine') || 'State Machine 1',
          layout: new rive.Layout({ fit: rive.Fit.contain, alignment: rive.Alignment.center }),
          onLoad: function () { self._reveal(); }
        });
        self._startRevealPoll();
        setTimeout(function () { if (!self._revealed) self._fallback(); }, 6000);
      }).catch(function () { self._loading = false; self._fallback(); });
    }

    _fallback() {
      if (this._dead || this._revealed) return;
      this._img.style.visibility = 'visible';
      this._img.style.opacity = '1';
    }

    _reveal() {
      if (this._dead || this._revealed || !this._rive) return;
      try { this._rive.resizeDrawingSurfaceToCanvas(); } catch (e) {}
      this._revealed = true;
      this._canvas.style.visibility = 'visible';
      this._canvas.style.opacity = '1';
      this._img.style.opacity = '0';
      this._img.style.visibility = 'hidden';
      if (this._pollT) { clearInterval(this._pollT); this._pollT = null; }
    }

    _startRevealPoll() {
      if (this._pollT || this._revealed) return;
      var self = this, tries = 0;
      this._pollT = setInterval(function () {
        if (self._dead) { clearInterval(self._pollT); self._pollT = null; return; }
        tries++;
        var r = self._rive;
        var ready = false;
        try { ready = !!(r && (r.isPlaying || (r.stateMachineNames && r.stateMachineNames.length))); } catch (e) {}
        if (ready) self._reveal();
        else if (tries > 40) { clearInterval(self._pollT); self._pollT = null; self._fallback(); }
      }, 120);
    }

    _vyomExit() { if (!this._dead && this._rive) { try { this._rive.pause(); } catch (e) {} } }
  }

  customElements.define('vyom-rive', VyomRive);

  /* Warm the two blocking fetches the moment this file parses, instead of waiting for the first
     element to intersect. The runtime is ~500KB from unpkg and the artboard is a second round trip;
     serialising them behind an IntersectionObserver callback is what made Vyom appear late. */
  loadRuntime().catch(function () {});
  try {
    var pre = document.createElement('link');
    pre.rel = 'preload'; pre.as = 'fetch'; pre.href = SRC; pre.crossOrigin = 'anonymous';
    document.head.appendChild(pre);
  } catch (e) {}
})();

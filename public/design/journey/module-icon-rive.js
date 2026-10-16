/* Module node icon — live Rive (moduleicon.riv)
   Artboard "AnimatedIcon" · state machine "State Machine 1" · view model "Icon":
     moduleType (artboard: "Learning" | "Practice") · completed (bool) · active (bool)   — both false = default
   Mounts into every .mc-node[data-mi-type]; the Tabler glyph inside stays as the fallback until Rive draws. */
(function () {
  if (window.__moduleIconRive) return;
  var RT = 'https://cdn.jsdelivr.net/npm/@rive-app/canvas@2.44.0/+esm';
  var SRC = (window.__resources && window.__resources.moduleIconRiv) || 'moduleicon.riv';
  var M = { R: null, mounted: new Map(), buf: null };

  function read(el) { return { type: el.getAttribute('data-mi-type') === 'practice' ? 'Practice' : 'Learning', state: el.getAttribute('data-mi-state') || 'default' }; }
  function apply(m) {
    var d = read(m.el), vi = m.vi; if (!vi) return;
    try { if (M.host !== null && m.type !== d.type) { vi.artboard('moduleType').value = m.r.getBindableArtboard(d.type); m.type = d.type; } } catch (e) {}
    try { var st = m.userState || d.state; vi.boolean('completed').value = st === 'completed'; vi.boolean('active').value = st === 'active' && (!!m.userState || M.arrived); } catch (e) {}
  }
  function mount(el) {
    if (M.mounted.has(el)) { apply(M.mounted.get(el)); return; }
    var cv = document.createElement('canvas');
    cv.className = 'mi-canvas';
    cv.style.cssText = 'opacity:0;transition:opacity .25s ease;pointer-events:none;';
    el.appendChild(cv);
    var ab = M.host || (M.info ? read(el).type : 'AnimatedIcon');
    var m = { el: el, cv: cv, vi: null, r: null, type: M.host ? null : read(el).type };
    M.mounted.set(el, m);
    var r = new M.R.Rive({
      buffer: M.buf ? M.buf.slice(0) : undefined, src: M.buf ? undefined : SRC,
      canvas: cv, artboard: ab, stateMachine: smFor(ab), autoplay: true, autoBind: true,
      layout: new M.R.Layout({ fit: M.R.Fit.Contain }),
      onLoad: function () {
        r.resizeDrawingSurfaceToCanvas(); m.r = r; m.vi = r.viewModelInstance; apply(m);
        cv.style.opacity = '1'; el.classList.add('mi-on');
      }
    });
  }
  function scan() {
    if (!M.R) return;
    document.querySelectorAll('.mc-node[data-mi-type]').forEach(mount);
    M.mounted.forEach(function (m, el) { if (!el.isConnected) { try { m.r && m.r.cleanup(); } catch (e) {} M.mounted.delete(el); } });
  }
  // detect artboards + state machines (names change between file versions)
  function probe() {
    return new Promise(function (res) {
      var cv = document.createElement('canvas'), done = false, p;
      var fin = function () { if (done) return; done = true; res(); setTimeout(function () { try { p && p.cleanup(); } catch (e) {} }, 0); };
      p = new M.R.Rive({ buffer: M.buf.slice(0), canvas: cv, autoplay: false, artboard: 'Learning', stateMachine: 'Learning',
        onLoad: function () {
          try {
            M.info = {};
            ((p.contents && p.contents.artboards) || []).forEach(function (ab) { M.info[ab.name] = (ab.stateMachines || []).map(function (x) { return x.name; }); });
            M.host = M.info.AnimatedIcon ? 'AnimatedIcon' : null;
            console.info('[moduleicon] contents', JSON.stringify(M.info), 'host:', M.host || '(per-type)');
          } catch (e) {}
          fin();
        },
        onLoadError: fin });
      setTimeout(fin, 4000);
    });
  }
  function smFor(ab) { var l = (M.info && M.info[ab]) || []; return l.indexOf('State Machine 1') >= 0 ? 'State Machine 1' : l[0]; }
  var t = 0;
  function soon() { clearTimeout(t); t = setTimeout(scan, 60); }
  function boot(R) {
    M.R = R;
    fetch(SRC).then(function (x) { return x.arrayBuffer(); }).then(function (b) { M.buf = b; return probe(); }).then(scan).catch(scan);
    new MutationObserver(function (list) {
      for (var i = 0; i < list.length; i++) {
        var a = list[i];
        if (a.type === 'attributes' && M.mounted.has(a.target)) { var mm = M.mounted.get(a.target); delete mm.userState; apply(mm); continue; }
        if (a.type === 'childList') { soon(); return; }
      }
    }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-mi-type', 'data-mi-state'] });
    // tap toggle: active → default, default → active (completed/locked untouched). Trusted clicks only, so Spark's synthetic re-click is ignored.
    window.addEventListener('click', function (e) {
      if (!e.isTrusted) return;
      var card = e.target && e.target.closest && e.target.closest('.cd-mod'); if (!card) return;
      var node = card.querySelector('.mc-node[data-mi-type]'), m = node && M.mounted.get(node);
      if (!m || !m.vi) return;
      var s = m.userState || node.getAttribute('data-mi-state');
      if (s === 'active') { m.userState = 'default'; apply(m); return; }
      if (s !== 'default') return;
      M.mounted.forEach(function (o) {
        if (o === m) return;
        var os = o.userState || o.el.getAttribute('data-mi-state');
        if (os === 'active') { o.userState = 'default'; apply(o); }
      });
      m.userState = 'active'; apply(m);
    }, true);
    window.addEventListener('resize', function () { M.mounted.forEach(function (m) { try { m.r && m.r.resizeDrawingSurfaceToCanvas(); } catch (e) {} }); });
  }
  import(RT).then(function (m) { boot(m.default && m.default.Rive ? m.default : m); })
    .catch(function () { if (window.rive && window.rive.Rive) boot(window.rive); });
  M.arrived = false;
  // active icon stays false until Spark arrives (spark-journey sets this alongside moduleJourney = true)
  M.setArrived = function (v) { M.arrived = !!v; M.mounted.forEach(function (m) { try { apply(m); } catch (e) {} }); };
  window.__moduleIconRive = M;
})();

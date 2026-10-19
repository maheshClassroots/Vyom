/* Goal path — the Goals Journey's progress illustration, live Rive (GoalPath.riv).
   Artboard "Goal" (600 × 500) · state machine "GoalFlag" · view model:
     showMountain (trigger)   reveals the hill, the winding path and the summit flag
     progress (number, 0–100) where along the path the marker should be
     updateProgress (trigger) moves the marker to `progress`; the artboard then writes `progressRef`
   Mounts into every .gp-mountain[data-gp-progress]; the attribute is the percentage ("33%" or 33)
   and a change to it re-runs updateProgress. The hill is revealed once per mount, and the first
   progress goes out after the reveal has had time to play, so the marker rides the finished path. */
(function () {
  if (window.__goalPathRive) return;
  var RT = 'https://cdn.jsdelivr.net/npm/@rive-app/canvas@2.44.0/+esm';
  var SRC = (window.__resources && window.__resources.goalPathRiv) || 'GoalPath.riv';
  var REVEAL_MS = 2400;      // the showMountain animation, before the first marker move
  var M = { R: null, mounted: new Map() };

  function pct(el) { var v = parseFloat(el.getAttribute('data-gp-progress')); return isNaN(v) ? 0 : Math.max(0, Math.min(100, v)); }
  function send(m) {
    if (!m.vi || !m.shown) return;
    var p = pct(m.el);
    if (m.sent === p) return;
    // The artboard only ever climbs: a count that went down (a reset) takes the hill
    // back to its reveal, which also lowers a hoisted flag, before the marker moves.
    if (m.sent !== null && p < m.sent) { revealOne(m); return; }
    m.sent = p;
    try { m.vi.number('progress').value = p; m.vi.trigger('updateProgress').trigger(); } catch (e) {}
  }
  function revealOne(m) {
    if (!m.vi) return;
    clearTimeout(m.t); m.shown = false; m.sent = null;
    try { m.vi.number('progress').value = 0; m.vi.trigger('updateProgress').trigger(); } catch (e) {}
    try { m.vi.trigger('showMountain').trigger(); } catch (e) {}
    m.t = setTimeout(function () { if (!M.mounted.has(m.el)) return; m.shown = true; send(m); }, REVEAL_MS);
  }
  function mount(el) {
    if (M.mounted.has(el)) {
      // The page's template engine re-renders the card with a copy of the
      // canvas it found there; only the live one stays.
      var m0 = M.mounted.get(el);
      el.querySelectorAll('canvas').forEach(function (c) { if (c !== m0.cv) c.remove(); });
      send(m0); return;
    }
    var cv = document.createElement('canvas');
    cv.style.cssText = 'display:block;width:100%;height:100%;opacity:0;transition:opacity .3s ease;';
    el.appendChild(cv);
    var m = { el: el, cv: cv, vi: null, r: null, shown: false, sent: null, t: 0 };
    M.mounted.set(el, m);
    var r = new M.R.Rive({
      src: SRC, canvas: cv, artboard: 'Goal', stateMachine: 'GoalFlag', autoplay: true, autoBind: true,
      layout: new M.R.Layout({ fit: M.R.Fit.Contain }),
      onLoad: function () {
        r.resizeDrawingSurfaceToCanvas(); m.r = r; m.vi = r.viewModelInstance;
        cv.style.opacity = '1';
        try { m.vi.number('progress').value = pct(el); } catch (e) {}
        try { m.vi.trigger('showMountain').trigger(); } catch (e) {}
        m.t = setTimeout(function () { if (!M.mounted.has(el)) return; m.shown = true; send(m); }, REVEAL_MS);
      }
    });
  }
  function scan() {
    if (!M.R) return;
    document.querySelectorAll('.gp-mountain[data-gp-progress]').forEach(mount);
    M.mounted.forEach(function (m, el) {
      if (el.isConnected) return;
      clearTimeout(m.t); try { m.r && m.r.cleanup(); } catch (e) {} M.mounted.delete(el);
    });
  }
  var t = 0;
  function soon() { clearTimeout(t); t = setTimeout(scan, 60); }
  // The count pops when it changes (the page rewrites its text nodes in place).
  var lastCount = new Map();
  function pop() {
    document.querySelectorAll('.gp-count').forEach(function (c) {
      var t = c.textContent;
      if (lastCount.has(c) && lastCount.get(c) !== t) {
        c.classList.remove('gp-pop'); void c.offsetWidth; c.classList.add('gp-pop');
      }
      lastCount.set(c, t);
    });
  }
  function boot(R) {
    M.R = R; scan(); pop();
    new MutationObserver(pop).observe(document.documentElement, { characterData: true, childList: true, subtree: true });
    new MutationObserver(function (list) {
      for (var i = 0; i < list.length; i++) {
        var a = list[i];
        if (a.type === 'attributes' && M.mounted.has(a.target)) { send(M.mounted.get(a.target)); continue; }
        if (a.type === 'childList') { soon(); return; }
      }
    }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-gp-progress'] });
    window.addEventListener('resize', function () { M.mounted.forEach(function (m) { try { m.r && m.r.resizeDrawingSurfaceToCanvas(); } catch (e) {} }); });
  }
  import(RT).then(function (m) { boot(m.default && m.default.Rive ? m.default : m); })
    .catch(function () { if (window.rive && window.rive.Rive) boot(window.rive); });

  // ---- progress demo (driven from the app's "Progress demo" dev button) ----
  // The page reads its chapter counts from window.__goalProgress and re-renders on
  // window.__goalRerender(); a new percentage on the card sends updateProgress above.
  var BASE = [['Algebra', 3, 10], ['Circles', 3, 10], ['Statistics', 4, 10]];
  function rows() { return (window.__goalProgress || BASE).map(function (r) { return r.slice(); }); }
  function setRows(next) { window.__goalProgress = next; if (window.__goalRerender) window.__goalRerender(); }
  function reveal() { M.mounted.forEach(revealOne); }
  function step() {
    var r = rows();
    for (var i = 0; i < r.length; i++) { if (r[i][1] < r[i][2]) { r[i][1] += 1; setRows(r); return true; } }
    return false;
  }
  var demo = 0;
  function stopDemo() { clearInterval(demo); demo = 0; }
  function runDemo() {
    stopDemo();
    setRows(rows().map(function (r) { return [r[0], 0, r[2]]; }));
    reveal();
    // one topic at a time once the hill has risen, up to the summit
    setTimeout(function () { demo = setInterval(function () { if (!step()) stopDemo(); }, 700); }, REVEAL_MS + 300);
  }
  M.reveal = reveal; M.step = step; M.reset = function () { stopDemo(); setRows(BASE.map(function (r) { return r.slice(); })); };
  M.zero = function () { stopDemo(); setRows(rows().map(function (r) { return [r[0], 0, r[2]]; })); };
  M.demo = runDemo; M.stop = stopDemo;
  window.addEventListener('message', function (e) {
    if (e.origin !== window.location.origin) return;
    var d = e.data; if (!d || d.type !== 'goal-path') return;
    if (d.action === 'reveal') reveal();
    else if (d.action === 'step') step();
    else if (d.action === 'reset') M.reset();
    else if (d.action === 'zero') M.zero();
    else if (d.action === 'demo') runDemo();
    else if (d.action === 'stop') stopDemo();
  });
  window.__goalPathRive = M;
})();

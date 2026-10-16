/* Chapter island icon — live Rive (chaptericons.riv)
   One artboard per chapter, each with "State Machine 1" (Idle / Active).
   The file has no "chapterIcon" host artboard (only the 15 chapter artboards), so each card loads its
   chapter's artboard directly; the "Chaptericon" view model's `active` flag is set when it binds.
   Mounts into every .cj-isl-img[data-ci-ch]; the PNG stays as the fallback until Rive draws. */
(function () {
  if (window.__chapterIconRive) return;
  var RT = 'https://cdn.jsdelivr.net/npm/@rive-app/canvas@2.44.0/+esm';
  var SRC = (window.__resources && window.__resources.chapterIconsRiv) || 'chaptericons.riv';
  var AB = {
    1: 'Real numbers', 2: 'Polynomials', 3: 'Pair of linear equations', 4: 'Quadratic equations',
    5: 'Arithmetic Progressions', 6: 'Coordinate geometry', 7: 'Triangles', 8: 'Circles', 9: 'Constructions',
    10: 'Applications of trigonometry 2', 11: 'Applications of trigonometry', 12: 'Area related to circles',
    13: 'Surface are as & volumes', 14: 'Statistics', 15: 'Probability'
  };
  var M = { R: null, buf: null, mounted: new Map() };

  function apply(m) {
    // default false; only the tapped chapter goes active — and never inside the module journey (zoomed detail view)
    var on = false;   // always inactive
    try { m.r.viewModelInstance.boolean('active').value = on; } catch (e) {}
  }
  function mount(el) {
    if (M.mounted.has(el)) { var m0 = M.mounted.get(el); if (m0.r) apply(m0); return; }
    var name = AB[+el.getAttribute('data-ci-ch')]; if (!name) return;
    var cv = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;inset:-14%;width:128%;height:128%;opacity:0;transition:opacity .25s ease;pointer-events:none;';
    el.appendChild(cv);
    var m = { el: el, cv: cv, r: null };
    M.mounted.set(el, m);
    var r = new M.R.Rive({
      buffer: M.buf ? M.buf.slice(0) : undefined, src: M.buf ? undefined : SRC,
      canvas: cv, artboard: name, stateMachine: 'State Machine 1', autoplay: true, autoBind: true,
      layout: new M.R.Layout({ fit: M.R.Fit.Contain }),
      onLoad: function () { sharp(r); m.r = r; M.loaded = (M.loaded || 0) + 1; apply(m); cv.style.opacity = '1'; el.classList.add('ci-on'); }
    });
  }
  // the island is CSS-scaled (and zoomed up to hero size), so draw at 3× device pixels to stay crisp
  function sharp(r) { try { r.resizeDrawingSurfaceToCanvas(Math.max(window.devicePixelRatio || 1, 1) * 4); } catch (e) {} }
  function scan() {
    if (!M.R) return;
    document.querySelectorAll('.cj-isl-img[data-ci-ch]').forEach(mount);
    M.mounted.forEach(function (m, el) { if (!el.isConnected) { try { m.r && m.r.cleanup(); } catch (e) {} M.mounted.delete(el); } });
  }
  var t = 0;
  function boot(R) {
    M.R = R;
    fetch(SRC).then(function (x) { return x.arrayBuffer(); }).then(function (b) { M.buf = b; scan(); }).catch(scan);
    new MutationObserver(function (list) {
      for (var i = 0; i < list.length; i++) {
        var a = list[i];
        if (a.type === 'attributes' && M.mounted.has(a.target)) { var m = M.mounted.get(a.target); if (m.r) apply(m); continue; }
        if (a.type === 'childList') { clearTimeout(t); t = setTimeout(scan, 60); return; }
      }
    }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-ci-active'] });
    // tap a chapter card → its icon goes active (the others drop back unless they're the current chapter)
    window.addEventListener('click', function (e) {
      var p = e.target && e.target.closest && e.target.closest('.cj-planet'); if (!p) return;
      var img = p.querySelector('.cj-isl-img[data-ci-ch]');
      M.mounted.forEach(function (m, el) { m.tapped = el === img; if (m.r) apply(m); });
    }, true);
    window.addEventListener('resize', function () { M.mounted.forEach(function (m) { if (m.r) sharp(m.r); }); });
    var wasZoom = false;
    setInterval(function () { var z = !!document.querySelector('.cj-zoomed'); if (z !== wasZoom) { wasZoom = z; M.mounted.forEach(function (m) { if (m.r) { apply(m); sharp(m.r); } }); } }, 250);
  }
  import(RT).then(function (m) { boot(m.default && m.default.Rive ? m.default : m); })
    .catch(function () { if (window.rive && window.rive.Rive) boot(window.rive); });
  window.__chapterIconRive = M;
})();

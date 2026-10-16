/* Spark riding the chapter rail — replaces the orange firefly dot (.cj-fly).
   spark.riv · artboard "Spark" · state machine "SparkCharacter" · view model "SparkAnimationControls".
   Artboard fitted to the .cj-fly box; sparkPositionX/Y pinned to the box centre; moduleJouneyMoving = true.
   The page's own motif loop keeps moving .cj-fly along the chapters exactly as before. */
(function () {
  if (window.__sparkFly) return;
  var RT = 'https://cdn.jsdelivr.net/npm/@rive-app/canvas@2.44.0/+esm';
  var SRC = (window.__resources && window.__resources.sparkRiv) || 'spark.riv';
  var F = { R: null, el: null, r: null, vi: null };
  window.__sparkFly = F;
  function num(n, v) { try { F.vi.number(n).value = v; } catch (e) {} }
  function bool(n, v) { try { F.vi.boolean(n).value = v; } catch (e) {} }
  function mount() {
    var el = document.querySelector('.cj-fly');
    if (!el || el === F.el || !F.R) return;
    if (F.r) { try { F.r.cleanup(); } catch (e) {} F.r = null; F.vi = null; }
    F.el = el;
    var B = el.offsetWidth || 140, BLEED = B, CW = B + BLEED * 2;
    var cv = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;left:' + (-BLEED) + 'px;top:' + (-BLEED) + 'px;width:' + CW + 'px;height:' + CW + 'px;pointer-events:none;opacity:0;transition:opacity .3s ease;';
    el.appendChild(cv);
    var r = new F.R.Rive({
      src: SRC, canvas: cv, artboard: 'Spark', stateMachine: 'SparkCharacter', autoplay: true, autoBind: true,
      layout: new F.R.Layout({ fit: F.R.Fit.Layout }),
      onLoad: function () {
        try { r.resizeDrawingSurfaceToCanvas(Math.max(window.devicePixelRatio || 1, 1) * 2); } catch (e) {}
        F.r = r; F.vi = r.viewModelInstance;
        var c = CW / 2;
        num('sparkPositionX', c); num('sparkPositionY', c); num('chatPositionX', c); num('chatPositionY', c);
        bool('moduleJouneyMoving', true); bool('moduleJourneyMoving', true); bool('moduleJourneyMove', true);
        cv.style.opacity = '1';
      }
    });
  }
  function boot(R) {
    F.R = R; mount();
    new MutationObserver(function () { if (!F.el || !F.el.isConnected) { F.el = null; mount(); } })
      .observe(document.documentElement, { childList: true, subtree: true });
  }
  import(RT).then(function (m) { boot(m.default && m.default.Rive ? m.default : m); })
    .catch(function () { if (window.rive && window.rive.Rive) boot(window.rive); });
})();

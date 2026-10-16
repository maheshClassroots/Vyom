/* Spark — live Rive companion for the chapter's module journey (Chapter Journey → chapter detail → Learning Journey).
   spark.riv · artboard "Spark" · state machine "SparkCharacter" · view model "SparkAnimationControls".
   Spark lives in his own small box (BOX × BOX css px). The artboard is fitted to that box (Fit.Layout), and
   sparkPositionX/Y are pinned to the box centre — so the character always sits in the middle of the box.
   The BOX itself is what moves: it travels along the module connector line (the SVG thread).
     open module view   → box starts at the top of the thread, moduleJouneyMoving = true, glides along the line
                          to the current module; on arrival moduleJourney = true (Rive resets moduleJouneyMoving itself)
     tap a module/Spark → moduleJourney = false (then the module opens)
     hover a module     → looks toward it · scroll → box stays glued to its point on the line
     leave module view  → box fades out
   Note: the view-model property is spelled "moduleJouneyMoving" in the file. */
(function () {
  if (window.__sparkJourney) return;
  var RT = 'https://cdn.jsdelivr.net/npm/@rive-app/canvas@2.44.0/+esm';
  var SRC = (window.__resources && window.__resources.sparkRiv) || 'spark.riv';
  var BOX = 220;                       // Spark box size in css px
  var SPEED = 0.42;                    // px of path per ms while travelling
  var S = { on: false, ready: false, vi: null, r: null, path: null, svg: null, len: 0, raf: 0, travelling: false, lastAct: Date.now() };
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var box = document.createElement('div');
  box.className = 'spark-box';
  box.title = 'Spark';
  box.style.cssText = 'position:absolute;left:0;top:0;width:' + BOX + 'px;height:' + BOX + 'px;overflow:visible;z-index:1;pointer-events:none;opacity:0;transition:opacity .3s ease;will-change:transform;';
  // the canvas extends one BOX past every edge, so anything Spark draws outside the box stays visible
  var BLEED = BOX, CW = BOX + BLEED * 2;
  var cv = document.createElement('canvas');
  cv.style.cssText = 'position:absolute;left:' + (-BLEED) + 'px;top:' + (-BLEED) + 'px;width:' + CW + 'px;height:' + CW + 'px;pointer-events:none;';
  var hit = document.createElement('div');   // tappable core, not the whole box
  hit.style.cssText = 'position:absolute;left:50%;top:50%;width:90px;height:90px;margin:-45px 0 0 -45px;border-radius:50%;cursor:pointer;pointer-events:none;';
  box.appendChild(cv); box.appendChild(hit);

  function vm() { return S.vi; }
  function num(n, v) { try { vm().number(n).value = v; } catch (e) {} }
  function bool(n, v) { try { vm().boolean(n).value = v; } catch (e) {} }
  function expr(v) { try { vm().enum('expression').value = v; } catch (e) {} }
  function look(dir) { ['LB', 'LT', 'RB', 'RT'].forEach(function (d) { bool('look' + d, d === dir); }); }
  function centre() { var c = CW / 2; num('sparkPositionX', c); num('sparkPositionY', c); num('chatPositionX', c); num('chatPositionY', c); }

  // ---- geometry ----
  function view() { var v = document.querySelector('.cd-modeview'); if (!v) return null; var r = v.getBoundingClientRect(); return r.width > 0 && r.height > 0 ? v : null; }
  function active(v) { return v.querySelector('.cd-mod-active') || v.querySelector('.cd-mod-available') || v.querySelector('.cd-mod'); }
  // the connector: the middle thread of the module path (falls back to the longest path)
  function findPath(v) {
    // the connector svg may have no class — take the longest path of any svg inside the module view
    var svgs = [].slice.call(v.querySelectorAll('.cd-path-svg, svg'));
    var best = null, bl = 0;
    svgs.forEach(function (svg) { [].slice.call(svg.querySelectorAll('path')).forEach(function (p) { var l = 0; try { l = p.getTotalLength(); } catch (e) {} if (l > bl) { bl = l; best = { svg: svg, path: p, total: l }; } }); });
    return best && bl > 200 ? best : null;
  }
  function screenAt(l) {
    var pt = S.path.getPointAtLength(Math.max(0, Math.min(S.total, l)));
    var m = S.path.getScreenCTM(); if (!m) return { x: 0, y: 0 };
    return { x: m.a * pt.x + m.c * pt.y + m.e, y: m.b * pt.x + m.d * pt.y + m.f };
  }
  // the length along the line closest to a module's node
  function lengthAt(el) {
    var r = el.getBoundingClientRect(), node = el.querySelector('.mi-wrap, .mc-node, .cd-mod-art') || el;
    var nr = node.getBoundingClientRect(); var cx = nr.left + nr.width / 2, cy = nr.top + nr.height / 2;
    if (!nr.width) { cx = r.left + r.width / 2; cy = r.top + r.height / 2; }
    var best = 0, bd = Infinity, N = 240;
    for (var i = 0; i <= N; i++) { var l = S.total * i / N, p = screenAt(l), d = (p.x - cx) * (p.x - cx) + (p.y - cy) * (p.y - cy); if (d < bd) { bd = d; best = l; } }
    // refine
    var step = S.total / N;
    for (var j = -10; j <= 10; j++) { var l2 = best + step * j / 10, p2 = screenAt(l2), d2 = (p2.x - cx) * (p2.x - cx) + (p2.y - cy) * (p2.y - cy); if (d2 < bd) { bd = d2; best = l2; } }
    return Math.max(0, Math.min(S.total, best));
  }
  function localAt(l) { var pt = S.path.getPointAtLength(Math.max(0, Math.min(S.total, l))); var m = S.path.getCTM && S.path.getCTM(); return m ? { x: m.a * pt.x + m.c * pt.y + m.e, y: m.b * pt.x + m.d * pt.y + m.f } : pt; }
  // Spark lives inside the module path container, between the line (z 1) and the modules (z 2) → behind the module icons
  function host() { var h = S.svg && S.svg.parentElement; if (h && box.parentElement !== h) { if (getComputedStyle(h).position === 'static') h.style.position = 'relative'; h.insertBefore(box, S.svg.nextSibling); } }
  function place() { host(); var p = localAt(S.len); box.style.transform = 'translate(' + Math.round(p.x - BOX / 2) + 'px,' + Math.round(p.y - BOX / 2) + 'px)'; }
  // keep the box glued to its point on the line every frame (handles scroll, layout shifts, resize)
  function loop() { if (!S.on) return; if (S.path && S.path.isConnected) place(); else rebind(); S.raf = requestAnimationFrame(loop); }
  function rebind() { var v = view(); if (!v) return; var f = findPath(v); if (!f) return; S.svg = f.svg; S.path = f.path; S.total = f.total; S.len = Math.min(S.len, S.total); }

  // ---- travel along the line ----
  function travel(to, done) {
    var from = S.len, dist = Math.abs(to - from);
    S.travelling = true; bool('moduleJouneyMoving', true); bool('moduleJourney', false);
    var dur = reduced ? 1 : Math.max(900, Math.min(4200, dist / SPEED)), t0 = performance.now();
    function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    (function step(now) {
      if (!S.on) { S.travelling = false; return; }
      var k = Math.min(1, (now - t0) / dur); S.len = from + (to - from) * ease(k);
      if (k < 1) requestAnimationFrame(step);
      else { S.travelling = false; done && done(); }
    })(t0);
  }

  // ---- lifecycle ----
  function enter() {
    var v = view(); if (!v) return; var a = active(v); if (!a) return;
    var f = findPath(v); if (!f || !f.total) return;
    S.on = true; S.lastAct = Date.now(); S.svg = f.svg; S.path = f.path; S.total = f.total; S.len = 0;
    resize(); centre(); expr('neutral'); look(null);
    bool('moduleJourney', false); bool('moduleJouneyMoving', false); iconArrived(false);
    place(); box.style.opacity = '1'; hit.style.pointerEvents = 'auto';
    cancelAnimationFrame(S.raf); S.raf = requestAnimationFrame(loop);
    var target = lengthAt(a);
    setTimeout(function () { if (S.on) travel(target, function () { bool('moduleJourney', true); iconArrived(true); }); }, reduced ? 0 : 350);
  }
  function exit() {
    S.on = false; cancelAnimationFrame(S.raf); hit.style.pointerEvents = 'none'; box.style.opacity = '0';
    bool('moduleJouneyMoving', false); bool('moduleJourney', false); iconArrived(false);
  }
  function iconArrived(v) { var mi = window.__moduleIconRive; if (mi && mi.setArrived) mi.setArrived(v); }

  // ---- interactions ----
  var allow = null;
  window.addEventListener('click', function (e) {
    if (!S.on || !S.ready) return;
    var el = e.target.closest && e.target.closest('.cd-mod'); if (!el || el === allow) return;
    bool('moduleJourney', false); S.lastAct = Date.now();   // on tap → false
    if (S.travelling) return;
    e.stopPropagation(); e.preventDefault();
    setTimeout(function () { allow = el; el.click(); allow = null; }, reduced ? 0 : 450);
  }, true);
  hit.addEventListener('click', function () { S.lastAct = Date.now(); bool('moduleJourney', false); });
  document.addEventListener('mouseover', function (e) {
    if (!S.on || S.travelling) return;
    var el = e.target.closest && e.target.closest('.cd-mod'); if (!el || el === S.hov) return;
    S.hov = el; S.lastAct = Date.now();
    var r = el.getBoundingClientRect(), b = box.getBoundingClientRect();
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2, sx = b.left + BOX / 2, sy = b.top + BOX / 2;
    look((cx < sx ? 'L' : 'R') + (cy < sy ? 'T' : 'B'));
  });
  document.addEventListener('mouseout', function (e) {
    if (!S.hov || (e.relatedTarget && S.hov.contains(e.relatedTarget))) return;
    S.hov = null; look(null);
  });
  function resize() { if (S.r) { try { S.r.resizeDrawingSurfaceToCanvas(Math.max(window.devicePixelRatio || 1, 1) * 2); } catch (e) {} centre(); } }
  window.addEventListener('resize', resize);

  // watch the DOM for the module view opening/closing
  function check() { if (!S.ready) return; var v = view(); if (v && !S.on) enter(); else if (!v && S.on) exit(); }
  var moT = 0;
  new MutationObserver(function () { clearTimeout(moT); moT = setTimeout(check, 60); }).observe(document.documentElement, { childList: true, subtree: true });
  setInterval(function () {
    if (!S.ready) return;
    check();
    if (S.on && !S.travelling && Date.now() - S.lastAct > 9000) {   // idle glance
      S.lastAct = Date.now(); var d = ['LT', 'RT', 'LB', 'RB'][Math.floor(Math.random() * 4)];
      look(d); setTimeout(function () { if (S.on) look(null); }, 1200);
    }
  }, 300);

  // ---- boot ----
  function boot(R) {
    var r = new R.Rive({
      src: SRC, canvas: cv, artboard: 'Spark', stateMachine: 'SparkCharacter', autoplay: true, autoBind: true,
      layout: new R.Layout({ fit: R.Fit.Layout }),
      onLoad: function () { S.r = r; S.vi = r.viewModelInstance; S.ready = !!S.vi; resize(); if (S.ready) check(); }
    });
  }
  function start() {
    import(RT).then(function (m) { boot(m.default && m.default.Rive ? m.default : m); })
      .catch(function () { if (window.rive && window.rive.Rive) boot(window.rive); });
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
  window.__sparkJourney = { state: S, box: box, enter: enter, exit: exit, travel: travel, BOX: BOX };
})();

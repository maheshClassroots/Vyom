/* Module card + node button as a live Rive component (Chapter Journey → chapter detail → Journey mode).
   modulecard.riv · artboard "ModuleCard" (1040×220) · state machine "ModuleCard" · view model "PlayCard":
     label · title · description (string) · progress (0–100) · isPressed
     isActive · isInactive · isCompleted (bool; all false = default state)
   Transparent artboard; play node centred at (250,111), card from x≈298 to 825.
   Each .cd-mod carries data-mc-* attributes; this script mounts one Rive per module and keeps the
   view-model strings in sync with them. The DOM pod/label stay underneath (invisible) for clicks + layout. */
(function () {
  if (window.__moduleCardRive) return;
  var RT = 'https://cdn.jsdelivr.net/npm/@rive-app/canvas@2.44.0/+esm';
  var SRC = (window.__resources && window.__resources.moduleCardRiv) || 'modulecard.riv';
  var AW = 1040, AH = 220, NX = 250, NY = 111;
  var R = null, buf = null, mounted = new Map();

  function clipDefs() {
    if (document.getElementById('mcClip')) return;
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('width', '0'); s.setAttribute('height', '0'); s.style.position = 'absolute';
    s.innerHTML = '<defs><clipPath id="mcClip" clipPathUnits="objectBoundingBox">' +
      '<ellipse cx="' + (NX / AW) + '" cy="' + (112 / AH) + '" rx="' + (48 / AW) + '" ry="' + (48 / AH) + '"/>' +
      '<rect x="' + (294 / AW) + '" y="' + (15 / AH) + '" width="' + ((832 - 294) / AW) + '" height="' + ((190 - 15) / AH) + '" rx="' + (26 / AW) + '" ry="' + (26 / AH) + '"/>' +
      '</clipPath></defs>';
    document.body.appendChild(s);
  }

  function read(el) {
    return { label: el.getAttribute('data-mc-label') || '', title: el.getAttribute('data-mc-title') || '',
      description: el.getAttribute('data-mc-desc') || '', progress: +el.getAttribute('data-mc-progress') || 0, state: el.getAttribute('data-mc-state') || 'default',
      scale: +el.getAttribute('data-mc-scale') || 1 };
  }
  function push(m) {
    var vi = m.vi; if (!vi) return; var d = read(m.el);
    try { vi.string('label').value = d.label; vi.string('title').value = d.title; vi.string('description').value = d.description; vi.number('progress').value = d.progress; } catch (e) {}
    try { vi.boolean('isActive').value = d.state === 'active'; vi.boolean('isInactive').value = d.state === 'inactive'; vi.boolean('isCompleted').value = d.state === 'completed'; } catch (e) {}
  }
  function size(m) {
    var d = read(m.el), pod = m.el.offsetWidth || 0, s = d.scale;
    var st = m.cv.style;
    st.width = (AW * s) + 'px'; st.height = (AH * s) + 'px';
    st.left = (pod / 2 - NX * s) + 'px'; st.top = (m.el.offsetHeight / 2 - NY * s) + 'px';
    if (m.r) { try { m.r.resizeDrawingSurfaceToCanvas(); } catch (e) {} }
  }

  function mount(el) {
    var cv = document.createElement('canvas');
    cv.className = 'mc-rive';
    cv.style.cssText = 'position:absolute;pointer-events:none;z-index:4;opacity:0;transition:opacity .25s ease;';
    el.appendChild(cv);
    var m = { el: el, cv: cv, r: null, vi: null };
    mounted.set(el, m);
    size(m);
    var opts = { canvas: cv, artboard: 'ModuleCard', stateMachine: 'ModuleCard', autoplay: true, autoBind: true,
      layout: new R.Layout({ fit: R.Fit.Contain }),
      onLoad: function () {
        try { m.r.resizeDrawingSurfaceToCanvas(); } catch (e) {}
        m.vi = m.r.viewModelInstance; push(m);
        cv.style.opacity = '1'; el.setAttribute('data-mc-on', '1');
      } };
    if (buf) opts.buffer = buf.slice(0); else opts.src = SRC;
    m.r = new R.Rive(opts);
    var press = function (v) { if (m.vi) { try { m.vi.boolean('isPressed').value = v; } catch (e) {} } };
    el.addEventListener('pointerdown', function () { press(true); });
    el.addEventListener('pointerup', function () { press(false); });
    el.addEventListener('pointerleave', function () { press(false); });
    new MutationObserver(function () { push(m); size(m); }).observe(el, { attributes: true, attributeFilter: ['data-mc-label', 'data-mc-title', 'data-mc-desc', 'data-mc-progress', 'data-mc-scale', 'data-mc-state', 'style'] });
  }

  function scan() {
    if (!R) return;
    document.querySelectorAll('.cd-mod[data-mc-title]').forEach(function (el) { if (!mounted.has(el)) mount(el); });
    mounted.forEach(function (m, el) {
      if (!el.isConnected) { try { m.r && m.r.cleanup(); } catch (e) {} mounted.delete(el); }
    });
  }

  var t = 0;
  function start() {
    var css = document.createElement('style');
    // once the Rive card is live, the DOM pod art, badges and label go invisible but keep catching clicks
    css.textContent = '.cd-mod[data-mc-on] .cd-mod-art,.cd-mod[data-mc-on] .cd-mod-badge,.cd-mod[data-mc-on] .cj-pulsering{opacity:0 !important;}' +
      '.cd-mod[data-mc-on] .cd-mod-label{opacity:0 !important;transform:translateY(-50%) !important;}' +
      '.cd-mod[data-mc-on]:focus-visible{box-shadow:none;}';
    document.head.appendChild(css);
    var load = typeof SRC === 'string' && SRC.indexOf('data:') !== 0 ? fetch(SRC).then(function (r) { return r.arrayBuffer(); }) : fetch(SRC).then(function (r) { return r.arrayBuffer(); });
    Promise.all([import(RT), load.catch(function () { return null; })]).then(function (res) {
      var mod = res[0]; R = mod.default && mod.default.Rive ? mod.default : mod; buf = res[1];
      scan();
      new MutationObserver(function () { clearTimeout(t); t = setTimeout(scan, 60); }).observe(document.body, { childList: true, subtree: true });
      window.addEventListener('resize', function () { mounted.forEach(size); });
    });
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
  window.__moduleCardRive = { mounted: mounted };
})();

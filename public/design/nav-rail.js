/* Byjus.AI — the ONE shared icon rail (logo + Goals / Chapters / Practice + student avatar → Profile).
   Every page mounts this; only the `current` attribute changes (goals | chapters | practice | profile | none).
   Geometry (keep in sync with the Home collapsed rail in app-cosmos*.js):
   rail 72px wide · logo 40px at top 24px · buttons start 22px below logo · 52px buttons, r14, 8px apart, 24px icons. */
(function () {
  if (customElements.get('byjus-rail')) return;
  const ITEMS = [
    ['goals', 'target', 'Goal Page.dc.html', 'Goals'],
    ['chapters', 'map-2', 'Chapter Journey - L&P.dc.html', 'Chapters'],
    ['practice', 'trophy', 'Practice.dc.html', 'Practice'],
  ];
  class ByjusRail extends HTMLElement {
    static get observedAttributes() { return ['current', 'theme']; }
    connectedCallback() { this.render(); }
    attributeChangedCallback() { if (this.isConnected) this.render(); }
    render() {
      const cur = this.getAttribute('current') || 'none';
      const dark = this.getAttribute('theme') === 'dark';
      const T = dark
        ? { def: '#261f37', ink: '#b9b3d1', hov: 'rgba(77,163,240,.16)', hovInk: '#4da3f0' }
        : { def: '#e9e2fe', ink: '#5c5f8a', hov: '#e7f5ff', hovInk: '#1c7ed6' };
      this.style.cssText = 'position:fixed;left:0;top:0;width:72px;z-index:60;display:block;pointer-events:none;';
      this.innerHTML = `
<nav aria-label="Main" style="display:flex;flex-direction:column;align-items:center;">
  <a href="Home Page.dc.html" title="Byjus.AI — home" style="pointer-events:auto;margin-top:24px;width:40px;height:40px;flex:none;border-radius:8px;overflow:hidden;display:grid;place-items:center;"><img src="logo.png" alt="Byjus.AI" style="width:100%;height:100%;object-fit:contain;"></a>
  <span aria-hidden="true" style="display:block;margin-top:16px;width:28px;height:1px;flex:none;background:rgba(112,72,232,.18);border-radius:1px;"></span>
  <div style="pointer-events:auto;margin-top:16px;display:flex;flex-direction:column;gap:8px;align-items:center;">
    ${ITEMS.map(([key, icon, href, title]) => {
      const on = key === cur;
      const st = on
        ? 'background:#228be6;color:#ffffff;box-shadow:0 6px 14px -6px rgba(34,139,230,.55);'
        : `background:${T.def};color:${T.ink};`;
      return `<a href="${href}" title="${title}" aria-label="${title}"${on ? ' aria-current="page"' : ''} data-on="${on ? 1 : 0}" style="width:52px;height:52px;flex:none;border-radius:14px;display:grid;place-items:center;text-decoration:none;transition:background .15s ease,color .15s ease;${st}"><i class="ti ti-${icon}" style="font-size:24px;"></i></a>`;
    }).join('')}
    <span aria-hidden="true" style="display:block;margin:8px 0;width:28px;height:1px;flex:none;background:rgba(112,72,232,.18);border-radius:1px;"></span>
    <a href="Profile.dc.html" title="Profile" aria-label="Profile"${cur === 'profile' ? ' aria-current="page"' : ''} style="width:52px;height:52px;flex:none;border-radius:14px;overflow:hidden;display:block;background:${T.def};box-shadow:${cur === 'profile' ? '0 0 0 2px #228be6' : 'none'};text-decoration:none;"><img src="aarav-avatar.png" alt="Aarav" style="width:100%;height:100%;object-fit:cover;display:block;"></a>
  </div>
</nav>`;
      this.querySelectorAll('a[data-on="0"]').forEach(a => {
        a.addEventListener('mouseenter', () => { a.style.background = T.hov; a.style.color = T.hovInk; });
        a.addEventListener('mouseleave', () => { a.style.background = T.def; a.style.color = T.ink; });
      });
    }
  }
  customElements.define('byjus-rail', ByjusRail);
})();

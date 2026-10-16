/* Shared phone navigation — the same floating pill the Home page renders, so the four screens
   agree on its position, size and behaviour. Home draws its own copy inside app-cosmos.js
   (it lives inside that React tree); this component is what the other three pages mount.

   Usage:  <mobile-nav active="journey"></mobile-nav>
   Shows only on phone-sized viewports; desktop keeps each page's existing chrome. */
(function () {
  if (customElements.get('mobile-nav')) return;

  var TABS = [
    { k: 'home',     t: 'Home',     i: 'home',         href: 'Home Page.dc.html' },
    { k: 'journey',  t: 'Journey',  i: 'route',        href: 'Chapter Journey - L&P.dc.html' },
    { k: 'practice', t: 'Assessment', i: 'target-arrow', href: 'Assessment.dc.html' },
    { k: 'profile',  t: 'Profile',  i: 'user',         href: 'Profile.dc.html?pane=profile' },
  ];

  var CSS = [
    ':host{display:none;}',
    /* the phone test matches app-cosmos: narrow OR short (landscape phones) */
    '@media (max-width:767px),(max-height:499px){:host{display:block;}}',
    '.bar{position:fixed;left:50%;z-index:40;display:flex;align-items:center;',
    '  bottom:calc(18px + max(env(safe-area-inset-bottom,0px), var(--dp-safe-bottom,0px)));',
    '  transform:translate(-50%, var(--nav-off,0%));opacity:var(--nav-op,1);pointer-events:var(--nav-pe,auto);',
    '  transition:transform .42s cubic-bezier(.4,0,.2,1),opacity .3s ease;',
    '  gap:4.8px;border-radius:999px;padding:5.6px;',
    '  background:rgba(255,255,255,.82);',
    '  backdrop-filter:blur(18px) saturate(1.6);-webkit-backdrop-filter:blur(18px) saturate(1.6);',
    '  box-shadow:0 12px 34px -10px rgba(70,46,146,.30),0 2px 8px rgba(70,46,146,.10),inset 0 1px 0 rgba(255,255,255,.9);',
    '  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;}',
    '@media (max-height:499px){.bar{bottom:calc(10px + max(env(safe-area-inset-bottom,0px), var(--dp-safe-bottom,0px)));}}',
    '.tab{height:46px;min-width:46px;flex:none;border-radius:999px;display:flex;align-items:center;',
    '  justify-content:center;gap:0;cursor:pointer;color:#5b5570;background:transparent;',
    '  text-decoration:none;transition:background .18s ease,color .18s ease;}',
    /* blue-8 -> blue-9: the label is white, so the fill must clear 4.5:1, not the 3:1 an icon needs */
    '.tab.on{min-width:112px;padding:0 11.2px;gap:5.6px;color:#fff;background:linear-gradient(180deg,#1971c2,#1864ab);',
    '  box-shadow:0 6px 16px -4px rgba(24,100,171,.5);}',
    '.tab i{font-size:21px;line-height:1;}',
    '.lbl{font-size:14px;font-weight:700;line-height:1;white-space:nowrap;color:#fff;}',
  ].join('\n');

  function ensureIconFont() {
    var href = 'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.24.0/dist/tabler-icons.min.css';
    if (document.querySelector('link[href="' + href + '"]')) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = href;
    document.head.appendChild(l);
  }

  class MobileNav extends HTMLElement {
    static get observedAttributes() { return ['active']; }
    connectedCallback() {
      ensureIconFont();
      if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
      this.render();
    }
    attributeChangedCallback() { if (this.shadowRoot) this.render(); }
    render() {
      var active = this.getAttribute('active') || 'home';
      var style = '<style>' + CSS + '</style>';
      /* The icon font lives in the document, not the shadow root, so the glyph is injected as a
         link inside the shadow root too — otherwise `ti` classes resolve to nothing here. */
      var fontLink = '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.24.0/dist/tabler-icons.min.css">';
      var tabs = TABS.map(function (tb) {
        var on = tb.k === active;
        return '<a class="tab' + (on ? ' on' : '') + '" href="' + tb.href + '" title="' + tb.t + '" aria-label="' + tb.t + '"'
          + (on ? ' aria-current="page"' : '') + '>'
          + '<i class="ti ti-' + tb.i + '"></i>'
          + (on ? '<span class="lbl">' + tb.t + '</span>' : '')
          + '</a>';
      }).join('');
      this.shadowRoot.innerHTML = style + fontLink + '<nav class="bar" role="navigation" aria-label="Main">' + tabs + '</nav>';
    }
  }
  customElements.define('mobile-nav', MobileNav);
})();

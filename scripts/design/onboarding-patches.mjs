/**
 * The onboarding page (the "Onboarding_export" mockup), hosted as a design
 * page: what the importer changes on the way in.
 *
 * - The cast is the app's own Vyom and Spark, standing over the page where
 *   the mockup drew its characters (`src/onboarding/OnboardingCast.tsx`);
 *   the mockup's own become empty boxes, and the page reports its step.
 * - The canvas is the app's plain wash, as under every other page.
 * - "Start my first class" (and "Skip this") start the class at once. The
 *   mockup's build screen is not shown: the launch animation plays in its
 *   place, and the teaching room follows.
 */
export const ONBOARDING_REPLACE = [
  // The cast is the app's own Vyom and Spark, standing over the page: the
  // mockup's characters become empty boxes for them to stand in.
  [
    "<script src=\"vyom-rive.js\"></script>",
    ""
  ],
  // The cast block and the step headings, as the storyboard lays them out: Spark and her line
  // above at Vyom's shoulder, the question in a bubble at Vyom's right, Spark at the right end of that row with her line in a bubble above her.
  [
    "      <!-- CAST: Vyom (and Sparkle once she's met) stay put across every question; only the bubble changes -->\n      <sc-if value=\"{{ showCast }}\" hint-placeholder-val=\"{{ false }}\">\n        <div style=\"flex:none;height:112px;margin-bottom:14px;display:flex;align-items:center;gap:6px;\">\n          <div class=\"ob-enter-v\" style=\"width:96px;height:96px;flex:none;overflow:hidden;display:grid;place-items:center;\">\n            <vyom-rive art-scale=\"1.35\" class=\"ob-bob\" style=\"width:100%;height:100%;object-fit:contain;\"></vyom-rive>\n          </div>\n          <sc-if value=\"{{ sparkle }}\" hint-placeholder-val=\"{{ false }}\">\n            <div class=\"ob-emerge\" style=\"width:66px;height:96px;flex:none;margin-left:-12px;display:grid;place-items:center;\">\n              <img src=\"spark-mascot-sm.png\" alt=\"Sparkle\" class=\"ob-bob\" style=\"width:62px;height:62px;object-fit:contain;animation-delay:.6s;\">\n            </div>\n          </sc-if>\n          <sc-if value=\"{{ sparkleSays }}\" hint-placeholder-val=\"{{ false }}\">\n            <div key=\"{{ sayKey }}\" class=\"ob-bubble-e\" style=\"flex:1;min-width:0;background:#fff1e6;color:#8a4712;border-radius:16px 16px 16px 5px;padding:12px 15px;box-shadow:0 8px 22px -14px rgba(180,110,30,.55);\"><div style=\"font-size:16px;font-weight:800;line-height:1.35;\">{{ sayTitle }}</div><div style=\"font-size:14px;font-weight:500;line-height:1.45;margin-top:2px;opacity:.85;\">{{ saySub }}</div></div>\n          </sc-if>\n          <sc-if value=\"{{ vyomSays }}\" hint-placeholder-val=\"{{ false }}\">\n            <div key=\"{{ sayKey }}\" class=\"ob-bubble-q\" style=\"flex:1;min-width:0;background:#f1edfb;color:#1f1a3d;border-radius:16px 16px 16px 5px;padding:12px 15px;box-shadow:0 8px 22px -14px rgba(70,46,146,.5);\"><div style=\"font-size:16px;font-weight:800;line-height:1.35;\">{{ sayTitle }}</div><div style=\"font-size:14px;font-weight:500;line-height:1.45;margin-top:2px;opacity:.8;\">{{ saySub }}</div></div>\n          </sc-if>\n        </div>\n      </sc-if>\n\n",
    "      <!-- CAST: the app's own Vyom and Spark stand in these boxes (the shell places them), laid out as in the\n           reference frame: Vyom at the left with the question in a bubble at his right; Spark at the right end\n           of that row, her line in a bubble above her with its tail pointing down at her. -->\n      <sc-if value=\"{{ showCast }}\" hint-placeholder-val=\"{{ false }}\">\n        <div style=\"flex:none;position:relative;height:176px;margin-bottom:10px;\">\n          <div class=\"ob-enter-v\" style=\"position:absolute;left:-8px;top:56px;width:120px;height:120px;\">\n            <div data-cast=\"vyom\" style=\"width:100%;height:100%;\"></div>\n          </div>\n          <sc-if value=\"{{ sparkleSays }}\" hint-placeholder-val=\"{{ false }}\">\n            <div key=\"{{ sayKey }}\" class=\"ob-bubble-e\" style=\"position:absolute;left:30%;right:5%;top:0;background:#fff1e0;color:#2a2140;border-radius:18px;padding:12px 16px;\"><div style=\"font-size:16px;font-weight:800;line-height:1.3;\">{{ sayTitle }}</div><div style=\"font-size:14px;font-weight:500;line-height:1.4;margin-top:2px;\">{{ saySub }}</div><i style=\"position:absolute;right:22px;bottom:-7px;width:16px;height:16px;background:#fff1e0;transform:rotate(45deg);border-radius:0 0 4px 0;\"></i></div>\n          </sc-if>\n          <div key=\"{{ castKey }}\" class=\"ob-bubble-q\" style=\"position:absolute;visibility:{{ uiVis }};left:25%;bottom:12px;max-width:calc(75% - 88px);background:#ece7fb;border-radius:18px;padding:11px 18px;font-size:18px;font-weight:700;color:#1f1a3d;line-height:1.3;letter-spacing:-.01em;\">{{ castLine }}<i style=\"position:absolute;left:-7px;bottom:14px;width:13px;height:13px;background:#ece7fb;transform:rotate(45deg);border-radius:0 0 0 4px;\"></i></div>\n          <sc-if value=\"{{ sparkle }}\" hint-placeholder-val=\"{{ false }}\">\n            <div style=\"position:absolute;right:-16px;top:108px;width:64px;height:64px;\"><div data-cast=\"spark\" style=\"width:64px;height:64px;\"></div></div>\n          </sc-if>\n        </div>\n      </sc-if>\n\n"
  ],
  [
    "<div style=\"flex:none;height:64px;font-size:24px;font-weight:800;color:#1f1a3d;line-height:1.3;letter-spacing:-.01em;text-wrap:pretty;\">What should we call you?</div>",
    "<div style=\"flex:none;height:14px;\"></div>"
  ],
  [
    "<div style=\"flex:none;height:64px;font-size:24px;font-weight:800;color:#1f1a3d;line-height:1.3;letter-spacing:-.01em;text-wrap:pretty;\">{{ prompt }}</div>",
    "<div style=\"flex:none;height:14px;\"></div>"
  ],
  [
    "<div style=\"flex:none;height:64px;font-size:24px;font-weight:800;color:#1f1a3d;line-height:1.3;letter-spacing:-.01em;text-wrap:pretty;\">Which board do you study under?</div>",
    "<div style=\"flex:none;height:14px;\"></div>"
  ],
  [
    "<div style=\"flex:none;height:64px;font-size:24px;font-weight:800;color:#1f1a3d;line-height:1.3;letter-spacing:-.01em;white-space:nowrap;\">What chapter is going on at school right now?</div>",
    "<div style=\"flex:none;height:14px;\"></div>"
  ],
  [
    "      sayKey: 'say' + step + (st.sparkIntro ? 's' : ''),\n",
    "      sayKey: 'say' + step + (st.sparkIntro ? 's' : ''),\n      castKey: 'cast' + step + (uiOn ? '' : 'w'),\n      castLine: isName ? 'What should we call you?' : isBoard ? 'Which board do you study under?' : isChoice ? 'Which grade are you in?' : isChapter ? 'Which chapter is going on at school right now?' : '',\n"
  ],
  // The shell is told which step is showing and whether Spark has been met,
  // which is what decides where the two characters stand.
  [
    "  componentDidUpdate() {\n    if (this.state.step === S.BUILD && !this._buildRan) { this._buildRan = true; this._runBuild(); }\n  }\n  componentDidMount() {\n",
    "  _tellShell() {\n    const st = this.state, step = st.step;\n    const answered = step === S.NAME ? !!st.name.trim() : step === S.BOARD ? !!st.board : step === S.GRADE ? !!st.grade : step === S.CHAPTER ? !!st.chapter : false;\n    try { window.parent.postMessage({ type: 'onboarding-state', step, sparkle: !!st.sparkle, sparkIntro: !!st.sparkIntro, intro: !!st.intro, answered }, window.location.origin); } catch (e) {}\n  }\n  componentDidUpdate() {\n    this._tellShell();\n    if (this.state.step === S.BUILD && !this._buildRan) { this._buildRan = true; this._runBuild(); }\n  }\n  componentDidMount() {\n    this._tellShell();\n    this._onShell = (e) => { const m = e.data; if (e.origin === window.location.origin && m && m.type === 'onboarding-cue' && m.sparkLanded) this.setState({ sparkLanded: true }); if (e.origin === window.location.origin && m && m.type === 'onboarding-cue' && m.vyomLanded) this.setState({ landed: true }); };\n    window.addEventListener('message', this._onShell);\n"
  ],
  [
    "background-image:radial-gradient(rgba(96,74,190,.13) 1px,transparent 1px),linear-gradient(180deg,#eee9fd 0%,#f8f5fe 46%,#fdfaf0 100%);background-size:24px 24px,100% 100%;",
    "background-image:linear-gradient(180deg,#eee9fd 0%,#f8f5fe 46%,#fdfaf0 100%);background-size:100% 100%;"
  ],
  [
    "      skipChapter: () => this._advance(),",
    "      skipChapter: () => this._start(),"
  ],
  // The grade step: Continue brings Spark in to say her line, and the page moves on by itself.
  [
    "      next: () => { if (!hasChoice) return; if (isAuth) { this._authNext(); return; } if (isChoice && !st.sparkle) { this.setState({ sparkle: true, sparkIntro: true }); return; } this._advance(); },",
    "      next: () => { if (!hasChoice) return; if (isChapter) { this._start(); return; } if (isAuth) { this._authNext(); return; } if (isChoice && !st.sparkle) { this.setState({ sparkle: true, sparkIntro: true }); return; } this._advance(); },"
  ],
  [
    "        : (step === S.CHAPTER ? 'Start my first class' : 'Continue'),",
    "        : isChoice && !st.sparkle ? 'Submit'\n        : (step === S.CHAPTER ? 'Start my first class' : 'Continue'),"
  ],
  [
    "      sparkleSays: isChoice && st.sparkIntro, vyomSays: !isAuth && !(isChoice && st.sparkIntro),",
    "      sparkleSays: isChoice && st.sparkIntro && st.sparkLanded, vyomSays: !isAuth && !(isChoice && st.sparkIntro),"
  ],
  [
    "  componentWillUnmount() {\n    clearTimeout(this._buildT);",
    "  componentWillUnmount() {\n    clearTimeout(this._buildT);\n    if (this._onShell) window.removeEventListener('message', this._onShell);"
  ],
  [
    "  .ob-bubble-e{animation:obSay .5s cubic-bezier(.2,.9,.3,1) .8s both;}",
    "  .ob-bubble-e{animation:obSay .5s cubic-bezier(.2,.9,.3,1) .1s both;}"
  ],
  // Vyom's introduction after sign-up.
  [
    "buildPct: 0, buildLog: [], sparkle: false, sparkIntro: false };",
    "buildPct: 0, buildLog: [], sparkle: false, sparkIntro: false, intro: false, introOut: false, fromIntro: false, landed: false };"
  ],
  // Vyom's introduction after sign-up.
  [
    "const TOTAL = 6;",
    "const TOTAL = 6;\n/** How long Vyom stands alone in the middle, saying hello, after sign-up. */\n/** ...of which his greeting is up for this long before it leaves. */\nconst INTRO_SAY_MS = 3000;\nconst INTRO_MS = 3500;\n/** If the shell never says he has landed (the page on its own), the field comes up this long after the intro. */\nconst LAND_FALLBACK_MS = 3500;"
  ],
  // Vyom's introduction after sign-up.
  [
    "_set(step) { this.setState({ step, chapterOpen: false, boardOpen: false, sparkIntro: false }); }",
    "_set(step) {\n    // Straight after sign-up Vyom introduces himself alone in the middle; the name step comes up when he is done.\n    const intro = step === S.NAME && this.state.step === S.AUTH;\n    clearTimeout(this._introT);\n    clearTimeout(this._introOutT);\n    clearTimeout(this._landT);\n    this.setState({ step, chapterOpen: false, boardOpen: false, sparkIntro: false, intro, introOut: false, fromIntro: intro, landed: false });\n    if (intro) {\n      this._landT = setTimeout(() => this.setState({ landed: true }), INTRO_MS + LAND_FALLBACK_MS);\n      this._introOutT = setTimeout(() => this.setState({ introOut: true }), INTRO_SAY_MS);\n      this._introT = setTimeout(() => this.setState({ intro: false, introOut: false }), INTRO_MS);\n    }\n  }"
  ],
  // Vyom's introduction after sign-up.
  [
    "this.setState((s) => ({ step: s.step - 1, chapterOpen: false, boardOpen: false, sparkIntro: false }));",
    "clearTimeout(this._introT);\n    clearTimeout(this._introOutT);\n    clearTimeout(this._landT);\n    this.setState((s) => ({ step: s.step - 1, chapterOpen: false, boardOpen: false, sparkIntro: false, intro: false, introOut: false, fromIntro: false }));"
  ],
  // Vyom's introduction after sign-up.
  [
    "showCast: !isAuth, sparkle: st.sparkle,",
    "showCast: !isAuth && !st.intro, intro: !!st.intro, introLine: 'Hi, I am Vyom. Your tutor.', uiCls: st.fromIntro ? 'ob-fade-in' : '', outCls: st.introOut ? ' ob-intro-out' : '', contentKey: step + (st.intro ? 'i' : '') + (uiOn ? '' : 'w'), uiVis: (st.intro || !uiOn) ? 'hidden' : 'visible', sparkle: st.sparkle,"
  ],
  // Vyom's introduction after sign-up.
  [
    "footerDisp: isBuild ? 'none' : 'flex',",
    "footerDisp: (isBuild || st.intro || !uiOn) ? 'none' : 'flex',"
  ],
  // Vyom's introduction after sign-up.
  [
    "showDots: step > S.AUTH,",
    "showDots: step > S.AUTH && !st.intro && uiOn,"
  ],
  // Vyom's introduction after sign-up.
  [
    "<div key=\"{{ step }}\" class=\"ob-screen ob-body\" style=\"flex:1;min-height:0;overflow-y:{{ scrollMode }};display:flex;flex-direction:column;\">",
    "<div key=\"{{ contentKey }}\" class=\"ob-screen ob-body\" style=\"flex:1;min-height:0;overflow-y:{{ scrollMode }};display:flex;flex-direction:column;visibility:{{ uiVis }};\">"
  ],
  // Vyom's introduction after sign-up.
  [
    "  <!-- fixed 3-region layout: header / content / footer never move, regardless of screen -->",
    "  <!-- INTRO: straight after sign-up Vyom stands alone in the middle and says hello; then he walks to his place and the\n       name step comes up (the shell reads the box below and walks him when it moves) -->\n  <sc-if value=\"{{ intro }}\" hint-placeholder-val=\"{{ false }}\">\n    <div style=\"position:absolute;inset:0;z-index:3;pointer-events:none;\">\n      <div style=\"position:absolute;left:50%;top:50%;width:120px;height:120px;transform:translate(-50%,-50%);\"><div data-cast=\"vyom\" style=\"width:100%;height:100%;\"></div></div>\n      <div style=\"position:absolute;left:50%;top:calc(50% + 80px);transform:translateX(-50%);\">\n        <div class=\"ob-intro-say{{ outCls }}\" style=\"position:relative;white-space:nowrap;background:#ece7fb;border-radius:18px;padding:11px 20px;font-size:18px;font-weight:700;color:var(--primary,#5f3dc4);line-height:1.3;letter-spacing:-.01em;\">{{ introLine }}<i style=\"position:absolute;left:50%;top:-6px;margin-left:-6px;width:12px;height:12px;background:#ece7fb;transform:rotate(45deg);border-radius:4px 0 0 0;\"></i></div>\n      </div>\n    </div>\n  </sc-if>\n\n  <!-- fixed 3-region layout: header / content / footer never move, regardless of screen -->"
  ],
  // Vyom's introduction after sign-up.
  [
    "  .ob-bubble-q{animation:obSay .5s cubic-bezier(.2,.9,.3,1) .3s both;}",
    "  .ob-bubble-q{animation:obSay .5s cubic-bezier(.2,.9,.3,1) .3s both;}\n  /* his greeting slides down out of him: small and a little above, settling to full size with a soft overshoot */\n  .ob-intro-say{transform-origin:50% 0;animation:obIntroIn .8s cubic-bezier(.18,.9,.28,1.08) 1.5s both;}\n  @keyframes obIntroIn{0%{opacity:0;transform:translateY(-32px) scale(.74)}50%{opacity:1}100%{opacity:1;transform:translateY(0) scale(1)}}\n  @keyframes obSayOut{from{opacity:1;transform:translateY(0) scale(1)}to{opacity:0;transform:translateY(-22px) scale(.82)}}\n  .ob-intro-out{transform-origin:50% 0;animation:obSayOut .4s cubic-bezier(.5,0,.75,.4) both !important;}\n  @keyframes obFade{from{opacity:0}to{opacity:1}}\n  .ob-fade-in{animation:obFade .5s ease .15s both;}"
  ],
  // Vyom's introduction after sign-up.
  [
    "    const isAuthMain = isAuth && st.authView === 'main';",
    "    // After the intro the question, the field and the buttons wait for Vyom to land at his place.\n    const uiOn = !st.fromIntro || st.landed;\n    const isAuthMain = isAuth && st.authView === 'main';"
  ],
];

/**
 * Patches that give the Goal Page's chapter drill-in the Chapter Journey's
 * module language. See goal-module-view/README.md.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const snippet = (name) => readFileSync(join(HERE, 'goal-module-view', name), 'utf8');

/** `[from, to]` pairs, each of which must match exactly once. */
export const GOAL_REPLACE = [
  // The two Rive helpers, after the inline-Vyom loader.
  [
    '<script src="vyom-rive.js"></script>',
    '<script src="vyom-rive.js"></script>\n<script src="module-icon-rive.js"></script>\n<script src="spark-journey.js"></script>\n<script src="goal-path-rive.js"></script>',
  ],
  // The module-card styles, at the end of the page's own sheet.
  ['</style>', `${snippet('module-card.css')}${snippet('progress-card.css')}</style>`],
  // The pod template.
  [snippet('pods.from.html'), snippet('pods.html')],
  // The goal thread's own steps are built by the same module builder but
  // drawn by their own template: the painted planet, the corner badges and
  // the pulse ring give way to the Rive module node, and the step card takes
  // the module-card class, keeping the goal's own content inside it.
  [
    snippet('step-art.from.html'),
    '              <div class="mc-node" data-mi-type="{{ m.mcType }}" data-mi-state="{{ m.mcState }}"></div>\n',
  ],
  [
    '<div class="cd-mod-label" style="left:{{ m.labelLeft }}px;width:{{ m.labelW }}px;box-shadow:{{ m.gCardSh }};padding:21px 25px 20px;">\n                <div class="cd-label-handle" style="background:{{ m.accent }};"></div>',
    '<div class="cd-mod-label mc-card" style="left:{{ m.labelLeft }}px;width:{{ m.labelW }}px;">',
  ],
  // One pod size for every module on the goal thread. The package grew the
  // active pod and shrank the rest, which moved each card to a different
  // offset; the Rive node draws the same size in every state, so the boxes
  // around it match too. The chapter view's own sizing is left as it was.
  [
    "const podSize = st === 'active' ? (_sm ? 96 : 116) : (st === 'completed' ? (_sm ? 76 : 92) : (_sm ? 64 : 80));",
    "const podSize = items ? 92 : (st === 'active' ? (_sm ? 96 : 116) : (st === 'completed' ? (_sm ? 76 : 92) : (_sm ? 64 : 80)));",
  ],
  // A tap on a goal-thread module sets the module icons and Spark (see the
  // vendored helpers) rather than opening the lesson; the active card's own
  // Start button still opens it.
  [
    'animation-delay:{{ m.enterDelay }}s;" onClick="{{ m.onClick }}" tabindex="0">\n              <div class="mc-node"',
    'animation-delay:{{ m.enterDelay }}s;" tabindex="0">\n              <div class="mc-node"',
  ],
  // The card stays pinned to the page's bottom-right at every width. The
  // package moved it inline above the thread once the column fell under
  // 640px, which is where it lands beside the chat; the app wants the
  // illustration at the corner, so the narrow variant is never taken.
  [
    "    const _narrow = (this.state.rowW || 900) < 640;\n",
    "    const _narrow = false;\n",
  ],
  // The progress card: a pill with the goal-path illustration (GoalPath.riv)
  // rising at its right end and the count beside it; open, the chapter rows
  // sit above the count. goal-path-rive.js draws the hill and moves its
  // marker to the card's percentage.
  [snippet('progress-card.from.html'), snippet('progress-card.html')],
  // The template's done flag and sub line, and the hooks the progress demo uses:
  // the chapter counts read from a window override, and a re-render that
  // the goal-path helper can ask for after changing them.
  [
    "    const _PR = [['Algebra', 3, 10], ['Circles', 3, 10], ['Statistics', 4, 10]];\n",
    "    const _PR = window.__goalProgress || [['Algebra', 3, 10], ['Circles', 3, 10], ['Statistics', 4, 10]];\n" +
      "    window.__goalRerender = () => this.setState({ gpTick: Date.now() });\n",
  ],
  [
    "progOpen: !!this.state.progOpen, progChev:",
    "progOpen: !!this.state.progOpen, progDoneAll: _pd >= _pt, progSub: _pd >= _pt ? 'All topics covered' : 'topics covered', progChev:",
  ],
  // The canvas: the package's plain lavender-to-cream wash, as the app paints
  // it under every page but the room. The dot lattice (and the pointer wake
  // that lit its dots) goes from the field and from the chapter drill-in.
  [
    'background-image:radial-gradient(rgba(96,74,190,.13) 1px,transparent 1px),linear-gradient(180deg,#eee9fd 0%,#f8f5fe 46%,#fdfaf0 100%);background-size:24px 24px,100% 100%;',
    'background-image:linear-gradient(180deg,#eee9fd 0%,#f8f5fe 46%,#fdfaf0 100%);background-size:100% 100%;',
  ],
  [
    '    background-image:\n      var(--cv-lattice),\n      var(--cv-linear);\n    background-size:24px 24px, 100% 100%;',
    '    background-image:\n      var(--cv-linear);\n    background-size:100% 100%;',
  ],
  [
    '.cj-wake{position:absolute;inset:0;z-index:1;pointer-events:none;transition:opacity .32s ease;',
    '.cj-wake{display:none;position:absolute;inset:0;z-index:1;pointer-events:none;transition:opacity .32s ease;',
  ],
  // Vyom's dock beside the composer: centred in the room left of the input
  // rather than hugging it, and without the rings that pulsed behind him.
  [
    '<div id="dockSlot" style="position:absolute;left:-10px;bottom:0;width:60px;height:60px;display:grid;place-items:center;">',
    '<div id="dockSlot" style="position:absolute;left:-34px;bottom:0;width:60px;height:60px;display:grid;place-items:center;">',
  ],
  [
    '.dock-ripple-lg{position:absolute;top:50%;left:50%;width:52px;height:52px;margin:-26px 0 0 -26px;border-radius:50%;border:2px solid #4dabf7;animation:dockripple 2.6s ease-out infinite;pointer-events:none;}',
    '.dock-ripple-lg{display:none;}',
  ],
  // The thread runs to the page's foot and fades out there, rather than
  // stopping at a hard edge above it. Its mask box then reaches past the
  // progress card, which is pinned inside it and was being cut at the edge.
  [
    '<div class="tr-scroll g2-scroll" style="flex:1;min-height:0;min-width:0;overflow-y:auto;margin-right:-{{ edgeGap }};padding:4px {{ edgeGap }} 24px 0;-webkit-mask-image:linear-gradient(180deg,transparent 0,#000 10px);mask-image:linear-gradient(180deg,transparent 0,#000 10px);">',
    '<div class="tr-scroll g2-scroll" style="flex:1;min-height:0;min-width:0;overflow-y:auto;margin-right:-{{ edgeGap }};margin-bottom:-44px;padding:4px {{ edgeGap }} 68px 0;-webkit-mask-image:linear-gradient(180deg,transparent 0,#000 10px,#000 calc(100% - 56px),transparent 100%);mask-image:linear-gradient(180deg,transparent 0,#000 10px,#000 calc(100% - 56px),transparent 100%);">',
  ],
  // The fields that template reads: label, state, type, fill and scale per
  // module, derived the same way the Chapter Journey derives them — with the
  // module type read off a goal step's own kind when it has one.
  [
    "        art, isCompleted: st === 'completed', isActive: st === 'active', isLocked: st === 'locked',\n        showRing:",
    "        mcLabel: 'MODULE ' + String(i + 1).padStart(2, '0'),\n" +
      "        mcProgress: st === 'completed' ? 100 : (st === 'active' ? 45 : 0),\n" +
      "        mcState: st === 'completed' ? 'completed' : (st === 'active' ? 'active' : (st === 'locked' ? 'inactive' : 'default')),\n" +
      "        mcType: (items && items[i].x && /practice|test/i.test(String(items[i].x.gKind))) ? 'practice' : (items ? 'learning' : (i % 3 === 2 ? 'practice' : 'learning')),\n" +
      "        mcFillW: (st === 'completed' ? 100 : (st === 'active' ? 45 : 0)) + '%',\n" +
      "        mcScale: +Math.min(1, Math.max(0.6, (pathW - x - 8) / 578)).toFixed(3),\n" +
      "        art, isCompleted: st === 'completed', isActive: st === 'active', isLocked: st === 'locked',\n        showRing:",
  ],
];

/** Files of the app's own that the goal site needs beside the page. */
export const GOAL_EXTRAS = {
  'module-icon-rive.js': join(HERE, 'vendor', 'module-icon-rive.js'),
  'spark-journey.js': join(HERE, 'vendor', 'spark-journey.js'),
  'goal-path-rive.js': join(HERE, 'vendor', 'goal-path-rive.js'),
};

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
    '<script src="vyom-rive.js"></script>\n<script src="module-icon-rive.js"></script>\n<script src="spark-journey.js"></script>',
  ],
  // The module-card styles, at the end of the page's own sheet.
  ['</style>', `${snippet('module-card.css')}</style>`],
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
};

#!/usr/bin/env node
/**
 * Imports one of the design package's pages into `public/design/<id>/`.
 *
 *   node scripts/import-design.mjs journey "<earlier package dir or .zip>"
 *   node scripts/import-design.mjs goal    "<later package dir or .zip>"
 *
 * Each page is a `.dc.html` document built on the design tool's own runtime
 * (`support.js`): a template in a custom `{{ }}` / `sc-if` language driven by
 * a `DCLogic` class, plus Rive helpers, the Mantine token sheets and a handful
 * of assets. They are copied here *as-is* and hosted inside the app in a
 * frame, which is what keeps the design and every animation exactly as
 * authored — WebGL nebula, camera zoom, FTUE sequence and Rive islands all
 * run on their own code.
 *
 * The two hosted pages come from two packages, so each lives in its own
 * folder with its own copy of the runtime and helpers:
 *
 *   journey  the earlier package's Chapter Journey — chapter planets with
 *            Rive chapter icons, module nodes drawn by `moduleicon.riv`, and
 *            Spark riding the module thread
 *   goal     the later package's Goal Page — "Unit test 2": the step thread
 *            toward the goal, with the left rail
 *
 * Two things are patched on the way in, and nothing else:
 *
 *  1. Every `window.location.href = …` that would hop to another page of the
 *     package is routed through `window.__designNav(page)`, which posts the
 *     target page name to the app when the page is framed (and still navigates
 *     when it is opened standalone). The app decides what each page means.
 *  2. A tiny bootstrap script is added to the head: it defines `__designNav`,
 *     sends plain `<a href="….dc.html">` links (the navs) the same way, and
 *     points the Rive helpers at the app's single copies in
 *     `public/characters/`.
 *
 * **Do not hand-edit `public/design/` — re-run this script.**
 */
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GOAL_EXTRAS, GOAL_REPLACE } from './design/goal-patches.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_ROOT = resolve(HERE, '..', 'public', 'design');

/** Files every page needs, copied verbatim from the package root. */
const COMMON = [
  'support.js',
  'mobile-nav.js',
  'canvas-bg.css',
  'logo.png',
  'vyom-mascot.png',
];

/** Directories every page needs, copied whole. */
const COMMON_DIRS = ['_ds', 'icons'];

/**
 * Files of the app's own that stand in for a package file of the same name.
 *
 * `vyom-rive.js`: the package's inline-Vyom loader drew a separate mascot
 * artboard. The app has one Vyom file, so its replacement draws the stage's
 * `VyomCanvas` artboard into a small canvas and sizes him with the artboard's
 * `scaleSmall` / `scaleFull` triggers — see the file.
 */
const JOURNEY_EXTRAS = Object.fromEntries(
  ['spark-journey.js', 'spark-fly.js', 'module-icon-rive.js', 'chapter-icon-rive.js', 'module-card-rive.js']
    .map((name) => [name, resolve(HERE, 'design', 'vendor', 'journey', name)]),
);

const OVERRIDES = {
  'vyom-rive.js': resolve(HERE, 'design', 'vyom-rive.js'),
};

/**
 * The hosted pages: the package file each is, and what it needs on top of
 * the common set. `optional` files are copied when the package has them and
 * skipped with a note when it does not.
 *
 * No `.riv` is ever copied from a package. The app keeps one copy of each
 * character file in `public/characters/`, and the bootstrap below points the
 * pages' helpers at those through `window.__resources`.
 */
const SITES = {
  journey: {
    file: 'Chapter Journey.dc.html',
    // The chapter journey's Spark (on the thread and flying between chapters)
    // is the alternate file; the Goal Page and the app's stage keep spark.riv.
    sparkRiv: '/characters/spark copy.riv',
    plain: [],
    optional: [],
    dirs: [],
    // Its Rive helpers came with the one package that shipped them, which is
    // no longer around; the app keeps them in design/vendor/journey/.
    extras: JOURNEY_EXTRAS,
    // The earlier package navigated with a floating phone pill; the app uses
    // the later package's left rail everywhere, so this page mounts that rail
    // instead — the same `byjus-rail` the Goal Page and the home use. The
    // file is borrowed from the goal site's folder, so import `goal` first.
    borrow: { 'nav-rail.js': 'goal', 'aarav-avatar.png': 'goal' },
    replace: [
      [
        '<mobile-nav active="journey" always=""></mobile-nav>',
        '<x-import component-from-global-scope="byjus-rail" from="./nav-rail.js" current="chapters" hint-size="72px,360px" style="position:fixed;left:0;top:0;z-index:60;"></x-import>',
      ],
      // The goal statement moves right of the rail, and the page's own logo
      // goes: the rail carries one, which is also the way home.
      [
        '<div style="position:absolute;top:24px;left:28px;z-index:30;display:flex;align-items:flex-start;gap:40px;',
        '<div style="position:absolute;top:24px;left:92px;z-index:30;display:flex;align-items:flex-start;gap:40px;',
      ],
      [
        '<div onClick="{{ closeHome }}" title="Home" role="button" tabindex="0" style="width:40px;height:40px;flex:none;border-radius:12px;overflow:hidden;display:grid;place-items:center;cursor:pointer;"><img src="logo.png" alt="Byjus.AI" style="width:100%;height:100%;object-fit:contain;"></div>',
        '',
      ],
    ],
  },
  goal: {
    file: 'Goal Page.dc.html',
    plain: ['nav-rail.js', 'image-slot.js', 'aarav-avatar.png'],
    optional: [],
    // The video thumbnails on its step cards.
    dirs: ['vidframes'],
    // Its chapter drill-in takes the Chapter Journey's module language —
    // Rive module nodes, the lavender cards, Spark on the thread. See
    // design/goal-module-view/README.md.
    extras: GOAL_EXTRAS,
    replace: GOAL_REPLACE,
  },
};

const bootstrap = (site) => `<script>
/* Added by scripts/import-design.mjs.
   The Rive files live once, in the app's public/characters/ — the page's
   helpers read their sources from here rather than from files beside it. */
window.__resources = Object.assign(window.__resources || {}, {
  vyomRiv: '/characters/vyom.riv',
  sparkRiv: '${site.sparkRiv || '/characters/spark.riv'}',
  moduleIconRiv: '/characters/moduleicon.riv',
  chapterIconsRiv: '/characters/chaptericons.riv',
  goalPathRiv: '/characters/GoalPath.riv',
});
/* When this page is hosted inside the Vyom app it must not navigate the
   frame to another file of the design package — it tells the app which page
   was asked for instead, and the app swaps screens. Opened on its own, it
   navigates as it always did. */
window.__designNav = function (to) {
  var page = String(to == null ? '' : to);
  try { page = decodeURI(page); } catch (e) {}
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ type: 'design-nav', page: page }, window.location.origin);
    return;
  }
  try { window.location.href = encodeURI(page); } catch (e) {}
};
/* Links to other pages of the package (the phone nav draws plain anchors)
   go the same way. Capture phase, so it runs before anything else does. */
document.addEventListener('click', function (e) {
  /* The phone nav is a custom element with a shadow root, so the event's
     target is retargeted to the host; the composed path still has the anchor. */
  var path = e.composedPath ? e.composedPath() : [e.target];
  var a = null;
  for (var i = 0; i < path.length; i++) {
    var n = path[i];
    if (n && n.tagName === 'A' && n.getAttribute && n.getAttribute('href')) { a = n; break; }
  }
  if (!a) return;
  var href = a.getAttribute('href') || '';
  if (!/[.]dc[.]html([?]|$)/.test(href)) return;
  e.preventDefault();
  window.__designNav(href);
}, true);
</script>`;

function patch(name, text, replace = [], site = {}) {
  // `window.location.href = X;` (or bare `location.href = X;`) →
  // `window.__designNav(X);`. The right-hand side runs to the statement's
  // semicolon, across lines — one of them builds a query string over four
  // lines.
  let count = 0;
  let out = text.replace(/(?<![\w.$])(?:window\.)?location\.href\s*=\s*([\s\S]*?);/g, (_m, rhs) => {
    count += 1;
    return `window.__designNav(${rhs.trim()});`;
  });
  // The close buttons prefer `history.back()` when the referrer is a sibling
  // page, falling back to a navigation to `f`. Inside the app's frame the
  // referrer is the app itself, and going back there would unwind the app's
  // own history — so that branch is routed to the bridge as well.
  out = out.replace(/history\.back\(\);\s*return;/g, () => {
    count += 1;
    return 'window.__designNav(f);return;';
  });
  // Site-specific markup swaps, each of which must match exactly once —
  // a miss means the package has changed under the patch.
  for (const [from, to] of replace) {
    const hits = out.split(from).length - 1;
    if (hits !== 1) throw new Error(`${name}: expected one match for ${JSON.stringify(from.slice(0, 60))}, found ${hits}`);
    out = out.replace(from, to);
  }
  const anchor = '<meta name="viewport"';
  const at = out.indexOf(anchor);
  if (at === -1) throw new Error(`${name}: viewport meta not found; cannot place the bootstrap`);
  const lineEnd = out.indexOf('\n', at);
  return {
    text: `${out.slice(0, lineEnd + 1)}${bootstrap(site)}\n${out.slice(lineEnd + 1)}`,
    count,
  };
}

function main() {
  const [id, input] = process.argv.slice(2);
  const site = SITES[id];
  if (!site || !input) {
    console.error('usage: node scripts/import-design.mjs <journey|goal> "<package dir or .zip>"');
    process.exit(1);
  }
  const out = join(OUT_ROOT, id);

  let root = resolve(input);
  let scratch = null;
  if (root.toLowerCase().endsWith('.zip')) {
    scratch = mkdtempSync(join(tmpdir(), 'design-'));
    const members = [
      site.file,
      ...COMMON,
      ...site.plain,
      ...site.optional,
      ...[...COMMON_DIRS, ...site.dirs].map((d) => `${d}/*`),
    ];
    // Exit 11 is unzip's "some names matched nothing" — the optional files.
    // Anything required that is missing is caught below, by name.
    const run = spawnSync('unzip', ['-o', '-q', root, ...members, '-d', scratch], {
      stdio: ['ignore', 'inherit', 'ignore'],
    });
    if (run.status !== 0 && run.status !== 11) {
      console.error(`unzip failed (exit ${run.status})`);
      process.exit(1);
    }
    root = scratch;
  }

  for (const name of [site.file, ...COMMON, ...site.plain, ...COMMON_DIRS, ...site.dirs]) {
    if (!existsSync(join(root, name))) {
      console.error(`"${name}" not found in ${root}`);
      process.exit(1);
    }
  }

  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });

  for (const name of [...COMMON, ...site.plain]) cpSync(join(root, name), join(out, name));
  for (const [name, source] of Object.entries(OVERRIDES)) cpSync(source, join(out, name));
  for (const [name, source] of Object.entries(site.extras ?? {})) cpSync(source, join(out, name));
  for (const name of site.optional) {
    if (existsSync(join(root, name))) cpSync(join(root, name), join(out, name));
    else console.log(`${name}: not in this package, skipped`);
  }
  for (const dir of [...COMMON_DIRS, ...site.dirs]) {
    cpSync(join(root, dir), join(out, dir), { recursive: true });
  }
  for (const [name, fromSite] of Object.entries(site.borrow ?? {})) {
    const source = join(OUT_ROOT, fromSite, name);
    if (!existsSync(source)) {
      console.error(`"${name}" is borrowed from the ${fromSite} site — import that first`);
      process.exit(1);
    }
    cpSync(source, join(out, name));
  }
  const { text, count } = patch(site.file, readFileSync(join(root, site.file), 'utf8'), site.replace ?? [], site);
  writeFileSync(join(out, site.file), text);
  console.log(`${id}: "${site.file}" — ${count} navigation${count === 1 ? '' : 's'} routed to the app`);

  if (scratch) rmSync(scratch, { recursive: true, force: true });
  console.log(`imported into ${out}`);
}

main();

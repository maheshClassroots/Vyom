#!/usr/bin/env node
/**
 * Imports the design package's pages that the app hosts into `public/design/`.
 *
 *   node scripts/import-design.mjs "<package dir or .zip>"
 *
 * Each page is a `.dc.html` document built on the design tool's own runtime
 * (`support.js`): a template in a custom `{{ }}` / `sc-if` language driven by
 * a `DCLogic` class, plus Rive helpers, the Mantine token sheets and a handful
 * of assets. They are copied here *as-is* and hosted inside the app in a
 * frame, which is what keeps the design and every animation exactly as
 * authored — WebGL nebula, camera zoom, FTUE sequence and Rive islands all
 * run on their own code.
 *
 * Two things are patched on the way in, and nothing else:
 *
 *  1. Every `window.location.href = …` that would hop to another page of the
 *     package is routed through `window.__designNav(page)`, which posts the
 *     target page name to the app when the page is framed (and still navigates
 *     when it is opened standalone). The app decides what each page means.
 *  2. A tiny bootstrap script is added to the head: it defines `__designNav`
 *     and sends plain `<a href="….dc.html">` links (the phone nav) the same way.
 *
 * **Do not hand-edit `public/design/` — re-run this script.**
 */
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, '..', 'public', 'design');

/** The pages the app hosts. Each is copied through the patcher. */
const PAGES = ['Chapter Journey.dc.html', 'Goal Page.dc.html'];

/** Files copied verbatim, relative to the package root. */
const PLAIN = [
  'support.js',
  'vyom-rive.js',
  'mobile-nav.js',
  // The Goal Page's left rail (an `x-import`), its image-slot helper, and
  // the student avatar on its calendar.
  'nav-rail.js',
  'image-slot.js',
  'aarav-avatar.png',
  'canvas-bg.css',
  'logo.png',
  'vyom.riv',
  'vyom-mascot.png',
];

/**
 * Files a version of a page may or may not use — copied when present,
 * skipped with a note when not. The Chapter Journey's Rive islands, for
 * one: an earlier package drew them with these helpers, a later one does not
 * ship them.
 */
const OPTIONAL = [
  'spark-journey.js',
  'spark-fly.js',
  'module-icon-rive.js',
  'chapter-icon-rive.js',
  'spark.riv',
  'chaptericons.riv',
  'moduleicon.riv',
];

/** Directories copied whole. `vidframes` is the Goal Page's video thumbnails. */
const DIRS = ['_ds', 'icons', 'vidframes'];


const BOOTSTRAP = `<script>
/* Added by scripts/import-design.mjs. When this page is hosted inside the
   Vyom app it must not navigate the frame to another file of the design
   package — it tells the app which page was asked for instead, and the app
   swaps screens. Opened on its own, it navigates as it always did. */
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

function patch(name, text) {
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
  const anchor = '<meta name="viewport"';
  const at = out.indexOf(anchor);
  if (at === -1) throw new Error(`${name}: viewport meta not found; cannot place the bootstrap`);
  const lineEnd = out.indexOf('\n', at);
  return {
    text: `${out.slice(0, lineEnd + 1)}${BOOTSTRAP}\n${out.slice(lineEnd + 1)}`,
    count,
  };
}

function main() {
  const input = process.argv[2];
  if (!input) {
    console.error('usage: node scripts/import-design.mjs "<package dir or .zip>"');
    process.exit(1);
  }

  let root = resolve(input);
  let scratch = null;
  if (root.toLowerCase().endsWith('.zip')) {
    scratch = mkdtempSync(join(tmpdir(), 'journey-'));
    const members = [...PAGES, ...PLAIN, ...OPTIONAL, ...DIRS.map((d) => `${d}/*`)];
    // Exit 11 is unzip's "some names matched nothing" — the optional files.
    // Anything required that is missing is caught below, by name.
    const run = spawnSync('unzip', ['-o', '-q', root, ...members, '-d', scratch], { stdio: ['ignore', 'inherit', 'ignore'] });
    if (run.status !== 0 && run.status !== 11) {
      console.error(`unzip failed (exit ${run.status})`);
      process.exit(1);
    }
    root = scratch;
  }
  for (const name of [...PAGES, ...PLAIN, ...DIRS]) {
    if (!existsSync(join(root, name))) {
      console.error(`"${name}" not found in ${root}`);
      process.exit(1);
    }
  }

  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });

  for (const name of PLAIN) cpSync(join(root, name), join(OUT, name));
  for (const name of OPTIONAL) {
    if (existsSync(join(root, name))) cpSync(join(root, name), join(OUT, name));
    else console.log(`${name}: not in this package, skipped`);
  }
  for (const dir of DIRS) cpSync(join(root, dir), join(OUT, dir), { recursive: true });
  for (const name of PAGES) {
    const { text, count } = patch(name, readFileSync(join(root, name), 'utf8'));
    writeFileSync(join(OUT, name), text);
    console.log(`${name}: ${count} navigation${count === 1 ? '' : 's'} routed to the app`);
  }

  if (scratch) rmSync(scratch, { recursive: true, force: true });
  console.log(`imported into ${OUT} (${PLAIN.length + PAGES.length} files + ${DIRS.join(', ')})`);
}

main();

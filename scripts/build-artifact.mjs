/**
 * Bundles the built app into one self-contained HTML file.
 *
 * A published artifact is sandboxed: no CDN, no XHR to other hosts, and no
 * server to serve /assets. So everything the page needs is folded inline —
 * the JS and CSS as text, and the binaries (Rive runtime, .riv files, fonts,
 * images) as base64 the app decodes at boot.
 *
 *   npm run build && node scripts/build-artifact.mjs
 *
 * The lesson video is deliberately left out: at 11MB it alone would blow the
 * 16MB page budget once base64-encoded. The video slide falls back to its
 * poster frame.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';

const DIST = 'dist';
const OUT = 'artifact/teaching-room.html';
const MAX_BYTES = 16 * 1024 * 1024;

/** Assets small enough to inline, by extension. Anything else is dropped. */
const MIME = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.riv': 'application/octet-stream',
};
/** Font formats to keep. woff2 alone covers every browser that runs this. */
const FONT_KEEP = new Set(['.woff2']);

const b64 = (file) => readFileSync(file).toString('base64');
const dataUri = (file) => `data:${MIME[path.extname(file)] ?? 'application/octet-stream'};base64,${b64(file)}`;

const assetsDir = path.join(DIST, 'assets');
const entries = readdirSync(assetsDir);
const jsFile = path.join(assetsDir, entries.find((f) => f.endsWith('.js')));
let css = readFileSync(path.join(assetsDir, entries.find((f) => f.endsWith('.css'))), 'utf8');
const js = readFileSync(jsFile, 'utf8');

/* ---- rewrite every /room/... reference inside the CSS ------------------- */

const dropped = [];
css = css.replace(/url\((["']?)(\/room\/[^)"']+)\1\)/g, (whole, _q, url) => {
  const file = path.join(DIST, url);
  const ext = path.extname(url);
  if (!existsSync(file)) return whole;
  // Keep one font format; the others are megabytes of duplicate glyphs.
  if (['.ttf', '.woff', '.eot'].includes(ext) && !FONT_KEEP.has(ext)) {
    dropped.push(url);
    return 'url()';
  }
  return `url(${dataUri(file)})`;
});
// Tidy the now-empty src entries left by dropped font formats.
css = css.replace(/,?\s*url\(\)\s*format\((["'])[^)]*\1\)/g, '');

/* ---- images the markup references -------------------------------------- */

const inlineImages = {};
for (const file of readdirSync(path.join(DIST, 'room'))) {
  const ext = path.extname(file);
  if (ext !== '.png') continue;
  const full = path.join(DIST, 'room', file);
  // The video poster is only needed if the video ships; it does not.
  inlineImages[`/room/${file}`] = dataUri(full);
}

/* ---- binaries the app decodes at boot ---------------------------------- */

const wasm = b64('node_modules/@rive-app/canvas/rive.wasm');
const riveFiles = {};
for (const file of readdirSync(DIST)) {
  if (file.endsWith('.riv')) riveFiles[`/${file}`] = b64(path.join(DIST, file));
}

/* ---- assemble ----------------------------------------------------------- */

const html = `<title>Vyom · Teaching Room</title>
<style>${css}</style>
<div id="root"></div>
<script>
window.__RIVE_WASM_B64 = ${JSON.stringify(wasm)};
window.__RIVE_FILES_B64 = ${JSON.stringify(riveFiles)};
window.__INLINE_IMAGES = ${JSON.stringify(inlineImages)};
</script>
<script type="module">${js}</script>
`;

writeFileSync(OUT, html);

const size = Buffer.byteLength(html);
const mb = (n) => `${(n / 1024 / 1024).toFixed(2)} MB`;
console.log(`wrote ${OUT}`);
console.log(`  css        ${mb(css.length)}`);
console.log(`  js         ${mb(js.length)}`);
console.log(`  rive.wasm  ${mb(wasm.length)}`);
console.log(`  .riv files ${Object.keys(riveFiles).length}`);
console.log(`  images     ${Object.keys(inlineImages).length}`);
if (dropped.length) console.log(`  dropped    ${dropped.length} duplicate font formats`);
console.log(`  total      ${mb(size)} of ${mb(MAX_BYTES)} budget`);
if (size > MAX_BYTES) {
  console.error('OVER BUDGET — trim assets before publishing');
  process.exit(1);
}

/**
 * Unpacks the bundled Byjus AI Teaching Room prototype into real files.
 *
 * The bundle stores every asset base64-encoded (some deflated) in a manifest
 * keyed by UUID, and references them by that UUID from the markup and CSS.
 * This writes each asset to public/room/ under its UUID + real extension, and
 * emits the prototype's stylesheets with those references rewritten, so the
 * ported room renders with the prototype's own fonts, images and CSS rather
 * than approximations of them.
 *
 *   node scripts/extract-prototype.mjs "Byjus AI Teaching Room (1).html"
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { inflateSync, gunzipSync, inflateRawSync } from 'node:zlib';
import { createInterface } from 'node:readline';
import { createReadStream } from 'node:fs';
import path from 'node:path';

const source = process.argv[2] ?? 'Byjus AI Teaching Room (1).html';
const outDir = 'public/room';
const cssOut = 'src/room/prototype.css';
const htmlOut = 'src/room/prototype.template.html';

const EXT = {
  'image/png': '.png', 'image/jpeg': '.jpg', 'image/svg+xml': '.svg',
  'image/webp': '.webp', 'video/mp4': '.mp4', 'font/woff2': '.woff2',
  'font/woff': '.woff', 'font/ttf': '.ttf', 'application/font-woff': '.woff',
  'text/javascript': '.js', 'application/javascript': '.js',
  'text/plain': '.txt', 'text/html': '.html', 'text/css': '.css',
};

function decode(entry) {
  const bytes = Buffer.from(entry.data, 'base64');
  // The manifest stores this as a JSON boolean; anything truthy means gzip
  // (the bundle's own loader uses DecompressionStream('gzip')).
  if (!entry.compressed || entry.compressed === 'false') return bytes;
  for (const fn of [gunzipSync, inflateSync, inflateRawSync]) {
    try { return fn(bytes); } catch { /* try the next framing */ }
  }
  throw new Error('could not inflate asset');
}

/** The manifest's mime is not always right, so trust the bytes. */
function sniff(bytes, mime) {
  if (bytes.slice(0, 4).toString('latin1') === 'RIVE') return { mime: 'application/rive', ext: '.riv' };
  if (bytes.slice(0, 8).toString('latin1').includes('PNG')) return { mime: 'image/png', ext: '.png' };
  const head = bytes.slice(0, 200).toString('utf8').trimStart().toLowerCase();
  if (head.startsWith('<!doctype html') || head.startsWith('<html')) {
    return { mime: 'text/html', ext: '.html' };
  }
  return { mime, ext: EXT[mime] ?? '' };
}

async function readLines(file) {
  const lines = [];
  const rl = createInterface({ input: createReadStream(file, { encoding: 'utf8' }), crlfDelay: Infinity });
  for await (const line of rl) lines.push(line);
  return lines;
}

const lines = await readLines(source);

// The bundle marks its two payload blocks with script tags; the JSON sits on
// the line directly after each opening tag.
// Match the opening tags themselves, not the loader script's mention of the
// same selector strings, then take the first parseable line after each.
function payloadAfter(kind) {
  const tag = new RegExp(`^\\s*<script type="__bundler/${kind}">`);
  const start = lines.findIndex((l) => tag.test(l));
  if (start < 0) throw new Error(`no ${kind} block — is this a bundled prototype?`);
  for (let i = start + 1; i < Math.min(start + 4, lines.length); i += 1) {
    const text = lines[i].trim();
    if (!text) continue;
    try { return JSON.parse(text); } catch { /* keep looking */ }
  }
  throw new Error(`could not parse the ${kind} payload`);
}

const manifest = payloadAfter('manifest');
const template = payloadAfter('template');

if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

/** uuid -> public path, so markup and CSS can be rewritten to point at files. */
const assetPath = new Map();
/** uuid -> the mime actually detected from the bytes. */
const kinds = new Map();
let written = 0;

for (const [uuid, entry] of Object.entries(manifest)) {
  // JS bundles are the prototype's own runtime; the port supplies its own.
  if (entry.mime.includes('javascript')) continue;
  const bytes = decode(entry);
  const { mime, ext } = sniff(bytes, entry.mime);
  const file = `${uuid}${ext}`;
  writeFileSync(path.join(outDir, file), bytes);
  assetPath.set(uuid, `/room/${file}`);
  kinds.set(uuid, mime);
  written += 1;
}

/** Rewrites every bare UUID reference to the file it now lives at. */
function rewrite(text) {
  let out = text;
  for (const [uuid, href] of assetPath) out = out.split(uuid).join(href);
  return out;
}

// Pull every <style> block out of the template, in order.
const styles = [...template.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
writeFileSync(
  cssOut,
  `/* Extracted verbatim from ${path.basename(source)} by scripts/extract-prototype.mjs.\n` +
    `   Do not hand-edit — re-run the script instead. */\n\n` +
    rewrite(styles.join('\n\n')),
);

// Keep the markup (styles stripped) as the reference the JSX is ported against.
writeFileSync(htmlOut, rewrite(template.replace(/<style>[\s\S]*?<\/style>/g, '')));

console.log(`assets written : ${written} -> ${outDir}`);
console.log(`stylesheet     : ${cssOut} (${styles.length} blocks)`);
console.log(`markup ref     : ${htmlOut}`);
for (const [uuid, href] of assetPath) {
  const declared = manifest[uuid].mime;
  const actual = kinds.get(uuid);
  const note = actual === declared ? '' : `  (manifest said ${declared})`;
  console.log(`  ${String(actual).padEnd(18)} ${href}${note}`);
}

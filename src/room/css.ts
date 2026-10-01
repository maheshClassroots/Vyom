import type { CSSProperties } from 'react';

const cache = new Map<string, CSSProperties>();

/**
 * Parses a CSS declaration string into a React style object.
 *
 * The prototype carries its layout in inline `style="..."` attributes. Retyping
 * those as camelCased object literals is where a "1:1" port quietly stops being
 * 1:1 — one dropped declaration and the box is wrong. This lets the prototype's
 * style strings be pasted in verbatim:
 *
 *   <div style={css('flex:1;display:flex;padding:4px 18px 18px;min-height:0')}>
 *
 * Custom properties (`--x`) are passed through untouched; everything else is
 * camelCased. Results are cached, since the same literal recurs every render.
 */
export function css(declarations: string): CSSProperties {
  const hit = cache.get(declarations);
  if (hit) return hit;

  const style: Record<string, string> = {};
  // Split on semicolons that are not inside brackets or quotes, so
  // gradients, url() and data URIs survive intact.
  let depth = 0;
  let quote: string | null = null;
  let start = 0;
  const parts: string[] = [];

  for (let i = 0; i < declarations.length; i += 1) {
    const ch = declarations[i];
    if (quote) {
      if (ch === quote && declarations[i - 1] !== '\\') quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") quote = ch;
    else if (ch === '(') depth += 1;
    else if (ch === ')') depth = Math.max(0, depth - 1);
    else if (ch === ';' && depth === 0) {
      parts.push(declarations.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(declarations.slice(start));

  for (const part of parts) {
    const split = part.indexOf(':');
    if (split < 0) continue;
    const name = part.slice(0, split).trim();
    const value = part.slice(split + 1).trim();
    if (!name || !value) continue;
    style[name.startsWith('--') ? name : name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())] =
      value;
  }

  const result = style as CSSProperties;
  cache.set(declarations, result);
  return result;
}

/**
 * Asset paths, as unpacked by scripts/extract-prototype.mjs. The prototype's
 * Spark PNG is no longer referenced — Spark renders from `spark_placeholder.riv`
 * via `SparkRive`.
 *
 * The single-file build has no server to fetch these from, so it inlines them
 * as data URIs and each path resolves through that table instead.
 */
declare global {
  interface Window {
    __INLINE_IMAGES?: Record<string, string>;
  }
}

const inlined = (typeof window === 'undefined' ? undefined : window.__INLINE_IMAGES) ?? {};
const resolve = (assetPath: string) => inlined[assetPath] ?? assetPath;

export const ASSET = {
  logo: resolve('/room/e4455d7b-b4c2-4533-84c1-19b32d99afd5.png'),
  poster: resolve('/room/09c3320c-00f4-4416-ab5a-14ded088b03b.png'),
  video: '/room/ff2c46c5-61a0-455a-9a75-bf9c539f818f.mp4',
} as const;

/**
 * True when running from inlined assets. The lesson video is 11MB and does not
 * fit the page budget, so the video slide shows its poster instead.
 */
export const HAS_VIDEO_FILE = Object.keys(inlined).length === 0;

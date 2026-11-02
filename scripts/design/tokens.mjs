/**
 * The design system's colours as literals, and the map from every colour the
 * design packages and the ported room use onto them. `src/tokens.css` is the
 * same system as custom properties for the app's own stylesheets; the hosted
 * pages and the prototype port paint with literals (inline styles, SVG
 * attributes, template strings), so they are recoloured by value instead.
 *
 * Keys are lower-case hex; values never appear as keys, so a recolour is
 * safe to run more than once.
 */
export const TOKENS = {
  primary: '#5f3dc4', primaryInk: '#4b2fb5', primarySoft: '#ebe5fb', primary200: '#b8a6ff',
  ink900: '#1f1a3d', ink700: '#4a4568', ink500: '#7b7696', ink300: '#b4afc9', line: '#e4e0f2',
  surfaceTint: '#f1edfb',
  now: '#e8590c', nowSoft: '#fff1e6', good: '#2f9e44', goodSoft: '#e9f8ec', bad: '#e03131',
  reward: '#f08c00', rewardSoft: '#fff4e0',
};

const T = TOKENS;
export const RECOLOR = {
  // every blue, every other violet, the teal: the one primary
  '#1c7ed6': T.primary, '#228be6': T.primary, '#339af0': T.primary, '#1864ab': T.primaryInk, '#1971c2': T.primaryInk,
  '#7950f2': T.primary, '#7048e8': T.primary, '#5c46cf': T.primary, '#845ef7': T.primary, '#7c6ae0': T.primary,
  '#15aabf': T.primary, '#0c8599': T.primaryInk, '#4c6ef5': T.primary, '#2f5fd8': T.primary, '#3b3fb5': T.primaryInk,
  '#4dabf7': T.primary200, '#74c0fc': T.primary200, '#4da3f0': T.primary200, '#8e7be9': T.primary200, '#9c88ee': T.primary200,
  '#a5d8ff': T.primarySoft, '#e7f5ff': T.primarySoft, '#d0ebff': T.primarySoft,
  // inks
  '#212529': T.ink900, '#211a4a': T.ink900, '#1f1b2e': T.ink900, '#3a3450': T.ink900, '#2b2654': T.ink900, '#1c1c1a': T.ink900, '#343a40': T.ink900, '#1b1442': T.ink900,
  '#5d5880': T.ink700, '#6b6786': T.ink700, '#6b6580': T.ink700, '#5c5f8a': T.ink700, '#495057': T.ink700, '#3f3a63': T.ink700, '#5c5875': T.ink700,
  '#868e96': T.ink500, '#8b86a6': T.ink500, '#8e8aa8': T.ink500, '#6a6a66': T.ink500, '#adb5bd': T.ink500, '#8c81bc': T.ink500, '#9482d5': T.ink500,
  '#b4aed4': T.ink300, '#ced4da': T.ink300,
  '#dee2e6': T.line, '#ddd9ee': T.line, '#d9d9d6': T.line, '#e7e2f2': T.line, '#e3dff0': T.line, '#e6e3f5': T.line, '#e2dcfb': T.line, '#eae6fd': T.line,
  // tints
  '#f3f0ff': T.surfaceTint, '#e9e2fe': T.surfaceTint, '#efecfd': T.surfaceTint, '#f4f1ff': T.surfaceTint, '#e3dbff': T.primarySoft, '#f1effe': T.surfaceTint, '#f0edfb': T.surfaceTint, '#f3f0fd': T.surfaceTint, '#f6f5fd': T.surfaceTint,
  // now
  '#d9480f': T.now, '#ff922b': T.now, '#ffa94d': T.now, '#fff4e6': T.nowSoft, '#ffe8cc': T.nowSoft,
  // reward
  '#fab005': T.reward, '#f0c000': T.reward, '#f0a000': T.reward, '#ffd43b': T.reward, '#f59f00': T.reward, '#fff3bf': T.rewardSoft,
  // good / bad
  '#2b8a3e': T.good, '#51cf66': T.good, '#40c057': T.good, '#69db7c': T.good, '#ebfbee': T.goodSoft, '#c92a2a': T.bad,
};

/** Recolours a text by value: every mapped colour, in any letter case, and `font-weight:600` to 700. */
export function recolor(text) {
  // six-digit colours, with an eight-digit alpha pair kept as it was
  let out = text.replace(/#([0-9a-fA-F]{6})([0-9a-fA-F]{2})?\b/g, (m, hex, a) => { const t = RECOLOR[`#${hex.toLowerCase()}`]; return t ? t + (a ?? '') : m; });
  out = out.replace(/font-weight:\s*600\b/g, 'font-weight:700');
  return out;
}

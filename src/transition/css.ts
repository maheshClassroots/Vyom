/**
 * Reads a duration custom property off `:root`, in milliseconds.
 *
 * The sequence has to know how long its own animations take, and the honest
 * place for that is the stylesheet that defines them. Reading it back beats
 * keeping a second copy in TypeScript, where retiming a keyframe and forgetting
 * the constant leaves the two quietly disagreeing.
 *
 * Deliberately *not* `animation.finished`, which looks like the better answer:
 * the Web Animations timeline stops advancing whenever the document is not
 * being painted — a background tab, an occluded window — and a promise that
 * never resolves would hang the sequence exactly when nobody is watching to
 * see it stuck.
 */
export function cssDurationMs(property: string, fallbackMs: number): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(property).trim();
  if (raw.endsWith('ms')) return Number.parseFloat(raw) || fallbackMs;
  if (raw.endsWith('s')) return (Number.parseFloat(raw) || fallbackMs / 1000) * 1000;
  return fallbackMs;
}

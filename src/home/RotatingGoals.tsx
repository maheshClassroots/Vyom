import { useEffect, useRef, useState } from 'react';
import { GOALS_CJ } from './chat';

/**
 * The goal statement in the home chrome — the design's `RotatingGoals`.
 *
 * Three goals rotate on a 30s cadence; the bar stays put and animates its
 * fill, only the statement is replaced, remounting so it replays its rise-in.
 * A tap opens all three; the rotation holds while they are open.
 */
export function RotatingGoals() {
  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) return;
    const t = window.setInterval(() => setIdx((i) => (i + 1) % GOALS_CJ.length), 30000);
    return () => window.clearInterval(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', down, true);
    document.addEventListener('keydown', key, true);
    return () => {
      document.removeEventListener('pointerdown', down, true);
      document.removeEventListener('keydown', key, true);
    };
  }, [open]);

  const g = GOALS_CJ[idx];

  return (
    <div className="goals" ref={box}>
      <div
        className="goals__pop"
        data-open={open}
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key !== 'Enter' && e.key !== ' ') return;
          e.preventDefault();
          setOpen((o) => !o);
        }}
      >
        <span className="goals__halo" aria-hidden="true" />
        {open ? (
          GOALS_CJ.map((x, i) => (
            <div key={i} className="goals__row" data-first={i === 0}>
              <div className="goals__text"><strong>{x.pct}%</strong> {x.label}</div>
              <div className="goals__bar"><div className="goals__fill" style={{ width: `${x.pct}%` }} /></div>
            </div>
          ))
        ) : (
          <>
            <div key={idx} className="goals__cycle">
              <div className="goals__text goals__text--live"><strong>{g.pct}%</strong> {g.label}</div>
            </div>
            <div className="goals__bar"><div className="goals__fill goals__fill--live" style={{ width: `${g.pct}%` }} /></div>
          </>
        )}
      </div>
    </div>
  );
}

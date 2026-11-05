import { useEffect, useMemo, useRef, useState } from 'react';
import { useSpark } from '../spark';
import { useVyom, VyomAnchor } from '../vyom';
import { triggerWhenIdle } from '../vyom/sequencing';
import { css } from './css';
import './complete.css';

/**
 * The module completion screen: Vyom comes to the middle and celebrates,
 * the module's reward — stars and coins — bursts out of him and flies up
 * into the header's counters, and the student picks what comes next.
 *
 * Mounted over the lesson's body once the last slide is done. The learn
 * slot's anchor moves here (the canvas's own is taken down while this is
 * up), so his walk to the middle is the same `moveToPoint` as everywhere
 * else; the celebration and the reward follow once he has arrived.
 */

/** What finishing the module pays, on top of the milestones. */
export const MODULE_REWARD = { xp: 50, coins: 3 };

/** The beats, from the moment the screen comes up: the burst once his walk to the middle is done. */
const BURST_AT_MS = 1100;
const FLY_MS = 1100;
const FLY_STAGGER_MS = 70;
const CONFETTI = 26;
const STARS = 8;
const COINS = 3;

interface ModuleCompleteProps {
  studentName: string;
  lessonTitle: string;
  objectives: number;
  /** Called as each star and coin lands in the header, so its counters tick up. */
  onReward: (xp: number, coins: number) => void;
  /** The primary choice: practice what was just learned. */
  onPractice: () => void;
  /** The secondary choice: straight on to the next module. */
  onNextModule: () => void;
}

interface Point {
  x: number;
  y: number;
}

const centreOf = (el: Element | null): Point | null => {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
};

/**
 * Sends one token from `from` to `to` on a lifted arc, fixed to the
 * viewport, and resolves when it lands.
 */
function fly(host: HTMLElement, kind: 'star' | 'coin', from: Point, to: Point, delay: number): Promise<void> {
  const el = document.createElement('span');
  el.className = `mc-token mc-token--${kind}`;
  el.innerHTML = `<i class="ti ${kind === 'star' ? 'ti-star-filled' : 'ti-coin-filled'}"></i>`;
  host.appendChild(el);
  const lift = -90 - Math.random() * 70;
  const sway = (Math.random() - 0.5) * 160;
  const anim = el.animate(
    [
      { transform: `translate(${from.x}px, ${from.y}px) scale(0.4)`, opacity: 0 },
      { transform: `translate(${from.x + sway * 0.6}px, ${from.y + lift}px) scale(1.15)`, opacity: 1, offset: 0.3 },
      { transform: `translate(${to.x}px, ${to.y}px) scale(0.55)`, opacity: 1 },
    ],
    { duration: FLY_MS, delay, easing: 'cubic-bezier(0.3, 0, 0.2, 1)', fill: 'forwards' },
  );
  return new Promise((resolve) => {
    anim.onfinish = () => {
      el.remove();
      resolve();
    };
  });
}

export function ModuleComplete({ studentName, lessonTitle, objectives, onReward, onPractice, onNextModule }: ModuleCompleteProps) {
  const { viewModelInstance } = useVyom();
  const { viewModelInstance: sparkInstance } = useSpark();
  const vmi = useRef(viewModelInstance);
  vmi.current = viewModelInstance;
  const sparkVmi = useRef(sparkInstance);
  sparkVmi.current = sparkInstance;

  const seat = useRef<HTMLDivElement>(null);
  const sky = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<'arriving' | 'burst' | 'settled'>('arriving');
  const [paid, setPaid] = useState({ xp: 0, coins: 0 });

  // The confetti's directions, drawn once.
  const confetti = useMemo(
    () =>
      Array.from({ length: CONFETTI }, (_, i) => {
        const angle = (i / CONFETTI) * Math.PI * 2 + Math.random() * 0.4;
        const dist = 120 + Math.random() * 160;
        return {
          dx: Math.cos(angle) * dist,
          dy: Math.sin(angle) * dist - 60,
          rot: Math.random() * 540 - 270,
          hue: ['#5f3dc4', '#f08c00', '#2f9e44', '#e8590c', '#b8a6ff', '#ffd43b'][i % 6],
          delay: Math.random() * 120,
          size: 6 + Math.random() * 6,
        };
      }),
    [],
  );

  useEffect(() => {
    const timers: number[] = [];
    const later = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));
    const fire = (name: string) => void triggerWhenIdle(() => vmi.current, name);
    const mood = (name: string) => {
      const e = vmi.current?.enum('emotion');
      if (e) e.value = name;
    };

    // ---- 1. he walks to the middle --------------------------------------
    // The anchor has just moved the slot here; a frame for it to be
    // measured, then the walk.
    later(80, () => fire('moveToPoint'));

    // ---- 2. the celebration, and the reward out of him -------------------
    later(BURST_AT_MS, () => {
      fire('celebrate');
      mood('happy');
      const e = sparkVmi.current?.enum('expression');
      if (e) e.value = 'delighted';
      setPhase('burst');

      const from = centreOf(seat.current);
      const star = centreOf(document.getElementById('xpWidget'));
      const coin = centreOf(document.getElementById('coinWidget'));
      const host = sky.current;
      if (!from || !host) return;
      // The XP split over the stars in whole points, the remainder on the last.
      const share = Math.floor(MODULE_REWARD.xp / STARS);
      for (let i = 0; i < STARS; i += 1) {
        const worth = i === STARS - 1 ? MODULE_REWARD.xp - share * (STARS - 1) : share;
        void fly(host, 'star', from, star ?? from, i * FLY_STAGGER_MS).then(() => {
          onReward(worth, 0);
          setPaid((p) => ({ ...p, xp: p.xp + worth }));
        });
      }
      for (let i = 0; i < COINS; i += 1) {
        void fly(host, 'coin', from, coin ?? from, 260 + i * FLY_STAGGER_MS * 2).then(() => {
          onReward(0, 1);
          setPaid((p) => ({ ...p, coins: p.coins + 1 }));
        });
      }
      later(FLY_MS + STARS * FLY_STAGGER_MS + 200, () => setPhase('settled'));
    });

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
      mood('neutral');
    };
    // Plays once, on mount: the screen is the event.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`mc mc--${phase}`} role="dialog" aria-label="Module complete">
      {/* the glow behind him, and the confetti out of him */}
      <div className="mc__seat" ref={seat}>
        <span className="mc__halo" />
        <VyomAnchor slot="learn" x="50%" y="50%" />
        {phase !== 'arriving' && (
          <span className="mc__confetti" aria-hidden="true">
            {confetti.map((c, i) => (
              <i
                key={i}
                style={{
                  ['--dx' as string]: `${c.dx}px`,
                  ['--dy' as string]: `${c.dy}px`,
                  ['--rot' as string]: `${c.rot}deg`,
                  ['--size' as string]: `${c.size}px`,
                  background: c.hue,
                  animationDelay: `${c.delay}ms`,
                }}
              />
            ))}
          </span>
        )}
      </div>

      {/* the words, the reward, the choice */}
      <div className="mc__card">
        <div className="mc__eyebrow">
          <i className="ti ti-confetti" /> Module complete
        </div>
        <h2 className="mc__title">Brilliant, {studentName}!</h2>
        <p className="mc__sub">
          You finished <strong>{lessonTitle}</strong> — all {objectives} objectives done.
        </p>

        <div className="mc__reward" aria-live="polite">
          <span className="mc__chip mc__chip--xp">
            <i className="ti ti-star-filled" />
            <b>+{paid.xp}</b> XP
          </span>
          <span className="mc__chip mc__chip--coin">
            <i className="ti ti-coin-filled" />
            <b>+{paid.coins}</b> {paid.coins === 1 ? 'coin' : 'coins'}
          </span>
        </div>

        <div className="mc__actions">
          <button type="button" className="mc__btn mc__btn--primary" onClick={onPractice}>
            <i className="ti ti-target" /> Practice now
          </button>
          <button type="button" className="mc__btn mc__btn--secondary" onClick={onNextModule}>
            <i className="ti ti-player-play-filled" /> Watch next module
          </button>
        </div>
      </div>

      {/* the reward in flight, above everything in the room */}
      <div className="mc__sky" ref={sky} aria-hidden="true" style={css('position:fixed;inset:0;pointer-events:none;')} />
    </div>
  );
}

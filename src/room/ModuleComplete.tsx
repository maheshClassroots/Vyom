import * as riveRuntime from '@rive-app/react-canvas';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useSpark } from '../spark';
import { useVyom, VyomAnchor } from '../vyom';
import { triggerWhenIdle } from '../vyom/sequencing';
import './complete.css';

/**
 * The module completion screen.
 *
 * A full flash screen over the lesson: the title, Vyom in the middle, the
 * rewards the module paid, and what to do next. It is revealed in three
 * beats:
 *
 *  1. the heading, and Vyom walks to the middle and celebrates;
 *  2. "Your rewards" appears and he turns to watch: the XP pill kicks and
 *     its stars burst out, hover and swoop up into the header's star
 *     counter, which ticks up as each lands; the orb pill does the same;
 *  3. he looks back and plays his module-complete animation, and the two
 *     buttons appear.
 *
 * The reward flights are the Rive pieces of the design package
 * "module-complete-lottie-rive" (`collect-stars.riv`, `collect-orbs.riv`,
 * one `collect` trigger each), and the order and timing are that package's
 * too. Each piece is a 1000-unit artboard whose flight runs from the pill
 * to the HUD of the package's own layout; here its canvas is laid over the
 * screen with the one transform that puts those two points on this
 * screen's pill and this header's counter, whatever the window size.
 * Vyom's eyes follow the package's look track, carried through the same
 * transform.
 */

/** What finishing the module pays, on top of the milestones. */
export const MODULE_REWARD = { xp: 50, orbs: 3 };

const RIV = '/room/complete';
/** How long his walk to the middle takes. */
const WALK_MS = 1000;
/** The package's timeline starts this many of its frames in: the lead-in it spends on its own title is not ours. */
const LEAD_FRAMES = 24;
const FPS = 30;
/** The package's cues, in its frames. */
const F_LOOK_ON = 30;
const F_HAPPY = 40;
const F_STARS = 44;
const F_STAR_LANDS = [80, 84, 88];
const F_ORBS = 119;
const F_ORB_LANDS = [160, 164];
const F_LOOK_OFF = 164;
const F_CELEBRATE = 176;
/** How long `celebrate` runs (measured: 2 s), with a little over. */
const CELEBRATE_MS = 2100;
/** How long `moduleComplete` runs (measured: 3.28 s), with a little over. */
const MODULE_COMPLETE_MS = 3400;
/** The rewards' own entrance, before their pills can be measured for the flights. */
const REWARDS_IN_MS = 600;
/** From this frame the look track belongs to the orbs' flight. */
const F_LOOK_ORBS = 114;

/**
 * Each flight in its own artboard's units: where it leaves the pill and
 * where it lands on the HUD, and the artboard's origin in the package's
 * 1920 x 1080 comp (for the look track, which is in comp pixels).
 */
const FLIGHT = {
  stars: {
    file: 'collect-stars.riv',
    artboard: 'Collect Stars',
    from: { x: 147, y: 851 },
    to: { x: 925, y: 126 },
    origin: { x: 765, y: -63 },
  },
  orbs: {
    file: 'collect-orbs.riv',
    artboard: 'Collect Orbs',
    from: { x: 66, y: 886 },
    to: { x: 949, y: 162 },
    origin: { x: 844, y: -99 },
  },
} as const;
type FlightName = keyof typeof FLIGHT;
const BOX = 1000;
const CONFETTI = 22;

interface ModuleCompleteProps {
  studentName: string;
  /** Called as each star and orb lands in the header, so its counters tick up. */
  onReward: (xp: number, orbs: number) => void;
  /** The primary choice: practice what was just learned. */
  onPractice: () => void;
  /** The secondary choice: straight on to the next module. */
  onNextModule: () => void;
}

interface Point {
  x: number;
  y: number;
}

/** A similarity: rotate, scale, move. Maps a flight's artboard onto the screen. */
interface Placement {
  scale: number;
  angle: number;
  tx: number;
  ty: number;
}

const centreOf = (el: Element | null | undefined): Point | null => {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
};

/** The transform that takes artboard point `a` to screen point `p` and `b` to `q`. */
function place(a: Point, b: Point, p: Point, q: Point): Placement {
  const scale = Math.hypot(q.x - p.x, q.y - p.y) / Math.hypot(b.x - a.x, b.y - a.y);
  const angle = Math.atan2(q.y - p.y, q.x - p.x) - Math.atan2(b.y - a.y, b.x - a.x);
  const cos = Math.cos(angle) * scale;
  const sin = Math.sin(angle) * scale;
  return {
    scale,
    angle,
    tx: p.x - (cos * a.x - sin * a.y),
    ty: p.y - (sin * a.x + cos * a.y),
  };
}
const apply = (m: Placement, pt: Point): Point => {
  const cos = Math.cos(m.angle) * m.scale;
  const sin = Math.sin(m.angle) * m.scale;
  return {
    x: m.tx + cos * pt.x - sin * pt.y,
    y: m.ty + sin * pt.x + cos * pt.y,
  };
};

/** Splits `total` into `parts` whole numbers, the remainder on the last. */
const split = (total: number, parts: number) =>
  Array.from({ length: parts }, (_, i) => (i === parts - 1 ? total - Math.floor(total / parts) * (parts - 1) : Math.floor(total / parts)));

export function ModuleComplete({ studentName, onReward, onPractice, onNextModule }: ModuleCompleteProps) {
  const { viewModelInstance, setSlotManual } = useVyom();
  const { viewModelInstance: sparkInstance } = useSpark();
  const vmi = useRef(viewModelInstance);
  vmi.current = viewModelInstance;
  const sparkVmi = useRef(sparkInstance);
  sparkVmi.current = sparkInstance;

  const xpIcon = useRef<HTMLSpanElement>(null);
  const orbIcon = useRef<HTMLSpanElement>(null);
  const canvases = {
    stars: useRef<HTMLCanvasElement>(null),
    orbs: useRef<HTMLCanvasElement>(null),
  };
  /** Which pill is giving up its reward, and whether he has got to the party. */
  const [kick, setKick] = useState<FlightName | null>(null);
  const [party, setParty] = useState(false);
  /** How far the reveal has got: 1 heading and him, 2 the rewards, 3 the buttons. */
  const [beat, setBeat] = useState<1 | 2 | 3>(1);

  // The confetti's directions, drawn once.
  const confetti = useMemo(
    () =>
      Array.from({ length: CONFETTI }, (_, i) => {
        const angle = (i / CONFETTI) * Math.PI * 2 + Math.random() * 0.4;
        const dist = 110 + Math.random() * 150;
        return {
          dx: Math.cos(angle) * dist,
          dy: Math.sin(angle) * dist - 50,
          rot: Math.random() * 540 - 270,
          hue: ['#5f3dc4', '#f08c00', '#2f9e44', '#e8590c', '#b8a6ff', '#ffd43b'][i % 6],
          delay: Math.random() * 120,
          size: 6 + Math.random() * 6,
        };
      }),
    [],
  );

  // The learn slot is taken over while he walks here. Left to the provider,
  // the slot moving under him would carry him along and set him down in the
  // middle at once; held back, the new point is written below and he walks.
  // Set before the provider's next slot sync, which runs on a frame.
  const seat = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    setSlotManual('learn', true);
    return () => setSlotManual('learn', false);
  }, [setSlotManual]);

  useEffect(() => {
    let alive = true;
    const timers: number[] = [];
    const later = (ms: number, fn: () => void) => timers.push(window.setTimeout(() => alive && fn(), ms));
    const fire = (name: string, onFired?: () => void) =>
      void triggerWhenIdle(() => vmi.current, name, {
        shouldContinue: () => alive,
        onFired,
      });
    const mood = (name: string) => {
      const e = vmi.current?.enum('emotion');
      if (e) e.value = name;
    };
    const looking = (on: boolean) => {
      const b = vmi.current?.boolean('isLookingAtPoint');
      if (b) b.value = on;
    };
    const lookAt = (p: Point) => {
      const x = vmi.current?.number('lookAtX');
      const y = vmi.current?.number('lookAtY');
      if (x) x.value = p.x;
      if (y) y.value = p.y;
    };

    // ---- the two flights, loaded and waiting in their idle state ----------
    const rives: Partial<Record<FlightName, riveRuntime.Rive>> = {};
    (Object.keys(FLIGHT) as FlightName[]).forEach((name) => {
      const canvas = canvases[name].current;
      if (!canvas) return;
      const r = new riveRuntime.Rive({
        src: `${RIV}/${FLIGHT[name].file}`,
        canvas,
        artboard: FLIGHT[name].artboard,
        stateMachines: 'State Machine 1',
        autoplay: true,
        autoBind: true,
        layout: new riveRuntime.Layout({ fit: riveRuntime.Fit.Contain }),
        onLoad: () => {
          try {
            r.resizeDrawingSurfaceToCanvas();
          } catch {
            /* drawn at the canvas's own size */
          }
        },
      });
      rives[name] = r;
    });

    // Where each flight sits on this screen: its pill's icon to the header's
    // counter. Measured when it is about to play, and again on a resize.
    const placements: Partial<Record<FlightName, Placement>> = {};
    const targets = {
      stars: () => ({
        from: centreOf(xpIcon.current),
        to: centreOf(document.querySelector('#xpWidget i')),
      }),
      orbs: () => ({
        from: centreOf(orbIcon.current),
        to: centreOf(document.querySelector('#orbWidget span')),
      }),
    };
    const lay = (name: FlightName) => {
      const { from, to } = targets[name]();
      const canvas = canvases[name].current;
      if (!from || !to || !canvas) return;
      const m = place(FLIGHT[name].from, FLIGHT[name].to, from, to);
      placements[name] = m;
      canvas.style.transform = `translate(${m.tx.toFixed(2)}px, ${m.ty.toFixed(2)}px) rotate(${m.angle.toFixed(5)}rad) scale(${m.scale.toFixed(5)})`;
    };
    const layAll = () => (Object.keys(FLIGHT) as FlightName[]).forEach(lay);
    window.addEventListener('resize', layAll);

    // His eyes: the package's look track, per frame, in its comp's pixels.
    let track: Point[] = [];
    void fetch(`${RIV}/look-track.json`)
      .then((r) => r.json() as Promise<{ points: [number, number][] }>)
      .then((d) => {
        track = d.points.map(([x, y]) => ({ x, y }));
      })
      .catch(() => undefined);

    // ---- 2 and 3: the rewards, then the module-complete animation ----------
    // Timed from the moment the rewards are asked to appear.
    const rewards = () => {
      setBeat(2);
      const at = (frame: number) => REWARDS_IN_MS + ((frame - LEAD_FRAMES) / FPS) * 1000;

      // ---- 2. he watches ------------------------------------------------
      later(at(F_LOOK_ON), () => {
        layAll();
        looking(true);
        const started = performance.now();
        const gaze = window.setInterval(() => {
          if (!alive) return;
          const frame = Math.round(F_LOOK_ON + ((performance.now() - started) / 1000) * FPS);
          if (frame >= F_LOOK_OFF) {
            window.clearInterval(gaze);
            return;
          }
          const name: FlightName = frame < F_LOOK_ORBS ? 'stars' : 'orbs';
          const m = placements[name];
          const pt = track[frame];
          if (!m || !pt) return;
          lookAt(
            apply(m, {
              x: pt.x - FLIGHT[name].origin.x,
              y: pt.y - FLIGHT[name].origin.y,
            }),
          );
        }, 1000 / FPS);
        timers.push(gaze);
      });
      later(at(F_HAPPY), () => {
        mood('happy');
        const e = sparkVmi.current?.enum('expression');
        if (e) e.value = 'delighted';
      });

      // ---- 3. the stars, then the orbs ----------------------------------
      const collect = (name: FlightName) => {
        lay(name);
        setKick(name);
        rives[name]?.viewModelInstance?.trigger('collect')?.trigger();
      };
      later(at(F_STARS), () => collect('stars'));
      split(MODULE_REWARD.xp, F_STAR_LANDS.length).forEach((worth, i) => later(at(F_STAR_LANDS[i]), () => onReward(worth, 0)));
      later(at(F_ORBS), () => collect('orbs'));
      split(MODULE_REWARD.orbs, F_ORB_LANDS.length).forEach((worth, i) => later(at(F_ORB_LANDS[i]), () => onReward(0, worth)));

      // ---- 4. and the party ---------------------------------------------
      later(at(F_LOOK_OFF), () => {
        looking(false);
        setKick(null);
      });
      later(at(F_CELEBRATE), () => {
        fire('moduleComplete');
        setBeat(3);
      });
      // The gesture puts his face back to neutral when it starts; he is
      // still pleased once it is over.
      later(at(F_CELEBRATE) + MODULE_COMPLETE_MS, () => mood('happy'));
    };

    // ---- 1. he walks to the middle and celebrates ---------------------------
    // His seat is written as the walk's destination (the stage canvas's
    // pixels) and he is sent there; once he has arrived the slot goes back to
    // the provider, which keeps him on it through a resize. The celebration
    // waits in line behind the walk, and the rewards wait for the celebration.
    later(80, () => {
      const to = centreOf(seat.current?.querySelector('.vyom-anchor'));
      const stage = document.querySelector('.vyom-stage__canvas')?.getBoundingClientRect();
      const x = vmi.current?.number('learnWindowX');
      const y = vmi.current?.number('learnWindowY');
      if (to && x && y) {
        x.value = to.x - (stage?.left ?? 0);
        y.value = to.y - (stage?.top ?? 0);
      }
      fire('moveToPoint', () =>
        later(WALK_MS, () => {
          setSlotManual('learn', false);
          fire('celebrate', () => {
            setParty(true);
            later(CELEBRATE_MS, rewards);
          });
        }),
      );
    });

    return () => {
      alive = false;
      timers.forEach((id) => {
        window.clearTimeout(id);
        window.clearInterval(id);
      });
      window.removeEventListener('resize', layAll);
      Object.values(rives).forEach((r) => r?.cleanup());
      looking(false);
      mood('neutral');
    };
    // Plays once, on mount: the screen is the event.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`mc mc--beat-${beat}`} role="dialog" aria-label="Module complete">
      <span className="mc__twinkles" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
      </span>

      <header className="mc__head">
        <h2 className="mc__title">Module Complete!</h2>
        <p className="mc__sub">Great job, {studentName}!</p>
      </header>

      {/* his seat: the learn slot's anchor while this screen is up */}
      <div className="mc__seat" ref={seat}>
        <VyomAnchor slot="learn" x="50%" y="50%" />
        {party && (
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

      <section className="mc__rewards" aria-label="Your rewards">
        <h3 className="mc__eyebrow">Your rewards</h3>
        <div className="mc__chips">
          <span className={`mc__chip${kick === 'stars' ? ' mc__chip--kick' : ''}`}>
            <span className="mc__icon" ref={xpIcon}>
              <i className="ti ti-star-filled" />
            </span>
            +{MODULE_REWARD.xp} XP
          </span>
          <span className={`mc__chip${kick === 'orbs' ? ' mc__chip--kick' : ''}`}>
            <span className="mc__icon" ref={orbIcon}>
              <span className="mc__orb" />
            </span>
            +{MODULE_REWARD.orbs} orbs
          </span>
        </div>
      </section>

      <div className="mc__actions">
        <button type="button" className="mc__btn mc__btn--primary" onClick={onPractice}>
          <i className="ti ti-target" /> Practice now
        </button>
        <button type="button" className="mc__btn mc__btn--secondary" onClick={onNextModule}>
          <i className="ti ti-player-play-filled" /> Watch next module
        </button>
      </div>

      {/* the rewards in flight, above everything in the room */}
      <div className="mc__sky" aria-hidden="true">
        <canvas ref={canvases.stars} width={BOX} height={BOX} />
        <canvas ref={canvases.orbs} width={BOX} height={BOX} />
      </div>
    </div>
  );
}

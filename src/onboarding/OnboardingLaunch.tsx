import lottie, { type AnimationItem } from 'lottie-web';
import * as riveRuntime from '@rive-app/react-canvas';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useSpark } from '../spark';
import { useVyom } from '../vyom';
import { triggerWhenIdle } from '../vyom/sequencing';
import './vyom-rive-lottie.js';
import './launch.css';

/**
 * The launch piece, keys 6 to 12 of the storyboard: Vyom expands to wrap
 * the screen, the network of cards appears inside him with Spark touring
 * it, and everything folds back into him.
 *
 * It is the design package "vyom-onboarding-launchwithspark", composed the
 * way the package composes it — two layers over Vyom's own expansion:
 *  - the package's Lottie (`/onboarding/launch/vyom-onboarding.json`), the
 *    whole timeline: the network, the cards, the gold trail and the Goal
 *    icon, with Spark only as an invisible placeholder layer that holds her
 *    centre, scale, rotation and opacity on every frame;
 *  - `sparkstatemachine.riv`, live, on a canvas laid over the Lottie: the
 *    package's connector (`vyom-rive-lottie.js`, vendored as-is) moves the
 *    canvas onto the placeholder every frame drawn and fires the Lottie's
 *    markers into her view model (which way she looks, flight by flight).
 * Underneath both, on his own stage, is Vyom's expansion and collapse — the
 * `exapndCollapse` trigger of his artboard (spelled as the file spells it).
 *
 * The order of it: the app's own Spark has scaled away into Vyom on the way
 * in; he opens up; half a second after his expansion is triggered the
 * Lottie starts (the package's warm-up cues having run ahead of it), and
 * the launch's Spark grows out of his centre at comp frame 31; a second
 * before the Lottie ends he collapses — so the last frame is him alone in
 * the middle, ready for the room.
 */

const LOTTIE_URL = '/onboarding/launch/vyom-onboarding.json';
const SPARK_RIV_URL = '/onboarding/launch/sparkstatemachine.riv';
/** The Lottie starts this long after Vyom's expansion is triggered. */
const LOTTIE_DELAY_MS = 500;
/** Vyom folds this long before the Lottie's end. */
const VYOM_COLLAPSE_BEFORE_END_MS = 1000;
/** Spark scales down to nothing over this long, walking into Vyom (about the length of the walk). */
const SPARK_SHRINK_MS = 1000;
/** Her `scale` (a percentage) at full size, and how long after she flies out it is given back. */
const SPARK_FULL_SCALE = 100;
const SPARK_RESTORE_AFTER_FLY_OUT_MS = 1500;
/** The expansion trigger, as the file spells it, and as it would be spelled. */
const EXPAND_TRIGGERS = ['exapndCollapse', 'expandCollapse'];
/**
 * Where the launch's Spark first appears (comp frame 31, growing out of
 * Vyom), in the comp's units: the app's own Spark is parked there for the
 * walk in, so she shrinks away where the launch's emerges.
 */
const SPARK_START = { x: 960.6, y: 539.3 };

/** A cue of the package's: `spark:<input>=<value>`, parsed. */
interface Cue {
  who: string;
  input: string;
  value: string;
}
/** What the package's connector hands back once Spark is loaded and laid over the Lottie. */
interface Connection {
  characters: Record<string, { vi: riveRuntime.ViewModelInstance; canvas: HTMLCanvasElement } | undefined>;
  /** The cues to run before the first frame: `at` is seconds relative to it (negative). */
  warmUpCues: { at: number; cue: Cue }[];
  place: () => void;
  destroy: () => void;
}
/** The connector, loaded for its side effect on `window`. */
const connector = () =>
  (window as unknown as { VyomRiveLottie: { attach: (o: Record<string, unknown>) => Promise<Connection> } }).VyomRiveLottie;

/** Writes one cue into the launch Spark's view model, as the connector does for the markers. */
function fireCue(conn: Connection, cue: Cue) {
  const vi = conn.characters[cue.who]?.vi;
  if (!vi) return;
  if (cue.input === 'trigger') vi.trigger(cue.value)?.trigger();
  else if (cue.value === 'true' || cue.value === 'false') {
    const b = vi.boolean(cue.input);
    if (b) b.value = cue.value === 'true';
  } else {
    const e = vi.enum(cue.input);
    if (e) e.value = cue.value;
  }
}

interface Comp {
  w: number;
  h: number;
  fr: number;
  ip: number;
  op: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface LaunchHandle {
  /**
   * Resolves once the Lottie and the launch's Spark are loaded. Called as
   * Start is tapped, so it also starts her warm-up: the package's cues that
   * come well before the first frame (her fly-in, her expression).
   */
  ready: () => Promise<void>;
  /** Where Spark should be parked when the piece starts, on the viewport. */
  sparkStart: () => Point;
  /**
   * Scales Spark down to nothing with her own `scale` value, so she is gone by
   * the time she has walked into Vyom (who is drawn over her). Resolves when
   * she is gone; her scale is given back after she has flown out.
   */
  shrinkSpark: (ms?: number) => Promise<void>;
  /** Plays the piece through once. Resolves on the Lottie's last frame. */
  play: () => Promise<void>;
  /** Fades the Lottie layer out. */
  fadeOut: () => void;
}

/** The comp's letterbox on the viewport: scale and offset, as the Lottie's own `meet` fit lays it. */
function letterbox(comp: Comp) {
  const sw = window.innerWidth;
  const sh = window.innerHeight;
  const k = Math.min(sw / comp.w, sh / comp.h);
  return { k, ox: (sw - comp.w * k) / 2, oy: (sh - comp.h * k) / 2 };
}

export const OnboardingLaunch = forwardRef<LaunchHandle, { lessonId: string }>(function OnboardingLaunch(_props, ref) {
  const stage = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState<boolean | null>(null);
  const loaded = useRef<Promise<{ anim: AnimationItem; comp: Comp; conn: Connection }> | null>(null);
  // The warm-up's early cues go out once.
  const warmed = useRef(false);
  // The comp's frame, kept where `sparkStart` can read it synchronously.
  const compRef = useRef<Comp | null>(null);

  const { viewModelInstance } = useVyom();
  const { viewModelInstance: sparkInstance } = useSpark();
  const vyomVmi = useRef(viewModelInstance);
  vyomVmi.current = viewModelInstance;
  const sparkVmi = useRef(sparkInstance);
  sparkVmi.current = sparkInstance;

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const anim = lottie.loadAnimation({
      container: el,
      renderer: 'svg',
      loop: false,
      autoplay: false,
      path: LOTTIE_URL,
      rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
    });
    // The package's connector waits for the Lottie itself, loads the Spark
    // riv into a canvas laid over it, and follows the placeholder layer and
    // the markers from then on. Its own timed warm-up is not used: the cues
    // are run from here, against the moment the Lottie really starts.
    let conn: Connection | null = null;
    let gone = false;
    loaded.current = connector()
      .attach({ animation: anim, stage: el, rive: riveRuntime, warmUp: false, spark: { src: SPARK_RIV_URL } })
      .then((c) => {
        conn = c;
        if (gone) c.destroy();
        const data = (anim as unknown as { animationData: { w: number; h: number; fr: number; ip: number; op: number } }).animationData;
        const comp: Comp = { w: data.w, h: data.h, fr: data.fr, ip: data.ip, op: data.op };
        compRef.current = comp;
        // The player's frame 0 is the comp's Start marker.
        anim.goToAndStop(0, true);
        c.place();
        return { anim, comp, conn: c };
      });
    return () => {
      gone = true;
      conn?.destroy();
      anim.destroy();
    };
  }, []);

  useImperativeHandle(ref, () => ({
    ready: async () => {
      const assets = await loaded.current;
      if (!assets || warmed.current) return;
      warmed.current = true;
      // Everything the package runs earlier than the half second between
      // Vyom's expansion and the first frame goes out now, unseen (her
      // canvas is transparent until the placeholder shows her).
      for (const w of assets.conn.warmUpCues) if (-w.at * 1000 > LOTTIE_DELAY_MS) fireCue(assets.conn, w.cue);
    },
    sparkStart: () => {
      const comp = compRef.current;
      if (!comp) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      const { k, ox, oy } = letterbox(comp);
      return { x: ox + SPARK_START.x * k, y: oy + SPARK_START.y * k };
    },
    shrinkSpark: (ms = SPARK_SHRINK_MS) =>
      new Promise<void>((resolve) => {
        const scale = () => sparkVmi.current?.number('scale');
        const from = scale()?.value ?? SPARK_FULL_SCALE;
        const t0 = performance.now();
        // A timer, not a frame loop: a hidden tab must still finish it.
        const id = window.setInterval(() => {
          const k = Math.min(1, (performance.now() - t0) / ms);
          const eased = k * k * (3 - 2 * k);
          const n = scale();
          if (n) n.value = from * (1 - eased);
          if (k >= 1) {
            window.clearInterval(id);
            resolve();
          }
        }, 16);
      }),
    play: async () => {
      const assets = await loaded.current;
      if (!assets) return;
      const { anim, comp, conn } = assets;

      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
      // The expansion waits its turn, once `actionPlaying` is false. The
      // collapse does not: he counts as busy for as long as he is open, and
      // the collapse is what ends that.
      const expand = (opts: { force?: boolean; onFired?: () => void } = {}) => {
        const vmi = vyomVmi.current;
        const name = EXPAND_TRIGGERS.find((n) => vmi?.trigger(n));
        if (!name) {
          console.warn('[launch] Vyom has no expand/collapse trigger');
          return Promise.resolve(false);
        }
        return triggerWhenIdle(() => vyomVmi.current, name, opts);
      };
      const sparkFire = (name: string) => sparkVmi.current?.trigger(name)?.trigger();
      const sparkSet = (name: string, value: number) => {
        const n = sparkVmi.current?.number(name);
        if (n) n.value = value;
      };

      // ---- Vyom opens up (Spark has already scaled away into him) ----------
      // A trigger sent into a busy artboard is swallowed: the expansion
      // waits for him to be free (a gesture from the page may still be
      // finishing when Start is tapped).
      let expandedAt = performance.now();
      await new Promise<void>((resolve) => {
        void expand({
          onFired: () => {
            expandedAt = performance.now();
            resolve();
          },
        }).then(() => resolve());
      });

      // ---- the network, half a second after his expansion ------------------
      // The warm-up cues that fall inside that half second keep the
      // package's own distance from the first frame.
      const startsAt = expandedAt + LOTTIE_DELAY_MS;
      for (const w of conn.warmUpCues) {
        const lead = -w.at * 1000;
        if (lead <= LOTTIE_DELAY_MS) window.setTimeout(() => fireCue(conn, w.cue), Math.max(0, startsAt - lead - performance.now()));
      }
      await sleep(Math.max(0, startsAt - performance.now()));
      setOn(true);

      const msPerFrame = 1000 / comp.fr;
      const totalFrames = comp.op - comp.ip;
      let collapsed = false;
      let sparkGone = false;
      await new Promise<void>((resolve) => {
        const onFrame = () => {
          const remaining = (totalFrames - anim.currentFrame) * msPerFrame;
          // Once she is out of sight, the app's own Spark leaves the stage
          // under cover of the Lottie's — into Vyom's centre, where the
          // module beat will find her.
          if (!sparkGone) {
            sparkGone = true;
            sparkSet('sparkPositionX', window.innerWidth / 2);
            sparkSet('sparkPositionY', window.innerHeight / 2);
            sparkFire('flyOut');
            // Given back once she has left the stage, so she comes in whole.
            window.setTimeout(() => sparkSet('scale', SPARK_FULL_SCALE), SPARK_RESTORE_AFTER_FLY_OUT_MS);
          }
          if (!collapsed && remaining <= VYOM_COLLAPSE_BEFORE_END_MS) {
            // Straight out: he counts as busy for as long as he is open,
            // and the collapse is what ends that.
            collapsed = true;
            void expand({ force: true });
          }
        };
        const done = () => {
          anim.removeEventListener('enterFrame', onFrame);
          anim.removeEventListener('complete', done);
          if (!collapsed) void expand({ force: true });
          resolve();
        };
        anim.addEventListener('enterFrame', onFrame);
        anim.addEventListener('complete', done);
        // From the Start marker to the End marker, once; the connector
        // follows every frame drawn.
        anim.goToAndPlay(0, true);
      });
    },
    fadeOut: () => setOn(false),
  }));

  return <div ref={stage} className="launch" data-on={on === null ? undefined : String(on)} aria-hidden="true" />;
});

import lottie, { type AnimationItem } from 'lottie-web';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useSpark } from '../spark';
import { useVyom } from '../vyom';
import { triggerWhenIdle } from '../vyom/sequencing';
import './launch.css';

/**
 * The launch piece, keys 6 to 12 of the storyboard: Vyom expands to wrap
 * the screen, the network of cards appears inside him with Spark touring
 * it, and everything folds back into him.
 *
 * Two things play, in two layers:
 *  - Vyom's own expansion and collapse — the `exapndCollapse` trigger of
 *    his artboard (spelled as the file spells it), once to open and once
 *    to close — on his stage, underneath;
 *  - the "With Spark" Lottie (`/onboarding/launch/with-spark.json`), drawn
 *    over him from its Start marker to its End marker: the network, the
 *    cards, the gold path, and Spark herself on it (her image sequence),
 *    arriving and leaving as the Lottie has it.
 *
 * The order of it: Vyom opens up and the app's own Spark shrinks away into
 * him (and is taken off stage under cover of that); half a second after
 * his expansion is triggered the Lottie starts; a second before it ends he
 * collapses — so the last frame is him alone in the middle, ready for the
 * module to start.
 */

const LOTTIE_URL = '/onboarding/launch/with-spark.json';
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
 * Where the Lottie's Spark first appears (frame 31, growing out of Vyom), in
 * the comp's units: the app's own Spark is parked there for the walk in, so
 * she shrinks away where the Lottie's emerges.
 */
const SPARK_START = { x: 960.6, y: 539.3 };

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
  /** Resolves once the Lottie is loaded. */
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
  const loaded = useRef<Promise<{ anim: AnimationItem; comp: Comp }> | null>(null);
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
    loaded.current = new Promise<{ anim: AnimationItem; comp: Comp }>((resolve) => {
      anim.addEventListener('DOMLoaded', () => {
        const data = (anim as unknown as { animationData: { w: number; h: number; fr: number; ip: number; op: number } }).animationData;
        const comp: Comp = { w: data.w, h: data.h, fr: data.fr, ip: data.ip, op: data.op };
        compRef.current = comp;
        anim.goToAndStop(comp.ip, true);
        resolve({ anim, comp });
      });
    });
    return () => anim.destroy();
  }, []);

  useImperativeHandle(ref, () => ({
    ready: async () => {
      await loaded.current;
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
      const { anim, comp } = assets;

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
      await sleep(Math.max(0, LOTTIE_DELAY_MS - (performance.now() - expandedAt)));
      setOn(true);

      const msPerFrame = 1000 / comp.fr;
      let collapsed = false;
      let sparkGone = false;
      await new Promise<void>((resolve) => {
        const onFrame = () => {
          const f = anim.currentFrame + anim.firstFrame;
          const remaining = (comp.op - f) * msPerFrame;
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
        anim.playSegments([comp.ip, comp.op], true);
      });
    },
    fadeOut: () => setOn(false),
  }));

  return <div ref={stage} className="launch" data-on={on === null ? undefined : String(on)} aria-hidden="true" />;
});

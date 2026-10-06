import { useCallback, useEffect, useRef, useState } from 'react';
import { useVyom } from '../vyom';
import { driveStep, nextFrame, sleep, waitUntilBusy, writeWhenIdle } from '../vyom/sequencing';
import { cssDurationMs } from './css';

/**
 * Where the transition has got to.
 *
 * `blank` is the long middle: the screen it came from has gone, the next one
 * is not up yet, and Vyom is alone while the module loads.
 */
export type TransitionPhase = 'idle' | 'fading-out' | 'blank' | 'fading-in' | 'presenting';

/** Fallbacks for the stylesheet's own durations, if a property cannot be read. */
const OUT_MS = 500;
const IN_MS = 500;
const GAP_MS = 500;


/**
 * How long the module takes to load, measured from the tap.
 *
 * The screen going out happens inside this, not before it: the fade is the
 * first half-second of it, and Vyom is alone for the rest.
 */
const LOAD_MS = 4000;

interface HomeToRoomOptions {
  /** Mounts the teaching room. Called once the module has reported loaded. */
  mountRoom: (lessonId: string) => void;
}

/**
 * ---------------------------------------------------------------------------
 * The home → teaching room transition
 * ---------------------------------------------------------------------------
 * The page is treated as one surface rather than a set of pieces: it dims and
 * steps back, Vyom is left alone in the middle while the module loads, and the
 * next page rises into its place. He is never part of the fade — he lives on a
 * fixed stage outside the frame, which is what lets the screens change around
 * him.
 *
 *   1. The screen fades out and recedes slightly (500ms), while Vyom is sent
 *      to the centre and the module starts — one beat, all at once.
 *   2. The rest of the module's four seconds, with Vyom alone.
 *   3. `moduleStartLoaded`, a 500ms beat, then the room rises in (500ms).
 *   4. Vyom moves up to his place at the top of the canvas.
 *   5. He presents, and the slide speaks: title, description and formula.
 *
 * Two things about how it drives the character:
 *
 * It writes to the ViewModel directly rather than through the provider's
 * `fire` / `setFlag`. Those are gated behind `AUTO_DRIVE_ENABLED`, which is
 * off so that nothing animates by itself; this is not the app animating by
 * itself, it is a sequence the student started by tapping a lesson, and it
 * should run whatever that gate is set to — the same reasoning the dev panel
 * and the sequencer already use.
 *
 * And no trigger is ever fired into a busy artboard — one that is would be
 * swallowed. What the steps mostly do *not* do is wait for the animation they
 * started, because the timings above already allow for it. Step 4 is the
 * exception: nothing says how long Vyom takes to travel up to the canvas, and
 * step 5 is him presenting what he has arrived at, so that one waits.
 */
export function useHomeToRoom({ mountRoom }: HomeToRoomOptions) {
  const { viewModelInstance, measureSlot, setSlotManual, setSlotPosition } = useVyom();
  const [phase, setPhase] = useState<TransitionPhase>('idle');

  // Set while a run is in progress, and cleared to abandon it. A ref rather
  // than state because the run reads it between every await, and a re-render
  // per read would be absurd.
  const running = useRef(false);
  useEffect(
    () => () => {
      running.current = false;
    },
    [],
  );

  // Read through a ref so the long-lived run always sees the current value: it
  // outlives several renders, and a captured `viewModelInstance` would be the
  // one that existed when the lesson was tapped.
  const vmi = useRef(viewModelInstance);
  vmi.current = viewModelInstance;

  const isBusy = useCallback(() => vmi.current?.boolean('actionPlaying')?.value === true, []);
  const alive = useCallback(() => running.current, []);

  // Worth saying out loud rather than stalling: the transition carries on
  // either way, because leaving the student on a blank screen is worse than a
  // character who is half a beat out of step.
  const warnIfStalled = (name: string, finished: boolean) => {
    if (!finished && running.current) {
      console.warn(`[transition] gave up waiting on "${name}" — carrying on`);
    }
  };

  /** Fires once the artboard is free, and moves straight on. */
  const fire = useCallback(
    async (name: string) => {
      const written = await writeWhenIdle(
        () => vmi.current?.trigger(name)?.trigger(),
        isBusy,
        alive,
      );
      warnIfStalled(name, written);
    },
    [isBusy, alive],
  );

  /**
   * Fires several triggers as one beat.
   *
   * They share a single check that the artboard is free and then go out in the
   * same tick, so none of them waits on another's animation. That is only safe
   * from idle — which is what the check is for.
   */
  const fireTogether = useCallback(
    async (...names: string[]) => {
      const written = await writeWhenIdle(
        () => names.forEach((name) => vmi.current?.trigger(name)?.trigger()),
        isBusy,
        alive,
      );
      warnIfStalled(names.join(' + '), written);
    },
    [isBusy, alive],
  );

  /** Fires, and holds until the animation it started has finished. */
  const fireAndWait = useCallback(
    async (name: string) => {
      const finished = await driveStep(() => vmi.current?.trigger(name)?.trigger(), isBusy, alive);
      warnIfStalled(name, finished);
    },
    [isBusy, alive],
  );

  const begin = useCallback(
    async (lessonId: string) => {
      if (running.current) return;
      running.current = true;

      const startedAt = performance.now();
      const outMs = cssDurationMs('--xit-out', OUT_MS);

      // ---- 1. the screen goes out, and he walks into the middle ----------
      // Manual first: these four numbers are written from the DOM anchors
      // every time one moves, so a coordinate set here would be overwritten
      // before the move trigger had read it.
      const centre = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      setSlotManual('learn', true);
      setSlotPosition('learn', centre);
      setPhase('fading-out');

      // The fade is a CSS animation, already running by the time the triggers
      // go out — nothing below waits for it. The two triggers go together,
      // after a single check that the artboard is free: gating the second
      // behind the first would hold `moduleStart` until Vyom had finished
      // walking, and the load is meant to happen *while* he walks.
      await fireTogether('moveToPoint', 'moduleStart');
      if (!running.current) return;

      // ---- 2. load -------------------------------------------------------
      // Two waits, not one, because the screen changes hands partway through.
      // The first ends when the page has gone, which is where `blank` starts.
      // The second is whatever is left of the module's four
      // seconds, measured from the tap — so the fade happens *inside* the
      // load rather than before it.
      await sleep(Math.max(0, outMs - (performance.now() - startedAt)));
      if (!running.current) return;
      setPhase('blank');

      await sleep(Math.max(0, LOAD_MS - (performance.now() - startedAt)));
      if (!running.current) return;

      // ---- 3. the room comes up ------------------------------------------
      await fire('moduleStartLoaded');
      if (!running.current) return;

      // Mounted while the frame is still blank, so the room is laid out and
      // ready before anything about it is visible.
      mountRoom(lessonId);
      // Two frames: one for React to commit the room, one for the browser to
      // lay it out.
      await nextFrame();
      if (!running.current) return;

      // Vyom's place on the canvas, read now — laid out, but before the
      // arrival animation has put a transform on anything.
      //
      // Measuring it later, once the room is visible, would be the obvious
      // thing and is a trap: the frame is scaling as it fades in, so every
      // rect inside it carries that scale until the last frame. Worse, the
      // transform is only guaranteed to have finished if the animation
      // timeline actually advanced — and it stops advancing whenever the
      // document is not being painted, so a student who switches tabs
      // mid-fade would come back to Vyom parked wherever the canvas had got
      // to. Layout does not move during the fade; only the transform does. So
      // the honest moment to read a layout position is before it exists.
      const canvasPoint = measureSlot('learn');

      // The beat between the module reporting loaded and the room appearing.
      await sleep(cssDurationMs('--xit-gap', GAP_MS));
      if (!running.current) return;

      setPhase('fading-in');
      await sleep(cssDurationMs('--xit-in', IN_MS));
      if (!running.current) return;

      // ---- 4. up to the top of the canvas --------------------------------
      // Written, not handed back to the layout to sync itself there. The
      // automatic sync is coalesced into an animation frame and skipped for
      // manual slots, so asking for it here competes with whatever frame the
      // fade has already queued — and a step that has to happen *now* cannot
      // be left to win that race. The position was read before the fade
      // began; see where `canvasPoint` is taken.
      if (canvasPoint) setSlotPosition('learn', canvasPoint);
      else console.warn('[transition] no learn anchor in the room — Vyom stays put');
      await nextFrame();
      await fireAndWait('moveToPoint');
      if (!running.current) return;

      // Back under the layout's control now the scripted move is done, so the
      // rest of the lesson behaves normally.
      setSlotManual('learn', false);

      // ---- 5. present, and then let the slide speak ----------------------
      // The gesture leads and the words follow it: `present` goes out while
      // the title, description and formula are still hidden, and they fade up
      // only once it is visibly under way. Waiting on the busy flag rather
      // than a timer ties the reveal to the animation actually starting —
      // and `waitUntilBusy` gives up after its grace, so a `present` that
      // drives nothing still lets the slide speak rather than silencing it.
      setPhase('presenting');
      vmi.current?.trigger('present')?.trigger();
      await waitUntilBusy(isBusy, alive);
      if (!running.current) return;

      running.current = false;
      // Back to `idle`, which is also what uncovers the slide's content: the
      // page at rest is the page with its words on it.
      setPhase('idle');
    },
    [fire, fireAndWait, fireTogether, isBusy, alive, measureSlot, mountRoom, setSlotManual, setSlotPosition],
  );

  /**
   * Back to the home page.
   *
   * The same gesture without the middle: there is no module to load on the way
   * back, so the screen goes out and the next one comes straight up.
   */
  const leave = useCallback(async (unmountRoom: () => void) => {
    if (running.current) return;
    running.current = true;

    setPhase('fading-out');
    await sleep(cssDurationMs('--xit-out', OUT_MS));
    if (!running.current) return;

    setPhase('blank');
    unmountRoom();
    await nextFrame();
    if (!running.current) return;

    setPhase('fading-in');
    await sleep(cssDurationMs('--xit-in', IN_MS));

    running.current = false;
    setPhase('idle');
  }, []);

  return { phase, begin, leave, isRunning: phase !== 'idle' };
}

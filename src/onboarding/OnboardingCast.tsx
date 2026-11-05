import { useEffect, useRef } from 'react';
import { useSpark } from '../spark';
import { useVyom } from '../vyom';
import { triggerWhenIdle, writeInLine } from '../vyom/sequencing';

/**
 * The app's own Vyom and Spark, standing on the onboarding page — and
 * reacting to it.
 *
 * The page (the hosted mockup) draws no characters of its own: where it
 * drew them it leaves empty boxes, `[data-cast="vyom"]` and
 * `[data-cast="spark"]`, and posts its state to the shell — the step,
 * whether the step has an answer, whether Spark has been met and is
 * speaking. This component reads the boxes through the frame every frame
 * and keeps the two characters on them, and plays the story the steps tell:
 *
 *  - Vyom appears in his box as soon as the page shows one and goes when
 *    it shows none (the sign-up step has no cast). Continue has him pivot
 *    to the next question, which lands with him pointing down at it.
 *  - On the name step he does not pivot or point down at the question: as soon
 *    as he has landed he takes up his typing pose (`isTyping`, `typingPos` 3)
 *    and holds it until the student moves on.
 *  - Straight after sign-up the page's box is in the middle of the screen
 *    (its `intro`: Vyom alone, saying hello). When the intro ends the box
 *    moves to his place on the name step, and he walks there with
 *    `moveToPoint` instead of being set down; when he arrives the page is
 *    told (`vyomLanded`) and brings up the question and the name field, and
 *    he starts typing.
 *  - On the grade step, Submit brings Spark: she flies from Vyom's centre
 *    to her box at the right end of the question row, and Vyom turns to look
 *    at her, confused; as she says her line (speaking, delighted) he turns
 *    happy — then both settle.
 *  - On the chapter step she stays where she is and glances down at the
 *    search bar; on Start she lights up as
 *    the two set off.
 *
 * Nothing is written into a busy artboard: every trigger goes through the
 * shared line (`triggerWhenIdle`), which sends it once `actionPlaying` is
 * false — the previous animation has finished — and in the order asked.
 * Unmounted the moment Start is tapped; the launch sequence takes the two
 * characters on from where this leaves them.
 */

/** The mockup's steps that matter here (its own `S` table). */
const STEP_NAME = 1;
const STEP_CHAPTER = 4;
/** The typing pose he holds while the name is asked for: his `typingPos` (he rests at 1). */
const TYPING_POS = 3;
/** The cast stands smaller than elsewhere in the app: each character's own `scale` (a percentage) while the onboarding shows. */
const VYOM_SCALE = 80;
const SPARK_SCALE = 72;
/** Their scale everywhere else. */
const FULL_SCALE = 100;
/** A box that moves this far in one go has been put somewhere else, not nudged: Vyom walks there. */
const WALK_JUMP_PX = 80;
/** The box has to hold still this many ticks before he walks to it (its entering drift has to be over). */
const WALK_REST_TICKS = 6;
/** He has arrived when his parked position is this close to where he was sent. */
const WALK_ARRIVE_PX = 3;
/** A walk that has not been seen to finish by now is taken as finished. */
const WALK_TIMEOUT_MS = 6000;
/** How long the mockup's own entering drift takes, so a box is read once it has landed. */
const ENTER_SETTLE_MS = 900;
/** How long to wait for an animation frame before ticking anyway. */
const TICK_FALLBACK_MS = 40;
/** A box has to move this far for a character to be rewritten. */
const EPSILON_PX = 0.25;
/** How long her fly-in takes to land her, before her line shows. */
const SPARK_FLY_IN_MS = 1000;
/** How far her spot may shift between steps before she is sent to it. */
const SPARK_STAY_PX = 60;
/** How long Spark's line takes her to say. */
const SPARK_LINE_MS = 3200;
/** How long Vyom's happy moment after an answer lasts. */
const HAPPY_MS = 1800;

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}
interface Point {
  x: number;
  y: number;
}
interface PageState {
  step: number;
  sparkle: boolean;
  sparkIntro: boolean;
  answered: boolean;
  /** Straight after sign-up, Vyom stands alone in the middle saying hello. */
  intro: boolean;
  since: number;
}

const centreOf = (b: Box): Point => ({ x: b.x + b.width / 2, y: b.y + b.height / 2 });

/** The page's frame and document, once it is up. */
function frameDoc() {
  const frame = document.querySelector<HTMLIFrameElement>('iframe.design__frame');
  const doc = frame?.contentDocument;
  return frame && doc && doc.body ? { frame, doc } : null;
}

/** An element's box on the viewport, through the frame, or null if it is not showing. */
function boxOf(frame: HTMLIFrameElement, el: Element | null): Box | null {
  if (!el) return null;
  const outer = frame.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  if (r.width <= 0 || r.height <= 0) return null;
  return { x: outer.left + r.left, y: outer.top + r.top, width: r.width, height: r.height };
}

export function OnboardingCast() {
  const { viewModelInstance } = useVyom();
  const { viewModelInstance: sparkInstance } = useSpark();
  const vyomVmi = useRef(viewModelInstance);
  vyomVmi.current = viewModelInstance;
  const sparkVmi = useRef(sparkInstance);
  sparkVmi.current = sparkInstance;

  // What the page last said about itself.
  const page = useRef<PageState>({ step: 0, sparkle: false, sparkIntro: false, answered: false, intro: false, since: performance.now() });

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { type?: unknown; step?: unknown; sparkle?: unknown; sparkIntro?: unknown; answered?: unknown; intro?: unknown };
      if (data?.type !== 'onboarding-state' || typeof data.step !== 'number') return;
      const prev = page.current;
      const next = { step: data.step, sparkle: Boolean(data.sparkle), sparkIntro: Boolean(data.sparkIntro), answered: Boolean(data.answered), intro: Boolean(data.intro) };
      // Only a new step moves the layout (and so is given its entering
      // drift); Submit on the grade step changes nothing under her, so she
      // comes at once.
      const stepChanged = next.step !== prev.step;
      page.current = { ...next, since: stepChanged ? performance.now() : prev.since };
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  useEffect(() => {
    // ---- Vyom --------------------------------------------------------------
    let vyomShown = false;
    let vyomAt: Point | null = null;
    const vyomFire = (name: string, expectRise = true) =>
      void triggerWhenIdle(() => vyomVmi.current, name, { shouldContinue: () => !stopped, expectRise });
    const vyomSet = (name: string, value: number) => {
      const n = vyomVmi.current?.number(name);
      if (n) n.value = value;
    };
    const vyomFlag = (name: string, value: boolean) => {
      const b = vyomVmi.current?.boolean(name);
      if (b) b.value = value;
    };
    const vyomMood = (name: string) => {
      const e = vyomVmi.current?.enum('emotion');
      if (e) e.value = name;
    };
    // A mood that is to hold for a while: one at a time, so a later mood is
    // not undone by an earlier one's timer — and re-asserted every frame,
    // because the artboard resets the emotion to neutral when a gesture
    // (`acknowledge`, `pointDown`) starts.
    let heldMood: string | null = null;
    let moodTimer = 0;
    const holdMood = (name: string) => {
      window.clearTimeout(moodTimer);
      heldMood = name;
      vyomMood(name);
    };
    const moodFor = (name: string, ms: number, then = 'neutral') => {
      holdMood(name);
      moodTimer = window.setTimeout(() => {
        heldMood = null;
        vyomMood(then);
      }, ms);
    };
    const placeVyom = (p: Point) => {
      const vmi = vyomVmi.current;
      if (!vmi) return;
      // The slot's own pair, so the next walk starts from here — and the
      // parked pair, which the artboard shows at once.
      for (const name of ['learnWindowX', 'refPosX']) {
        const n = vmi.number(name);
        if (n) n.value = p.x;
      }
      for (const name of ['learnWindowY', 'refPosY']) {
        const n = vmi.number(name);
        if (n) n.value = p.y;
      }
    };
    // Gestures wait their turn: one at a time, into an idle artboard.
    const cues: { name: string; at: number }[] = [];
    const cue = (name: string) => {
      if (!cues.some((c) => c.name === name)) cues.push({ name, at: performance.now() });
    };
    const timers = new Set<number>();
    const later = (ms: number, fn: () => void) => {
      const id = window.setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms);
      timers.add(id);
    };

    // ---- Spark -------------------------------------------------------------
    let sparkShown = false;
    let sparkTarget: Point | null = null;
    let sparkMoveAt = 0;
    const sparkFire = (name: string) => sparkVmi.current?.trigger(name)?.trigger();
    const sparkSet = (name: string, value: number) => {
      const n = sparkVmi.current?.number(name);
      if (n) n.value = value;
    };
    const sparkFlag = (name: string, value: boolean) => {
      const b = sparkVmi.current?.boolean(name);
      if (b) b.value = value;
    };
    const sparkFace = (name: string) => {
      const e = sparkVmi.current?.enum('expression');
      if (e) e.value = name;
    };
    const placeSpark = (p: Point) => {
      sparkSet('sparkPositionX', p.x);
      sparkSet('sparkPositionY', p.y);
    };

    // ---- the story: what the page said last time, to see what changed ----
    let seenStep = -1;
    let seenIntro = false;
    // Vyom's walk from where the page first put him to where it moves its box
    // to — from the middle of the screen to his place on the name step.
    // His typing pose on the name step: taken up when he lands, held, let go on leaving.
    let typingOn = false;
    let typingPosBefore: number | null = null;
    const startTyping = () => {
      if (typingOn) return;
      typingOn = true;
      void writeInLine(
        () => vyomVmi.current,
        (vmi) => {
          const pos = vmi.number('typingPos');
          if (pos) {
            typingPosBefore ??= pos.value;
            pos.value = TYPING_POS;
          }
          const typing = vmi.boolean('isTyping');
          if (typing) typing.value = true;
        },
        { shouldContinue: () => !stopped && typingOn },
      );
    };
    const stopTyping = () => {
      if (!typingOn) return;
      typingOn = false;
      vyomFlag('isTyping', false);
      if (typingPosBefore !== null) {
        vyomSet('typingPos', typingPosBefore);
        typingPosBefore = null;
      }
    };
    let walking: { to: Point; since: number } | null = null;
    let lastBoxAt: Point | null = null;
    let restTicks = 0;
    let glancedAtInput = false;

    // A frame when there is one, a timer when there is not: a document that
    // is not being painted stops servicing animation frames, and the cast
    // would never be placed at all.
    let frame = 0;
    let timer = 0;
    let stopped = false;
    const schedule = () => {
      frame = requestAnimationFrame(tick);
      timer = window.setTimeout(tick, TICK_FALLBACK_MS);
    };
    const tick = () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      if (stopped) return;
      schedule();
      // Held every frame: the artboards are free to put it back.
      if (vyomVmi.current?.number('scale')?.value !== VYOM_SCALE) vyomSet('scale', VYOM_SCALE);
      if (sparkVmi.current?.number('scale')?.value !== SPARK_SCALE) sparkSet('scale', SPARK_SCALE);
      const fd = frameDoc();
      if (!fd || !vyomVmi.current) return;
      const { frame: iframe, doc } = fd;
      const now = performance.now();
      const st = page.current;
      const settled = now - st.since > ENTER_SETTLE_MS;

      // ---- Vyom in his box, every frame -----------------------------------
      const vyomBox = boxOf(iframe, doc.querySelector('[data-cast="vyom"]'));
      if (vyomBox) {
        const c = centreOf(vyomBox);
        restTicks =
          lastBoxAt && Math.abs(c.x - lastBoxAt.x) < 0.5 && Math.abs(c.y - lastBoxAt.y) < 0.5 ? restTicks + 1 : 0;
        lastBoxAt = c;
        const num = (name: string) => vyomVmi.current?.number(name)?.value ?? NaN;
        if (!vyomAt) {
          placeVyom(c);
          vyomAt = c;
        } else if (walking) {
          // Walking: the artboard parks him at the destination when he arrives.
          const arrived = Math.hypot(num('refPosX') - walking.to.x, num('refPosY') - walking.to.y) < WALK_ARRIVE_PX;
          if (arrived || now - walking.since > WALK_TIMEOUT_MS) {
            vyomAt = walking.to;
            walking = null;
            // He is where the question is: the page brings the question, the
            // field and the buttons up, and he goes straight into his typing
            // pose (no pivot first, on this step).
            try {
              iframe.contentWindow?.postMessage({ type: 'onboarding-cue', vyomLanded: true }, window.location.origin);
            } catch {
              /* the frame may be gone */
            }
            cue('typing');
          }
        } else if (Math.hypot(c.x - vyomAt.x, c.y - vyomAt.y) > WALK_JUMP_PX) {
          // The box has been put somewhere else (the intro ending): once it has
          // come to rest, he walks there rather than being set down.
          if (restTicks >= WALK_REST_TICKS) {
            for (const name of ['learnWindowX', 'learnWindowY']) {
              const n = vyomVmi.current?.number(name);
              if (n) n.value = name === 'learnWindowX' ? c.x : c.y;
            }
            walking = { to: c, since: now };
            vyomFire('moveToPoint', false);
          }
        } else if (Math.abs(c.x - vyomAt.x) > EPSILON_PX || Math.abs(c.y - vyomAt.y) > EPSILON_PX) {
          placeVyom(c);
          vyomAt = c;
        }
        if (!vyomShown) {
          vyomFire('appear');
          vyomMood('neutral');
          vyomShown = true;
        }
      } else if (vyomShown) {
        vyomFire('disappear');
        vyomShown = false;
      }

      // ---- the gestures, one at a time, into an idle artboard -------------
      // Queued in the order asked; the line sends each once the last has finished.
      while (cues.length && vyomShown) {
        const name = cues.shift()!.name;
        if (name === 'typing') startTyping();
        else vyomFire(name);
      }
      if (heldMood && vyomVmi.current?.enum('emotion')?.value !== heldMood) vyomMood(heldMood);

      // ---- Continue: he pivots to the next question, then points it out --
      if (st.step !== seenStep) {
        const advanced = seenStep >= 0 && st.step > seenStep;
        seenStep = st.step;
        glancedAtInput = false;
        // He lets go of his typing pose when the name step is left.
        if (st.step !== STEP_NAME) stopTyping();
        // Not during the intro: he is saying hello, not pointing at a question; the cues come when he has walked to it.
        // On the name step he types rather than points down.
        const step = st.step;
        if (advanced && vyomShown && !st.intro) cue('pivot');
        if (vyomBox && !st.intro) later(ENTER_SETTLE_MS, () => cue(step === STEP_NAME ? 'typing' : 'pointDown'));
      }

      // ---- Spark: in on Submit, by the search bar on the chapter step -----
      if (!st.sparkle) {
        if (sparkShown) {
          sparkFire('flyOut');
          sparkShown = false;
          sparkTarget = null;
        }
        return;
      }
      if (!settled) return;

      // Her spot is her box, at the right end of the question row: the row
      // is laid out the same on every step, so she stays put from one to the next.
      const sparkBox = boxOf(iframe, doc.querySelector('[data-cast="spark"]'));
      const target: Point | null = sparkBox ? centreOf(sparkBox) : null;
      if (!target) return;

      if (!sparkShown) {
        // Met for the first time: out of Vyom (her chat position is his
        // centre) and over to her box, where she says her line. He turns to
        // look at her while she does.
        if (vyomAt) {
          sparkSet('chatPositionX', vyomAt.x);
          sparkSet('chatPositionY', vyomAt.y);
          vyomSet('lookAtX', target.x);
          vyomSet('lookAtY', target.y);
          vyomFlag('isLookingAtPoint', true);
          holdMood('confused');
        }
        placeSpark(target);
        sparkFace('delighted');
        sparkFire('flyIn');
        sparkShown = true;
        sparkTarget = target;
        sparkMoveAt = now;
        // Her line waits for her: the page shows it once she has landed.
        later(SPARK_FLY_IN_MS, () => {
          try {
            iframe.contentWindow?.postMessage({ type: 'onboarding-cue', sparkLanded: true }, window.location.origin);
          } catch {
            /* the frame may be gone */
          }
        });
        return;
      }

      // Her line, once she has landed: speaking for its length, then both
      // settle — she to neutral, he back from his look, pleased.
      if (st.sparkIntro && !seenIntro && now - sparkMoveAt > SPARK_FLY_IN_MS) {
        seenIntro = true;
        sparkFlag('isSpeaking', true);
        moodFor('happy', SPARK_LINE_MS + HAPPY_MS);
        later(SPARK_LINE_MS, () => {
          sparkFlag('isSpeaking', false);
          sparkFace('neutral');
          vyomFlag('isLookingAtPoint', false);
          cue('acknowledge');
        });
      }

      // The search bar sits a little above where the options were; that is
      // not a move. Only a real one — the layout changing under her — is.
      const moved = !sparkTarget || Math.abs(target.x - sparkTarget.x) > SPARK_STAY_PX || Math.abs(target.y - sparkTarget.y) > SPARK_STAY_PX;
      // A new place to be (another step, a resize): one move, not one per frame.
      if (moved && now - sparkMoveAt > ENTER_SETTLE_MS) {
        placeSpark(target);
        sparkFire('moveToPoint');
        sparkTarget = target;
        sparkMoveAt = now;
        glancedAtInput = false;
      }
      // By the search bar, she glances down at it once she has arrived.
      if (st.step === STEP_CHAPTER && !glancedAtInput && now - sparkMoveAt > ENTER_SETTLE_MS + 400) {
        glancedAtInput = true;
        sparkFire('lookLB');
      }
    };
    schedule();
    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      window.clearTimeout(moodTimer);
      timers.forEach((id) => window.clearTimeout(id));
      stopTyping();
      // Vyom is back to full size for the launch, which starts him from where he
      // stands. Spark is left as she is: the launch scales her down from this
      // size into him, and gives her full size back once she has flown out.
      vyomSet('scale', FULL_SCALE);
      // Whatever was held is let go, so the launch starts from a clean pair.
      vyomFlag('isLookingAtPoint', false);
      sparkFlag('isSpeaking', false);
    };
  }, []);

  return null;
}

import type { ViewModelInstance } from '@rive-app/react-canvas';

/**
 * ---------------------------------------------------------------------------
 * Driving the artboard in order
 * ---------------------------------------------------------------------------
 * Anything that fires more than one trigger in a row needs the same handful of
 * rules, learned the hard way while building the sequencer:
 *
 *  - The artboard raises `actionPlaying` while an animation runs. A trigger
 *    fired into a busy artboard is swallowed, so a sequence has to wait.
 *  - The flag does not settle in the same frame as a write. Reading it straight
 *    after writing catches it mid-change — sometimes the previous animation's
 *    value, sometimes a reset that has not yet become the new one's `true`.
 *    Pausing first is what makes the reading mean anything.
 *  - It does not *rise* in the same frame either. Waiting only for it to fall
 *    reads the previous idle state and runs straight past the animation the
 *    step just started, so a step waits for the rise and then the fall.
 *
 * The sequencer and the page transition both need this, so it lives here
 * rather than in either of them.
 */

/** How long to wait for the artboard to go idle before giving up. */
export const BUSY_TIMEOUT_MS = 10000;

/** How often the busy flag is checked while waiting. */
export const POLL_MS = 40;

/**
 * How long the artboard must have been idle before the next trigger is sent.
 *
 * `actionPlaying` falls while the artboard is still settling out of an
 * animation, and a trigger sent in that window is chained onto the last one
 * instead of starting clean — `pointDown` loses its look-down, a repeat is
 * swallowed outright. Measured: sent within ~250 ms of the fall it goes wrong,
 * from ~400 ms it plays as authored.
 */
export const QUIET_AFTER_BUSY_MS = 500;

/** Settle time between writing to the ViewModel and reading the busy flag. */
export const STATE_SETTLE_MS = 50;

/**
 * How long to let the busy flag rise after a write before deciding the write
 * started nothing.
 *
 * A step that drives nothing visible — setting a boolean that is already set,
 * say — never raises it, so this is a ceiling rather than a delay: it ends the
 * moment the flag goes true.
 */
export const BUSY_RISE_GRACE_MS = 400;

export const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });

/**
 * Backstop for `nextFrame`, in wall-clock time.
 *
 * Generous next to a 16 ms frame, because it is not trying to approximate one:
 * it only has to fire when there are going to be no frames at all.
 */
const FRAME_FALLBACK_MS = 100;

/**
 * Resolves after the browser has painted, twice — enough for a fresh layout.
 *
 * Races the frames against a timer, because a backgrounded tab stops servicing
 * `requestAnimationFrame` altogether. Waiting on frames alone means a sequence
 * that is mid-flight when the student switches tabs never resumes: they come
 * back to a screen frozen part-way through, with no way out of it. A late
 * measurement is a far smaller problem than a transition that never ends.
 */
export const nextFrame = () =>
  new Promise<void>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    requestAnimationFrame(() => requestAnimationFrame(finish));
    window.setTimeout(finish, FRAME_FALLBACK_MS);
  });

/** Reads the busy flag, or false when the artboard exposes none. */
export type BusyProbe = () => boolean;

/** Lets a caller abandon a wait — a stopped sequence, an unmounted component. */
export type ContinueProbe = () => boolean;

/**
 * Waits for the artboard to go idle.
 *
 * Returns false if it is still busy after `BUSY_TIMEOUT_MS`, or if the caller
 * asked to stop — a sequence should end rather than hang when an animation
 * never reports finishing.
 */
export async function waitWhileBusy(
  isBusy: BusyProbe,
  shouldContinue: ContinueProbe,
  timeoutMs = BUSY_TIMEOUT_MS,
): Promise<boolean> {
  const deadline = performance.now() + timeoutMs;
  let sawBusy = false;
  while (isBusy()) {
    sawBusy = true;
    if (!shouldContinue()) return false;
    if (performance.now() > deadline) return false;
    await sleep(POLL_MS);
  }
  if (sawBusy) lastAnimationEnd = performance.now();
  return true;
}

/** When the artboard was last seen to finish an animation, for the quiet period. */
let lastAnimationEnd = 0;

/** Records that something the busy flag does not cover (a reveal) has just finished. */
export function noteAnimationEnd() {
  lastAnimationEnd = performance.now();
}

/**
 * Waits for the artboard to be idle *and* to have stayed idle for `quietMs`
 * since its last animation ended — see `QUIET_AFTER_BUSY_MS`. After a long
 * rest there is nothing to wait for.
 */
export async function waitUntilQuiet(
  isBusy: BusyProbe,
  shouldContinue: ContinueProbe,
  quietMs = QUIET_AFTER_BUSY_MS,
): Promise<boolean> {
  for (;;) {
    if (!(await waitWhileBusy(isBusy, shouldContinue))) return false;
    const rest = quietMs - (performance.now() - lastAnimationEnd);
    if (rest <= 0) return true;
    await sleep(rest);
  }
}

/**
 * Waits for the busy flag to rise, up to `BUSY_RISE_GRACE_MS`.
 *
 * Returns as soon as it goes true, and returns anyway when the grace runs out,
 * because not every write starts an animation.
 */
export async function waitUntilBusy(
  isBusy: BusyProbe,
  shouldContinue: ContinueProbe,
  graceMs = BUSY_RISE_GRACE_MS,
): Promise<void> {
  const deadline = performance.now() + graceMs;
  while (!isBusy()) {
    if (!shouldContinue()) return;
    if (performance.now() > deadline) return;
    await sleep(POLL_MS);
  }
}

/**
 * Waits for a condition, up to a ceiling.
 *
 * Returns true the moment the probe reads true, and false when the time runs
 * out or the caller asks to stop. For the states the busy flag does not
 * cover: `appear` reports idle about a second before `vyomVisible` turns
 * true, so a sequence that needs him *shown* rather than merely idle waits
 * on that flag instead.
 */
export async function waitFor(
  probe: () => boolean,
  shouldContinue: ContinueProbe,
  timeoutMs: number,
): Promise<boolean> {
  const deadline = performance.now() + timeoutMs;
  while (!probe()) {
    if (!shouldContinue()) return false;
    if (performance.now() > deadline) return false;
    await sleep(POLL_MS);
  }
  return true;
}

/**
 * Waits for the artboard to be idle, then writes — no more.
 *
 * This is the half of the rule set that protects the *write*: a trigger fired
 * into a busy artboard is swallowed, so a caller must never fire into one.
 * What it deliberately does not do is wait for what the write started, which
 * is what a caller wants when it already knows how long to allow — a
 * choreographed transition on a fixed clock, say. Waiting for the rise there
 * would add the rise grace to every step for nothing.
 *
 * Returns false when it gave up waiting, and in that case nothing was written.
 */
export async function writeWhenIdle(
  write: () => void,
  isBusy: BusyProbe,
  shouldContinue: ContinueProbe,
  quietMs = 0,
): Promise<boolean> {
  await sleep(STATE_SETTLE_MS);
  const ready = quietMs > 0 ? await waitUntilQuiet(isBusy, shouldContinue, quietMs) : await waitWhileBusy(isBusy, shouldContinue);
  if (!ready) return false;
  write();
  return true;
}

/**
 * Waits for the artboard to be idle, runs `write`, then holds until whatever it
 * started has finished — the whole rule set in one call.
 *
 * This is for a caller that does not know how long the write will take and
 * must not run ahead of it: the sequencer's steps, or a transition step whose
 * next beat depends on the character having arrived.
 *
 * Returns false when it gave up waiting, so a caller can stop rather than carry
 * on into a sequence that has already lost sync with the character.
 */
export async function driveStep(
  write: () => void,
  isBusy: BusyProbe,
  shouldContinue: ContinueProbe,
  quietMs = 0,
): Promise<boolean> {
  if (!(await writeWhenIdle(write, isBusy, shouldContinue, quietMs))) return false;

  await sleep(STATE_SETTLE_MS);
  await waitUntilBusy(isBusy, shouldContinue);
  return waitWhileBusy(isBusy, shouldContinue);
}

/**
 * Every app-driven trigger goes through one line.
 *
 * The line is first come, first served, and each trigger waits at the front
 * of it until `actionPlaying` is false — the previous animation has finished
 * — before it is written. Once written it holds the line only until the busy
 * flag has had its chance to rise, so the trigger behind it reads a flag that
 * means something; the *fall* is the next trigger's to wait for.
 *
 * `force` skips the wait, for the one trigger that is meant to land on a busy
 * artboard: the collapse of an expansion, which the artboard keeps busy for
 * as long as it is open and which is what ends that. It still takes its turn.
 *
 * Resolves true once written; false if the artboard never went idle, in which
 * case nothing was written (a trigger sent into a busy artboard is swallowed
 * anyway, and one that never goes idle would hold the line for ever).
 */
let triggerLine: Promise<unknown> = Promise.resolve();

export interface TriggerOptions {
  /** Lets a caller abandon its turn — an unmounted component, a stopped sequence. */
  shouldContinue?: ContinueProbe;
  /** Fire without waiting for the artboard to be idle. */
  force?: boolean;
  /** Called the moment the trigger is written, before the line moves on. */
  onFired?: () => void;
  /**
   * The trigger is an animation that must run, so the busy flag has to rise
   * after it. If it does not, the trigger was swallowed — the artboard was
   * still settling from the last one — and it is sent again once idle.
   * Leave off for triggers that drive nothing the flag reports (a scale).
   */
  expectRise?: boolean;
}

/** How many times a swallowed trigger is sent again. */
const RESEND_LIMIT = 2;

/** How long to wait for `vyomVisible` to follow `appear` / `disappear`. */
const VISIBLE_GRACE_MS = 2500;

export function triggerWhenIdle(
  getVmi: () => ViewModelInstance | null | undefined,
  name: string,
  options: TriggerOptions = {},
): Promise<boolean> {
  const { shouldContinue = () => true, force = false, onFired, expectRise = false } = options;
  const isBusy = () => getVmi()?.boolean('actionPlaying')?.value === true;
  const isVisible = () => getVmi()?.boolean('vyomVisible')?.value === true;
  const write = () => {
    getVmi()?.trigger(name)?.trigger();
    onFired?.();
  };
  const turn = async () => {
    for (let attempt = 0; ; attempt++) {
      if (force) {
        write();
      } else if (!(await writeWhenIdle(write, isBusy, shouldContinue, QUIET_AFTER_BUSY_MS))) {
        console.warn(`[vyom] "${name}" not sent: the artboard did not go idle`);
        return false;
      }
      // Let what it started raise the flag, so the trigger behind reads one that means something.
      await sleep(STATE_SETTLE_MS);
      await waitUntilBusy(isBusy, shouldContinue);
      if (!expectRise || isBusy() || attempt >= RESEND_LIMIT || !shouldContinue()) break;
      console.warn(`[vyom] "${name}" started nothing — sending it again`);
    }
    // `appear` and `disappear` are the animations the flag misreports: it falls
    // a beat before he is shown (or hidden), and a trigger sent in that gap is
    // swallowed. Hold the line until `vyomVisible` has caught up.
    if (name === 'appear' || name === 'disappear') {
      await waitWhileBusy(isBusy, shouldContinue);
      const want = name === 'appear';
      await waitFor(() => isVisible() === want, shouldContinue, VISIBLE_GRACE_MS);
      noteAnimationEnd();
    }
    return true;
  };
  const result = triggerLine.then(turn);
  triggerLine = result.catch(() => undefined);
  return result;
}

/**
 * A ViewModel write — a flag or a number rather than a trigger — that takes
 * its turn in the same line as the triggers.
 *
 * For a state that is set after an animation and has to follow it (a looping
 * pose that starts once the gesture before it has finished): it waits for
 * `actionPlaying` to be false and quiet, like a trigger, and runs in the
 * order asked. Resolves false, writing nothing, if the artboard never went
 * idle or the caller withdrew.
 */
export function writeInLine(
  getVmi: () => ViewModelInstance | null | undefined,
  write: (vmi: ViewModelInstance) => void,
  options: { shouldContinue?: ContinueProbe } = {},
): Promise<boolean> {
  const { shouldContinue = () => true } = options;
  const isBusy = () => getVmi()?.boolean('actionPlaying')?.value === true;
  const turn = () =>
    writeWhenIdle(
      () => {
        const vmi = getVmi();
        if (vmi) write(vmi);
      },
      isBusy,
      shouldContinue,
      QUIET_AFTER_BUSY_MS,
    );
  const result = triggerLine.then(turn);
  triggerLine = result.catch(() => undefined);
  return result;
}

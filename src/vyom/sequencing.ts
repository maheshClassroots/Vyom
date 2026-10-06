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
  while (isBusy()) {
    if (!shouldContinue()) return false;
    if (performance.now() > deadline) return false;
    await sleep(POLL_MS);
  }
  return true;
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
): Promise<boolean> {
  await sleep(STATE_SETTLE_MS);
  if (!(await waitWhileBusy(isBusy, shouldContinue))) return false;
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
): Promise<boolean> {
  if (!(await writeWhenIdle(write, isBusy, shouldContinue))) return false;

  await sleep(STATE_SETTLE_MS);
  await waitUntilBusy(isBusy, shouldContinue);
  return waitWhileBusy(isBusy, shouldContinue);
}

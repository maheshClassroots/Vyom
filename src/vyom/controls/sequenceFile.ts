import type { SequenceCharacter } from './sequenceDrag';

/** The kinds of step a lane can hold. */
export type StepKind = 'trigger' | 'boolean' | 'enum' | 'number' | 'wait';

/**
 * One step, as it is held in a lane.
 *
 * `id` is per-step rather than per-property, so the same control can appear
 * more than once in a lane and still be dragged around independently. It is
 * assigned fresh on every load and never saved — see `SavedStep`.
 */
export interface Step {
  id: string;
  kind: StepKind;
  /** Property name — every kind except `wait`. */
  name?: string;
  /** Value to hold, for `boolean`. */
  on?: boolean;
  /** Value to select, for `enum`. */
  value?: string;
  /** Value to write, for `number`. */
  amount?: number;
  /** Milliseconds to hold, for `wait`. */
  ms?: number;
}

/** A step on disk: the same thing without the session-local `id`. */
export type SavedStep = Omit<Step, 'id'>;

/**
 * What a saved sequence file contains.
 *
 * `character` travels with the steps for the same reason it travels with a
 * dragged control: a Vyom property means nothing to Spark's ViewModel, so a
 * file loaded into the wrong lane is refused rather than silently building a
 * sequence that does nothing.
 *
 * `format` and `version` are what tell a stray .json from a sequence, and
 * leave room to migrate an older file rather than having to reject it.
 */
export interface SequenceFile {
  format: typeof SEQUENCE_FORMAT;
  version: number;
  character: SequenceCharacter;
  savedAt: string;
  steps: SavedStep[];
}

export const SEQUENCE_FORMAT = 'vyom-sequence';
export const SEQUENCE_VERSION = 1;

const STEP_KINDS: StepKind[] = ['trigger', 'boolean', 'enum', 'number', 'wait'];

let nextId = 0;
export const makeStepId = () => `step-${++nextId}`;

/** Builds the file body for a lane's steps, dropping the session-local ids. */
export function toSequenceFile(character: SequenceCharacter, steps: Step[]): SequenceFile {
  return {
    format: SEQUENCE_FORMAT,
    version: SEQUENCE_VERSION,
    character,
    savedAt: new Date().toISOString(),
    steps: steps.map(({ id: _id, ...rest }) => rest),
  };
}

export interface ParseResult {
  steps: Step[];
  /** Properties the file names that this character's ViewModel does not have. */
  unknown: string[];
}

/**
 * Reads a saved sequence back, or throws with a reason a human can act on.
 *
 * Validation is deliberate rather than a cast: the file comes off disk and may
 * be hand-edited, from another build, or not a sequence at all, and a bad step
 * that reaches the play loop fails as a silent no-op rather than an error.
 *
 * Properties the ViewModel does not have are kept rather than dropped, and
 * reported instead: that usually means the .riv has moved on, and seeing which
 * names went missing is more use than a quietly shortened sequence.
 */
export function parseSequenceFile(
  raw: string,
  expected: SequenceCharacter,
  knownProperties: Set<string>,
): ParseResult {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error('not valid JSON');
  }

  if (!data || typeof data !== 'object') throw new Error('not a sequence file');
  const file = data as Partial<SequenceFile>;

  if (file.format !== SEQUENCE_FORMAT) throw new Error('not a sequence file');
  if (typeof file.version !== 'number' || file.version > SEQUENCE_VERSION) {
    throw new Error(`saved by a newer build (version ${String(file.version)})`);
  }
  if (file.character !== expected) {
    throw new Error(`saved for ${String(file.character)}, not ${expected}`);
  }
  if (!Array.isArray(file.steps)) throw new Error('no steps in the file');

  const unknown = new Set<string>();
  const steps = file.steps.map((candidate, index) => {
    const at = `step ${index + 1}`;
    if (!candidate || typeof candidate !== 'object') throw new Error(`${at} is not a step`);
    const { kind, name, on, value, amount, ms } = candidate as SavedStep;
    if (!STEP_KINDS.includes(kind)) throw new Error(`${at} has an unknown kind "${String(kind)}"`);

    if (kind === 'wait') {
      return { id: makeStepId(), kind, ms: Math.max(0, Number(ms) || 0) };
    }

    if (typeof name !== 'string' || name === '') throw new Error(`${at} is missing a property name`);
    if (!knownProperties.has(name)) unknown.add(name);

    if (kind === 'boolean') return { id: makeStepId(), kind, name, on: on === true };
    if (kind === 'enum') return { id: makeStepId(), kind, name, value: String(value ?? '') };
    if (kind === 'number') return { id: makeStepId(), kind, name, amount: Number(amount) || 0 };
    return { id: makeStepId(), kind, name };
  });

  return { steps, unknown: [...unknown] };
}

/**
 * Hands the file to the browser's downloads.
 *
 * An object URL rather than a data URL so a long sequence is not capped by the
 * URL length a browser will accept, and revoked on the next frame — the click
 * has been dispatched by then, and holding it keeps the blob alive for the
 * life of the document.
 */
export function downloadSequence(character: SequenceCharacter, steps: Step[]) {
  const body = JSON.stringify(toSequenceFile(character, steps), null, 2);
  const url = URL.createObjectURL(new Blob([body], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  // Date-stamped, because a lane is usually saved more than once in a session
  // and the downloads folder is the only place they are told apart.
  link.download = `${character}-sequence-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  requestAnimationFrame(() => URL.revokeObjectURL(url));
}

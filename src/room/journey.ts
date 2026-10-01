import type { SlotId } from '../vyom';

export type BoardMode = 'intro' | 'teach' | 'quiz' | 'video';

export interface Question {
  q: string;
  opts: string[];
  /** Index of the correct option. */
  ans: number;
}

export interface ChatLine {
  who: 'vyom' | 'user';
  text: string;
}

export interface Step {
  id: string;
  mode: BoardMode;
  title: string;
  sub?: string;
  chip?: boolean;
  /** Learning-objective list, with how many are ticked off on this step. */
  bullets?: string[];
  loDone?: number;
  /** Index of the objective that celebrates as it completes. */
  loCelebrate?: number;
  outro?: boolean;
  msgs: ChatLine[];
  /**
   * Where Vyom stands for this step. `canvas` puts him on the board (the
   * prototype's `introMaxImg` / `outroLand` mounts); `chat` docks him in the
   * rail beside the composer (`#dockSlot`).
   */
  slot: SlotId;
  /** Trigger fired when the step opens, once Vyom has arrived. */
  cue?: string;
  /**
   * Booleans held for the duration of the step. In `MasterCanvas` the
   * conversational and waiting states are booleans, not triggers, so they are
   * set here and cleared when the step changes.
   */
  flags?: Record<string, boolean>;
  /** Milestones pay out XP and an orb, and fire `celebrate`. */
  milestone?: boolean;
  /** Question shown on a `quiz` board. */
  question?: Question;
}

const OBJECTIVES = [
  'Recognize a trapezoid by its parallel sides',
  'Understand how its area relates to shapes you already know',
  'Find the area of a trapezoid using the base(s) and height',
];

/**
 * The demo journey, carried over from the prototype's `this.steps`.
 *
 * Every step keeps a stable `id`: nothing compares a step to a numeric index,
 * so inserting a slide never silently rewires unrelated behaviour.
 */
export const STEPS: Step[] = [
  {
    id: 'intro',
    mode: 'intro',
    title: 'Area of a trapezoid',
    sub: "We'll learn how to find the area of a trapezoid together.",
    slot: 'learn',
    cue: 'appear',
    milestone: true,
    msgs: [
      { who: 'vyom', text: "Hi {name}! I'm Vyom. Today we're going to discover how to find the area of a trapezoid." },
    ],
  },
  {
    id: 'obj',
    mode: 'teach',
    title: 'What you will be able to do',
    chip: true,
    bullets: OBJECTIVES,
    loDone: 0,
    slot: 'chat',
    cue: 'present',
    msgs: [
      { who: 'vyom', text: "First, you'll recognize a trapezoid by its parallel sides." },
      { who: 'vyom', text: "Next, you'll understand how its area relates to shapes you already know." },
      { who: 'vyom', text: "And finally, you'll find the area of a trapezoid using the base(s) and height." },
    ],
  },
  {
    id: 'explore',
    mode: 'quiz',
    title: 'Check what you spotted',
    chip: true,
    slot: 'chat',
    cue: 'present',
    // Carried over from the prototype's own question bank (`SKIPQ`).
    question: {
      q: 'How many pairs of parallel sides does a trapezoid have?',
      opts: ['Two', 'One', 'None'],
      ans: 1,
    },
    msgs: [
      { who: 'vyom', text: "Drag the top corner of a parallelogram and one pair of sides stops being parallel. So — how many pairs does a trapezoid have?" },
    ],
  },
  {
    id: 'lo1',
    mode: 'teach',
    title: 'What you will be able to do',
    chip: true,
    bullets: OBJECTIVES,
    loDone: 1,
    loCelebrate: 0,
    slot: 'chat',
    cue: 'correct',
    milestone: true,
    msgs: [
      { who: 'vyom', text: "Great — that's one down. You can now recognize a trapezoid by its parallel sides." },
    ],
  },
  {
    id: 'def',
    mode: 'teach',
    title: 'This new shape is a trapezoid',
    chip: true,
    slot: 'chat',
    cue: 'present',
    msgs: [
      { who: 'vyom', text: 'This new shape is called a trapezoid — a quadrilateral with only one pair of parallel sides.' },
    ],
  },
  {
    id: 'lo2',
    mode: 'teach',
    title: 'What you will be able to do',
    chip: true,
    bullets: OBJECTIVES,
    loDone: 2,
    loCelebrate: 1,
    slot: 'chat',
    cue: 'correct',
    milestone: true,
    msgs: [
      { who: 'vyom', text: 'Two down! You now understand how its area relates to shapes you already know.' },
    ],
  },
  {
    id: 'video',
    mode: 'video',
    title: 'Watch and learn',
    slot: 'chat',
    flags: { isWaiting: true },
    msgs: [
      { who: 'vyom', text: 'Let’s explore how to find the area of a trapezoid. Watch the video to see how the shape is changed to help find the area.' },
    ],
  },
  {
    id: 'outro',
    mode: 'teach',
    title: 'Module complete!',
    chip: true,
    outro: true,
    bullets: OBJECTIVES,
    loDone: 3,
    loCelebrate: 2,
    slot: 'learn',
    cue: 'celebrate',
    milestone: true,
    msgs: [
      { who: 'vyom', text: "You did it, {name}! Let's recap. First — a trapezoid has one pair of parallel sides." },
      { who: 'vyom', text: 'Second — its area depends on the two parallel sides and the height.' },
      { who: 'vyom', text: 'And finally — the area is ½ × (a + b) × h square units. Great work today!' },
    ],
  },
];

export const STEP_INDEX: Record<string, number> = Object.fromEntries(
  STEPS.map((step, index) => [step.id, index]),
);

/** Steps that pay out rewards, in order — these are the dots on the track. */
export const MILESTONES = STEPS.map((s, i) => (s.milestone ? i : -1)).filter((i) => i >= 0);

export const REWARD = { xp: 20, orbs: 1 };

/**
 * The classes the home page offers to resume.
 *
 * Verbatim from `RESUME_CLASSES` in the design's `app-cosmos.js`. Both cards
 * open the teaching room, which is what the design does too — its own
 * `onClick` is `openTeachingRoom()` for every tile.
 */
export interface LessonCard {
  id: string;
  /** Chapter name, shown small above the title. */
  chapter: string;
  /** The class itself. */
  title: string;
  /** Tabler icon name for the tile's badge. */
  icon: string;
}

export const LESSONS: LessonCard[] = [
  { id: 'fractions', chapter: 'Fractions & Decimals', title: 'Adding unlike denominators', icon: 'math-symbols' },
  { id: 'integers', chapter: 'Integers', title: 'Multiplication & division', icon: 'divide' },
];

/** The goal statement in the top chrome — `GOAL_HOME` in the design. */
export const GOAL = { pct: 68, label: 'of scoring 90%+ in the year-end exam' };

/** Header counters, as the design ships them. */
export const STATS = { stars: 4820, orbs: 32 };

/** Orbiting icon rings behind the mascot, outermost last. */
export const HERO_RINGS = [
  ['plus', 'divide', 'percentage'],
  ['math-function', 'math-pi', 'square-root-2'],
  ['atom-2', 'flask', 'calculator'],
];

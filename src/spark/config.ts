import type { PropertyMeta } from '../vyom/types';

/**
 * Everything the runtime needs to find Spark inside its .riv file.
 *
 * Same contract as `RIVE_CONFIG`: names are candidates in priority order, the
 * first one actually present in the file wins, and a miss degrades to a console
 * warning plus a sensible fallback rather than a blank canvas. Nothing else in
 * the app hardcodes these names.
 */
export const SPARK_CONFIG = {
  src: '/sparkrigfinalallanimations.riv',
  artboardCandidates: ['Spark'],
  /** The machine's entry state is Spark's default idle. */
  stateMachineCandidates: ['Spark', 'SparkRender'],
  viewModel: 'SparkAnimationControls',
} as const;

/**
 * Grouping and slider ranges for Spark's ViewModel properties.
 *
 * Like Vyom's `PROPERTY_META`, this only decides which heading a property sits
 * under and what range a number scrubs over. Controls are generated from the
 * ViewModel's *actual* properties at runtime, so a property missing from this
 * map still gets a working control — it just lands under "Unsorted". Adding a
 * trigger in Rive therefore needs no code change here.
 */
export const SPARK_PROPERTY_META: Record<string, PropertyMeta> = {
  flyIn: { group: 'presence' },
  flyOut: { group: 'presence' },
  idleVariant: { group: 'presence', min: 0, max: 5, step: 1 },
  activeness: { group: 'presence', min: 0, max: 100, step: 1 },

  isSpeaking: { group: 'communication' },
  isCurious: { group: 'communication' },
  isConfused: { group: 'communication' },

  delighted: { group: 'feedback' },
  surprised: { group: 'feedback' },
  ahaGlow: { group: 'feedback' },

  point: { group: 'gesture' },
  pointVariant: { group: 'gesture', min: 0, max: 3, step: 1 },
  pointToSpark: { group: 'gesture' },
  sparkToPoint: { group: 'gesture' },

  moveToPoint: { group: 'position' },
  moveToX: { group: 'position', min: -2000, max: 4000, step: 1 },
  moveToY: { group: 'position', min: -2000, max: 4000, step: 1 },

  isLookingAtPoint: { group: 'gaze' },
  lookAtX: { group: 'gaze', min: -2000, max: 4000, step: 1 },
  lookAtY: { group: 'gaze', min: -2000, max: 4000, step: 1 },
  lookUp: { group: 'gaze' },
  lookDown: { group: 'gaze' },
  lookLeft: { group: 'gaze' },
  lookRight: { group: 'gaze' },

  height: { group: 'appearance', min: 0, max: 400, step: 1 },
};

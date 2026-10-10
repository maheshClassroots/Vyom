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
  src: '/sparkanimations.riv',
  artboardCandidates: ['Spark'],
  /** The machine's entry state is Spark's default idle. */
  stateMachineCandidates: ['SparkCharacter'],
  viewModel: 'SparkAnimationControls',
  /**
   * Like Vyom, Spark's artboard is screen-sized and drawn with Fit.Layout: it
   * is resized to the canvas rather than scaled into it, so 1 artboard unit is
   * 1 CSS pixel at a scale factor of 1.
   */
  layoutScaleFactor: 1,
} as const;

/**
 * Properties the ViewModel computes for itself. Hidden from the control panel
 * and never written — the counterpart of Vyom's `xref`/`yref`.
 */
export const SPARK_INTERNAL_PROPERTIES = new Set(['positionXRef', 'positionYRef']);

/**
 * Real ViewModel properties deliberately left out of the control panel
 * because this app does not use them. They still exist on the artboard.
 */
export const SPARK_HIDDEN_PROPERTIES = new Set(['activeness']);

/**
 * Grouping and slider ranges for Spark's ViewModel properties.
 *
 * Like Vyom's `PROPERTY_META`, this only decides which heading a property sits
 * under and what range a number scrubs over. Controls are generated from the
 * ViewModel's *actual* properties at runtime, so a property missing from this
 * map still gets a working control — it just lands under "Unsorted".
 */
export const SPARK_PROPERTY_META: Record<string, PropertyMeta> = {
  // Entrance, exit and placement live together: they are what decides where
  // Spark is on screen.
  flyIn: { group: 'position' },
  flyOut: { group: 'position' },
  moveToPoint: { group: 'position' },
  sparkPositionX: { group: 'position', min: -2000, max: 4000, step: 1 },
  sparkPositionY: { group: 'position', min: -2000, max: 4000, step: 1 },
  chatPositionX: { group: 'position', min: -2000, max: 4000, step: 1 },
  chatPositionY: { group: 'position', min: -2000, max: 4000, step: 1 },

  // The module beats, mirroring Vyom's: the file now carries the same three
  // triggers, so Spark can react to a lesson loading alongside him.
  moduleStart: { group: 'navigation' },
  moduleStartLoaded: { group: 'navigation' },
  moduleComplete: { group: 'navigation' },

  isSpeaking: { group: 'communication' },
  // Mouth openness while speaking. Spelled correctly here, unlike Vyom's
  // `speakAmplitute`; the same 0–100 range.
  speakAmplitude: { group: 'communication', min: 0, max: 100, step: 1 },
  expression: { group: 'feedback' },

  lookLT: { group: 'gaze' },
  lookRT: { group: 'gaze' },
  lookLB: { group: 'gaze' },
  lookRB: { group: 'gaze' },
};

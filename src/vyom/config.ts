import type { PropertyGroupId, SlotDefinition, PropertyMeta } from './types';

/**
 * Everything the runtime needs to find the character inside the .riv file.
 * Nothing else in the app hardcodes these names.
 */
export const RIVE_CONFIG = {
  src: '/vyom_Latest_updated.riv',
  /**
   * Artboards to try, in priority order — the first one actually present in the
   * file wins. A rename in Rive is a one-line change here, and a name that is
   * absent degrades to a clear console warning plus the file's default artboard
   * instead of a blank canvas.
   */
  artboardCandidates: ['VyomCanvas', 'MasterCanvas'],
  stateMachine: 'Canvas',
  viewModel: 'MasterCanvas',
  /**
   * With Fit.layout the artboard is resized to the canvas instead of being
   * scaled into it, so 1 artboard unit === 1 CSS pixel at a scale factor of 1.
   * That is what lets us feed raw DOM coordinates straight into the slot
   * position properties.
   * Raise this to render the artboard's layout at a larger base size.
   */
  layoutScaleFactor: 1,
} as const;

/**
 * ---------------------------------------------------------------------------
 * Position slots — the extension point for "where can Vyom stand?"
 * ---------------------------------------------------------------------------
 * A slot pairs a DOM region with the ViewModel number properties that carry
 * its coordinates, plus the trigger that sends Vyom there.
 *
 * To support a new destination (say a toolbar or a quiz overlay), add one
 * entry here and drop a `useVyomAnchor('toolbar')` ref on the element.
 * No other file changes — the dev panel, the move API and the coordinate
 * plumbing all read from this map.
 */
export const STAGE_SLOTS = {
  learn: {
    id: 'learn',
    label: 'Learning Canvas',
    xProperty: 'learnWindowX',
    yProperty: 'learnWindowY',
    enterTrigger: 'chatToLearn',
  },
  chat: {
    id: 'chat',
    label: 'Chat Window',
    xProperty: 'chatposX',
    yProperty: 'chatposY',
    enterTrigger: 'learntoChat',
  },
} as const satisfies Record<string, SlotDefinition>;

/**
 * Properties the ViewModel computes for itself. They are hidden from the test
 * panel and never written: `xref`/`yref` are the artboard's internal reference
 * point, not inputs.
 */
export const INTERNAL_PROPERTIES = new Set(['xref', 'yref']);

export const SLOT_LIST = Object.values(STAGE_SLOTS) as SlotDefinition[];

/** Slot Vyom occupies on first paint. */
export const DEFAULT_SLOT = 'learn';

/**
 * ---------------------------------------------------------------------------
 * Presentation metadata — grouping and ranges only.
 * ---------------------------------------------------------------------------
 * Controls are labelled with the ViewModel's own property names, verbatim, so
 * what you click in the panel is what you call in Rive. This map only decides
 * which heading a property sits under and what range a number scrubs over.
 * Controls are generated from the ViewModel's *actual* properties at runtime,
 * so a property missing from this map still gets a working control (it just
 * lands in the "Unsorted" group). This map only decides labelling and order,
 * which means new Rive properties never break existing wiring.
 */
export const PROPERTY_GROUPS: Record<PropertyGroupId, { label: string; order: number }> = {
  navigation: { label: 'Navigation', order: 0 },
  position: { label: 'Position', order: 1 },
  presence: { label: 'Presence', order: 2 },
  communication: { label: 'Communication', order: 3 },
  feedback: { label: 'Feedback', order: 4 },
  gesture: { label: 'Gesture', order: 5 },
  gaze: { label: 'Gaze', order: 6 },
  appearance: { label: 'Appearance', order: 7 },
  unsorted: { label: 'Unsorted', order: 99 },
};

export const PROPERTY_META: Record<string, PropertyMeta> = {
  chatToLearn: { group: 'navigation' },
  learntoChat: { group: 'navigation' },

  learnWindowX: { group: 'position', min: -2000, max: 4000, step: 1 },
  learnWindowY: { group: 'position', min: -2000, max: 4000, step: 1 },
  chatposX: { group: 'position', min: -2000, max: 4000, step: 1 },
  chatposY: { group: 'position', min: -2000, max: 4000, step: 1 },

  appear: { group: 'presence' },
  disappear: { group: 'presence' },
  isWaiting: { group: 'presence' },
  idleVariant: { group: 'presence', min: 0, max: 5, step: 1 },

  isListening: { group: 'communication' },
  isThinking: { group: 'communication' },
  isSpeaking: { group: 'communication' },
  isTyping: { group: 'communication' },
  typingPos: { group: 'communication', min: 0, max: 5, step: 1 },
  present: { group: 'communication' },

  correct: { group: 'feedback' },
  wrong: { group: 'feedback' },
  celebrate: { group: 'feedback' },
  acknowledge: { group: 'feedback' },

  point: { group: 'gesture' },
  pointDir: { group: 'gesture', min: 0, max: 7, step: 1 },
  pivot: { group: 'gesture' },

  isLookingAtPoint: { group: 'gaze' },
  lookAtX: { group: 'gaze', min: -2000, max: 4000, step: 1 },
  lookAtY: { group: 'gaze', min: -2000, max: 4000, step: 1 },

  isDarkMode: { group: 'appearance' },
};

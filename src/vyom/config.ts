import type { PropertyGroupId, SlotDefinition, PropertyMeta } from './types';

/**
 * Everything the runtime needs to find the character inside the .riv file.
 * Nothing else in the app hardcodes these names.
 */
export const RIVE_CONFIG = {
  src: '/vyom_Latest_updated2.riv',
  /**
   * Artboards to try, in priority order — the first one actually present in the
   * file wins. A rename in Rive is a one-line change here, and a name that is
   * absent degrades to a clear console warning plus the file's default artboard
   * instead of a blank canvas.
   */
  artboardCandidates: ['VyomCanvas', 'MasterCanvas'],
  stateMachine: 'Canvas',
  /** Renamed from `MasterCanvas` in the current file. */
  viewModel: 'VyomControls',
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
 * Whether the app drives the character on its own.
 *
 * With this off, the runtime loads the artboard and keeps the slot
 * coordinates bound — and does nothing else. No entrance, no opening
 * `appear`, no step cues, no held booleans: every trigger and flag the app
 * would normally fire is skipped, so the only motion on screen is whatever
 * the artboard does by itself.
 *
 * The control panel is unaffected — it writes to the ViewModel directly, so
 * everything can still be driven by hand. Turn this back on once the trigger
 * sequence is settled.
 */
export const AUTO_DRIVE_ENABLED = false;

/**
 * The one trigger fired without being asked for by a click: Vyom's entrance.
 *
 * Deliberately its own setting rather than something `AUTO_DRIVE_ENABLED`
 * covers. That gate turns off the app driving the character by itself — the
 * step cues, the held flags, the opening move — and it stays off. This is a
 * single named beat, so it is spelled out here and fired by one effect, rather
 * than reopening the gate and getting everything else back with it.
 *
 * Set to null for a character who does nothing at all until something asks.
 */
export const LOAD_TRIGGER: string | null = 'appear';

/**
 * Values the artboard computes for itself — Rive's internal wiring.
 *
 * The app must never write these. They are still worth seeing, because they
 * say what the artboard currently thinks, so the panel lists them in their own
 * read-only section instead of hiding them or offering a control.
 */
export const READ_ONLY_PROPERTIES = new Set([
  'actionPlaying',
  'vyomVisible',
  'xref',
  'yref',
  'refPosX',
  'refPosY',
]);

export const SLOT_LIST = Object.values(STAGE_SLOTS) as SlotDefinition[];

/**
 * The slot a coordinate property belongs to, or undefined for anything else.
 *
 * Anything writing `learnWindowX/Y` or `chatposX/Y` by hand needs to know it
 * is writing into a slot: the layout owns those four numbers and overwrites
 * them on the next anchor or resize pass, so a hand-written value only
 * survives once the slot is taken off automatic.
 */
export function slotForProperty(name: string): SlotDefinition | undefined {
  return SLOT_LIST.find((slot) => slot.xProperty === name || slot.yProperty === name);
}

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
  moduleStart: { group: 'navigation' },
  moduleStartLoaded: { group: 'navigation' },
  moduleComplete: { group: 'navigation' },
  moveToPoint: { group: 'navigation' },

  learnWindowX: { group: 'position', min: -2000, max: 4000, step: 1 },
  learnWindowY: { group: 'position', min: -2000, max: 4000, step: 1 },
  chatposX: { group: 'position', min: -2000, max: 4000, step: 1 },
  chatposY: { group: 'position', min: -2000, max: 4000, step: 1 },

  appear: { group: 'presence' },
  disappear: { group: 'presence' },
  isWaiting: { group: 'presence' },
  vyomVisible: { group: 'presence' },
  actionPlaying: { group: 'presence' },
  scaleFull: { group: 'presence' },
  scaleSmall: { group: 'presence' },

  isListening: { group: 'communication' },
  isThinking: { group: 'communication' },
  isSpeaking: { group: 'communication' },
  isTyping: { group: 'communication' },
  typingPos: { group: 'communication', min: 0, max: 5, step: 1 },
  present: { group: 'communication' },
  mouthPhoneme: { group: 'communication' },
  // Mouth openness while speaking. Range unconfirmed — see the note in the
  // handover; 0–100 matches the only other amplitude-style number in the app.
  speakAmplitute: { group: 'communication', min: 0, max: 100, step: 1 },

  correct: { group: 'feedback' },
  wrong: { group: 'feedback' },
  celebrate: { group: 'feedback' },
  acknowledge: { group: 'feedback' },
  emotion: { group: 'feedback' },

  pointUp: { group: 'gesture' },
  pointDown: { group: 'gesture' },
  pointLeft: { group: 'gesture' },
  pointRight: { group: 'gesture' },
  pivot: { group: 'gesture' },

  isLookingAtPoint: { group: 'gaze' },
  lookAtX: { group: 'gaze', min: -2000, max: 4000, step: 1 },
  lookAtY: { group: 'gaze', min: -2000, max: 4000, step: 1 },

  isDarkMode: { group: 'appearance' },
};

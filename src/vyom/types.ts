import type { DataType } from '@rive-app/react-canvas';
import type { STAGE_SLOTS } from './config';

export type SlotId = keyof typeof STAGE_SLOTS;

/** Describes one place Vyom can stand, and the ViewModel keys that drive it. */
export interface SlotDefinition {
  id: string;
  label: string;
  /** ViewModel number property holding the X coordinate, in artboard units. */
  xProperty: string;
  /** ViewModel number property holding the Y coordinate, in artboard units. */
  yProperty: string;
  /** Optional ViewModel trigger fired when Vyom should travel to this slot. */
  enterTrigger?: string;
}

export type PropertyGroupId =
  | 'navigation'
  | 'position'
  | 'presence'
  | 'communication'
  | 'feedback'
  | 'gesture'
  | 'gaze'
  | 'appearance'
  | 'unsorted';

export interface PropertyMeta {
  group: PropertyGroupId;
  min?: number;
  max?: number;
  step?: number;
}

/** A ViewModel property discovered at runtime, decorated with display metadata. */
export interface VyomProperty {
  name: string;
  type: `${DataType}`;
  group: PropertyGroupId;
  meta: PropertyMeta;
  /** True when the value is written by the layout, not by a human. */
  isSlotDriven: boolean;
  /** True for values the ViewModel computes for itself (`xref`/`yref`). */
  isInternal: boolean;
}

export interface Point {
  x: number;
  y: number;
}

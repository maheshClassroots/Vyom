import type { VyomProperty } from '../types';

/** Which character a dragged control belongs to. */
export type SequenceCharacter = 'vyom' | 'spark';

/**
 * What a control carries when dragged into the sequencer.
 *
 * The character travels with the payload so a lane can refuse a control that
 * belongs to the other one: a Spark property means nothing to Vyom's
 * ViewModel, and silently accepting it would build a sequence that does
 * nothing at play time.
 */
export interface SequenceDragPayload {
  character: SequenceCharacter;
  name: string;
  type: VyomProperty['type'];
}

/**
 * Custom MIME type, so a drop area can tell a dragged control from any other
 * dragged thing (text, a file) before accepting it.
 */
export const SEQUENCE_DRAG_TYPE = 'application/x-rive-control';

export function writeDragPayload(event: React.DragEvent, payload: SequenceDragPayload) {
  event.dataTransfer.setData(SEQUENCE_DRAG_TYPE, JSON.stringify(payload));
  event.dataTransfer.effectAllowed = 'copy';
}

export function readDragPayload(event: React.DragEvent): SequenceDragPayload | null {
  const raw = event.dataTransfer.getData(SEQUENCE_DRAG_TYPE);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SequenceDragPayload;
  } catch {
    return null;
  }
}

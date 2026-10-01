import type { ReactNode } from 'react';
import type { VyomProperty } from '../types';
import { writeDragPayload, type SequenceCharacter } from './sequenceDrag';

interface DragGripProps {
  character: SequenceCharacter;
  name: string;
  type: VyomProperty['type'];
  /** Overrides the default tooltip — used where the drag has a caveat. */
  title?: string;
}

/**
 * The handle that carries a property into the sequencer.
 *
 * Split out from `DraggableControl` because not every draggable property is
 * laid out as a control row: the slot coordinates are a read-out pair rather
 * than a slider, and they need the same grip without the wrapper.
 */
export function DragGrip({ character, name, type, title }: DragGripProps) {
  return (
    <span
      className="ctrl-row__grip"
      draggable
      onDragStart={(event) => writeDragPayload(event, { character, name, type })}
      title={title ?? `Drag ${name} into the sequencer`}
      aria-hidden="true"
    >
      ⠿
    </span>
  );
}

interface DraggableControlProps {
  property: VyomProperty;
  character: SequenceCharacter;
  children: ReactNode;
}

/**
 * Wraps a control with a grip that can be dragged into the sequencer.
 *
 * Only the grip is draggable, not the control: marking the row itself
 * draggable would fight the inputs inside it — a range slider in particular
 * starts a drag instead of scrubbing.
 */
export function DraggableControl({ property, character, children }: DraggableControlProps) {
  return (
    <div className="ctrl-row">
      <DragGrip character={character} name={property.name} type={property.type} />
      {children}
    </div>
  );
}

import type { ReactNode } from 'react';
import type { ViewModelInstance } from '@rive-app/react-canvas';
import type { PositionBlockDefinition, Point, VyomProperty } from '../types';
import { DragGrip, DraggableControl } from './DraggableControl';
import { NumberControl } from './PropertyControl';
import type { SequenceCharacter } from './sequenceDrag';

/**
 * Vyom's slots, as the panel needs them: the layout writes two of the
 * coordinate pairs from the DOM, so moving one by hand has to take its slot
 * off automatic or the next anchor or resize pass writes the layout back over
 * it.
 */
export interface SlotApi {
  positions: Record<string, Point>;
  manual: Record<string, boolean>;
  setManual: (slotId: string, manual: boolean) => void;
  setPosition: (slotId: string, point: Point) => void;
}

interface PositionGroupProps {
  title?: string;
  blocks: PositionBlockDefinition[];
  properties: VyomProperty[];
  vmi: ViewModelInstance | null;
  character: SequenceCharacter;
  /** The panel's filter text: a block shows when it, its title or its notes match. */
  query: string;
  slots?: SlotApi;
  /** Rows above the blocks (Spark's flyIn / flyOut / moveToPoint buttons) and below them. */
  before?: ReactNode;
  after?: ReactNode;
}

/**
 * The panel's Positioning group: each pair of coordinates under a title, with
 * what it is for written beneath — which value to hook to what, and which
 * trigger to follow it with.
 *
 * Shared by Vyom's panel and Spark's, because they read the same way: the
 * pairs differ, the layout does not.
 */
export function PositionGroup({ title = 'Positioning', blocks, properties, vmi, character, query, slots, before, after }: PositionGroupProps) {
  const needle = query.trim().toLowerCase();
  const byName = new Map(properties.map((property) => [property.name, property]));

  const shown = blocks.filter((block) => {
    const x = byName.get(block.x);
    const y = byName.get(block.y);
    if (!x && !y) return false;
    if (!needle) return true;
    return [block.title, block.x, block.y, ...block.notes].some((text) => text.toLowerCase().includes(needle));
  });
  if (shown.length === 0 && !before && !after) return null;

  return (
    <section className="devpanel__section">
      <h3>{title}</h3>
      {before}
      <div className="posblocks">
        {shown.map((block) => (
          <PositionBlock
            key={block.title}
            block={block}
            x={byName.get(block.x)}
            y={byName.get(block.y)}
            vmi={vmi}
            character={character}
            slots={block.slotId ? slots : undefined}
          />
        ))}
      </div>
      {after}
    </section>
  );
}

interface PositionBlockProps {
  block: PositionBlockDefinition;
  x: VyomProperty | undefined;
  y: VyomProperty | undefined;
  vmi: ViewModelInstance | null;
  character: SequenceCharacter;
  slots?: SlotApi;
}

function PositionBlock({ block, x, y, vmi, character, slots }: PositionBlockProps) {
  const slotId = slots ? block.slotId : undefined;
  const isManual = slotId ? Boolean(slots?.manual[slotId]) : false;

  return (
    <div className="posblock">
      <div className="posblock__head">
        <h4>{block.title}</h4>
        {slots && slotId && (
          <label className="slot__manual" title="Hold the value you set, instead of the layout writing it from the page">
            <input type="checkbox" checked={isManual} onChange={(event) => slots.setManual(slotId, event.target.checked)} />
            manual
          </label>
        )}
      </div>
      <code className="posblock__props">
        [{block.x}, {block.y}]
      </code>

      {([x, y] as const).map((property, axis) =>
        !property ? null : slots && slotId ? (
          <SlotCoordinate
            key={property.name}
            property={property}
            character={character}
            value={(axis === 0 ? slots.positions[slotId]?.x : slots.positions[slotId]?.y) ?? 0}
            onChange={(next) => {
              if (!isManual) slots.setManual(slotId, true);
              const point = slots.positions[slotId] ?? { x: 0, y: 0 };
              slots.setPosition(slotId, axis === 0 ? { ...point, x: next } : { ...point, y: next });
            }}
          />
        ) : (
          <DraggableControl key={property.name} property={property} character={character}>
            <NumberControl property={property} vmi={vmi} />
          </DraggableControl>
        ),
      )}

      <ul className="posblock__notes">
        {block.notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </div>
  );
}

interface SlotCoordinateProps {
  property: VyomProperty;
  character: SequenceCharacter;
  value: number;
  onChange: (next: number) => void;
}

/**
 * One coordinate of a slot pair. Its value is the slot's own (the layout's
 * reading), not what the artboard last reported, because the layout writes
 * these through the binder and the artboard raises no change event for that.
 */
function SlotCoordinate({ property, character, value, onChange }: SlotCoordinateProps) {
  const { min = -2000, max = 4000, step = 1 } = property.meta;
  return (
    <div className="ctrl-row">
      <DragGrip
        character={character}
        name={property.name}
        type={property.type}
        title={`Drag ${property.name} into the sequencer — playing it takes the slot off automatic`}
      />
      <div className="ctrl ctrl--number">
        <div className="ctrl__row">
          <span className="ctrl__label">{property.name}</span>
          <span className="ctrl__value">{Math.round(value)}</span>
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
        />
      </div>
    </div>
  );
}

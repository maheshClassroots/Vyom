import { useVyom } from '../hooks';
import { SLOT_LIST } from '../config';
import type { SlotId } from '../types';
import { DragGrip } from './DraggableControl';

/**
 * Position read-out per slot. Coordinates are normally derived from the DOM;
 * flipping a slot to manual suspends that and lets you scrub the raw values,
 * which is the quickest way to check the artboard's reachable area.
 */
export function SlotControls() {
  const { activeSlot, moveTo, slotPositions, manualSlots, setSlotManual, setSlotPosition } =
    useVyom();

  return (
    <div className="slots">
      {SLOT_LIST.map((slot) => {
        const point = slotPositions[slot.id] ?? { x: 0, y: 0 };
        const isManual = Boolean(manualSlots[slot.id]);
        const isActive = activeSlot === slot.id;

        return (
          <div key={slot.id} className={`slot${isActive ? ' slot--active' : ''}`}>
            <div className="slot__head">
              <button
                type="button"
                className="slot__go"
                onClick={() => moveTo(slot.id as SlotId)}
                disabled={!slot.enterTrigger}
              >
                {slot.label}
              </button>
              <label className="slot__manual">
                <input
                  type="checkbox"
                  checked={isManual}
                  onChange={(event) => setSlotManual(slot.id, event.target.checked)}
                />
                manual
              </label>
            </div>

            {/* Each coordinate carries a grip, so a position can be dropped
                into the sequencer as a step like any other property. Playing
                such a step flips this slot to manual — otherwise the next
                anchor or resize pass would write the DOM position straight
                back over it. */}
            <div className="slot__coords">
              {([slot.xProperty, slot.yProperty] as const).map((name, axis) => (
                <code key={name} className="slot__coord">
                  <DragGrip
                    character="vyom"
                    name={name}
                    type="number"
                    title={`Drag ${name} into the sequencer — playing it switches ${slot.label} to manual`}
                  />
                  {name} {Math.round(axis === 0 ? point.x : point.y)}
                </code>
              ))}
            </div>

            {isManual && (
              <div className="slot__sliders">
                <input
                  type="range"
                  min={0}
                  max={window.innerWidth}
                  value={point.x}
                  onChange={(event) =>
                    setSlotPosition(slot.id, { ...point, x: Number(event.target.value) })
                  }
                />
                <input
                  type="range"
                  min={0}
                  max={window.innerHeight}
                  value={point.y}
                  onChange={(event) =>
                    setSlotPosition(slot.id, { ...point, y: Number(event.target.value) })
                  }
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

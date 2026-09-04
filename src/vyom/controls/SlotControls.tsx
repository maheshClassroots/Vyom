import { useVyom } from '../hooks';
import { SLOT_LIST } from '../config';
import type { SlotId } from '../types';

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

            <div className="slot__coords">
              <code>
                {slot.xProperty} {Math.round(point.x)}
              </code>
              <code>
                {slot.yProperty} {Math.round(point.y)}
              </code>
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

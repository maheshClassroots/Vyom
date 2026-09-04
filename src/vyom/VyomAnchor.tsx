import { useVyomAnchor } from './hooks';
import type { SlotId } from './types';

interface VyomAnchorProps {
  slot: SlotId;
  /** Horizontal position inside the parent, as a CSS length or percentage. */
  x?: string;
  /** Vertical position inside the parent, as a CSS length or percentage. */
  y?: string;
  /** Draws the anchor point — handy while positioning, off in production. */
  debug?: boolean;
}

/**
 * A zero-size marker positioned with plain CSS. Because the coordinates handed
 * to Rive are measured from the DOM, responsiveness comes for free: percentages,
 * clamp(), grid placement and container queries all work unmodified.
 */
export function VyomAnchor({ slot, x = '50%', y = '50%', debug = false }: VyomAnchorProps) {
  const ref = useVyomAnchor(slot);

  return (
    <div
      ref={ref}
      className={`vyom-anchor${debug ? ' vyom-anchor--debug' : ''}`}
      style={{ left: x, top: y }}
      data-slot={slot}
      aria-hidden="true"
    />
  );
}

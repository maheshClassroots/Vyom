import { useContext, type CSSProperties } from 'react';
import { useSpark } from '../spark/hooks';
import { SparkRiveComponentContext } from '../spark/SparkRiveComponentContext';

interface SparkRiveProps {
  size: number;
  style?: CSSProperties;
}

/**
 * Where Spark draws on the page.
 *
 * The Rive instance itself belongs to `SparkProvider`, the same way Vyom's
 * belongs to `VyomProvider` — that is what lets the control panel drive the
 * character from outside the room. This component only places the canvas and
 * plays no part in loading it.
 *
 * Unlike Vyom, Spark is a small inline element rather than a full-screen
 * overlay, so the box is a fixed square in the flow of the layout and the
 * artboard is scaled into it with `Fit.Contain`.
 *
 * The box is rendered even when the artboard is missing, so a load failure
 * leaves a gap rather than reflowing the title beside it.
 */
export function SparkRive({ size, style }: SparkRiveProps) {
  const RiveComponent = useContext(SparkRiveComponentContext);
  const { loadError } = useSpark();

  return (
    // No CSS motion here: every visual change is the artboard's own. The float
    // that used to sit on the prototype's PNG is the state machine's job now.
    <div
      aria-hidden="true"
      style={{ width: size, height: size, flex: 'none', pointerEvents: 'none', ...style }}
    >
      {RiveComponent && !loadError && <RiveComponent />}
    </div>
  );
}

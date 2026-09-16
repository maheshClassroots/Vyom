import type { CSSProperties } from 'react';

interface SparkRiveProps {
  size: number;
  style?: CSSProperties;
}

/**
 * The spot Spark used to occupy inline in the room.
 *
 * Spark is now drawn on a full-viewport stage (`SparkStage`) and positioned by
 * his artboard's own ViewModel coordinates, so nothing renders here. The box
 * is kept, at its original size, so the title and outro layouts around it do
 * not reflow — and so it can become a position anchor later without another
 * layout change.
 */
export function SparkRive({ size, style }: SparkRiveProps) {
  return (
    <div
      aria-hidden="true"
      style={{ width: size, height: size, flex: 'none', pointerEvents: 'none', ...style }}
    />
  );
}

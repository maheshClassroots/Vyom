import { Alignment, Fit, Layout, useRive } from '@rive-app/react-canvas';
import type { CSSProperties } from 'react';
import { embeddedRive } from '../vyom/embedded';

/**
 * The Spark mascot, rendered from `spark_placeholder.riv`.
 *
 * Replaces the prototype's static PNG. It plays the default animation of the
 * `Spark` state machine and carries no CSS motion of its own — the float that
 * used to sit on the image is the artboard's job now.
 *
 * Unlike Vyom, Spark is a small inline element rather than a full-screen
 * overlay, so it uses `Fit.Contain` inside whatever box it is given rather
 * than resizing its artboard to the canvas.
 */
const SPARK_SRC = '/spark_placeholder.riv';
const SPARK_STATE_MACHINE = 'Spark';

interface SparkRiveProps {
  size: number;
  style?: CSSProperties;
}

export function SparkRive({ size, style }: SparkRiveProps) {
  const embedded = embeddedRive(SPARK_SRC);
  const { RiveComponent } = useRive({
    ...(embedded ? { buffer: embedded } : { src: SPARK_SRC }),
    stateMachines: SPARK_STATE_MACHINE,
    autoplay: true,
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
  });

  return (
    <div
      aria-hidden="true"
      style={{ width: size, height: size, flex: 'none', pointerEvents: 'none', ...style }}
    >
      <RiveComponent />
    </div>
  );
}

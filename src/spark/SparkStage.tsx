import { useContext } from 'react';
import { useSpark } from './hooks';
import { SparkRiveComponentContext } from './SparkRiveComponentContext';

/**
 * The full-viewport canvas Spark lives on — the counterpart of `VyomStage`.
 *
 * Spark's artboard is screen-sized and drawn with Fit.Layout, so he is placed
 * within it by the ViewModel's own position properties rather than by a DOM
 * box. The layer ignores pointer events so the UI underneath stays usable.
 *
 * No `ref` goes on `RiveComponent`: it manages its own canvas and container
 * refs, and overriding them stops the runtime from booting.
 */
export function SparkStage() {
  const RiveComponent = useContext(SparkRiveComponentContext);
  const { loadError } = useSpark();

  if (loadError) {
    return (
      <div className="spark-stage spark-stage--error" role="alert">
        {loadError}
      </div>
    );
  }

  if (!RiveComponent) return null;

  return (
    <div className="spark-stage" aria-hidden="true">
      <RiveComponent className="spark-stage__canvas" />
    </div>
  );
}

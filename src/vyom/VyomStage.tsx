import { useContext } from 'react';
import { RiveComponentContext } from './RiveComponentContext';
import { useVyom } from './hooks';

/**
 * The single full-viewport canvas Vyom lives on.
 *
 * One artboard spans the whole app rather than one canvas per region, which is
 * what lets the character travel between the chat window and the content canvas
 * as a continuous animation instead of a hand-off between two players.
 *
 * The layer ignores pointer events so the UI underneath stays interactive.
 * Note: no `ref` is attached to `RiveComponent` — it manages its own canvas and
 * container refs internally, and overriding them stops the runtime from booting.
 */
export function VyomStage() {
  const RiveComponent = useContext(RiveComponentContext);
  const { loadError, stageOffset } = useVyom();

  if (loadError) {
    return (
      <div className="vyom-stage vyom-stage--error" role="alert">
        {loadError}
      </div>
    );
  }

  if (!RiveComponent) return null;

  return (
    // No CSS transitions or opacity here: every visual change to the character
    // is the artboard's own, driven by ViewModel triggers. Hiding him for the
    // opening move is `disappear`, not a fade on this element. The one CSS
    // property is the offset: a translate, so the stage can track a scrolling
    // page frame for frame — and, when asked, ease back to rest in step with
    // a walk the artboard is playing at the same time.
    <div
      className="vyom-stage"
      aria-hidden="true"
      style={
        stageOffset
          ? {
              transform: `translate(${stageOffset.x}px, ${stageOffset.y}px)`,
              transition: stageOffset.easeMs ? `transform ${stageOffset.easeMs}ms cubic-bezier(0.4, 0, 0.2, 1)` : undefined,
            }
          : undefined
      }
    >
      <RiveComponent className="vyom-stage__canvas" />
    </div>
  );
}

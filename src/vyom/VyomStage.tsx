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
  const { loadError } = useVyom();

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
    // opening move is `disappear`, not a fade on this element.
    <div className="vyom-stage" aria-hidden="true">
      <RiveComponent className="vyom-stage__canvas" />
    </div>
  );
}

import { useState } from 'react';
import { useDraggable } from '../vyom/controls/useDraggable';

type Action = 'reveal' | 'step' | 'reset' | 'zero' | 'demo' | 'stop';

/**
 * Development surface for the Goals Journey's progress card — the hybrid of
 * the page's own count and the goal-path illustration (GoalPath.riv). Built
 * like the Vyom and Spark buttons: collapsed to a draggable button, opening
 * into a small floating panel.
 *
 * The card lives inside the hosted page's frame, so each button posts a
 * message to it; `goal-path-rive.js` there changes the chapter counts, asks
 * the page to re-render, and the new percentage on the card moves the marker.
 */
export function GoalPathDevPanel() {
  const [open, setOpen] = useState(false);
  const button = useDraggable('goalpath-button');
  const panel = useDraggable('goalpath-panel');

  const send = (action: Action) => {
    const frame = document.querySelector<HTMLIFrameElement>('iframe.design__frame');
    frame?.contentWindow?.postMessage({ type: 'goal-path', action }, window.location.origin);
  };

  if (!open) {
    return (
      <button
        type="button"
        className="devpanel__reopen devpanel__reopen--goal"
        onClick={() => setOpen(true)}
        {...button.collapsedProps}
      >
        Progress demo
      </button>
    );
  }

  return (
    <aside className="goalpanel" {...panel.hostProps}>
      <header className="devpanel__head goalpanel__head" {...panel.handleProps}>
        <div>
          <h2>Progress demo</h2>
          <p className="devpanel__status devpanel__status--ok">GoalPath.riv · the goal page's progress card</p>
        </div>
        <button type="button" className="devpanel__close" onClick={() => setOpen(false)}>
          ×
        </button>
      </header>
      <div className="goalpanel__grid">
        <button type="button" className="ctrl--trigger" onClick={() => send('demo')} title="Start from zero, reveal the hill, then add a topic at a time to the summit">
          Run demo
        </button>
        <button type="button" className="ctrl--trigger" onClick={() => send('stop')}>
          Stop
        </button>
        <button type="button" className="ctrl--trigger" onClick={() => send('reveal')} title="Replay showMountain, then move the marker to the current count">
          Reveal again
        </button>
        <button type="button" className="ctrl--trigger" onClick={() => send('step')} title="One more topic covered">
          +1 topic
        </button>
        <button type="button" className="ctrl--trigger" onClick={() => send('zero')}>
          Set to 0
        </button>
        <button type="button" className="ctrl--trigger" onClick={() => send('reset')} title="Back to the page's own counts">
          Reset
        </button>
      </div>
    </aside>
  );
}

import { useMemo, useState } from 'react';
import { useVyom } from '../hooks';
import { DraggableControl } from './DraggableControl';
import { PropertyControl, ReadOnlyControl } from './PropertyControl';
import { SlotControls } from './SlotControls';
import { useDraggable } from './useDraggable';

/**
 * Testing surface for the whole ViewModel.
 *
 * The control list is generated from `viewModel.properties`, i.e. from the .riv
 * file itself — not from a hardcoded list. Add a trigger, boolean or number in
 * Rive, republish, and it shows up here automatically; the only thing config
 * decides is which heading it sits under.
 */
export function VyomDevPanel() {
  const { properties, isReady, loadError, viewModelInstance, artboardName, availableArtboards } =
    useVyom();
  // Collapsed by default: this panel is for development, not for the
  // student. It reopens from the button in the top-right corner.
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  // Both the collapsed button and the open panel can be dragged out of the
  // way — the room's own chrome sits under the top-right corner otherwise.
  const button = useDraggable('vyom-button');
  const panel = useDraggable('vyom-panel');

  // Listed in the ViewModel's own order — the order the properties appear in
  // the .riv file — rather than regrouped and alphabetised. The file is the
  // source of truth, so the panel reads the same way the artboard does.
  const { controls, readOnly } = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matches = (name: string) => (needle ? name.toLowerCase().includes(needle) : true);
    return {
      // Slot coordinates are written by the layout and have their own section.
      controls: properties.filter(
        (p) => !p.isSlotDriven && !p.isInternal && matches(p.name),
      ),
      // Rive's internal wiring — read-out only, never written from here.
      readOnly: properties.filter((p) => p.isInternal && matches(p.name)),
    };
  }, [properties, query]);

  if (!open) {
    return (
      <button
        type="button"
        className="devpanel__reopen"
        onClick={() => setOpen(true)}
        {...button.collapsedProps}
      >
        Vyom controls
      </button>
    );
  }

  return (
    <aside className="devpanel" {...panel.hostProps}>
      <header className="devpanel__head" {...panel.handleProps}>
        <div>
          <h2>Vyom controls</h2>
          <p className={`devpanel__status devpanel__status--${isReady ? 'ok' : 'wait'}`}>
            {loadError ?? (isReady ? `${properties.length} bound properties` : 'loading artboard…')}
          </p>
          {isReady && (
            <p className="devpanel__artboard" title={`In file: ${availableArtboards.join(', ')}`}>
              artboard <code>{artboardName ?? '(default)'}</code>
              {availableArtboards.length > 1 && ` · ${availableArtboards.length} in file`}
            </p>
          )}
        </div>
        <button type="button" className="devpanel__close" onClick={() => setOpen(false)}>
          ×
        </button>
      </header>

      <section className="devpanel__section">
        <h3>Slots</h3>
        <SlotControls />
      </section>

      <input
        className="devpanel__search"
        type="search"
        placeholder="Filter properties"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      <div className="devpanel__scroll">
        <section className="devpanel__section">
          <h3>
            State machine
            <span className="devpanel__note">{controls.length} in file order</span>
          </h3>
          <div className="devpanel__grid devpanel__grid--ordered">
            {controls.map((property) => (
              <DraggableControl key={property.name} property={property} character="vyom">
                <PropertyControl property={property} vmi={viewModelInstance} />
              </DraggableControl>
            ))}
          </div>
        </section>
        {readOnly.length > 0 && (
          <section className="devpanel__section">
            <h3>
              Rive internals
              <span className="devpanel__note">read-only</span>
            </h3>
            <p className="devpanel__hint">
              The artboard writes these itself. They are shown to read, never to set.
            </p>
            <div className="devpanel__grid devpanel__grid--ordered">
              {readOnly.map((property) => (
                <ReadOnlyControl key={property.name} property={property} vmi={viewModelInstance} />
              ))}
            </div>
          </section>
        )}

        {controls.length === 0 && readOnly.length === 0 && (
          <p className="devpanel__empty">No matching properties.</p>
        )}
      </div>
    </aside>
  );
}

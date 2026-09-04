import { useMemo, useState } from 'react';
import { useVyom } from '../hooks';
import { PROPERTY_GROUPS } from '../config';
import type { PropertyGroupId, VyomProperty } from '../types';
import { PropertyControl } from './PropertyControl';
import { SlotControls } from './SlotControls';

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
  const [open, setOpen] = useState(true);
  const [query, setQuery] = useState('');

  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matched = needle
      ? properties.filter((property) => property.name.toLowerCase().includes(needle))
      : properties;

    const buckets = new Map<PropertyGroupId, VyomProperty[]>();
    for (const property of matched) {
      // Slot coordinates are driven by layout (they live in SlotControls), and
      // internal properties are the ViewModel's own working values.
      if (property.isSlotDriven || property.isInternal) continue;
      const list = buckets.get(property.group) ?? [];
      list.push(property);
      buckets.set(property.group, list);
    }

    return [...buckets.entries()]
      .map(([id, items]) => ({
        id,
        label: PROPERTY_GROUPS[id]?.label ?? id,
        order: PROPERTY_GROUPS[id]?.order ?? 50,
        items: items.slice().sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => a.order - b.order);
  }, [properties, query]);

  if (!open) {
    return (
      <button type="button" className="devpanel__reopen" onClick={() => setOpen(true)}>
        Vyom controls
      </button>
    );
  }

  return (
    <aside className="devpanel">
      <header className="devpanel__head">
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
        {groups.map((group) => (
          <section key={group.id} className="devpanel__section">
            <h3>{group.label}</h3>
            <div className={`devpanel__grid devpanel__grid--${group.id}`}>
              {group.items.map((property) => (
                <PropertyControl key={property.name} property={property} vmi={viewModelInstance} />
              ))}
            </div>
          </section>
        ))}
        {groups.length === 0 && <p className="devpanel__empty">No matching properties.</p>}
      </div>
    </aside>
  );
}

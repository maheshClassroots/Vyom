import { useMemo, useState } from 'react';
import { PROPERTY_GROUPS } from '../../vyom/config';
import { DraggableControl } from '../../vyom/controls/DraggableControl';
import { PositionGroup } from '../../vyom/controls/PositionGroup';
import { PropertyControl } from '../../vyom/controls/PropertyControl';
import type { PropertyGroupId, VyomProperty } from '../../vyom/types';
import { useDraggable } from '../../vyom/controls/useDraggable';
import { SPARK_POSITION_BLOCKS } from '../config';
import { useSpark } from '../hooks';

/**
 * Testing surface for Spark's whole ViewModel — the counterpart to
 * `VyomDevPanel`, and deliberately built the same way.
 *
 * The control list is generated from `viewModel.properties`, i.e. from the
 * .riv file itself, not from a hardcoded list. Add a trigger, boolean or
 * number in Rive, republish, and it shows up here automatically; config only
 * decides which heading it sits under and what range a slider scrubs over.
 *
 * `PropertyControl` is shared with Vyom rather than copied: it already renders
 * the right widget per runtime-reported type, and one implementation means
 * both characters gain support for a new property type at once.
 */
export function SparkDevPanel() {
  const {
    properties,
    isReady,
    loadError,
    viewModelInstance,
    artboardName,
    availableArtboards,
    stateMachineName,
  } = useSpark();
  // Collapsed by default: this panel is for development, not for the
  // student. It reopens from the button in the top-right corner.
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const button = useDraggable('spark-button');
  const panel = useDraggable('spark-panel');

  const { groups, position } = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matched = needle
      ? properties.filter((property) => property.name.toLowerCase().includes(needle))
      : properties;

    const buckets = new Map<PropertyGroupId, VyomProperty[]>();
    for (const property of matched) {
      // Her live position is listed in the Positioning group's own block, not here.
      if (property.isInternal) continue;
      const list = buckets.get(property.group) ?? [];
      list.push(property);
      buckets.set(property.group, list);
    }

    // The Positioning group is laid out by `PositionGroup`: her coordinate pairs
    // get titles and notes, and what is left of the group (the fly/move
    // buttons, her chat position) sits above and below them as before.
    const inBlocks = new Set(SPARK_POSITION_BLOCKS.flatMap((block) => [block.x, block.y]));
    const positionRows = (buckets.get('position') ?? []).filter((property) => !inBlocks.has(property.name));
    buckets.delete('position');
    const byKind = (a: VyomProperty, b: VyomProperty) =>
      Number(a.type !== 'trigger') - Number(b.type !== 'trigger') || a.name.localeCompare(b.name);
    const position = {
      actions: positionRows.filter((property) => property.type === 'trigger').sort(byKind),
      rest: positionRows.filter((property) => property.type !== 'trigger').sort(byKind),
    };

    const groups = [...buckets.entries()]
      .map(([id, items]) => ({
        id,
        label: PROPERTY_GROUPS[id]?.label ?? id,
        order: PROPERTY_GROUPS[id]?.order ?? 50,
        // Buttons ahead of sliders within a group, so flyIn/flyOut/moveToPoint
        // read as one row of actions above the coordinates they act on.
        items: items
          .slice()
          .sort(
            (a, b) =>
              Number(a.type !== 'trigger') - Number(b.type !== 'trigger') ||
              a.name.localeCompare(b.name),
          ),
      }))
      .sort((a, b) => a.order - b.order);
    return { groups, position };
  }, [properties, query]);

  if (!open) {
    return (
      <button
        type="button"
        className="devpanel__reopen devpanel__reopen--spark"
        onClick={() => setOpen(true)}
        {...button.collapsedProps}
      >
        Spark controls
      </button>
    );
  }

  return (
    <aside className="devpanel devpanel--spark" {...panel.hostProps}>
      <header className="devpanel__head" {...panel.handleProps}>
        <div>
          <h2>Spark controls</h2>
          <p className={`devpanel__status devpanel__status--${isReady ? 'ok' : 'wait'}`}>
            {loadError ?? (isReady ? `${properties.length} bound properties` : 'loading artboard…')}
          </p>
          {isReady && (
            <p className="devpanel__artboard" title={`In file: ${availableArtboards.join(', ')}`}>
              artboard <code>{artboardName ?? '(default)'}</code>
              {stateMachineName && (
                <>
                  {' · '}
                  <code>{stateMachineName}</code>
                </>
              )}
            </p>
          )}
        </div>
        <button type="button" className="devpanel__close" onClick={() => setOpen(false)}>
          ×
        </button>
      </header>

      <input
        className="devpanel__search"
        type="search"
        placeholder="Filter properties"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      <div className="devpanel__scroll">
        <PositionGroup
          blocks={SPARK_POSITION_BLOCKS}
          properties={properties}
          vmi={viewModelInstance}
          character="spark"
          query={query}
          before={
            position.actions.length > 0 && (
              <div className="devpanel__grid devpanel__grid--position">
                {position.actions.map((property) => (
                  <DraggableControl key={property.name} property={property} character="spark">
                    <PropertyControl property={property} vmi={viewModelInstance} />
                  </DraggableControl>
                ))}
              </div>
            )
          }
          after={
            position.rest.length > 0 && (
              <div className="devpanel__grid devpanel__grid--position">
                {position.rest.map((property) => (
                  <DraggableControl key={property.name} property={property} character="spark">
                    <PropertyControl property={property} vmi={viewModelInstance} />
                  </DraggableControl>
                ))}
              </div>
            )
          }
        />
        {groups.map((group) => (
          <section key={group.id} className="devpanel__section">
            <h3>{group.label}</h3>
            <div className={`devpanel__grid devpanel__grid--${group.id}`}>
              {group.items.map((property) => (
                <DraggableControl key={property.name} property={property} character="spark">
                  <PropertyControl property={property} vmi={viewModelInstance} />
                </DraggableControl>
              ))}
            </div>
          </section>
        ))}
        {groups.length === 0 && position.actions.length + position.rest.length === 0 && (
          <p className="devpanel__empty">No matching properties.</p>
        )}
      </div>
    </aside>
  );
}

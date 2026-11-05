import {
  useViewModelInstanceBoolean,
  useViewModelInstanceColor,
  useViewModelInstanceEnum,
  useViewModelInstanceNumber,
  useViewModelInstanceString,
  type ViewModelInstance,
} from '@rive-app/react-canvas';
import { useEffect, useRef, useState } from 'react';
import { TRIGGERS_WITHOUT_BUSY } from '../config';
import { triggerWhenIdle } from '../sequencing';
import type { VyomProperty } from '../types';

interface ControlProps {
  property: VyomProperty;
  vmi: ViewModelInstance | null;
}

/**
 * Renders the right control for a property based on the type reported by the
 * ViewModel at runtime. Each control is its own component so the panel can
 * render a list of unknown length without breaking the rules of hooks — which
 * is what makes new Rive properties appear here with no code change.
 */
export function PropertyControl({ property, vmi }: ControlProps) {
  switch (property.type) {
    case 'trigger':
      return <TriggerControl property={property} vmi={vmi} />;
    case 'boolean':
      return <BooleanControl property={property} vmi={vmi} />;
    case 'number':
    case 'integer':
      return <NumberControl property={property} vmi={vmi} />;
    case 'string':
      return <StringControl property={property} vmi={vmi} />;
    case 'enumType':
      return <EnumControl property={property} vmi={vmi} />;
    case 'color':
      return <ColorControl property={property} vmi={vmi} />;
    default:
      return (
        <div className="ctrl ctrl--unsupported">
          <span className="ctrl__label">{property.name}</span>
          <span className="ctrl__badge">{property.type}</span>
        </div>
      );
  }
}

/**
 * A trigger button that plays the animation as authored.
 *
 * A bare `.trigger()` is lost whenever the artboard is mid-animation, and
 * still goes wrong for a while after `actionPlaying` falls: sent into that
 * tail it chains onto the last animation (`pointDown` drops its look-down)
 * or is swallowed. So a click joins the shared line — sent once the previous
 * animation has ended and the artboard has had its quiet moment, re-sent if
 * the artboard swallowed it — and the button shows it is waiting its turn.
 */
function TriggerControl({ property, vmi }: ControlProps) {
  const [waiting, setWaiting] = useState(0);
  const vmiRef = useRef(vmi);
  vmiRef.current = vmi;
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const send = () => {
    setWaiting((n) => n + 1);
    void triggerWhenIdle(() => vmiRef.current, property.name, {
      expectRise: !TRIGGERS_WITHOUT_BUSY.has(property.name),
    }).finally(() => {
      if (alive.current) setWaiting((n) => n - 1);
    });
  };

  return (
    <button
      type="button"
      className={`ctrl ctrl--trigger${waiting > 0 ? ' ctrl--pending' : ''}`}
      onClick={send}
      title={waiting > 0 ? 'Waiting for the previous animation to finish' : undefined}
    >
      {property.name}
      {waiting > 0 && <span className="ctrl__badge">{waiting > 1 ? `queued ×${waiting}` : 'queued'}</span>}
    </button>
  );
}

function BooleanControl({ property, vmi }: ControlProps) {
  const { value, setValue } = useViewModelInstanceBoolean(property.name, vmi);
  return (
    <label className="ctrl ctrl--boolean">
      <input
        type="checkbox"
        checked={value ?? false}
        onChange={(event) => setValue(event.target.checked)}
      />
      <span className="ctrl__label">{property.name}</span>
    </label>
  );
}

function NumberControl({ property, vmi }: ControlProps) {
  const { value, setValue } = useViewModelInstanceNumber(property.name, vmi);
  const { min = -1000, max = 1000, step = 1 } = property.meta;
  const reported = value ?? 0;

  /**
   * Local echo of what the slider was dragged to.
   *
   * Rive raises no change event for a value written from here, so the hook's
   * `value` keeps reporting whatever the artboard last published. Feeding that
   * straight back into a controlled input snaps the thumb to the stale number
   * on the next render and the slider reads as broken — even though the write
   * did reach the ViewModel. The echo is dropped as soon as the artboard
   * reports a value of its own, so a property the animation drives still wins.
   */
  const [draft, setDraft] = useState<number | null>(null);
  useEffect(() => setDraft(null), [reported]);
  const current = draft ?? reported;

  return (
    <div className="ctrl ctrl--number">
      <div className="ctrl__row">
        <span className="ctrl__label">{property.name}</span>
        <span className="ctrl__value">{Math.round(current)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={current}
        onChange={(event) => {
          const next = Number(event.target.value);
          setDraft(next);
          setValue(next);
        }}
      />
    </div>
  );
}

function StringControl({ property, vmi }: ControlProps) {
  const { value, setValue } = useViewModelInstanceString(property.name, vmi);
  return (
    <label className="ctrl ctrl--string">
      <span className="ctrl__label">{property.name}</span>
      <input type="text" value={value ?? ''} onChange={(event) => setValue(event.target.value)} />
    </label>
  );
}

function EnumControl({ property, vmi }: ControlProps) {
  const { value, values, setValue } = useViewModelInstanceEnum(property.name, vmi);
  return (
    <label className="ctrl ctrl--enum">
      <span className="ctrl__label">{property.name}</span>
      <select value={value ?? ''} onChange={(event) => setValue(event.target.value)}>
        {values.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function ColorControl({ property, vmi }: ControlProps) {
  const { value, setRgb } = useViewModelInstanceColor(property.name, vmi);
  const hex = `#${((value ?? 0) & 0xffffff).toString(16).padStart(6, '0')}`;

  return (
    <label className="ctrl ctrl--color">
      <span className="ctrl__label">{property.name}</span>
      <input
        type="color"
        value={hex}
        onChange={(event) => {
          const parsed = Number.parseInt(event.target.value.slice(1), 16);
          setRgb((parsed >> 16) & 0xff, (parsed >> 8) & 0xff, parsed & 0xff);
        }}
      />
    </label>
  );
}

/**
 * A live read-out with no input: for values the artboard owns.
 *
 * Writing these would fight the state machine, so there is deliberately
 * nothing to click or drag. The value still updates, because the artboard
 * publishes its own changes and the hook subscribes to them.
 */
export function ReadOnlyControl({ property, vmi }: ControlProps) {
  switch (property.type) {
    case 'boolean':
      return <ReadOnlyBoolean property={property} vmi={vmi} />;
    case 'number':
    case 'integer':
      return <ReadOnlyNumber property={property} vmi={vmi} />;
    default:
      return (
        <div className="ctrl ctrl--readonly">
          <span className="ctrl__label">{property.name}</span>
          <span className="ctrl__badge">{property.type}</span>
        </div>
      );
  }
}

function ReadOnlyBoolean({ property, vmi }: ControlProps) {
  const { value } = useViewModelInstanceBoolean(property.name, vmi);
  return (
    <div className="ctrl ctrl--readonly">
      <span className="ctrl__label">{property.name}</span>
      <span className={`ctrl__flag${value ? ' ctrl__flag--on' : ''}`}>{value ? 'true' : 'false'}</span>
    </div>
  );
}

function ReadOnlyNumber({ property, vmi }: ControlProps) {
  const { value } = useViewModelInstanceNumber(property.name, vmi);
  return (
    <div className="ctrl ctrl--readonly">
      <span className="ctrl__label">{property.name}</span>
      <span className="ctrl__value">{value === null ? '—' : Math.round(value)}</span>
    </div>
  );
}

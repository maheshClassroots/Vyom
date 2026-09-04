import {
  useViewModelInstanceBoolean,
  useViewModelInstanceColor,
  useViewModelInstanceEnum,
  useViewModelInstanceNumber,
  useViewModelInstanceString,
  useViewModelInstanceTrigger,
  type ViewModelInstance,
} from '@rive-app/react-canvas';
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

function TriggerControl({ property, vmi }: ControlProps) {
  const { trigger } = useViewModelInstanceTrigger(property.name, vmi);
  return (
    <button type="button" className="ctrl ctrl--trigger" onClick={trigger}>
      {property.name}
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
  const current = value ?? 0;

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
        onChange={(event) => setValue(Number(event.target.value))}
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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ViewModelInstance } from '@rive-app/react-canvas';
import { useSpark } from '../../spark';
import { slotForProperty } from '../config';
import { useVyom } from '../hooks';
import type { Point, PropertyMeta, VyomProperty } from '../types';
import { BUSY_TIMEOUT_MS, driveStep, sleep } from '../sequencing';
import { readDragPayload, type SequenceCharacter } from './sequenceDrag';
import {
  downloadSequence,
  makeStepId as makeId,
  parseSequenceFile,
  type Step,
} from './sequenceFile';

const DEFAULT_WAIT_MS = 500;

/**
 * Dev-only sequencer: drag controls out of the character panels, drop them
 * into a lane, and play the lane back.
 *
 * It holds no palette of its own — the control panels are the source, so
 * there is one list of controls in the app rather than two that can drift
 * apart. One lane per character, because the two are separate artboards with
 * separate ViewModels: a control only ever means something to its own lane,
 * and a lane refuses a control dragged from the other panel.
 *
 * Lanes write to their ViewModel directly rather than through a provider, for
 * the same reason the panels do: `AUTO_DRIVE_ENABLED` gates the app's own
 * automation, and this is a hand-driven tool that should keep working while
 * that is off.
 */
export function SequenceComposer() {
  const vyom = useVyom();
  const spark = useSpark();
  const [open, setOpen] = useState(false);

  /**
   * Latest slot coordinates, mirrored outside React state.
   *
   * Two coordinate steps can run in the same tick — X then Y — and the second
   * would otherwise read a `slotPositions` captured before the first one
   * landed, writing the stale X back alongside the new Y.
   */
  const slotPoints = useRef<Record<string, Point>>({});
  useEffect(() => {
    slotPoints.current = vyom.slotPositions;
  }, [vyom.slotPositions]);

  /**
   * Handles a number step that targets a slot coordinate.
   *
   * `learnWindowX/Y` and `chatposX/Y` are written by the layout from the DOM
   * anchors, so writing one straight into the ViewModel would hold only until
   * the next anchor or resize pass. Taking the slot off automatic first is
   * what makes the step stick; the panel's "manual" box hands the slot back to
   * the layout afterwards.
   *
   * Returns false for any other number, which the lane then writes itself.
   */
  const writeVyomNumber = useCallback(
    (name: string, value: number) => {
      const slot = slotForProperty(name);
      if (!slot) return false;
      vyom.setSlotManual(slot.id, true);
      const previous = slotPoints.current[slot.id] ?? { x: 0, y: 0 };
      const point =
        name === slot.xProperty ? { ...previous, x: value } : { ...previous, y: value };
      slotPoints.current = { ...slotPoints.current, [slot.id]: point };
      vyom.setSlotPosition(slot.id, point);
      return true;
    },
    [vyom],
  );

  if (!open) {
    return (
      <button
        type="button"
        className="devpanel__reopen devpanel__reopen--seq"
        onClick={() => setOpen(true)}
      >
        Sequencer
      </button>
    );
  }

  return (
    <aside className="seq">
      <header className="seq__head">
        <h2>Sequencer</h2>
        <p className="seq__sub">Drag a control from either panel into its lane, then play.</p>
        <button type="button" className="devpanel__close" onClick={() => setOpen(false)}>
          ×
        </button>
      </header>

      <div className="seq__lanes">
        <SequenceLane
          label="Vyom"
          character="vyom"
          properties={vyom.properties}
          viewModelInstance={vyom.viewModelInstance}
          // Raised by the artboard while an animation runs; steps wait on it.
          busyProperty="actionPlaying"
          onNumberWrite={writeVyomNumber}
        />
        <SequenceLane
          label="Spark"
          character="spark"
          properties={spark.properties}
          viewModelInstance={spark.viewModelInstance}
          busyProperty={null}
        />
      </div>
    </aside>
  );
}

interface SequenceLaneProps {
  label: string;
  character: SequenceCharacter;
  properties: VyomProperty[];
  viewModelInstance: ViewModelInstance | null;
  /** Boolean the artboard raises while busy, or null when it exposes none. */
  busyProperty: string | null;
  /**
   * Chance to handle a number write before the lane does it.
   *
   * Returning true means the write is done; false falls through to a plain
   * ViewModel write. Vyom uses it for the slot coordinates, which need the
   * layout taken out of the way first.
   */
  onNumberWrite?: (name: string, value: number) => boolean;
}

function SequenceLane({
  label,
  character,
  properties,
  viewModelInstance,
  busyProperty,
  onNumberWrite,
}: SequenceLaneProps) {
  const [steps, setSteps] = useState<Step[]>([]);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const dragFrom = useRef<number | null>(null);

  // Set while a sequence is running; cleared to ask it to stop.
  const runningRef = useRef(false);
  useEffect(() => () => { runningRef.current = false; }, []);

  const hasBusyFlag = useMemo(
    () => Boolean(busyProperty) && properties.some((p) => p.name === busyProperty),
    [properties, busyProperty],
  );

  const enumOptions = useCallback(
    (name: string) => viewModelInstance?.enum(name)?.values ?? [],
    [viewModelInstance],
  );

  /** Slider bounds from config, so a number step offers the same range the panel does. */
  const rangeFor = useCallback(
    (name: string): PropertyMeta =>
      properties.find((p) => p.name === name)?.meta ?? { group: 'unsorted' },
    [properties],
  );

  /** Builds the right kind of step for a dropped control. */
  const stepFor = useCallback(
    (name: string, type: VyomProperty['type']): Step => {
      if (type === 'boolean') return { id: makeId(), kind: 'boolean', name, on: true };
      if (type === 'enumType')
        return { id: makeId(), kind: 'enum', name, value: enumOptions(name)[0] ?? '' };
      if (type === 'number' || type === 'integer') {
        const current = viewModelInstance?.number(name)?.value;
        return { id: makeId(), kind: 'number', name, amount: Math.round(current ?? 0) };
      }
      return { id: makeId(), kind: 'trigger', name };
    },
    [enumOptions, viewModelInstance],
  );

  const moveStep = useCallback((from: number, to: number) => {
    setSteps((current) => {
      if (from === to || from < 0 || from >= current.length) return current;
      const next = current.slice();
      const [moved] = next.splice(from, 1);
      next.splice(to > from ? to - 1 : to, 0, moved);
      return next;
    });
  }, []);

  /** Accepts a dropped control, or refuses one from the other character. */
  const acceptDrop = useCallback(
    (event: React.DragEvent, at?: number) => {
      setOver(false);
      const payload = readDragPayload(event);
      if (!payload) {
        // Not a control — a step being reordered within this lane.
        if (dragFrom.current !== null && at !== undefined) moveStep(dragFrom.current, at);
        dragFrom.current = null;
        return;
      }
      if (payload.character !== character) {
        setStatus(`${payload.name} belongs to the other character`);
        return;
      }
      setStatus(null);
      const step = stepFor(payload.name, payload.type);
      setSteps((current) => {
        const next = current.slice();
        next.splice(at ?? next.length, 0, step);
        return next;
      });
    },
    [character, stepFor, moveStep],
  );

  const patchStep = useCallback((id: string, patch: Partial<Step>) => {
    setSteps((current) => current.map((step) => (step.id === id ? { ...step, ...patch } : step)));
  }, []);

  const removeStep = useCallback((id: string) => {
    setSteps((current) => current.filter((step) => step.id !== id));
  }, []);

  // Clicked by the Load button: the native file input is kept out of the way
  // rather than styled, since every browser draws it differently.
  const fileInput = useRef<HTMLInputElement>(null);

  /** Property names this lane can actually drive, for checking a loaded file. */
  const knownProperties = useMemo(
    () => new Set(properties.map((property) => property.name)),
    [properties],
  );

  const loadFile = useCallback(
    async (file: File) => {
      try {
        const { steps: loaded, unknown } = parseSequenceFile(
          await file.text(),
          character,
          knownProperties,
        );
        // Replaces rather than appends: a saved sequence is a whole sequence,
        // and appending one to whatever is already in the lane is almost never
        // what loading a file is meant to do.
        setSteps(loaded);
        setStatus(
          unknown.length > 0
            ? `loaded ${loaded.length} steps · not in this artboard: ${unknown.join(', ')}`
            : `loaded ${loaded.length} steps`,
        );
      } catch (error) {
        setStatus(`could not load: ${error instanceof Error ? error.message : 'unreadable file'}`);
      }
    },
    [character, knownProperties],
  );

  const isBusy = useCallback(() => {
    if (!viewModelInstance || !busyProperty || !hasBusyFlag) return false;
    return viewModelInstance.boolean(busyProperty)?.value === true;
  }, [viewModelInstance, busyProperty, hasBusyFlag]);

  const stop = useCallback(() => {
    runningRef.current = false;
    setPlayingIndex(null);
    setStatus('stopped');
  }, []);

  const play = useCallback(async () => {
    if (!viewModelInstance || steps.length === 0 || runningRef.current) return;
    runningRef.current = true;
    setStatus(null);

    const giveUp = (why: string) => {
      setStatus(runningRef.current ? why : 'stopped');
      runningRef.current = false;
      setPlayingIndex(null);
    };

    for (let index = 0; index < steps.length; index += 1) {
      if (!runningRef.current) return;
      const step = steps[index];
      setPlayingIndex(index);

      if (step.kind === 'wait') {
        await sleep(step.ms ?? 0);
        continue;
      }

      const name = step.name ?? '';
      // `driveStep` carries the whole rule set: wait for the character to be
      // idle, write, then hold until the animation that write started has
      // finished. A sequence that skipped either half would outrun what it is
      // driving — and a trigger fired into a busy artboard is simply lost.
      const finished = await driveStep(
        () => {
          if (step.kind === 'trigger') viewModelInstance.trigger(name)?.trigger();
          else if (step.kind === 'boolean') {
            const property = viewModelInstance.boolean(name);
            if (property) property.value = step.on ?? false;
          } else if (step.kind === 'enum') {
            const property = viewModelInstance.enum(name);
            if (property && step.value) property.value = step.value;
          } else if (step.kind === 'number') {
            const amount = step.amount ?? 0;
            if (!onNumberWrite?.(name, amount)) {
              const property = viewModelInstance.number(name);
              if (property) property.value = amount;
            }
          }
        },
        isBusy,
        () => runningRef.current,
      );

      if (!finished) {
        giveUp(`gave up on ${name}: ${busyProperty} stayed true for ${BUSY_TIMEOUT_MS / 1000}s`);
        return;
      }
    }

    runningRef.current = false;
    setPlayingIndex(null);
    setStatus('finished');
  }, [steps, viewModelInstance, isBusy, busyProperty, onNumberWrite]);

  return (
    <section className="lane">
      <h3 className="lane__head">
        {label}
        <span className="devpanel__note">
          {steps.length} steps
          {steps.length > 0 && (
            <>
              {' · '}
              <button type="button" className="seq__link" onClick={() => setSteps([])}>
                clear
              </button>
            </>
          )}
        </span>
      </h3>

      <ol
        className={`seq__list${over ? ' seq__list--over' : ''}`}
        onDragOver={(event) => {
          event.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(event) => acceptDrop(event)}
      >
        {steps.map((step, index) => (
          <li
            key={step.id}
            className={`seq__step${playingIndex === index ? ' seq__step--playing' : ''}`}
            draggable
            onDragStart={() => { dragFrom.current = index; }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.stopPropagation();
              acceptDrop(event, index);
            }}
          >
            <span className="seq__index">{index + 1}</span>

            {step.kind === 'trigger' && <span className="seq__name">{step.name}</span>}

            {step.kind === 'boolean' && (
              <span className="seq__name seq__name--set">
                <span className="seq__prop">{step.name}</span>
                <button
                  type="button"
                  className={`seq__toggle${step.on ? ' seq__toggle--on' : ''}`}
                  onClick={() => patchStep(step.id, { on: !step.on })}
                >
                  {step.on ? 'true' : 'false'}
                </button>
              </span>
            )}

            {step.kind === 'enum' && (
              <span className="seq__name seq__name--set">
                <span className="seq__prop">{step.name}</span>
                <select
                  value={step.value ?? ''}
                  onChange={(event) => patchStep(step.id, { value: event.target.value })}
                >
                  {enumOptions(step.name ?? '').map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </span>
            )}

            {step.kind === 'number' && (
              <span className="seq__name seq__name--set">
                <span className="seq__prop">{step.name}</span>
                <input
                  type="number"
                  min={rangeFor(step.name ?? '').min}
                  max={rangeFor(step.name ?? '').max}
                  step={rangeFor(step.name ?? '').step ?? 1}
                  value={step.amount ?? 0}
                  onChange={(event) => patchStep(step.id, { amount: Number(event.target.value) })}
                />
              </span>
            )}

            {step.kind === 'wait' && (
              <span className="seq__name seq__name--wait">
                wait
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={step.ms ?? 0}
                  onChange={(event) =>
                    patchStep(step.id, { ms: Math.max(0, Number(event.target.value)) })
                  }
                />
                ms
              </span>
            )}

            <button
              type="button"
              className="seq__remove"
              onClick={() => removeStep(step.id)}
              aria-label={`Remove step ${index + 1}`}
            >
              ×
            </button>
          </li>
        ))}
        {steps.length === 0 && (
          <li className="seq__empty">Drag {label}&apos;s controls here</li>
        )}
      </ol>

      <div className="seq__foot">
        <button
          type="button"
          className="seq__wait"
          onClick={() =>
            setSteps((current) => [...current, { id: makeId(), kind: 'wait', ms: DEFAULT_WAIT_MS }])
          }
        >
          + wait
        </button>
        <button
          type="button"
          className="seq__io"
          onClick={() => downloadSequence(character, steps)}
          disabled={steps.length === 0}
          title={`Save this lane as ${character}-sequence.json`}
        >
          ↓ Save
        </button>
        <button
          type="button"
          className="seq__io"
          onClick={() => fileInput.current?.click()}
          title="Load a saved sequence, replacing this lane"
        >
          ↑ Load
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            // Cleared so picking the same file twice in a row still fires.
            event.target.value = '';
            if (file) void loadFile(file);
          }}
        />
        <button
          type="button"
          className="seq__play"
          onClick={playingIndex === null ? play : stop}
          disabled={steps.length === 0 || !viewModelInstance}
        >
          {playingIndex === null ? `▶ Play ${label}` : '■ Stop'}
        </button>
      </div>
      {status && <p className="seq__status">{status}</p>}
      {!hasBusyFlag && steps.length > 0 && (
        <p className="seq__status seq__status--warn">
          no busy flag on {label} — steps fire back to back
        </p>
      )}
    </section>
  );
}

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  Alignment,
  Fit,
  Layout,
  useRive,
  useRiveFile,
  useViewModel,
  useViewModelInstance,
  type Rive,
  type ViewModelInstance,
} from '@rive-app/react-canvas';
import { VyomBinder } from '../vyom/binder';
import { embeddedRive } from '../vyom/embedded';
import { resolveArtboard, resolveStateMachine } from '../vyom/resolveArtboard';
import type { VyomProperty } from '../vyom/types';
import {
  SPARK_CONFIG,
  SPARK_HIDDEN_PROPERTIES,
  SPARK_INTERNAL_PROPERTIES,
  SPARK_PROPERTY_META,
} from './config';
import { SparkRiveComponentContext } from './SparkRiveComponentContext';

export interface SparkContextValue {
  rive: Rive | null;
  viewModelInstance: ViewModelInstance | null;
  binder: VyomBinder | null;
  /** Every property the ViewModel actually exposes, decorated for display. */
  properties: VyomProperty[];
  /** Artboard actually in use, and every artboard the file contains. */
  artboardName: string | null;
  availableArtboards: string[];
  /** State machine actually running. */
  stateMachineName: string | null;
  isReady: boolean;
  loadError: string | null;

  /** Fires any trigger by name; returns false when the property is absent. */
  fire: (name: string) => boolean;
  /** Holds a boolean by name — `isSpeaking`, `isCurious`, `isConfused`. */
  setFlag: (name: string, value: boolean) => boolean;
  /** Sets a number by name — `idleVariant`, `activeness`, gaze, move targets. */
  setValue: (name: string, value: number) => boolean;
}

export const SparkContext = createContext<SparkContextValue | null>(null);

/** Decorates the ViewModel's real properties with groups/ranges from config. */
function describeProperties(
  instanceProperties: { name: string; type: string }[],
): VyomProperty[] {
  return instanceProperties
    .filter(({ name }) => !SPARK_HIDDEN_PROPERTIES.has(name))
    .map(({ name, type }) => {
      const meta = SPARK_PROPERTY_META[name] ?? { group: 'unsorted' as const };
      return {
        name,
        type: type as VyomProperty['type'],
        group: meta.group,
        meta,
        isSlotDriven: false,
        // `positionXRef`/`positionYRef` are the artboard's own working values.
        isInternal: SPARK_INTERNAL_PROPERTIES.has(name),
      };
    });
}

/**
 * Owns Spark's Rive instance and exposes its ViewModel to the app.
 *
 * Deliberately the same shape as `VyomProvider`: the file is read first, every
 * name is resolved against what the file actually contains, and the ViewModel
 * is bound by name so the control panel is generated from the artboard rather
 * than hardcoded.
 *
 * Spark's artboard is screen-sized, so like Vyom he is drawn on one
 * full-viewport canvas (`SparkStage`) and positioned inside the artboard by
 * its own ViewModel coordinates, not by where a DOM box happens to sit.
 */
export function SparkProvider({ children }: { children: ReactNode }) {
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load the file first so the artboard and state machine can be checked
  // against what it really holds. `useRive` reads its parameters once, at
  // init, so the names have to be settled before the instance is created —
  // hence the null params until the file resolves.
  const embedded = embeddedRive(SPARK_CONFIG.src);
  const { riveFile, status } = useRiveFile(
    embedded ? { buffer: embedded } : { src: SPARK_CONFIG.src },
  );

  const resolved = useMemo(() => {
    if (!riveFile || status !== 'success') return null;
    const artboard = resolveArtboard(riveFile, SPARK_CONFIG.artboardCandidates);
    const stateMachine = resolveStateMachine(
      riveFile,
      artboard.name,
      SPARK_CONFIG.stateMachineCandidates,
    );
    return { artboard, stateMachine };
  }, [riveFile, status]);

  const riveParams = useMemo(
    () =>
      !resolved || !riveFile
        ? null
        : {
            riveFile,
            // `undefined` means "use the file's default artboard".
            artboard: resolved.artboard.name ?? undefined,
            // The state machine plays its entry state on load, which is
            // Spark's default idle.
            //
            // `stateMachines` (plural) despite the runtime's deprecation
            // warning recommending `stateMachine`: this version's constructor
            // silently ignores the singular form and falls back to the
            // artboard's first timeline, so the machine never runs and the
            // ViewModel appears dead. Verified against the file — the
            // plural form starts the machine, the singular one does not.
            stateMachines: resolved.stateMachine.name ?? undefined,
            // Fit.Layout resizes the artboard to the canvas instead of scaling
            // it, so the artboard fills the screen and 1 unit === 1 CSS pixel.
            layout: new Layout({
              fit: Fit.Layout,
              alignment: Alignment.Center,
              layoutScaleFactor: SPARK_CONFIG.layoutScaleFactor,
            }),
            autoplay: true,
            // The ViewModel is bound explicitly below so its name is authoritative.
            autoBind: false,
            onLoadError: () => setLoadError(`Could not load ${SPARK_CONFIG.src}`),
          },
    [resolved, riveFile],
  );

  const { rive, RiveComponent } = useRive(riveParams, {
    shouldResizeCanvasToContainer: true,
  });

  // Prefer the ViewModel named in config; fall back to the artboard default so
  // a rename in Rive degrades to "still works" instead of "no controls".
  const namedViewModel = useViewModel(rive, { name: SPARK_CONFIG.viewModel });
  const defaultViewModel = useViewModel(rive, { useDefault: true });
  const viewModel = namedViewModel ?? defaultViewModel;

  // Passing `rive` binds the instance to the state machine automatically.
  const viewModelInstance = useViewModelInstance(viewModel, { rive });

  const binder = useMemo(
    () => (viewModelInstance ? new VyomBinder(viewModelInstance) : null),
    [viewModelInstance],
  );

  const properties = useMemo(
    () => (viewModel ? describeProperties(viewModel.properties) : []),
    [viewModel],
  );

  useEffect(() => {
    if (status === 'failed') setLoadError(`Could not load ${SPARK_CONFIG.src}`);
  }, [status]);

  const fire = useCallback((name: string) => binder?.fire(name) ?? false, [binder]);
  const setFlag = useCallback(
    (name: string, value: boolean) => binder?.setBoolean(name, value) ?? false,
    [binder],
  );
  const setValue = useCallback(
    (name: string, value: number) => binder?.setNumber(name, value) ?? false,
    [binder],
  );

  const stateMachineName = resolved?.stateMachine.name ?? null;

  const value = useMemo<SparkContextValue>(
    () => ({
      rive,
      viewModelInstance,
      binder,
      properties,
      artboardName: resolved?.artboard.name ?? null,
      availableArtboards: resolved?.artboard.available ?? [],
      stateMachineName,
      isReady: Boolean(rive && viewModelInstance),
      loadError,
      fire,
      setFlag,
      setValue,
    }),
    [
      rive,
      viewModelInstance,
      binder,
      properties,
      resolved,
      stateMachineName,
      loadError,
      fire,
      setFlag,
      setValue,
    ],
  );

  return (
    <SparkContext.Provider value={value}>
      <SparkRiveComponentContext.Provider value={RiveComponent}>
        {children}
      </SparkRiveComponentContext.Provider>
    </SparkContext.Provider>
  );
}

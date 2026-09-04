import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
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
import {
  DEFAULT_SLOT,
  INTERNAL_PROPERTIES,
  PROPERTY_META,
  RIVE_CONFIG,
  SLOT_LIST,
  STAGE_SLOTS,
} from './config';
import { VyomBinder } from './binder';
import { RiveComponentContext } from './RiveComponentContext';
import { resolveArtboard } from './resolveArtboard';
import { embeddedRive } from './embedded';
import type { Point, SlotDefinition, SlotId, VyomProperty } from './types';

interface AnchorEntry {
  element: HTMLElement;
  slot: SlotDefinition;
}

export interface VyomContextValue {
  rive: Rive | null;
  viewModelInstance: ViewModelInstance | null;
  binder: VyomBinder | null;
  /** Every property the ViewModel actually exposes, decorated for display. */
  properties: VyomProperty[];
  /** Artboard actually in use, and every artboard the file contains. */
  artboardName: string | null;
  availableArtboards: string[];
  isReady: boolean;
  loadError: string | null;

  /** Slot Vyom was last sent to. */
  activeSlot: SlotId;
  moveTo: (slot: SlotId) => void;

  /** Fires any trigger by name; returns false when the property is absent. */
  fire: (name: string) => boolean;

  /**
   * Sets a boolean by name. In `MasterCanvas` the conversational states
   * (`listening`, `thinking`, `isSpeaking`, `isTyping`, `wait`) are booleans
   * rather than triggers, so they are held rather than fired.
   */
  setFlag: (name: string, value: boolean) => boolean;

  /** Sets a number by name — `pointDir`, `idleVariant`, `typingPos`, gaze. */
  setValue: (name: string, value: number) => boolean;

  /** Anchor plumbing — used by `useVyomAnchor`, not usually called directly. */
  registerAnchor: (slotId: string, element: HTMLElement | null) => void;
  requestSlotSync: () => void;

  /**
   * False until the opening move has had time to complete.
   *
   * The artboard starts Vyom in whichever slot it defaults to, so the opening
   * move is a slide across the room. He is hidden for it with the artboard's
   * own `disappear`; this flag tells the app when he is in place, so the
   * opening `appear` plays where he should be standing.
   */
  entranceComplete: boolean;

  /** Live coordinates last pushed to Rive, for read-out in the dev panel. */
  slotPositions: Record<string, Point>;
  /** Slots whose coordinates are being set by hand instead of by layout. */
  manualSlots: Record<string, boolean>;
  setSlotManual: (slotId: string, manual: boolean) => void;
  setSlotPosition: (slotId: string, point: Point) => void;
}

/**
 * Retry ladder for slot moves made before the state machine settles.
 *
 * The artboard's entry transition ignores triggers until it finishes, and this
 * runtime emits no `advance` or `statechange` events to wait on. So an early
 * move is re-attempted on this ladder — whichever attempt lands first wins and
 * the rest are no-ops. A later move cancels whatever is still queued, so the
 * destination is always the most recent one asked for.
 */
const ENTRANCE_RETRIES_MS = [0, 300, 700, 1100, 1600];

/** After this long, the machine is assumed live and moves fire once. */
const SETTLE_MS = 3200;

/**
 * How long the artboard's slot-to-slot travel takes, in ms.
 *
 * The opening reveal is timed from the move trigger actually being dispatched,
 * not from page load, so this is the one number that matters: a property of the
 * animation rather than of how fast the machine booted. Raise it if Vyom is
 * still sliding when he becomes visible.
 */
const MOVE_TRAVEL_MS = 900;

export const VyomContext = createContext<VyomContextValue | null>(null);

/** Decorates the ViewModel's real properties with labels/groups from config. */
function describeProperties(instanceProperties: { name: string; type: string }[]): VyomProperty[] {
  const slotDriven = new Set(
    SLOT_LIST.flatMap((slot) => [slot.xProperty, slot.yProperty]),
  );

  return instanceProperties.map(({ name, type }) => {
    const meta = PROPERTY_META[name] ?? { group: 'unsorted' as const };
    return {
      name,
      type: type as VyomProperty['type'],
      group: meta.group,
      meta,
      isSlotDriven: slotDriven.has(name),
      isInternal: INTERNAL_PROPERTIES.has(name),
    };
  });
}

export function VyomProvider({ children }: { children: ReactNode }) {
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeSlot, setActiveSlot] = useState<SlotId>(DEFAULT_SLOT);
  const [slotPositions, setSlotPositions] = useState<Record<string, Point>>({});
  const [entranceComplete, setEntranceComplete] = useState(false);
  const [manualSlots, setManualSlots] = useState<Record<string, boolean>>({});

  // Load the file first so the artboard name can be checked against what the
  // file really contains. `useRive` reads its parameters once, at init, so the
  // name has to be settled before the instance is created — hence the null
  // params until the file resolves.
  const embedded = embeddedRive(RIVE_CONFIG.src);
  const { riveFile, status } = useRiveFile(
    embedded ? { buffer: embedded } : { src: RIVE_CONFIG.src },
  );

  const artboard = useMemo(() => {
    if (!riveFile || status !== 'success') return null;
    return resolveArtboard(riveFile, RIVE_CONFIG.artboardCandidates);
  }, [riveFile, status]);

  const riveParams = useMemo(
    () =>
      artboard === null || !riveFile
        ? null
        : {
            riveFile,
            // `undefined` means "use the file's default artboard".
            artboard: artboard.name ?? undefined,
            stateMachines: RIVE_CONFIG.stateMachine,
            // Fit.Layout resizes the artboard to the canvas rather than scaling
            // it, so the artboard matches the screen and 1 unit === 1 CSS pixel.
            layout: new Layout({
              fit: Fit.Layout,
              alignment: Alignment.Center,
              layoutScaleFactor: RIVE_CONFIG.layoutScaleFactor,
            }),
            autoplay: true,
            // The ViewModel is bound explicitly below so its name is authoritative.
            autoBind: false,
            onLoadError: () => setLoadError(`Could not load ${RIVE_CONFIG.src}`),
          },
    [artboard, riveFile],
  );

  const { rive, RiveComponent, canvas } = useRive(riveParams, {
    shouldResizeCanvasToContainer: true,
  });

  // Prefer the ViewModel named in config; fall back to the artboard default so
  // a rename in Rive degrades to "still works" instead of "blank screen".
  const namedViewModel = useViewModel(rive, { name: RIVE_CONFIG.viewModel });
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

  const isReady = Boolean(rive && viewModelInstance);

  useEffect(() => {
    if (status === 'failed') setLoadError(`Could not load ${RIVE_CONFIG.src}`);
  }, [status]);



  // Dev-only console handle: `__vyom.rive.contents` lists artboards and state
  // machines, which is the fastest way to check a name against the .riv file.
  /* ----------------------------------------------------------------------- */
  /* Anchor tracking                                                          */
  /* ----------------------------------------------------------------------- */

  const anchorsRef = useRef(new Map<string, AnchorEntry>());
  const stageCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const binderRef = useRef<VyomBinder | null>(null);
  const manualSlotsRef = useRef(manualSlots);
  const frameRef = useRef<number | null>(null);

  binderRef.current = binder;
  manualSlotsRef.current = manualSlots;

  /**
   * Converts each registered anchor's centre into artboard units and pushes it
   * into that slot's X/Y properties. Coalesced into one animation frame so a
   * burst of resize callbacks costs a single pass.
   */
  const syncSlots = useCallback(() => {
    frameRef.current = null;
    const activeBinder = binderRef.current;
    const stage = stageCanvasRef.current;
    if (!activeBinder || !stage) return;

    const stageRect = stage.getBoundingClientRect();
    const scale = RIVE_CONFIG.layoutScaleFactor || 1;
    const next: Record<string, Point> = {};

    anchorsRef.current.forEach(({ element, slot }, slotId) => {
      if (manualSlotsRef.current[slotId]) return;
      const rect = element.getBoundingClientRect();
      // Anchor centre, expressed relative to the canvas, then to the artboard.
      const point = {
        x: (rect.left + rect.width / 2 - stageRect.left) / scale,
        y: (rect.top + rect.height / 2 - stageRect.top) / scale,
      };
      activeBinder.setNumber(slot.xProperty, point.x);
      activeBinder.setNumber(slot.yProperty, point.y);
      next[slotId] = point;
    });

    if (Object.keys(next).length > 0) {
      setSlotPositions((previous) => {
        const merged = { ...previous, ...next };
        const unchanged = Object.entries(merged).every(
          ([key, value]) =>
            previous[key] && previous[key].x === value.x && previous[key].y === value.y,
        );
        return unchanged && Object.keys(previous).length === Object.keys(merged).length
          ? previous
          : merged;
      });
    }
  }, []);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    (window as unknown as Record<string, unknown>).__vyom = {
      rive,
      viewModel,
      viewModelInstance,
      binder,
    };
  }, [binder, rive, viewModel, viewModelInstance]);

  const requestSlotSync = useCallback(() => {
    if (frameRef.current !== null) return;
    frameRef.current = requestAnimationFrame(syncSlots);
  }, [syncSlots]);

  const registerAnchor = useCallback(
    (slotId: string, element: HTMLElement | null) => {
      const slot = SLOT_LIST.find((candidate) => candidate.id === slotId);
      if (!slot) {
        console.warn(`[vyom] unknown slot "${slotId}" — add it to STAGE_SLOTS.`);
        return;
      }
      if (element) anchorsRef.current.set(slotId, { element, slot });
      else anchorsRef.current.delete(slotId);
      requestSlotSync();
    },
    [requestSlotSync],
  );

  // `useRive` owns the canvas element; never attach a competing ref to
  // `RiveComponent` — its own container/canvas refs are how it boots.
  useEffect(() => {
    stageCanvasRef.current = canvas;
    requestSlotSync();
  }, [canvas, requestSlotSync]);

  // Push coordinates as soon as the ViewModel is live, and on window resize.
  useEffect(() => {
    if (!binder) return;
    binder.invalidate();
    requestSlotSync();
  }, [binder, requestSlotSync]);

  useEffect(() => {
    const onResize = () => requestSlotSync();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [requestSlotSync]);

  useEffect(
    () => () => {
      if (frameRef.current === null) return;
      cancelAnimationFrame(frameRef.current);
      // Must clear the handle too: leaving it set makes `requestSlotSync`
      // think a frame is still pending and drop every later sync.
      frameRef.current = null;
    },
    [],
  );

  /* ----------------------------------------------------------------------- */
  /* Imperative API                                                           */
  /* ----------------------------------------------------------------------- */

  const fire = useCallback(
    (name: string) => {
      const fired = binderRef.current?.fire(name) ?? false;
      if (!fired) console.warn(`[vyom] no trigger named "${name}" on the ViewModel.`);
      return fired;
    },
    [],
  );

  const entranceTimers = useRef<number[]>([]);

  const cancelEntrance = useCallback(() => {
    entranceTimers.current.forEach(window.clearTimeout);
    entranceTimers.current = [];
  }, []);

  useEffect(
    () => () => {
      if (pendingTrigger.current !== null) cancelAnimationFrame(pendingTrigger.current);
      pendingTrigger.current = null;
    },
    [],
  );

  const pendingTrigger = useRef<number | null>(null);
  /** Set by the entrance so it can time arrival from the real dispatch. */
  const onMoveDispatched = useRef<(() => void) | null>(null);
  /** Set by the entrance so each retry can re-hide him if `disappear` was lost. */
  const hideForEntrance = useRef<(() => void) | null>(null);

  const applySlot = useCallback(
    (slotId: SlotId) => {
      const slot = STAGE_SLOTS[slotId];
      if (!slot) return;
      setActiveSlot(slotId);

      // Destination coordinates must be current before Vyom travels.
      syncSlots();
      if (!slot.enterTrigger) return;

      // ...but the trigger has to wait a frame. A trigger sent in the same tick
      // as a number write is swallowed: `.trigger()` returns cleanly and the
      // transition simply never runs. Writing a slot's coordinates and firing
      // its move trigger together is exactly that case, so the two are split
      // across frames.
      const trigger = slot.enterTrigger;
      if (pendingTrigger.current !== null) cancelAnimationFrame(pendingTrigger.current);
      pendingTrigger.current = requestAnimationFrame(() => {
        pendingTrigger.current = null;
        if (binderRef.current?.fire(trigger)) onMoveDispatched.current?.();
      });
    },
    [syncSlots],
  );

  const settled = useRef(false);

  /**
   * Sends Vyom to a slot.
   *
   * Before the artboard settles this schedules the retry ladder instead of a
   * single call, so an early move — the app's own opening step, say — is not
   * silently dropped. A later move always supersedes an earlier one.
   */
  const setFlag = useCallback((name: string, value: boolean) => {
    const ok = binderRef.current?.setBoolean(name, value) ?? false;
    if (!ok) console.warn(`[vyom] no boolean named "${name}" on the ViewModel.`);
    return ok;
  }, []);

  const setValue = useCallback((name: string, value: number) => {
    const ok = binderRef.current?.setNumber(name, value) ?? false;
    if (!ok) console.warn(`[vyom] no number named "${name}" on the ViewModel.`);
    return ok;
  }, []);

  const moveTo = useCallback(
    (slotId: SlotId) => {
      cancelEntrance();
      if (settled.current) {
        applySlot(slotId);
        return;
      }
      entranceTimers.current = ENTRANCE_RETRIES_MS.map((delay) =>
        window.setTimeout(() => applySlot(slotId), delay),
      );
    },
    [applySlot, cancelEntrance],
  );

  const setSlotManual = useCallback(
    (slotId: string, manual: boolean) => {
      setManualSlots((previous) => ({ ...previous, [slotId]: manual }));
      if (!manual) {
        binderRef.current?.invalidate();
        requestSlotSync();
      }
    },
    [requestSlotSync],
  );

  const setSlotPosition = useCallback((slotId: string, point: Point) => {
    const slot = SLOT_LIST.find((candidate) => candidate.id === slotId);
    if (!slot || !binderRef.current) return;
    binderRef.current.setNumber(slot.xProperty, point.x);
    binderRef.current.setNumber(slot.yProperty, point.y);
    setSlotPositions((previous) => ({ ...previous, [slotId]: point }));
  }, []);

  // Send Vyom to the starting slot once everything is bound.
  // See ENTRANCE_RETRIES_MS for why this is a schedule rather than one call.
  //
  // Deliberately no "already entered" ref: under StrictMode the cleanup would
  // cancel the schedule and the guard would then skip the re-run, leaving Vyom
  // wherever the artboard defaults to. Re-scheduling is idempotent, and the
  // effect only re-runs when `isReady` flips.
  useEffect(() => {
    if (!isReady) return;

    settled.current = false;
    const settle = window.setTimeout(() => {
      settled.current = true;
    }, SETTLE_MS);

    entranceTimers.current = ENTRANCE_RETRIES_MS.map((delay) =>
      window.setTimeout(() => {
        hideForEntrance.current?.();
        applySlot(DEFAULT_SLOT);
      }, delay),
    );

    // Hide him for the opening move with the artboard's own trigger. Repeated
    // on each retry rung, because an early `disappear` can be swallowed by the
    // entry transition just as the move can — but never after he has arrived,
    // which would hide him again.
    let arrived = false;
    hideForEntrance.current = () => {
      if (!arrived) binderRef.current?.fire('disappear');
    };
    hideForEntrance.current();

    // Mark him in place a travel-length after the move was actually dispatched.
    // Timing from the dispatch rather than from load means a slow boot, a
    // throttled tab or a swallowed early attempt all push it out with them
    // instead of calling him arrived mid-slide. Each retry re-arms it.
    let arrive = 0;
    onMoveDispatched.current = () => {
      window.clearTimeout(arrive);
      arrive = window.setTimeout(() => {
        arrived = true;
        setEntranceComplete(true);
      }, MOVE_TRAVEL_MS);
    };

    return () => {
      onMoveDispatched.current = null;
      hideForEntrance.current = null;
      window.clearTimeout(settle);
      window.clearTimeout(arrive);
      cancelEntrance();
    };
  }, [applySlot, cancelEntrance, isReady]);

  const value = useMemo<VyomContextValue>(
    () => ({
      rive,
      viewModelInstance,
      binder,
      properties,
      artboardName: artboard?.name ?? null,
      availableArtboards: artboard?.available ?? [],
      isReady,
      loadError,
      activeSlot,
      moveTo,
      fire,
      setFlag,
      setValue,
      registerAnchor,
      requestSlotSync,
      entranceComplete,
      slotPositions,
      manualSlots,
      setSlotManual,
      setSlotPosition,
    }),
    [
      rive,
      viewModelInstance,
      binder,
      properties,
      artboard,
      isReady,
      loadError,
      activeSlot,
      moveTo,
      fire,
      setFlag,
      setValue,
      registerAnchor,
      requestSlotSync,
      entranceComplete,
      slotPositions,
      manualSlots,
      setSlotManual,
      setSlotPosition,
    ],
  );

  return (
    <VyomContext.Provider value={value}>
      <RiveComponentContext.Provider value={RiveComponent}>{children}</RiveComponentContext.Provider>
    </VyomContext.Provider>
  );
}

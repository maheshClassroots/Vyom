import {
  Alignment,
  Fit,
  Layout,
  useRive,
  useViewModel,
  useViewModelInstance,
} from '@rive-app/react-canvas';
import { useEffect, type CSSProperties } from 'react';
import { embeddedRive } from '../vyom/embedded';

/**
 * The Spark mascot, rendered from `spark_placeholder.riv`.
 *
 * Replaces the prototype's static PNG. It plays the default animation of the
 * `Spark` state machine and carries no CSS motion of its own — the float that
 * used to sit on the image is the artboard's job now.
 *
 * Unlike Vyom, Spark is a small inline element rather than a full-screen
 * overlay, so it uses `Fit.Contain` inside whatever box it is given rather
 * than resizing its artboard to the canvas.
 */
const SPARK_SRC = '/spark_placeholder.riv';
const SPARK_STATE_MACHINE = 'Spark';
const SPARK_VIEW_MODEL = 'SparkAnimationControls';

/**
 * How lively Spark is once the artboard has loaded. Written on bind rather
 * than left at the artboard's own default, so the room owns the setting.
 */
const SPARK_ACTIVENESS = 40;

interface SparkRiveProps {
  size: number;
  style?: CSSProperties;
}

export function SparkRive({ size, style }: SparkRiveProps) {
  const embedded = embeddedRive(SPARK_SRC);
  const { rive, RiveComponent } = useRive({
    ...(embedded ? { buffer: embedded } : { src: SPARK_SRC }),
    stateMachines: SPARK_STATE_MACHINE,
    autoplay: true,
    // Bound explicitly below so the ViewModel's name is authoritative.
    autoBind: false,
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
  });

  // Same fallback as VyomProvider: a rename in Rive degrades to the artboard
  // default rather than to an unbound instance.
  const namedViewModel = useViewModel(rive, { name: SPARK_VIEW_MODEL });
  const defaultViewModel = useViewModel(rive, { useDefault: true });
  const viewModel = namedViewModel ?? defaultViewModel;
  const viewModelInstance = useViewModelInstance(viewModel, { rive });

  useEffect(() => {
    if (!viewModelInstance) return;
    const activeness = viewModelInstance.number('activeness');
    if (!activeness) {
      console.warn(`[spark] no "activeness" number on ${SPARK_VIEW_MODEL}`);
      return;
    }
    activeness.value = SPARK_ACTIVENESS;
  }, [viewModelInstance]);

  return (
    <div
      aria-hidden="true"
      style={{ width: size, height: size, flex: 'none', pointerEvents: 'none', ...style }}
    >
      <RiveComponent />
    </div>
  );
}

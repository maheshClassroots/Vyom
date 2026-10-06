import { useViewModelInstanceBoolean } from '@rive-app/react-canvas';
import { useCallback, useContext, useEffect, useRef } from 'react';
import { VyomContext, type VyomContextValue } from './VyomProvider';
import type { SlotId } from './types';

export function useVyom(): VyomContextValue {
  const context = useContext(VyomContext);
  if (!context) throw new Error('useVyom must be used inside <VyomProvider>.');
  return context;
}

/**
 * Marks a DOM element as the resting spot for a slot.
 *
 * The element's centre is measured and written into the slot's X/Y ViewModel
 * properties whenever it moves or resizes, so Vyom's position stays correct
 * across breakpoints, panel resizes and font changes without any media queries.
 *
 *   const ref = useVyomAnchor('canvas');
 *   <div ref={ref} className="vyom-anchor" />
 */
export function useVyomAnchor<T extends HTMLElement = HTMLDivElement>(slotId: SlotId) {
  const { registerAnchor, requestSlotSync } = useVyom();
  const observerRef = useRef<ResizeObserver | null>(null);
  // The element this anchor last claimed, so that giving the slot up can say
  // which element is giving it up rather than clearing it blind.
  const heldRef = useRef<T | null>(null);

  return useCallback(
    (element: T | null) => {
      observerRef.current?.disconnect();
      observerRef.current = null;

      registerAnchor(slotId, element, heldRef.current);
      heldRef.current = element;
      if (!element) return;

      // Watch the anchor and its container: the anchor's size rarely changes,
      // but the layout around it does, which moves the anchor.
      const observer = new ResizeObserver(() => requestSlotSync());
      observer.observe(element);
      if (element.offsetParent instanceof HTMLElement) observer.observe(element.offsetParent);
      observer.observe(document.documentElement);
      observerRef.current = observer;
    },
    [registerAnchor, requestSlotSync, slotId],
  );
}

/** Convenience wrapper for navigation between slots. */
export function useVyomStage() {
  const { activeSlot, moveTo, isReady } = useVyom();
  return { activeSlot, moveTo, isReady };
}

/**
 * Fires a named trigger. The name is checked against the live ViewModel, so a
 * trigger added in Rive is usable here the moment the file is republished.
 */
export function useVyomTrigger(name: string) {
  const { fire } = useVyom();
  return useCallback(() => fire(name), [fire, name]);
}

/** Sets a named boolean on the ViewModel. */
export function useVyomBoolean(name: string) {
  const { setFlag } = useVyom();
  return useCallback((value: boolean) => setFlag(name, value), [setFlag, name]);
}

/**
 * Reads a named boolean back off the ViewModel, re-rendering when it changes.
 *
 * The read side of `useVyomBoolean`, for UI that has to follow a Rive property
 * rather than drive it — the property is the source of truth, so the dev
 * panel's checkbox, `setFlag` and the artboard itself all move it, and every
 * reader sees the same value. Missing names read `false`.
 */
export function useVyomBooleanValue(name: string) {
  const { viewModelInstance } = useVyom();
  const { value } = useViewModelInstanceBoolean(name, viewModelInstance);
  return value ?? false;
}

/** Fires a trigger once, when `active` flips to true. */
export function useVyomTriggerOn(name: string, active: boolean) {
  const fire = useVyomTrigger(name);
  const previous = useRef(false);
  const { isReady } = useVyom();

  useEffect(() => {
    if (!isReady) return;
    if (active && !previous.current) fire();
    previous.current = active;
  }, [active, fire, isReady]);
}

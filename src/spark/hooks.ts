import { useCallback, useContext } from 'react';
import { SparkContext, type SparkContextValue } from './SparkProvider';

export function useSpark(): SparkContextValue {
  const context = useContext(SparkContext);
  if (!context) throw new Error('useSpark must be used inside <SparkProvider>.');
  return context;
}

/**
 * Fires a named trigger. The name is checked against the live ViewModel, so a
 * trigger added in Rive is usable here the moment the file is republished.
 */
export function useSparkTrigger(name: string) {
  const { fire } = useSpark();
  return useCallback(() => fire(name), [fire, name]);
}

/** Holds a named boolean — `isSpeaking`, `isCurious`, `isConfused`. */
export function useSparkBoolean(name: string) {
  const { setFlag } = useSpark();
  return useCallback((value: boolean) => setFlag(name, value), [setFlag, name]);
}

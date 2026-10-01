import { createContext, type ComponentProps, type JSX } from 'react';

/**
 * Carries the canvas component `useRive` hands back, so the provider can own
 * the Rive instance while `SparkRive` decides where on the page it draws.
 *
 * Mirrors `RiveComponentContext` for Vyom. Kept in its own module so the
 * provider file exports components only, which is what Fast Refresh wants.
 */
export const SparkRiveComponentContext = createContext<
  ((props: ComponentProps<'canvas'>) => JSX.Element) | null
>(null);

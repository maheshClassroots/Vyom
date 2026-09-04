import { createContext, type ComponentProps, type JSX } from 'react';

/**
 * Carries the canvas component produced by `useRive` so `VyomStage` can render
 * it anywhere in the tree while the provider keeps ownership of the instance.
 * Kept in its own module so the provider file exports only components/hooks,
 * which is what Fast Refresh needs to patch it without a full reload.
 */
export const RiveComponentContext = createContext<
  ((props: ComponentProps<'canvas'>) => JSX.Element) | null
>(null);

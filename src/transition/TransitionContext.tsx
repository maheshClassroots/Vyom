import { createContext, useContext } from 'react';
import type { TransitionPhase } from './useHomeToRoom';

/**
 * The phase, published to whichever screen is showing.
 *
 * The transition is orchestrated by the shell, but two of its steps are about
 * things inside a page — the home page's elements collapsing, the intro
 * slide's content waiting its turn — and those pages need to know where the
 * sequence has got to. Context rather than props because the room is several
 * components deep and only one of them cares.
 */
export const TransitionContext = createContext<TransitionPhase>('idle');

export function useTransitionPhase() {
  return useContext(TransitionContext);
}

/**
 * True while the room is on screen but its slide is still waiting to speak.
 *
 * Covers everything up to and including `presenting`: the gesture leads and
 * the words follow it, so the title, description and formula stay hidden until
 * Vyom is visibly presenting them. `idle` shows them — which is also the right
 * answer for a room reached any other way, with no transition at all.
 */
export function introStillHidden(phase: TransitionPhase) {
  return phase !== 'idle';
}

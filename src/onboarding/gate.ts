/** Set once the onboarding has been completed on this browser. */
export const ONBOARDED_KEY = 'vyomOnboarded';
/** The lesson the onboarding's first class opens. */
export const FIRST_LESSON = 'fractions';

/**
 * Whether the app opens on the onboarding: until it has been completed here,
 * or whenever the page is opened with `?onboarding` (to replay it).
 */
export function startsOnOnboarding(): boolean {
  try {
    if (new URLSearchParams(window.location.search).has('onboarding')) return true;
    return localStorage.getItem(ONBOARDED_KEY) !== '1';
  } catch {
    return false;
  }
}

/**
 * The platform frame, and the one place that decides which screen is showing.
 *
 * The app opens on the home page; choosing a lesson plays the transition, which
 * empties the screen toward Vyom, sends him to the centre while the module
 * loads, and then builds the teaching room back out of him. Going back plays
 * the same gesture, shorter. The shell owns both because it is the only thing
 * that sees both screens — neither is mounted or unmounted by the click, but
 * partway through the sequence it starts.
 *
 * Both character stages and all three dev surfaces are mounted for the life of
 * the app, above whichever screen is showing. The characters are one artboard
 * each from first paint to last, and the dev tools are reachable from the home
 * page as well as the lesson — a sequence is built and played against the same
 * two artboards either way.
 */

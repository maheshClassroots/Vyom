import { useCallback, useState } from 'react';
import { ChallengesPage } from '../challenges';
import { HomePage } from '../home';
import { TeachingRoom } from '../room/TeachingRoom';
import { Surface, TransitionContext, useHomeToRoom } from '../transition';
import { SequenceComposer, useVyomBooleanValue, VyomDevPanel, VyomStage } from '../vyom';
import { SparkDevPanel, SparkStage } from '../spark';
import '../transition/transition.css';

const STUDENT_NAME = 'Aarav';

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
export function AppShell() {
  const [lessonId, setLessonId] = useState<string | null>(null);
  const inLesson = lessonId !== null;
  // A page Vyom is not on: he disappears on the way there and reappears on
  // the way back. Placeholder for now — see `ChallengesPage`.
  const [inChallenges, setInChallenges] = useState(false);

  const mountRoom = useCallback((id: string) => setLessonId(id), []);
  const { phase, begin, leave, swap, isRunning } = useHomeToRoom({ mountRoom });

  // The surface follows the character's own theme, which is where the room's
  // background used to read it from.
  const isDarkMode = useVyomBooleanValue('isDarkMode');

  const exitLesson = useCallback(() => {
    void leave(() => setLessonId(null));
  }, [leave]);

  const openChallenges = useCallback(() => {
    void swap(() => setInChallenges(true), { out: 'disappear' });
  }, [swap]);

  const closeChallenges = useCallback(() => {
    void swap(() => setInChallenges(false), { in: 'appear' });
  }, [swap]);

  return (
    <TransitionContext.Provider value={phase}>
      <div className={`shell${phase !== 'idle' ? ` xit--${phase}` : ''}`}>
        <main className="shell__frame">
          {/* Painted once and never faded. Its colour is the cue that the room
              has loaded: it follows `inLesson`, which flips the moment the
              room mounts — part way through the blank, before its contents
              come up. So the surface changes first and the room arrives on a
              surface that has already become the room's. */}
          <Surface tint={inLesson ? 'room' : 'home'} dark={isDarkMode} />

          <div className="shell__page">
            {inLesson ? (
              <TeachingRoom onExit={exitLesson} />
            ) : inChallenges ? (
              <ChallengesPage onBack={closeChallenges} disabled={isRunning} />
            ) : (
              // A second tap while the screen is already emptying would start
              // the sequence again from the top, so the page stops listening.
              <HomePage
                studentName={STUDENT_NAME}
                onOpenLesson={begin}
                onOpenChallenges={openChallenges}
                disabled={isRunning}
              />
            )}
          </div>
        </main>

        {/* Rendered last, and on their own z-index tier, so the characters and
            the dev tools draw above either screen — including the room's own
            overlays, which climb into the thousands. Which screen is showing
            only decides where the slot anchors sit, so moving between them is a
            move within the artboard rather than a teardown. */}
        <VyomStage />
        <SparkStage />
        <VyomDevPanel />
        <SparkDevPanel />
        <SequenceComposer />
      </div>
    </TransitionContext.Provider>
  );
}

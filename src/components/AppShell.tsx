import { useCallback, useRef, useState } from 'react';
import { ChallengesPage } from '../challenges';
import { HomePage, type GoalChat } from '../home';
import { DesignPage, GoalPathDevPanel, type DesignDestination, type DesignPageId } from '../design';
import { FIRST_LESSON, ONBOARDED_KEY, OnboardingCast, OnboardingLaunch, startsOnOnboarding, type LaunchHandle } from '../onboarding';
import { TeachingRoom } from '../room/TeachingRoom';
import { Surface, TransitionContext, useHomeToRoom } from '../transition';
import { SequenceComposer, useVyomBooleanValue, VyomDevPanel, VyomStage } from '../vyom';
import { SparkDevPanel, SparkStage } from '../spark';
import '../transition/transition.css';

const STUDENT_NAME = 'Aarav';

export function AppShell() {
  const [lessonId, setLessonId] = useState<string | null>(null);
  const inLesson = lessonId !== null;
  // A page of the design package — the Chapter Journey or the Goals Journey —
  // hosted in a frame. Vyom is not on them (they draw their own), so he
  // leaves the way he does for Challenges, and a module tapped there opens
  // the lesson with the same load sequence as from home, with him
  // reappearing in the middle of it.
  const [designPage, setDesignPage] = useState<DesignPageId | null>(() => (startsOnOnboarding() ? 'onboarding' : null));
  // The Goal Page's "set / change goal" taps open the home chat in that
  // thread; the mode travels in the query of the file it asked for.
  const [goalChat, setGoalChat] = useState<GoalChat | null>(null);
  // A page Vyom is not on: he disappears on the way there and reappears on
  // the way back. Placeholder for now — see `ChallengesPage`.
  const [inChallenges, setInChallenges] = useState(false);

  // Mounting the room also leaves a design page, which is the other place a
  // lesson can be opened from: the frame comes down with the blank, so the
  // room rises on its own.
  const mountRoom = useCallback((id: string) => {
    setLessonId(id);
    setDesignPage(null);
  }, []);
  const { phase, begin, launchFromOnboarding, leave, swap, isRunning } = useHomeToRoom({ mountRoom });

  // The onboarding's launch animation, mounted for the run from Start into
  // the first class and taken down once the room is up.
  const [launching, setLaunching] = useState(false);
  const launch = useRef<LaunchHandle>(null);
  const startFirstClass = useCallback(() => {
    try {
      localStorage.setItem(ONBOARDED_KEY, '1');
    } catch {
      /* storage may be unavailable; the onboarding will show again */
    }
    // The cast follower stands down; the sequence takes the two characters
    // on from where it left them.
    setLaunching(true);
    // The overlay mounts on the next commit; the sequence waits on its
    // handle through `ready`, so everything it needs is loaded before
    // anything is fired.
    void (async () => {
      const handle = await new Promise<LaunchHandle>((resolve) => {
        const poll = () => (launch.current ? resolve(launch.current) : requestAnimationFrame(poll));
        poll();
      });
      await launchFromOnboarding(FIRST_LESSON, handle, () => setDesignPage(null));
      setLaunching(false);
    })();
  }, [launchFromOnboarding]);

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

  const openDesignPage = useCallback(
    (page: DesignPageId) => {
      void swap(() => {
        setDesignPage(page);
        setGoalChat(null);
      }, { out: 'disappear' });
    },
    [swap],
  );

  /**
   * A design page asked to go somewhere, by the name of the file it would
   * have loaded. Home, the teaching room and the other hosted page exist
   * here; the rest of the package does not, and those taps are left where
   * they are.
   */
  const leaveDesignPage = useCallback(
    (to: DesignDestination, file: string) => {
      if (to === 'home') {
        const query = new URLSearchParams(file.split('?')[1] ?? '');
        const mode = query.get('goalChat');
        void swap(() => {
          setDesignPage(null);
          setGoalChat(mode ? { mode, goal: query.get('goal') } : null);
        }, { in: 'appear' });
      } else if (to === 'lesson' && designPage === 'onboarding') {
        // The onboarding's Start: through the launch animation into the
        // first class.
        startFirstClass();
      } else if (to === 'lesson') {
        // The same load sequence as from home; Vyom is off stage here, and
        // the sequence sees that for itself.
        void begin('fractions');
      } else if (to === 'journey' || to === 'goal' || to === 'onboarding') {
        // Page to page: he is off stage on both, so no cue either way.
        void swap(() => setDesignPage(to));
      } else {
        console.warn(`[design] "${file}" is not part of this build`);
      }
    },
    [begin, swap, designPage, startFirstClass],
  );

  return (
    <TransitionContext.Provider value={phase}>
      <div className={`shell${phase !== 'idle' ? ` xit--${phase}` : ''}`} data-launch={launching || undefined}>
        <main className="shell__frame">
          {/* Painted once and never faded. Its colour is the cue that the room
              has loaded: it follows `inLesson`, which flips the moment the
              room mounts — part way through the blank, before its contents
              come up. So the surface changes first and the room arrives on a
              surface that has already become the room's. */}
          <Surface tint={inLesson || designPage ? 'room' : 'home'} dark={isDarkMode} />

          <div className="shell__page">
            {inLesson ? (
              <TeachingRoom onExit={exitLesson} />
            ) : inChallenges ? (
              <ChallengesPage onBack={closeChallenges} disabled={isRunning} />
            ) : designPage ? (
              <DesignPage page={designPage} onNavigate={leaveDesignPage} />
            ) : (
              // A second tap while the screen is already emptying would start
              // the sequence again from the top, so the page stops listening.
              <HomePage
                studentName={STUDENT_NAME}
                onOpenLesson={begin}
                onOpenChallenges={openChallenges}
                onOpenJourney={() => openDesignPage('journey')}
                onOpenGoal={() => openDesignPage('goal')}
                onOpenOnboarding={() => openDesignPage('onboarding')}
                goalChat={goalChat}
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
        {designPage === 'onboarding' && !launching && <OnboardingCast />}
        <VyomStage />
        {/* Between the two stages: the launch piece's network draws over Vyom
            and under Spark (the shell lifts her stage while it plays). Mounted
            with the onboarding page, so its Lottie is loaded before Start. */}
        {(designPage === 'onboarding' || launching) && <OnboardingLaunch ref={launch} lessonId={FIRST_LESSON} />}
        <SparkStage />
        <VyomDevPanel />
        <SparkDevPanel />
        <SequenceComposer />
        {designPage === 'goal' && <GoalPathDevPanel />}
      </div>
    </TransitionContext.Provider>
  );
}

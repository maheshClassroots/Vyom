import { useState } from 'react';
import { HomePage } from '../home';
import { TeachingRoom } from '../room/TeachingRoom';
import { SequenceComposer, VyomDevPanel, VyomStage } from '../vyom';
import { SparkDevPanel, SparkStage } from '../spark';

const STUDENT_NAME = 'Aarav';

/**
 * The platform frame, and the one place that decides which screen is showing.
 *
 * The app opens on the home page; choosing a lesson swaps in the teaching
 * room. `shell__frame` hosts whichever is current, and the Rive stages are
 * full-viewport overlays so a character can cross the whole screen in one
 * continuous animation.
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

  return (
    <div className="shell">
      <main className="shell__frame">
        {inLesson ? (
          <TeachingRoom onExit={() => setLessonId(null)} />
        ) : (
          <HomePage studentName={STUDENT_NAME} onOpenLesson={setLessonId} />
        )}
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
  );
}

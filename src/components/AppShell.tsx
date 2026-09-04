import { TeachingRoom } from '../room/TeachingRoom';
import { VyomDevPanel, VyomStage } from '../vyom';

/**
 * The platform frame. `shell__frame` hosts the teaching room; the Rive stage is
 * a single overlay spanning the whole viewport so Vyom can cross between the
 * chat dock and the content stage in one continuous animation.
 */
export function AppShell() {
  return (
    <div className="shell">
      <main className="shell__frame">
        <TeachingRoom />
      </main>

      {/* Rendered last so the character draws above the UI. */}
      <VyomStage />
      <VyomDevPanel />
    </div>
  );
}

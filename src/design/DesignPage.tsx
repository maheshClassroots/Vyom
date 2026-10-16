import { useEffect, useRef, useState } from 'react';
import './design.css';

/**
 * The pages the app hosts: where each lives under `public/design/`, and the
 * file name the package gives it — see `scripts/import-design.mjs` for which
 * package each comes from.
 */
export const DESIGN_PAGES = {
  /** The earlier package's Chapter Journey: Rive chapter icons, module nodes, Spark on the thread. */
  journey: { dir: 'journey', file: 'Chapter Journey.dc.html', title: 'Chapter Journey' },
  /** The later package's Goal Page: the "Unit test 2" step thread with the rail. */
  goal: { dir: 'goal', file: 'Goal Page.dc.html', title: 'Goals Journey' },
} as const;

export type DesignPageId = keyof typeof DESIGN_PAGES;

/** What a page asked to navigate to, by the file it named. */
export type DesignDestination = 'home' | 'lesson' | DesignPageId | 'unknown';

interface DesignPageProps {
  page: DesignPageId;
  /** The page asked to go somewhere; `file` is the file it named. */
  onNavigate: (to: DesignDestination, file: string) => void;
}

function classify(file: string): DesignDestination {
  if (file.startsWith('Home Page')) return 'home';
  // Both teaching-room variants in the package are this app's one room.
  if (file.startsWith('Teaching Room')) return 'lesson';
  // The packages' own names for the two hosted pages: their rails link
  // "Goals" to a Goal Page and "Chapters" to a Chapter Journey variant.
  if (file.startsWith('Goal Page')) return 'goal';
  if (file.startsWith('Chapter Journey')) return 'journey';
  return 'unknown';
}

/**
 * A page of the design package, hosted as-is.
 *
 * These pages are documents in the design tool's runtime — templated
 * `DCLogic` classes with their own WebGL, camera moves, Rive islands and
 * FTUE sequences. They are run as-is in a frame rather than rebuilt here,
 * which is what keeps every pixel and every animation exactly as designed;
 * `scripts/import-design.mjs` says how they get into `public/design/` and
 * what little is changed on the way.
 *
 * The only seam is navigation: a page posts the name of the file it would
 * have gone to, and the shell swaps screens. Vyom is not on these pages —
 * they carry their own — so the shell takes him off on the way in and brings
 * him back on the way out.
 */
export function DesignPage({ page, onNavigate }: DesignPageProps) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);

  // Read through a ref so the listener never goes stale.
  const navigate = useRef(onNavigate);
  navigate.current = onNavigate;

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      // Only this frame, and only our own origin: the pages are served from
      // `public/`, so anything else is not one of them.
      if (event.origin !== window.location.origin) return;
      if (event.source !== frame.current?.contentWindow) return;
      const data = event.data as { type?: unknown; page?: unknown };
      if (data?.type !== 'design-nav' || typeof data.page !== 'string') return;
      navigate.current(classify(data.page), data.page);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return (
    <div className="design">
      <iframe
        // A new frame per page, so switching pages does not keep the old
        // one's document around.
        key={page}
        ref={frame}
        className="design__frame"
        data-loaded={loaded}
        src={`/design/${DESIGN_PAGES[page].dir}/${encodeURIComponent(DESIGN_PAGES[page].file)}`}
        title={DESIGN_PAGES[page].title}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}

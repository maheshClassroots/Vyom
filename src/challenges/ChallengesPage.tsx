import './challenges.css';

interface ChallengesPageProps {
  /** Back to the home page. */
  onBack: () => void;
  /** Set while a transition is running, so a second tap cannot restart it. */
  disabled?: boolean;
}

/** Placeholder rows, so the page has a shape to design against. */
const PLACEHOLDERS = [
  { id: 'daily', title: 'Daily challenge', meta: 'Placeholder' },
  { id: 'weekly', title: 'Weekly streak', meta: 'Placeholder' },
  { id: 'boss', title: 'Chapter boss', meta: 'Placeholder' },
];

/**
 * The Challenges screen — a stand-in.
 *
 * The design for this page has not been built yet. What is here is the frame
 * the real one will drop into: a header with the way back, a title, and a
 * column of dummy rows. Vyom is not on this page — he leaves as the home page
 * goes and returns with it — so there are no slot anchors here.
 */
export function ChallengesPage({ onBack, disabled = false }: ChallengesPageProps) {
  return (
    <div className="challenges">
      <header className="challenges__chrome">
        <button
          type="button"
          className="challenges__back"
          onClick={onBack}
          disabled={disabled}
          aria-label="Back to home"
        >
          <i className="ti ti-arrow-left" />
        </button>
        <h1 className="challenges__title">Challenges</h1>
      </header>

      <main className="challenges__body">
        <p className="challenges__note">Design to come — this page is a placeholder.</p>
        <ul className="challenges__list">
          {PLACEHOLDERS.map((item) => (
            <li key={item.id} className="challenges__row">
              <span className="challenges__row-icon" aria-hidden="true">
                <i className="ti ti-trophy" />
              </span>
              <span className="challenges__row-text">
                <span className="challenges__row-title">{item.title}</span>
                <span className="challenges__row-meta">{item.meta}</span>
              </span>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}

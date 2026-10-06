import { VyomAnchor } from '../vyom';
import { GOAL, HERO_RINGS, LESSONS, STATS, type LessonCard } from './lessons';
// The room's stylesheet carries the Tabler icon font and the Mantine tokens
// the design draws on, and the home page is shown before the room ever
// mounts — so it is pulled in here rather than left to the room.
import '../room/prototype.css';
import './home.css';

interface HomePageProps {
  /** Called with the lesson id when a class is opened. */
  onOpenLesson: (lessonId: string) => void;
  studentName: string;
  /** Set while the transition is running, so a second tap cannot restart it. */
  disabled?: boolean;
}

/**
 * The landing screen, ported from the design's `Home Page.dc.html`.
 *
 * That file is a shell: the screen itself is built by `app-cosmos.js`, whose
 * home branch is reproduced here — goal chrome, orbiting hero, "Resume a
 * class" tiles, journey buttons and the composer. The design's own tiles call
 * `openTeachingRoom()`, so a tile here opens the room too.
 *
 * Vyom is not drawn here: he lives on the app-wide stage, and the hero only
 * marks where he should stand with a slot anchor. The box is kept so the
 * layout reserves his space and the rings stay centred on him.
 *
 * The composer and the two journey buttons are presentational: the pages they
 * lead to in the design (Chapter Journey, Challenges) do not exist in this
 * app, so they are rendered but inert rather than faked.
 *
 * Nothing here takes part in the page transition individually — the shell
 * fades the whole frame. Vyom is outside it, which is what leaves him standing
 * while the page goes.
 */
export function HomePage({ onOpenLesson, studentName, disabled = false }: HomePageProps) {
  return (
    <div className="home">
      <header className="home__chrome">
        <div className="home__brand" aria-hidden="true">
          <i className="ti ti-planet" />
        </div>

        <div className="home__goal">
          <p className="home__goal-text">
            <strong>{GOAL.pct}%</strong> {GOAL.label}
          </p>
          <span
            className="home__goal-bar"
            role="progressbar"
            aria-valuenow={GOAL.pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${GOAL.pct}% ${GOAL.label}`}
          >
            <span className="home__goal-fill" style={{ width: `${GOAL.pct}%` }} />
          </span>
        </div>

        <div className="home__stats">
          <span className="home__stat">
            <i className="ti ti-star-filled home__stat-star" />
            {STATS.stars.toLocaleString('en-IN')}
          </span>
          <span className="home__stat-divide" aria-hidden="true" />
          <span className="home__stat">
            <span className="home__orb" aria-hidden="true" />
            {STATS.orbs}
          </span>
          <span className="home__avatar">
            <img src="/home/aarav-avatar.png" alt={studentName} />
            <i className="ti ti-chevron-down" />
          </span>
        </div>
      </header>

      <main className="home__hero">
        <div className="home__mascot-wrap">
          <span className="home__mascot-glow" aria-hidden="true" />
          <span className="home__rings" aria-hidden="true">
            {HERO_RINGS.map((icons, ring) => (
              <span
                key={ring}
                className="ringx"
                style={{ animationDuration: '4.2s', animationDelay: `${(ring * 4.2) / 3}s` }}
              >
                <span className="ringx-line" />
                {icons.map((icon, index) => {
                  // Icons sit evenly around the ring, starting at twelve o'clock.
                  const angle = (index / icons.length) * Math.PI * 2 - Math.PI / 2;
                  return (
                    <span
                      key={icon}
                      className="home__ring-icon"
                      style={{
                        left: `${50 + 50 * Math.cos(angle)}%`,
                        top: `${50 + 50 * Math.sin(angle)}%`,
                      }}
                    >
                      <i className={`ti ti-${icon}`} />
                    </span>
                  );
                })}
              </span>
            ))}
          </span>
          <span className="home__mascot" aria-hidden="true">
            {/* Both slots are anchored here, not just `learn`.
                The artboard reads `chatposX/Y` as well as `learnWindowX/Y`,
                and a slot left unanchored keeps the file's own default — on
                home that parked Vyom near the bottom of the screen. The room
                anchors these same two slots to the lesson canvas and the chat
                dock, so moving between screens re-points them rather than
                swapping characters. */}
            <VyomAnchor slot="learn" x="50%" y="50%" />
            <VyomAnchor slot="chat" x="50%" y="50%" />
          </span>
        </div>

        <h1 className="home__greeting">Hi {studentName}! 👋</h1>
        <p className="home__sub">Pick up where you left off — or ask me anything below.</p>

        <section className="home__resume" aria-labelledby="home-resume">
          <h2 className="home__label" id="home-resume">
            Resume a class
          </h2>
          {LESSONS.map((lesson) => (
            <ResumeTile
              key={lesson.id}
              lesson={lesson}
              onOpen={onOpenLesson}
              disabled={disabled}
            />
          ))}
        </section>
      </main>

      <footer className="home__foot">
        <div className="home__jumps">
          <button type="button" className="home__jump" disabled title="Not part of this build">
            Chapter Journey
          </button>
          <button type="button" className="home__jump" disabled title="Not part of this build">
            Challenges
          </button>
        </div>

        <div className="home__composer">
          <span className="home__composer-glow" aria-hidden="true" />
          <div className="home__composer-inner">
            <span className="home__composer-icon" aria-hidden="true">
              <i className="ti ti-paperclip" />
            </span>
            <input
              className="home__composer-input"
              placeholder="Ask Vyom anything…"
              aria-label="Ask Vyom anything"
              disabled
            />
            <span className="home__composer-icon" aria-hidden="true">
              <i className="ti ti-microphone" />
            </span>
            <span className="home__composer-send" aria-hidden="true">
              <i className="ti ti-send" />
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

interface ResumeTileProps {
  lesson: LessonCard;
  onOpen: (lessonId: string) => void;
  disabled: boolean;
}

function ResumeTile({ lesson, onOpen, disabled }: ResumeTileProps) {
  return (
    <button
      type="button"
      className="resume"
      onClick={() => onOpen(lesson.id)}
      disabled={disabled}
    >
      <span className="resume__icon" aria-hidden="true">
        <i className={`ti ti-${lesson.icon}`} />
      </span>
      <span className="resume__text">
        <span className="resume__chapter">{lesson.chapter}</span>
        <span className="resume__title">{lesson.title}</span>
      </span>
      <span className="resume__go" aria-hidden="true">
        <i className="ti ti-player-play-filled" />
      </span>
    </button>
  );
}

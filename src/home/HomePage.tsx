import { useCallback, useEffect, useRef, useState } from 'react';
import { ASSET } from '../room/css';
import { useVyom, VyomAnchor } from '../vyom';
import { nextFrame, sleep, STATE_SETTLE_MS, waitFor, waitUntilBusy, waitWhileBusy } from '../vyom/sequencing';
import { vyomOwner } from './chat';
import { ChatThread, Composer } from './HomeChat';
import { HERO_RINGS, LESSONS, STATS, type LessonCard } from './lessons';
import { RotatingGoals } from './RotatingGoals';
import { useHomeChat, type GoalChat } from './useHomeChat';
// The room's stylesheet carries the Tabler icon font and the Mantine tokens
// the design draws on, and the home page is shown before the room ever
// mounts — so it is pulled in here rather than left to the room.
import '../room/prototype.css';
import './home.css';

/** How long the hero's launch plays before the journey opens — the design's `doLaunch`. */
const LAUNCH_MS = 1050;

/**
 * How long he is given to reach a line before its text appears.
 *
 * The artboard never raises its busy flag for a walk, so these are clock
 * values: the long one covers the scale-down and the walk from the hero to
 * his first seat, the short one a hop from the typing row to the line that
 * replaces it.
 */
const ARRIVE_FROM_HERO_MS = 1000;
const ARRIVE_MS = 400;

/** How long a walk takes — the scroll hook is muted for this long after a move goes out. */
const WALK_MS = 1000;

/**
 * The page's own motion has to land before a seat can be measured.
 *
 * Anchors are measured from the DOM, and a transform mid-flight measures
 * where the element is now, not where it will stop. The hero and the thread
 * slide in and out, so their transforms are polled until they read `none`,
 * up to this ceiling — generous, because a document that is not being
 * painted (a background tab) advances its transitions only when it is; a
 * new row rises over 0.3s, which is waited out by the clock. A seat read
 * before that lands sends him to the wrong place — or, for the hero, off the
 * top of the screen.
 */
const SLIDE_MAX_MS = 4000;
const ROW_IN_MS = 320;
/**
 * While the thread scrolls he stays inside its window: his seat may leave
 * through the top or the bottom, but he stops at the edge and waits there —
 * this far in from the thread's visible top and bottom, so the small
 * character is wholly in view (the top also clears the chrome that overlaps
 * the thread's first rows).
 */
const STICK_TOP_PX = 136;
const STICK_BOTTOM_PX = 56;

interface HomePageProps {
  /** Called with the lesson id when a class is opened. */
  onOpenLesson: (lessonId: string) => void;
  /** Opens the Practice placeholder (the design's Assessments page is not in this build). */
  onOpenChallenges: () => void;
  /** Opens the Chapter Journey. */
  onOpenJourney: () => void;
  /** Opens the Goals Journey — the design's Goal Page. */
  onOpenGoal: () => void;
  /** Opened from the Goal Page's "set / change goal": the chat starts in that thread. */
  goalChat?: GoalChat | null;
  studentName: string;
  /** Set while a transition is running, so a second tap cannot restart it. */
  disabled?: boolean;
}

/**
 * The landing screen, ported from the design's `Home Page.dc.html`.
 *
 * That file is a shell: the screen itself is built by `app-cosmos.js`, whose
 * home branch is reproduced here — the left rail, goal chrome, orbiting hero,
 * "Pick up where you left off" tiles and the chat. The chat is the design's
 * `HomeChat`: sending from the hero slides the thread in over it, Vyom works
 * through the demo's doubt in stages, checks in, and compresses the thread
 * into a summary once it is understood.
 *
 * Vyom is not drawn here: he lives on the app-wide stage, and this page only
 * marks where he should stand with a slot anchor — in the hero, or, with the
 * chat open, beside his newest line, which he walks down to as the thread
 * grows. He is small in the chat and full-size in the hero, by the artboard's
 * own scale triggers.
 *
 * The rail is the design's navigation: Goals and Chapters open the hosted
 * design pages; Practice opens the placeholder, since the design's page is
 * not in this build; the profile tile is inert for the same reason.
 *
 * Nothing here takes part in the page transition individually — the shell
 * fades the whole frame. Vyom is outside it, which is what leaves him standing
 * while the page goes.
 */
export function HomePage({
  onOpenLesson,
  onOpenChallenges,
  onOpenJourney,
  onOpenGoal,
  goalChat = null,
  studentName,
  disabled = false,
}: HomePageProps) {
  const chat = useHomeChat({ goalChat, onGoalDone: onOpenGoal });
  const { convo, messages, thinking, exitConvo } = chat;
  const [launch, setLaunch] = useState(false);
  const [heroHover, setHeroHover] = useState(false);
  const hero = useRef<HTMLElement>(null);
  const thread = useRef<HTMLDivElement>(null);

  /* ------------------------------------------------- Vyom follows the chat */
  const { viewModelInstance, binder, requestSlotSync, measureSlot } = useVyom();
  const vmi = useRef(viewModelInstance);
  vmi.current = viewModelInstance;
  const bind = useRef(binder);
  bind.current = binder;

  // Where his anchor is: the hero, or the row that holds him in the thread.
  const owner = convo ? (vyomOwner(messages, thinking) ?? '__typing__') : 'hero';
  // The newest line of his whose text may show. A line is pending until he
  // has reached its seat, so the text appears where he already stands.
  const [revealed, setRevealed] = useState(0);
  // Where he was last actually sent — written only once the move has gone
  // out, so a cancelled run leaves it alone.
  const applied = useRef('hero');
  // The scroll hook is muted while a walk is in flight: the thread pins to
  // the bottom as a line lands, and a parked-position write from that scroll
  // would snap him mid-walk. Only the walk moves him between lines.
  const walkingUntil = useRef(0);
  // The scale-down that follows the opening walk, pending until he arrives.
  const entryScale = useRef(0);
  useEffect(() => () => window.clearTimeout(entryScale.current), []);

  useEffect(() => {
    const from = applied.current;
    if (from === owner) return;
    let alive = true;
    const fire = (name: string) => vmi.current?.trigger(name)?.trigger();
    const isBusy = () => vmi.current?.boolean('actionPlaying')?.value === true;
    const stillAlive = () => alive;
    // The `learn` slot is his seat: once the page has stopped moving, its
    // anchor is synced, and the move trigger follows a frame later.
    const seatThenMove = async (settle: () => Promise<unknown>) => {
      await settle();
      if (!alive) return false;
      requestSlotSync();
      await nextFrame();
      if (!alive) return false;
      fire('moveToPoint');
      return true;
    };
    // The hero and the thread slide in and out; a seat inside either is only
    // measured once that element has come to rest.
    const atRest = (el: HTMLElement | null) =>
      waitFor(() => !el || getComputedStyle(el).transform === 'none', stillAlive, SLIDE_MAX_MS);
    walkingUntil.current = Infinity;
    void (async () => {
      if (from === 'hero') {
        // Into the chat: once the thread has slid in, he walks to his seat
        // at full size, and shrinks on arrival. The scale-down is its own
        // timer, so a line landing mid-walk cannot cancel it.
        if (!(await seatThenMove(() => atRest(thread.current)))) return;
        window.clearTimeout(entryScale.current);
        entryScale.current = window.setTimeout(() => fire('scaleSmall'), WALK_MS);
      } else if (owner === 'hero') {
        // Home: full size first, then the walk. Unlike the scale-down, the
        // scale-up raises the busy flag and drops it, so it is waited out —
        // sent together, the move is lost — and the hero has slid back into
        // place by the time it has.
        window.clearTimeout(entryScale.current);
        fire('scaleFull');
        await sleep(STATE_SETTLE_MS);
        await waitUntilBusy(isBusy, stillAlive);
        await waitWhileBusy(isBusy, stillAlive);
        if (!alive) return;
        if (!(await seatThenMove(() => atRest(hero.current)))) return;
      } else if (!(await seatThenMove(() => sleep(ROW_IN_MS)))) {
        return;
      }
      applied.current = owner;
      walkingUntil.current = performance.now() + WALK_MS;
      // His line's text follows him in: it shows once he has had time to
      // reach the seat beside it.
      const id = owner.startsWith('m') ? Number(owner.slice(1)) : 0;
      if (id) {
        await sleep(from === 'hero' ? ARRIVE_FROM_HERO_MS : ARRIVE_MS);
        if (!alive) return;
        setRevealed((r) => Math.max(r, id));
      }
    })();
    return () => {
      alive = false;
      walkingUntil.current = 0;
    };
  }, [owner, requestSlotSync]);

  /**
   * The thread scrolled: his seat moved under him. He is hooked to it through
   * the artboard's own reference position — `refPosX` / `refPosY` are where
   * he is parked — rather than walked, so he tracks the line frame for frame,
   * and sticks at the thread's top or bottom edge once the line has left.
   * Muted while a walk is in flight.
   */
  const onThreadScroll = useCallback((el: HTMLElement) => {
    if (applied.current === 'hero' || performance.now() < walkingUntil.current) return;
    const seat = measureSlot('learn');
    if (!seat || !bind.current) return;
    // Sticky: clamped to the thread's window, so he never scrolls out of it.
    const box = el.getBoundingClientRect();
    const y = Math.min(Math.max(seat.y, box.top + STICK_TOP_PX), box.bottom - STICK_BOTTOM_PX);
    bind.current.setNumber('refPosX', seat.x);
    bind.current.setNumber('refPosY', y);
  }, [measureSlot]);

  /* ------------------------------------------------------------- actions */
  const openLesson = (id: string) => {
    // Back to full size before the walk to the centre — the lesson's own
    // sequence waits for the artboard to be free before it sends him.
    if (owner !== 'hero') vmi.current?.trigger('scaleFull')?.trigger();
    onOpenLesson(id);
  };

  // A closed chat starts the next one from nothing pending.
  useEffect(() => {
    if (!convo) setRevealed(0);
  }, [convo]);

  // The hero's "Open my journey": rings race, the page drops away, then the
  // journey opens.
  const launchJourney = () => {
    if (launch || disabled) return;
    setLaunch(true);
    window.setTimeout(() => {
      onOpenJourney();
      setLaunch(false);
    }, LAUNCH_MS);
  };

  return (
    <div className="home" data-convo={convo} data-launch={launch}>
      {/* The rail: the design's collapsed history column, which on the home
          page is the app's navigation. Logo, the three sections, profile. */}
      <nav className="home__rail" aria-label="Sections">
        <span className="home__rail-logo">
          <img src={ASSET.logo} alt="Byjus.AI" />
        </span>
        <span className="home__rail-rule" aria-hidden="true" />
        <div className="home__rail-items">
          <button type="button" className="home__rail-item" title="Goals" aria-label="Goals" onClick={onOpenGoal} disabled={disabled}>
            <i className="ti ti-target" />
          </button>
          <button type="button" className="home__rail-item" title="Chapters" aria-label="Chapters" onClick={onOpenJourney} disabled={disabled}>
            <i className="ti ti-map-2" />
          </button>
          <button type="button" className="home__rail-item" title="Practice" aria-label="Practice" onClick={onOpenChallenges} disabled={disabled}>
            <i className="ti ti-trophy" />
          </button>
          <span className="home__rail-rule home__rail-rule--inner" aria-hidden="true" />
          <button type="button" className="home__rail-item home__rail-item--profile" title="Profile" aria-label="Profile" disabled>
            <img src="/home/aarav-avatar.png" alt="" />
          </button>
        </div>
      </nav>

      <div className="home__main">
        {/* Floating chrome: the goal and the counters slide up out of the way
            when the chat opens, and the chat's close button takes the corner. */}
        <header className="home__chrome">
          <div className="home__widgets">
            <RotatingGoals />
            <div className="home__stats">
              <span className="home__stat" title="Experience points">
                <i className="ti ti-star-filled home__stat-star" />
                {STATS.stars.toLocaleString('en-IN')}
              </span>
              <span className="home__stat-divide" aria-hidden="true" />
              <span className="home__stat" title="Energy orbs">
                <span className="home__orb" aria-hidden="true" />
                {STATS.orbs}
              </span>
              {/* Phones only: the rail is hidden there and the profile moves
                  up into the chrome, as in the design. */}
              <span className="home__avatar">
                <img src="/home/aarav-avatar.png" alt={studentName} />
                <i className="ti ti-chevron-down" />
              </span>
            </div>
          </div>
          {convo && (
            <button type="button" className="home__close" title="Close conversation" aria-label="Close conversation" onClick={exitConvo}>
              <i className="ti ti-x" />
            </button>
          )}
        </header>

        <div className="home__stage">
          <main className="home__hero" aria-hidden={convo} ref={hero}>
            <div className="home__mascot-wrap">
              <span className="home__mascot-glow" aria-hidden="true" />
              <span className="home__rings" aria-hidden="true">
                {HERO_RINGS.map((icons, ring) => {
                  const dur = launch ? 1.05 : 4.2;
                  return (
                    <span
                      key={ring}
                      className="ringx"
                      style={{ animationDuration: `${dur}s`, animationDelay: `${(ring * dur) / 3}s` }}
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
                  );
                })}
              </span>
              {/* Vyom's place when the chat is closed. Both slots are anchored
                  here: the artboard reads `chatposX/Y` as well as
                  `learnWindowX/Y`, and a slot left unanchored keeps the file's
                  own default. With the chat open, `learn` moves to his newest
                  line in the thread. */}
              <span
                className="home__mascot"
                role="button"
                tabIndex={convo ? -1 : 0}
                title="Open my journey"
                aria-label="Open my journey"
                onClick={launchJourney}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter' && e.key !== ' ') return;
                  e.preventDefault();
                  launchJourney();
                }}
                onMouseEnter={() => setHeroHover(true)}
                onMouseLeave={() => setHeroHover(false)}
              >
                {!convo && <VyomAnchor slot="learn" x="50%" y="50%" />}
                <VyomAnchor slot="chat" x="50%" y="50%" />
                <span className="home__journey-tip" data-on={heroHover && !launch} aria-hidden="true">
                  <i className="ti ti-planet" />
                  Open my journey
                </span>
              </span>
            </div>

            <div className="home__hero-copy">
              <h1 className="home__greeting">Hi {studentName}! 👋</h1>
              <p className="home__sub">Pick up where you left off — or ask me anything below.</p>

              <section className="home__resume" aria-labelledby="home-resume">
                <h2 className="home__label" id="home-resume">
                  Pick up where you left off
                </h2>
                {LESSONS.map((lesson) => (
                  <ResumeTile key={lesson.id} lesson={lesson} onOpen={openLesson} disabled={disabled} />
                ))}
              </section>
            </div>
          </main>

          <div className="home__thread" aria-hidden={!convo} ref={thread}>
            <ChatThread
              chat={chat}
              onResume={() => openLesson(LESSONS[0].id)}
              revealedThrough={revealed}
              onScroll={onThreadScroll}
            />
          </div>
        </div>

        <footer className="home__foot">
          <Composer chat={chat} disabled={disabled} />
        </footer>
      </div>
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

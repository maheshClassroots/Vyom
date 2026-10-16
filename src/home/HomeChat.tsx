import { useEffect, useRef, type ReactNode } from 'react';
import { VyomAnchor } from '../vyom';
import { CHIPS, FRAC_ASK_TEXT, FRAC_INTRO, FRAC_KEY, SUMMARY_TEXT, vyomOwner, type ChatMessage } from './chat';
import { FracMini, FractionVisual, StepDots } from './FractionVisual';
import type { HomeChatState } from './useHomeChat';

const AVATAR = '/home/aarav-avatar.png';

/** Reads a line aloud — the design's "Listen" control. */
function speak(t: string) {
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t);
    u.rate = 1;
    u.pitch = 1.05;
    window.speechSynthesis.speak(u);
  } catch {
    /* no speech on this browser */
  }
}

function Listen({ text }: { text: string }) {
  return (
    <button type="button" className="thread__listen" onClick={() => speak(text)}>
      <i className="ti ti-volume" />
      Listen
    </button>
  );
}

/**
 * Vyom's seat beside a line of his. Only the newest holds him — he is the
 * app-wide character, so this is where the `learn` slot's anchor sits while
 * the chat is open, and he walks down the thread as it grows.
 */
function VyomSeat({ live, size = 29 }: { live: boolean; size?: number }) {
  return (
    <div className="thread__seat" style={{ width: size, height: size }}>
      {live && <VyomAnchor slot="learn" x="50%" y="50%" />}
    </div>
  );
}

function StudentSeat({ live }: { live: boolean }) {
  return (
    <div className="thread__seat thread__seat--student" data-live={live}>
      <img src={AVATAR} alt="Aarav" />
    </div>
  );
}

interface ThreadProps {
  chat: HomeChatState;
  /** "Start the class" on the closing line. */
  onResume: () => void;
  /** Vyom's lines up to this id show their text; later ones wait for him. */
  revealedThrough?: number;
  /** The thread scrolled; given the scrolling element. */
  onScroll?: (el: HTMLElement) => void;
}

/** The messages, the check-in chips, and the closing options. */
export function ChatThread({ chat, onResume, revealedThrough = Infinity, onScroll }: ThreadProps) {
  const { messages, thinking, stage, xs, step, transcript, comp, sumOpen, setSumOpen, answer, reset } = chat;
  const scroller = useRef<HTMLDivElement>(null);

  // New lines pin the thread to the bottom, as the design does.
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, thinking, stage, revealedThrough]);

  const scrolled = useRef(onScroll);
  scrolled.current = onScroll;
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const handler = () => scrolled.current?.(el);
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, []);

  const owner = vyomOwner(messages, thinking);
  const lastStudent = [...messages].reverse().find((m) => m.role === 'student')?.id ?? null;

  const transcriptBody = () => (
    <div className="thread__transcript">
      {transcript
        .filter((m) => !m.ask && m.text !== FRAC_ASK_TEXT)
        .map((m) =>
          m.role === 'student' ? (
            <div key={m.id} className="thread__t-student"><div>{m.text}</div></div>
          ) : m.explain ? (
            <div key={m.id} className="thread__t-vyom">
              <div className="thread__t-bubble">
                <div>{FRAC_INTRO}</div>
                <div className="thread__key thread__key--small">
                  <div className="thread__key-label"><i className="ti ti-sparkles" />Key idea</div>
                  <div className="thread__key-text">{FRAC_KEY}</div>
                  <div className="thread__key-visual"><FractionVisual step={3} /></div>
                </div>
              </div>
            </div>
          ) : (
            <div key={m.id} className="thread__t-vyom"><div className="thread__t-bubble">{m.text}</div></div>
          ),
        )}
    </div>
  );

  const pending = (m: ChatMessage) => m.role !== 'student' && m.id > revealedThrough;
  const dots = (
    <div className="thread__typing">
      {[0, 1, 2].map((i) => <span key={i} style={{ animationDelay: `${i * 0.2}s` }} />)}
    </div>
  );

  const row = (m: ChatMessage): ReactNode => {
    const live = owner === `m${m.id}`;
    // Not yet arrived at: his seat is here, but the line waits for him.
    if (pending(m)) {
      return (
        <div key={m.id} className="thread__row thread__row--typing">
          <VyomSeat live={live} size={38} />
          {dots}
        </div>
      );
    }
    if (m.role === 'student') {
      return (
        <div key={m.id} className="thread__row thread__row--student">
          <div className="thread__bubble thread__bubble--student">{m.text}</div>
          <StudentSeat live={lastStudent === m.id} />
        </div>
      );
    }
    if (m.summary) {
      return (
        <div key={m.id} className="thread__row">
          <VyomSeat live={live} />
          <div className="thread__col">
            <div className="thread__eyebrow">SUMMARY</div>
            <div className="thread__bubble thread__bubble--summary">
              <div className="thread__cleared"><i className="ti ti-circle-check" />Concept cleared · Adding unlike fractions</div>
              <div className="thread__text thread__text--ink">{SUMMARY_TEXT}</div>
              <FracMini />
              <button type="button" className="thread__expand" onClick={() => setSumOpen(!sumOpen)}>
                <i className={`ti ${sumOpen ? 'ti-arrows-diagonal-minimize-2' : 'ti-arrows-diagonal'}`} />
                {sumOpen ? 'Hide full explanation' : 'Expand full explanation'}
              </button>
              <Listen text={SUMMARY_TEXT} />
              {sumOpen && (
                <div className="thread__full">
                  <div className="thread__eyebrow thread__eyebrow--upper">Full explanation</div>
                  {transcriptBody()}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
    if (m.explain) {
      return (
        <div key={m.id} className="thread__row">
          <VyomSeat live={live} />
          <div className="thread__col">
            <div className="thread__bubble thread__bubble--explain">
              <div className="thread__text thread__in">{FRAC_INTRO}</div>
              {xs >= 2 && (
                <div className="thread__key thread__in">
                  <div className="thread__key-label"><i className="ti ti-sparkles" />Key idea</div>
                  <div className="thread__key-text">{FRAC_KEY}</div>
                  <div className="thread__key-visual">
                    <FractionVisual step={xs >= 3 ? step : 0} hide />
                    <StepDots step={xs >= 3 ? step : 0} />
                  </div>
                </div>
              )}
              {xs >= 6 && <div className="thread__text thread__in thread__text--after">{FRAC_ASK_TEXT}</div>}
              {xs < 6 && (
                <div className="thread__xs-dots">
                  {[0, 1, 2].map((i) => <span key={i} style={{ animationDelay: `${i * 0.16}s` }} />)}
                </div>
              )}
              {xs >= 6 && <Listen text={`${FRAC_INTRO} ${FRAC_KEY} ${FRAC_ASK_TEXT}`} />}
            </div>
          </div>
        </div>
      );
    }
    return (
      <div key={m.id} className="thread__row">
        <VyomSeat live={live} />
        <div className="thread__col">
          <div className="thread__bubble">
            <div>{m.text}</div>
            {m.text && <Listen text={m.text} />}
          </div>
        </div>
      </div>
    );
  };

  const typingRow = (
    <div key="typing" className="thread__row thread__row--typing">
      <VyomSeat live={owner === '__typing__'} size={38} />
      {dots}
    </div>
  );

  return (
    <div className="thread" ref={scroller}>
      {comp ? (
        <div className="thread__compress">
          <div className="thread__compress-body" data-collapse={comp === 'collapse'}>
            {messages.map(row)}
          </div>
          <div className="thread__compress-pill">
            Compressing
            <span>{[0, 1, 2].map((i) => <i key={i} style={{ animationDelay: `${i * 0.2}s` }} />)}</span>
          </div>
        </div>
      ) : (
        <div className="thread__list">
          {messages.map(row)}
          {thinking && typingRow}
          {stage === 'asking' && (
            <div className="thread__options">
              <button type="button" className="thread__opt thread__opt--got" onClick={() => answer('got')}>
                <i className="ti ti-thumb-up" />I've got it
              </button>
              <button type="button" className="thread__opt" onClick={() => answer('doubt')}>
                <i className="ti ti-help-circle thread__opt-blue" />I still have a doubt
              </button>
            </div>
          )}
          {stage === 'wrap' && (
            <div className="thread__options">
              <button type="button" className="thread__opt thread__opt--start" onClick={onResume}>
                <i className="ti ti-player-play-filled" />Start the class
              </button>
              <button type="button" className="thread__opt" onClick={reset}>
                <i className="ti ti-message-plus thread__opt-violet" />Ask another doubt
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface ComposerProps {
  chat: HomeChatState;
  disabled?: boolean;
}

/** The composer, with the quick replies that rise above it when focused. */
export function Composer({ chat, disabled = false }: ComposerProps) {
  const { text, setText, focus, setFocus, submit, convo, messages, chipsVisible } = chat;
  const input = useRef<HTMLInputElement>(null);
  const started = messages.length > 0;

  return (
    <div className="home__composer" data-active={focus}>
      {chipsVisible && !disabled && (
        <div className="home__chips" onMouseDown={(e) => e.preventDefault()}>
          {CHIPS.map((t) => (
            <button
              key={t}
              type="button"
              className="home__chip"
              onClick={() => {
                setText(t);
                window.setTimeout(() => input.current?.focus(), 0);
              }}
            >
              {t}
            </button>
          ))}
        </div>
      )}
      <span className="home__composer-glow" aria-hidden="true" />
      <div className="home__composer-shell">
        <div className="home__composer-inner">
          <span className="home__composer-icon" aria-hidden="true">
            <i className="ti ti-paperclip" />
          </span>
          <input
            ref={input}
            className="home__composer-input"
            value={text}
            disabled={disabled}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
            placeholder={convo && started ? 'Reply to Vyom…' : 'Ask Vyom anything…'}
            aria-label="Ask Vyom anything"
          />
          <span className="home__composer-icon" aria-hidden="true">
            <i className="ti ti-microphone" />
          </span>
          <button type="button" className="home__composer-send" onClick={submit} aria-label="Send" disabled={disabled}>
            <i className="ti ti-send" />
          </button>
        </div>
      </div>
    </div>
  );
}

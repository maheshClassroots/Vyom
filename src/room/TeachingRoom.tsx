import { useCallback, useEffect, useRef, useState } from 'react';
import { useVyom, useVyomStage, VyomAnchor } from '../vyom';
import { MILESTONES, REWARD, STEPS } from './journey';
import { ChatPanel, type ChatMessage } from './ChatPanel';
import { RoomChrome } from './RoomChrome';
import { ASSET, css } from './css';
import { Mcq } from './Mcq';
import { SparkRive } from './SparkRive';
import './prototype.css';
import './room.css';

const STUDENT_NAME = 'Aarav';

/**
 * Delay before a step's character cue fires, measured from the slot move.
 * The move writes the slot coordinates and fires its trigger a frame later; a
 * cue on top
 * of that collides with the write or interrupts the travel animation.
 */
const CUE_DELAY_MS = 700;

/** Held states that must be released when the journey moves on. */
const CLEARED_FLAGS = ['isListening', 'isThinking', 'isSpeaking', 'isTyping', 'isWaiting'];

const AMBIENT = [
  'position:absolute;left:16%;top:18%;width:5px;height:5px;border-radius:50%;background:#fff;box-shadow:0 0 9px 2px rgba(255,225,180,.9);animation:twn 3.5s ease-in-out infinite;',
  'position:absolute;right:20%;top:14%;width:4px;height:4px;border-radius:50%;background:#fff;box-shadow:0 0 8px 2px rgba(200,185,255,.9);animation:twn 4.4s ease-in-out .7s infinite;',
  'position:absolute;right:12%;bottom:22%;width:5px;height:5px;border-radius:50%;background:#fff;box-shadow:0 0 9px 2px rgba(180,220,255,.9);animation:twn 3.8s ease-in-out 1.3s infinite;',
  'position:absolute;left:12%;bottom:16%;width:4px;height:4px;border-radius:50%;background:#fff;box-shadow:0 0 8px 2px rgba(255,205,190,.9);animation:twn 4.6s ease-in-out .4s infinite;',
];

export function TeachingRoom() {
  const { fire, setFlag, isReady, entranceComplete } = useVyom();
  const { moveTo } = useVyomStage();

  const [step, setStep] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const [recording, setRecording] = useState(false);
  const [draft, setDraft] = useState('');
  const [points, setPoints] = useState(120);
  const [orbs, setOrbs] = useState(6);
  const [pulse, setPulse] = useState(false);
  const [celebratingDot, setCelebratingDot] = useState<number | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  /** The intro title's highlight paints on shortly after the slide lands. */
  const [titleHi, setTitleHi] = useState(false);
  /** Objective being narrated on the sequence slide; -1 when none. */
  const [activeBullet, setActiveBullet] = useState(-1);

  const current = STEPS[step];
  const paidMilestones = useRef(new Set<number>());
  const timers = useRef<number[]>([]);
  const messageId = useRef(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  useEffect(
    () => () => {
      timers.current.forEach(window.clearTimeout);
      timers.current = [];
    },
    [],
  );

  const pushMessage = useCallback((who: ChatMessage['who'], text: string) => {
    messageId.current += 1;
    setMessages((list) => [...list, { id: `m${messageId.current}`, who, text }]);
  }, []);

  /* ----------------------------------------------------- step choreography */

  useEffect(() => {
    if (!isReady) return;

    timers.current.forEach(window.clearTimeout);
    timers.current = [];
    setCelebrating(false);
    setVideoPlaying(false);
    setTitleHi(false);
    setActiveBullet(-1);

    // The conversational states are held booleans, so a step change has to put
    // them down before the new step raises its own.
    CLEARED_FLAGS.forEach((flag) => setFlag(flag, false));
    if (current.flags) {
      Object.entries(current.flags).forEach(([flag, value]) => setFlag(flag, value));
    }
    if (current.mode === 'intro') later(() => setTitleHi(true), 900);

    moveTo(current.slot);
    // The opening slide's cue waits for the stage reveal (see the effect below)
    // so the appearance is not played while Vyom is still hidden.
    const cue = current.cue;
    if (cue && step > 0) later(() => fire(cue), CUE_DELAY_MS);

    current.msgs.forEach((message, index) => {
      later(() => {
        pushMessage(message.who, message.text.replace('{name}', STUDENT_NAME));
        // On the objectives slide each line narrates one bullet, so the
        // highlight follows the message that is landing.
        if (current.bullets && current.loCelebrate == null) setActiveBullet(index);
        if (index === 0 && current.msgs.length > 1) setFlag('isSpeaking', true);
      }, CUE_DELAY_MS + 250 + index * 1400);
    });

    // The opening slide is a milestone on the track but pays nothing — the
    // prototype shows 120 XP / 6 orbs until the first objective is earned.
    if (current.milestone && step > 0 && !paidMilestones.current.has(step)) {
      paidMilestones.current.add(step);
      const dot = MILESTONES.indexOf(step);
      later(() => {
        setCelebrating(true);
        setCelebratingDot(dot);
        setPoints((value) => value + REWARD.xp);
        setOrbs((value) => value + REWARD.orbs);
        setPulse(true);
        fire('celebrate');
      }, CUE_DELAY_MS + 340);
      later(() => {
        setCelebratingDot(null);
        setPulse(false);
      }, CUE_DELAY_MS + 1740);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, isReady]);

  // The opening `appear` plays once Vyom is in place, so the artboard's own
  // entrance animation runs where he should be standing rather than mid-move.
  const openingCuePlayed = useRef(false);
  useEffect(() => {
    if (!entranceComplete || step !== 0 || openingCuePlayed.current) return;
    openingCuePlayed.current = true;
    if (STEPS[0].cue) fire(STEPS[0].cue);
  }, [entranceComplete, fire, step]);

  /* ------------------------------------------------------------ interaction */

  const go = useCallback((next: number) => setStep(Math.max(0, Math.min(STEPS.length - 1, next))), []);

  const openChat = useCallback(
    (mode: 'message' | 'mic') => {
      // Opening the panel is a UI action: it does not move Vyom or change his
      // state. Every character animation is left to a deliberate action.
      setChatOpen(true);
      setRecording(mode === 'mic');
    },
    [],
  );

  const toggleChat = useCallback(() => setChatOpen((open) => !open), []);

  const send = useCallback(() => {
    const text = draft.trim();
    if (!text) return;
    pushMessage('user', text);
    setDraft('');
    setRecording(false);
    setTyping(true);
    setFlag('isThinking', true);
    later(() => {
      setTyping(false);
      setFlag('isThinking', false);
      setFlag('isSpeaking', true);
      pushMessage('vyom', 'Good question — the area is the average of the two bases times the height.');
    }, 1100);
  }, [draft, later, pushMessage, setFlag]);

  const onAnswer = useCallback(
    (correct: boolean) => {
      fire(correct ? 'correct' : 'wrong');
      pushMessage(
        'vyom',
        correct
          ? "That's it — exactly one pair. That is what makes it a trapezoid rather than a parallelogram."
          : 'Not quite — a trapezoid keeps exactly one pair of parallel sides. Two pairs would make it a parallelogram.',
      );
    },
    [fire, pushMessage],
  );

  const toggleVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play();
      setVideoPlaying(true);
      setFlag('isWaiting', true);
    } else {
      video.pause();
      setVideoPlaying(false);
      setFlag('isWaiting', false);
    }
  }, [setFlag]);

  const reachedMilestones = MILESTONES.filter((index) => index <= step).length;
  const nodeFillPct = MILESTONES.length > 1
    ? (Math.max(0, reachedMilestones - 1) / (MILESTONES.length - 1)) * 100
    : 0;
  const teachWrapW = chatOpen ? 'calc(100% - 372px)' : '100%';
  const isIntroStep = current.mode === 'intro';

  return (
    <div
      className="room-root"
      style={css('height:100%;display:flex;flex-direction:column;position:relative;background-image:radial-gradient(18% 28% at 12% 22%,rgba(190,170,255,.22),transparent 70%),radial-gradient(20% 30% at 86% 78%,rgba(255,196,150,.2),transparent 70%),radial-gradient(rgba(96,74,190,.13) 1px,transparent 1px),linear-gradient(180deg,#eee9fd 0%,#f8f5fe 46%,#fdfaf0 100%);background-size:auto,auto,24px 24px,auto;color:#212529;overflow:hidden;')}
    >
      {/* ambient light — spans the whole room with no clip boundary */}
      <div aria-hidden="true" style={css('position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden;')}>
        {AMBIENT.map((style) => <span key={style} style={css(style)} />)}
      </div>

      <RoomChrome points={points} orbs={orbs} xpPulse={pulse} orbPulse={pulse} />

      {/* body: single unified card */}
      <div style={css('flex:1;display:flex;padding:4px 18px 18px;min-height:0;position:relative;z-index:1;')}>
        <div style={css('flex:1;display:flex;min-height:0;background:transparent;border:4px solid transparent;border-radius:24px;overflow:hidden;transition:border-color .55s ease-in-out,box-shadow .55s ease-in-out;box-shadow:none;position:relative;')}>
          <ChatPanel
            open={chatOpen}
            messages={messages}
            typing={typing}
            recording={recording}
            draft={draft}
            onDraft={setDraft}
            onSend={send}
            onOpen={openChat}
            onToggleMic={() => setRecording((value) => !value)}
          />

          {/* teaching wrapper — right-anchored, width animates 100% ↔ calc(100% - 372px) */}
          <div
            style={{
              ...css('flex:none;margin-left:auto;display:flex;flex-direction:column;min-width:0;position:relative;transition:width .42s cubic-bezier(.4,0,.2,1);'),
              width: teachWrapW,
            }}
          >
            <div style={css('flex:1;position:relative;overflow:hidden;')}>
              <div style={css('position:absolute;inset:0;container-type:size;display:grid;place-items:center;padding:18px;z-index:1;')}>
                {/* chat toggle handle, latched to the chat window's right edge */}
                <div
                  onClick={toggleChat}
                  title={chatOpen ? 'Hide chat' : 'Show chat'}
                  style={css('position:absolute;top:18px;bottom:18px;left:0;width:18px;z-index:26;cursor:pointer;display:flex;align-items:center;')}
                >
                  <div style={css('position:absolute;left:0;top:-18px;bottom:-18px;width:1px;background:#e5dbff;transition:opacity .34s ease;')} />
                  <div style={css('position:absolute;left:0;top:50%;transform:translateY(-50%);width:5px;height:190px;border-radius:0 5px 5px 0;background:linear-gradient(180deg,#228be6,#6741d9);')} />
                  <div style={css('position:absolute;left:5px;top:50%;transform:translateY(-50%);display:flex;align-items:center;justify-content:center;padding:26px 3px;background:#fff;border:1px solid #e5dbff;border-left:none;border-radius:0 10px 10px 0;box-shadow:4px 0 16px rgba(120,90,200,.16);color:#6741d9;')}>
                    <i className={`ti ${chatOpen ? 'ti-chevron-left' : 'ti-chevron-right'}`} style={css('font-size:16px;')} />
                  </div>
                </div>

                {/* 16:9 content stage */}
                <div style={css('position:relative;width:min(100cqw, calc(100cqh * 16 / 9));aspect-ratio:16/9;overflow:hidden;border-radius:18px;background:transparent;box-shadow:none;transition:box-shadow .55s ease-in-out;')}>
                  {/* Vyom's place on the learning canvas: horizontally centred,
                      and 10vh below the top edge. It belongs to the canvas rather
                      than to any one slide, so it stays put as the journey
                      moves; the offset is viewport-relative so it holds its
                      proportion as the room resizes. */}
                  <VyomAnchor slot="learn" x="50%" y="10vh" />

                  {current.mode === 'intro' && (
                    <div className="bpop" style={css('position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:safe center;overflow:auto;padding:24px 34px 20px;text-align:center;')}>
                      <div id="introMascots" style={css('position:relative;display:flex;align-items:flex-end;gap:8px;flex:none;margin-bottom:8px;')}>
                        <div style={css('position:absolute;left:50%;top:50%;transform:translate(-50%,-52%);width:240px;height:158px;background:radial-gradient(ellipse,rgba(255,212,168,.6),rgba(190,170,255,.32) 46%,transparent 72%);filter:blur(15px);z-index:0;animation:halo 5s ease-in-out infinite;')} />
                        <div style={css('position:relative;z-index:1;width:92px;height:92px;')} />
                        <SparkRive size={120} style={css('position:relative;z-index:1;margin-bottom:10px;filter:drop-shadow(0 10px 13px rgba(253,126,20,.3));')} />
                      </div>
                      <h1 style={css('margin:0 0 14px;font-size:38px;line-height:1.1;font-weight:800;color:#212529;letter-spacing:-.01em;')}>
                        <span className={`title-hi${titleHi ? ' title-hi-on' : ''}`} style={css('display:inline-block;padding:2px 14px;')}>{current.title}</span>
                      </h1>
                      <p style={css('margin:0 0 20px;font-size:20px;font-weight:500;color:#495057;max-width:560px;line-height:1.5;')}>{current.sub}</p>
                      <div style={css('display:flex;align-items:center;gap:14px;background:#fff;border:1px solid #e9ecef;border-radius:16px;padding:12px 26px;box-shadow:0 2px 6px -3px rgba(70,46,146,.16);font-size:30px;font-weight:800;color:#212529;white-space:nowrap;line-height:1.1;')}>
                        Area = {' '}
                        <span style={css('display:inline-flex;flex-direction:column;align-items:center;font-size:20px;font-weight:800;color:#7950f2;line-height:1.05;')}>
                          <span style={css('border-bottom:2px solid #7950f2;padding:0 5px 2px;')}>b + a</span>
                          <span style={css('padding-top:2px;')}>2</span>
                        </span>{' '}
                        × <span style={css('color:#e8590c;')}>h</span>
                      </div>
                    </div>
                  )}

                  {current.mode === 'teach' && (
                    <div className="bpop" style={css('position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:safe center;overflow:hidden;padding:24px 34px 20px;text-align:center;')}>
                      {current.outro && (
                        <div id="outroLand" style={css('display:flex;align-items:flex-end;justify-content:center;gap:10px;height:92px;margin-bottom:8px;flex:none;')}>
                          <div style={css('position:relative;width:84px;height:84px;')} />
                          <SparkRive size={116} style={css('margin-bottom:6px;')} />
                        </div>
                      )}

                      <h2 style={css('margin:0 0 18px;font-size:30px;font-weight:800;color:#212529;')}>{current.title}</h2>

                      {current.bullets ? (
                        <div style={css('display:flex;flex-direction:column;gap:10px;width:min(620px,100%);text-align:left;')}>
                          {current.bullets.map((bullet, index) => {
                            const done = index < (current.loDone ?? 0);
                            const justEarned = celebrating && index === current.loCelebrate;
                            const highlighted = current.loCelebrate == null
                              ? index === activeBullet
                              : justEarned;
                            return (
                              <div className={`obj-row${highlighted ? ' obj-hl' : ''}`} key={bullet} style={css('position:relative;display:flex;align-items:flex-start;gap:14px;background:#f8f9fa;border:1px solid #e9ecef;border-radius:12px;padding:10px 16px;')}>
                                {justEarned && (
                                  <svg aria-hidden="true" style={css('position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible;')}>
                                    <rect className="lo-ring-r" pathLength={100} />
                                  </svg>
                                )}
                                <div className={`lo-badge${done ? ' lo-done' : ''}`} style={css('width:32px;height:32px;flex:none;border-radius:10px;color:#fff;display:grid;place-items:center;font-size:14px;font-weight:800;')}>
                                  {done ? <i className="ti ti-check lo-tick" style={css('font-size:19px;')} /> : <span>{index + 1}</span>}
                                </div>
                                <div style={css('font-size:20px;font-weight:500;color:#495057;line-height:1.35;padding-top:2px;')}>{bullet}</div>
                              </div>
                            );
                          })}
                          {current.id === 'obj' && (
                            <div
                              onClick={() => go(step + 1)}
                              style={css('flex:none;align-self:center;margin-top:14px;display:inline-flex;align-items:center;gap:8px;background:#fff;border:1px solid #e9ecef;color:#495057;font-size:14px;font-weight:700;padding:12px 22px;border-radius:12px;cursor:pointer;')}
                            >
                              <i className="ti ti-checks" />I already know these
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={css('display:flex;align-items:center;gap:14px;background:#fff;border:1px solid #e9ecef;padding:16px 28px;border-radius:16px;box-shadow:0 2px 6px -3px rgba(70,46,146,.16);font-size:30px;font-weight:800;color:#212529;')}>
                          Area =
                          <span style={css('display:inline-flex;flex-direction:column;align-items:center;font-size:20px;font-weight:800;color:#7950f2;line-height:1.15;')}>
                            <span style={css('border-bottom:2px solid #7950f2;padding:0 6px 3px;')}>b + a</span>
                            <span style={css('padding-top:3px;')}>2</span>
                          </span>
                          × <span style={css('color:#e8590c;')}>h</span>
                        </div>
                      )}
                    </div>
                  )}

                  {current.mode === 'quiz' && current.question && (
                    <div className="bpop" style={css('position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:safe center;gap:20px;overflow:auto;padding:44px 34px 20px;text-align:center;')}>
                      <div style={css('position:absolute;top:16px;left:18px;display:flex;align-items:center;gap:8px;font-size:14px;font-weight:800;letter-spacing:.09em;color:#1c7ed6;background:#e7f5ff;padding:6px 12px;border-radius:999px;')}>EXPLORE</div>
                      <h2 style={css('margin:0;font-size:30px;font-weight:800;color:#212529;max-width:720px;line-height:1.25;')}>
                        {current.question.q}
                      </h2>
                      <Mcq key={current.id} question={current.question} onAnswer={onAnswer} />
                    </div>
                  )}

                  {current.mode === 'video' && (
                    <div className="bpop" style={css('position:absolute;inset:0;display:grid;place-items:center;overflow:hidden;background:#000;border-radius:18px;')}>
                      <video
                        ref={videoRef}
                        poster={ASSET.poster}
                        src={ASSET.video}
                        onClick={toggleVideo}
                        style={css('width:100%;height:100%;object-fit:contain;cursor:pointer;')}
                      />
                      {!videoPlaying && (
                        <button
                          type="button"
                          onClick={toggleVideo}
                          style={css('position:absolute;width:74px;height:74px;border-radius:50%;border:none;cursor:pointer;display:grid;place-items:center;color:#fff;background:rgba(0,0,0,.55);backdrop-filter:blur(6px);font-size:30px;')}
                        >
                          <i className="ti ti-player-play-filled" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* teaching nav */}
            <div style={css('position:relative;z-index:6;flex:none;display:flex;align-items:center;justify-content:center;gap:26px;padding:14px 26px;')}>
              <div
                onClick={() => go(step - 1)}
                title="Previous"
                style={{
                  ...css('display:inline-flex;align-items:center;justify-content:center;width:46px;height:46px;flex:none;background:#fff;border:1.5px solid #dee2e6;border-radius:12px;'),
                  color: step === 0 ? '#ced4da' : '#495057',
                  cursor: step === 0 ? 'default' : 'pointer',
                  opacity: step === 0 ? 0.5 : 1,
                }}
              >
                <i className="ti ti-chevron-left" style={css('font-size:22px;')} />
              </div>

              <div style={css('position:relative;flex:none;width:min(714px,80%);min-width:294px;height:16px;')}>
                <div style={css('position:absolute;left:6px;right:6px;top:50%;transform:translateY(-50%);height:6px;background:#dcd8e6;border-radius:999px;overflow:hidden;')}>
                  <div style={{ ...css('height:100%;background:#228be6;border-radius:999px;transition:width .4s cubic-bezier(.2,.7,.3,1);'), width: `${nodeFillPct}%` }} />
                </div>
                {MILESTONES.map((milestoneStep, index) => {
                  const left = MILESTONES.length > 1 ? (index / (MILESTONES.length - 1)) * 100 : 0;
                  const done = milestoneStep <= step;
                  const cel = celebratingDot === index;
                  return (
                    <span
                      key={milestoneStep}
                      className={`tr-snode ${done ? 'tr-snode-done' : 'tr-snode-todo'}${cel ? ' tr-snode-cel' : ''}`}
                      style={{ left: `calc(6px + ${left}% - ${(left / 100) * 12}px)` }}
                    >
                      {cel && (
                        <>
                          <span className="tr-flash" />
                          <span className="tr-ripple" />
                          <span className="tr-ripple r2" />
                          <span className="tr-ripple r3" />
                        </>
                      )}
                    </span>
                  );
                })}
              </div>

              <div
                onClick={() => go(step + 1)}
                title="Next"
                style={{
                  ...css('position:relative;overflow:hidden;display:inline-flex;align-items:center;justify-content:center;width:46px;height:46px;flex:none;border-radius:12px;'),
                  // The prototype keeps the intro's button white and fills it;
                  // every later slide uses the solid blue affordance.
                  background: isIntroStep ? '#fff' : '#228be6',
                  color: isIntroStep ? '#343a40' : '#fff',
                  border: isIntroStep ? '1.5px solid #dee2e6' : '1.5px solid transparent',
                  cursor: step === STEPS.length - 1 ? 'default' : 'pointer',
                  opacity: step === STEPS.length - 1 ? 0.5 : 1,
                }}
              >
                <i className="ti ti-chevron-right" style={css('font-size:22px;')} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

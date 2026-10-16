import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CONVO_OPENER,
  FRAC_ASK_TEXT,
  FRAC_DOUBT_DEFAULT,
  FRAC_FOLLOWUP_A,
  FRAC_FOLLOWUP_Q,
  GOAL_CHAT_TURN_1,
  GOAL_CHAT_TURN_2,
  RESUME_TEXT,
  WRAP_TEXT,
  goalChatOpener,
  type ChatMessage,
  type ChatStage,
  type Compress,
} from './chat';

export interface GoalChat {
  mode: string;
  goal: string | null;
}

interface Options {
  /** Opened from the Goal Page's "set / change goal": starts in that thread. */
  goalChat?: GoalChat | null;
  /** The goal chat's last turn sends the student back to the Goals Journey. */
  onGoalDone?: () => void;
}

/**
 * The home chat's state machine — the design's `HomeChat` logic, with its
 * timings. The composer owns `text`; everything else is what the thread shows.
 *
 * `convo` is the mode switch: off, the home page shows its hero; on, the
 * thread slides in over it. Sending anything from the hero starts the demo's
 * worked explanation; from the check-in, a typed line is a follow-up doubt.
 */
export function useHomeChat({ goalChat = null, onGoalDone }: Options = {}) {
  const [text, setText] = useState('');
  const [focus, setFocus] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [thinking, setThinking] = useState(false);
  const [stage, setStage] = useState<ChatStage>('idle');
  /** How much of the staged explanation is showing, 0–6. */
  const [xs, setXs] = useState(6);
  /** Which visual panel is lit, 0–3. */
  const [step, setStep] = useState(0);
  const [transcript, setTranscript] = useState<ChatMessage[]>([]);
  const [comp, setComp] = useState<Compress>(null);
  const [convo, setConvo] = useState(false);
  const [sumOpen, setSumOpen] = useState(false);

  const idRef = useRef(0);
  const timers = useRef<number[]>([]);
  const goalChatRef = useRef(false);
  const goalTurn = useRef(0);

  const nextId = () => ++idRef.current;
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  const clearT = useCallback(() => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
  }, []);
  const push = useCallback((m: Omit<ChatMessage, 'id'>) => {
    setMessages((x) => [...x, { id: ++idRef.current, ...m }]);
  }, []);

  useEffect(() => () => clearT(), [clearT]);

  // The goal chat: Vyom opens, and the composer answers twice.
  useEffect(() => {
    if (!goalChat) return;
    goalChatRef.current = true;
    const t = window.setTimeout(() => {
      setConvo(true);
      setMessages([{ id: nextId(), role: 'vyom', text: goalChatOpener(goalChat.mode, goalChat.goal) }]);
    }, 400);
    return () => window.clearTimeout(t);
    // Runs once, for the mode the page was opened in.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startFrac = useCallback(
    (q?: string) => {
      clearT();
      setStage('explaining');
      setStep(0);
      setMessages([{ id: nextId(), role: 'student', text: q && q.trim() ? q : FRAC_DOUBT_DEFAULT, concept: 'frac' }]);
      setThinking(true);
      setXs(0);
      // One bubble, revealed in stages: intro → key idea → step 1 → 2 → 3 → check-in.
      later(() => { setThinking(false); setXs(1); push({ role: 'vyom', explain: true, concept: 'frac' }); }, 1700);
      later(() => setXs(2), 3300);
      later(() => { setXs(3); setStep(1); }, 4900);
      later(() => { setXs(4); setStep(2); }, 6400);
      later(() => { setXs(5); setStep(3); }, 7900);
      later(() => { setXs(6); setStage('asking'); }, 9400);
    },
    [clearT, push],
  );

  const answer = useCallback(
    (kind: 'got' | 'doubt', custom?: string) => {
      clearT();
      if (kind === 'got') {
        setStage('understood');
        setComp('outline');
        later(() => setComp('collapse'), 700);
        later(() => {
          setMessages((prev) => {
            const concept = prev.filter((m) => m.concept === 'frac');
            setTranscript(concept);
            const kept = prev.filter((m) => m.concept !== 'frac');
            return [...kept, { id: nextId(), role: 'vyom', summary: true }];
          });
          setComp(null);
        }, 1300);
        later(() => { push({ role: 'vyom', text: WRAP_TEXT, wrap: true }); setStage('wrap'); }, 2700);
      } else {
        setStage('explaining');
        push({ role: 'student', text: custom && custom.trim() ? custom : FRAC_FOLLOWUP_Q, concept: 'frac' });
        setThinking(true);
        later(() => { setThinking(false); push({ role: 'vyom', text: FRAC_FOLLOWUP_A, concept: 'frac' }); setStep(3); }, 950);
        later(() => { push({ role: 'vyom', text: FRAC_ASK_TEXT, ask: true, concept: 'frac' }); setStage('asking'); }, 2550);
      }
    },
    [clearT, push],
  );

  /** "Ask another doubt": the thread empties but the chat stays open. */
  const reset = useCallback(() => {
    clearT();
    setMessages([]);
    setThinking(false);
    setStage('idle');
    setStep(0);
    setTranscript([]);
    setSumOpen(false);
  }, [clearT]);

  /** The × on the chat: back to the hero. */
  const exitConvo = useCallback(() => {
    reset();
    setXs(6);
    setConvo(false);
    setText('');
    goalChatRef.current = false;
    goalTurn.current = 0;
  }, [reset]);

  const resumeConversation = useCallback(() => {
    clearT();
    setMessages((prev) => [
      ...prev.filter((m) => !m.summary),
      ...transcript.map((m) => ({ ...m, id: nextId(), concept: 'frac' as const })),
      { id: nextId(), role: 'vyom', text: RESUME_TEXT, concept: 'frac' },
    ]);
    setStage('asking');
  }, [clearT, transcript]);

  const submit = useCallback(() => {
    const t = text.trim();
    if (!t) return;
    setText('');
    if (goalChatRef.current) {
      clearT();
      push({ role: 'student', text: t });
      setThinking(true);
      goalTurn.current += 1;
      const turn = goalTurn.current;
      later(() => {
        setThinking(false);
        push({ role: 'vyom', text: turn === 1 ? GOAL_CHAT_TURN_1 : GOAL_CHAT_TURN_2 });
        if (turn >= 2) later(() => onGoalDone?.(), 2600);
      }, 1100);
      return;
    }
    if (!convo) {
      setConvo(true);
      startFrac(t);
      return;
    }
    if (stage === 'asking') answer('doubt', t);
    else startFrac(t);
  }, [answer, clearT, convo, onGoalDone, push, stage, startFrac, text]);

  /** Opens the chat with Vyom's greeting and nothing asked yet. */
  const enterConvo = useCallback(() => {
    if (convo) return;
    setConvo(true);
    setMessages((x) => (x.length ? x : [{ id: nextId(), role: 'vyom', text: CONVO_OPENER }]));
  }, [convo]);

  const isGoalChat = goalChatRef.current;
  const chipsVisible =
    (focus && !convo) || (convo && !isGoalChat && !thinking && messages.length <= 2);

  return {
    text, setText, focus, setFocus,
    messages, thinking, stage, xs, step, transcript, comp, convo, sumOpen, setSumOpen,
    chipsVisible,
    submit, answer, reset, exitConvo, enterConvo, resumeConversation,
  };
}

export type HomeChatState = ReturnType<typeof useHomeChat>;

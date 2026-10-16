/**
 * The home chat's script — the design's `HomeChat` demo content, verbatim.
 *
 * The demo answers any doubt with one worked explanation (adding unlike
 * fractions), revealed in stages, then checks in. The copy is the design's.
 */

export const FRAC_DOUBT_DEFAULT = 'How do I add ½ and ⅓? The bottoms are different.';
export const FRAC_ASK_TEXT =
  "Does that make sense? Ask me anything, or tap ‘I've got it’ when you're ready.";
export const FRAC_FOLLOWUP_Q = "But why don't we add the bottoms too — 2 + 3?";
export const FRAC_FOLLOWUP_A =
  "Great catch — that's the most common mix-up! The bottom only tells us the *size* of each piece. We're counting pieces, so only the tops add up; the size (sixths) stays the same. Adding the bottoms would quietly change the piece size halfway through.";
export const FRAC_INTRO =
  "Great question! When two fractions have different bottoms — like ½ and ⅓ — we can't add them yet. First we find the smallest number both bottoms fit into: for 2 and 3 that's 6, so we cut both fractions into sixths.";
export const FRAC_KEY =
  '½ becomes 3/6 and ⅓ becomes 2/6 — every piece is the same size now. Then just add the tops: 3 + 2 = 5, keep the bottom, and you get 5/6.';
export const SUMMARY_TEXT =
  "You asked how to add ½ + ⅓. We gave both the same bottom of 6 (½ → 3/6, ⅓ → 2/6), then added the tops to get 5/6 — that's the whole trick for adding unlike fractions.";
export const WRAP_TEXT =
  "Nice work, Aarav! 🎉 That doubt's sorted. Want to lock it in with today's class, or is there another doubt on your mind?";
export const CONVO_OPENER = "Hey Aarav! I'm all ears — what would you like to work on today?";
export const RESUME_TEXT =
  "We're back in this thread — ask me anything and I'll fold it into the summary when you're done.";

/** Quick replies shown above a focused composer. */
export const CHIPS = [
  'I have a doubt',
  'I want to set a goal',
  'I want to change my goal',
  'I need homework help',
  'I want to practice',
];

/** The goal statements that rotate in the header, on a 30s cadence. */
export const GOALS_CJ = [
  { pct: 68, label: 'of scoring 90%+ in the year-end exam' },
  { pct: 45, label: 'of acing the Fractions unit test' },
  { pct: 80, label: 'of finishing adding unlike fractions today' },
];

/** The goal chat, reached from the Goal Page's own "set / change goal" taps. */
export const GOAL_NAMES: Record<string, string> = {
  g1: 'Unit test 2',
  g2: 'Master Circles',
  g3: 'Year-end syllabus',
};
export function goalChatOpener(mode: string, goalId: string | null) {
  const name = (goalId && GOAL_NAMES[goalId]) || 'your goal';
  return mode === 'edit'
    ? `Let's update “${name}”. What would you like to change — the date, the chapters, or how much time you spend each day?`
    : "Let's set up a new goal. Is there a test coming up at school, or something you want to get really good at?";
}
export const GOAL_CHAT_TURN_1 = 'Got it. And by when do you want this done?';
export const GOAL_CHAT_TURN_2 =
  "Done — I've updated your goal and reshaped your path. Head back to your Goals journey to see it.";

export type Role = 'student' | 'vyom';

export interface ChatMessage {
  id: number;
  role: Role;
  text?: string;
  /** The staged fractions explanation — one bubble, revealed in parts. */
  explain?: boolean;
  /** The compressed-concept card that replaces the explanation. */
  summary?: boolean;
  /** The check-in line, kept out of the transcript. */
  ask?: boolean;
  /** Belongs to the fractions thread, so it compresses into the summary. */
  concept?: 'frac';
  /** The closing line, which carries the two follow-on options. */
  wrap?: boolean;
}

/** idle → explaining → asking → understood → wrap */
export type ChatStage = 'idle' | 'explaining' | 'asking' | 'understood' | 'wrap';

/** The compression beat: the thread is outlined, then shrinks away. */
export type Compress = null | 'outline' | 'collapse';

/** Who holds Vyom right now: the typing row while he thinks, else his newest line. */
export function vyomOwner(messages: ChatMessage[], thinking: boolean): string | null {
  if (thinking) return '__typing__';
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role !== 'student') return `m${messages[i].id}`;
  }
  return null;
}

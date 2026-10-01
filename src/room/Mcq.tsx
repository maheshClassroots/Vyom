import { useState } from 'react';
import { css } from './css';

export interface Question {
  q: string;
  opts: string[];
  /** Index of the correct option. */
  ans: number;
}

interface McqProps {
  question: Question;
  /** Fired once, with whether the learner picked correctly. */
  onAnswer: (correct: boolean) => void;
}

const LETTERS = ['A', 'B', 'C', 'D'];

/**
 * Single-answer question, styled from the prototype's `_skipOptionRows`:
 * the picked option turns green or red, and a wrong pick also reveals the
 * correct one. Answering is one-shot, as in the prototype.
 */
export function Mcq({ question, onAnswer }: McqProps) {
  const [picked, setPicked] = useState<number | null>(null);

  function choose(index: number) {
    if (picked !== null) return;
    setPicked(index);
    onAnswer(index === question.ans);
  }

  return (
    <div style={css('display:flex;flex-direction:column;gap:12px;width:min(620px,100%);text-align:left;')}>
      {question.opts.map((label, index) => {
        const chosen = picked === index;
        const correct = index === question.ans;
        const answered = picked !== null;

        // Colour rules lifted from the prototype: the pick is marked, and once
        // answered the correct row is always shown green.
        let borderColor = '#e7e2f2';
        let bg = '#fff';
        let letterBg = '#eceef1';
        let letterColor = '#495057';
        let textColor = '#343a40';
        let mark = '';
        let markColor = 'transparent';

        if (chosen && !correct) {
          borderColor = '#e03131'; bg = '#fff5f5'; letterBg = '#e03131';
          letterColor = '#fff'; textColor = '#c92a2a'; mark = '✕'; markColor = '#e03131';
        } else if (answered && correct) {
          borderColor = '#2f9e44'; bg = '#ebfbee'; letterBg = '#2f9e44';
          letterColor = '#fff'; textColor = '#2b8a3e'; mark = '✓'; markColor = '#2f9e44';
        }

        return (
          <div
            key={label}
            onClick={() => choose(index)}
            className="def-opt"
            style={{
              ...css('display:flex;align-items:center;gap:14px;padding:14px 16px;border-radius:14px;box-shadow:0 4px 14px rgba(120,90,200,.08);transition:border-color .18s ease,background .18s ease;'),
              cursor: answered ? 'default' : 'pointer',
              border: `2px solid ${borderColor}`,
              background: bg,
            }}
          >
            <div
              style={{
                ...css('width:34px;height:34px;flex:none;border-radius:9px;display:grid;place-items:center;font-size:14px;font-weight:800;'),
                background: letterBg,
                color: letterColor,
              }}
            >
              {LETTERS[index]}
            </div>
            <div style={{ ...css('flex:1;font-size:16px;font-weight:700;'), color: textColor }}>{label}</div>
            <div style={{ ...css('font-size:20px;'), color: markColor }}>{mark}</div>
          </div>
        );
      })}
    </div>
  );
}

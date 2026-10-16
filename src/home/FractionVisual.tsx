import type { ReactNode } from 'react';

/**
 * The worked visual for adding ½ + ⅓ — the design's `FractionVisual`.
 * Three panels, lit one at a time as the explanation reaches them.
 */

const VIOLET = '#7950f2';
const BLUE = '#339af0';

function FracBar({ denom, fills }: { denom: number; fills: (string | null)[] }) {
  return (
    <div className="frac-bar">
      {Array.from({ length: denom }).map((_, i) => (
        <div
          key={i}
          className="frac-bar__cell"
          style={{
            background: fills[i] ?? '#fff',
            borderRight: i < denom - 1 ? `1px solid ${fills[i] ? 'rgba(255,255,255,.6)' : '#e6e3f5'}` : 'none',
          }}
        />
      ))}
    </div>
  );
}

function VisRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="vis-row">
      <div className="vis-row__label">{label}</div>
      <div className="vis-row__bar">{children}</div>
    </div>
  );
}

function VPanel({
  title, idx, step, hide, children,
}: { title: string; idx: number; step: number; hide?: boolean; children: ReactNode }) {
  const on = step >= idx;
  if (hide && !on) return null;
  return (
    <div className="vpanel" data-on={on}>
      <div className="vpanel__head">
        <div className="vpanel__num" data-on={on}>{idx}</div>
        <div className="vpanel__title">{title}</div>
      </div>
      {children}
    </div>
  );
}

export function FractionVisual({ step, hide }: { step: number; hide?: boolean }) {
  return (
    <div className="frac-visual">
      <VPanel title="The problem" idx={1} step={step} hide={hide}>
        <div className="vis-rows">
          <VisRow label="½"><FracBar denom={2} fills={[VIOLET, null]} /></VisRow>
          <VisRow label="⅓"><FracBar denom={3} fills={[BLUE, null, null]} /></VisRow>
        </div>
        <div className="vpanel__note">Different-size pieces — we can't add them yet.</div>
      </VPanel>
      <VPanel title="Make the pieces match (sixths)" idx={2} step={step} hide={hide}>
        <div className="vis-rows">
          <VisRow label="3/6"><FracBar denom={6} fills={[VIOLET, VIOLET, VIOLET, null, null, null]} /></VisRow>
          <VisRow label="2/6"><FracBar denom={6} fills={[BLUE, BLUE, null, null, null, null]} /></VisRow>
        </div>
        <div className="vpanel__note">½ = 3/6 and ⅓ = 2/6 — same-size pieces now.</div>
      </VPanel>
      <VPanel title="Add the tops" idx={3} step={step} hide={hide}>
        <VisRow label="5/6"><FracBar denom={6} fills={[VIOLET, VIOLET, VIOLET, BLUE, BLUE, null]} /></VisRow>
        <div className="vpanel__note">
          3 + 2 = 5 sixths. So ½ + ⅓ = <b>5/6</b>.
        </div>
      </VPanel>
    </div>
  );
}

/** Progress dots under the visual: the lit step stretches. */
export function StepDots({ step }: { step: number }) {
  return (
    <div className="step-dots">
      {[1, 2, 3].map((i) => (
        <span key={i} className="step-dots__dot" data-on={step >= i} />
      ))}
    </div>
  );
}

/** The one-line recap inside the summary card. */
export function FracMini() {
  return (
    <div className="frac-mini">
      <div className="frac-mini__lhs">½ + ⅓ =</div>
      <div className="frac-mini__bar"><FracBar denom={6} fills={[VIOLET, VIOLET, VIOLET, BLUE, BLUE, null]} /></div>
      <div className="frac-mini__rhs">5/6</div>
    </div>
  );
}

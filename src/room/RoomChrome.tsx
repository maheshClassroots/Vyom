import { ASSET, css } from './css';

interface RoomChromeProps {
  points: number;
  orbs: number;
  xpPulse: boolean;
  orbPulse: boolean;
  /** Leaves the lesson and returns to the home page. */
  onHome?: () => void;
}

/**
 * Floating top chrome — markup and inline styles taken verbatim from the
 * prototype's "FLOATING TOP CHROME" block.
 */
export function RoomChrome({ points, orbs, xpPulse, orbPulse, onHome }: RoomChromeProps) {
  return (
    <div style={css('flex:none;position:relative;z-index:2;display:flex;align-items:center;gap:14px;padding:24px 20px 4px 28px;')}>
      {/* The prototype's logo was decorative; it is the way back to the home
          page now, so it answers the keyboard as a button should. */}
      <div
        title="Home"
        role="button"
        tabIndex={0}
        onClick={onHome}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          onHome?.();
        }}
        style={css('width:40px;height:40px;flex:none;border-radius:12px;overflow:hidden;display:grid;place-items:center;cursor:pointer;')}
      >
        <img src={ASSET.logo} alt="Byjus.AI" style={css('width:100%;height:100%;object-fit:contain;')} />
      </div>

      <div style={css('display:flex;align-items:center;gap:9px;flex:0 1 auto;min-width:0;padding:9px 16px 9px 0;border-radius:12px;')}>
        <span style={css('font-size:14px;font-weight:700;color:#5d5880;flex:none;')}>Lesson</span>
        <i className="ti ti-chevron-right" style={css('font-size:13px;color:#8b86a6;flex:none;')} />
        <span style={css('font-size:14px;font-weight:800;color:#5f3dc4;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;')}>
          Area of a trapezoid
        </span>
      </div>

      <div style={css('flex:1;min-width:0;')} />

      <div style={css('display:flex;align-items:center;flex:none;gap:8px;')}>
        <div
          id="xpWidget"
          className={xpPulse ? 'rw-pulse' : ''}
          style={css('display:flex;align-items:center;gap:8px;padding:8px 15px 8px 12px;border-radius:12px;')}
          title="Experience points"
        >
          <i className="ti ti-star-filled" style={css('font-size:20px;color:#fab005;filter:drop-shadow(0 1px 2px rgba(180,120,0,.35));')} />
          <span style={css('font-weight:800;color:#7a4700;font-size:18px;letter-spacing:-.01em;')}>{points}</span>
        </div>

        <span
          aria-hidden="true"
          style={css('width:1px;height:20px;flex:none;margin:0 6px;background:linear-gradient(180deg,rgba(120,90,200,0),rgba(120,90,200,.22) 30%,rgba(120,90,200,.22) 70%,rgba(120,90,200,0));')}
        />

        <div
          id="orbWidget"
          className={orbPulse ? 'rw-pulse' : ''}
          style={css('display:flex;align-items:center;gap:8px;padding:8px 16px 8px 13px;border-radius:12px;')}
          title="Energy orbs"
        >
          <span style={css('width:18px;height:18px;flex:none;border-radius:50%;background:radial-gradient(circle at 34% 28%,#fff,#ffe066 42%,#ff922b 78%,#e8590c);box-shadow:0 0 10px rgba(255,193,7,.95),0 0 3px rgba(255,255,255,.9);')} />
          <span style={css('font-weight:800;color:#7a4700;font-size:18px;letter-spacing:-.01em;')}>{orbs}</span>
        </div>
      </div>

      <div style={css('position:relative;flex:none;margin-left:auto;')}>
        <div
          title="Report an issue"
          style={css('width:44px;height:44px;background:transparent;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid transparent;box-shadow:0 8px 22px rgba(150,120,215,.14);border-radius:11px;display:grid;place-items:center;cursor:pointer;color:#6b6580;font-size:20px;')}
        >
          <i className="ti ti-flag-3" />
        </div>
      </div>

      <div style={css('position:relative;flex:none;')}>
        <div
          title="Audio settings"
          style={css('width:44px;height:44px;background:transparent;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid transparent;box-shadow:0 8px 22px rgba(150,120,215,.14);border-radius:11px;display:grid;place-items:center;cursor:pointer;color:#6b6580;font-size:20px;')}
        >
          <i className="ti ti-volume" />
        </div>
      </div>

      <div
        title="Close lesson"
        style={css('width:44px;height:44px;flex:none;background:transparent;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:none;box-shadow:0 8px 22px rgba(150,120,215,.14);border-radius:11px;display:grid;place-items:center;cursor:pointer;color:#6b6580;font-size:20px;')}
      >
        <i className="ti ti-x" />
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { VyomAnchor } from '../vyom';
import { css } from './css';

export interface ChatMessage {
  id: string;
  who: 'vyom' | 'user';
  text: string;
}

/** Opacity by distance from the newest message, from the prototype's `_opL`. */
const OPACITY_BY_RECENCY = [1, 0.75, 0.5, 0.45, 0.4, 0.35, 0.3, 0.25, 0.2, 0.15];

/** A collapsed chat shows the newest Vyom bubble only, and only this long. */
const COLLAPSED_TTL_MS = 15000;

interface ChatPanelProps {
  open: boolean;
  messages: ChatMessage[];
  typing: boolean;
  recording: boolean;
  draft: string;
  onDraft: (value: string) => void;
  onSend: () => void;
  onOpen: (mode: 'message' | 'mic') => void;
  onToggleMic: () => void;
}

/**
 * Chat window and the morphing composer, ported from the prototype's
 * "CHAT WINDOW" and "docked mascot slot" blocks. Inline styles are the
 * prototype's own; the bindings it wrote as `{{ }}` are computed here.
 */
export function ChatPanel({
  open, messages, typing, recording, draft, onDraft, onSend, onOpen, onToggleMic,
}: ChatPanelProps) {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing, open]);

  const composerW = open ? '288px' : '108px';
  const inputRef = useRef<HTMLInputElement>(null);

  // Collapsed, the room shows just the newest Vyom line for 15 seconds — the
  // prototype's `_within15` rule. A tick re-renders when that window lapses.
  const newest = messages[messages.length - 1];
  const [, setTick] = useState(0);
  const newestAt = useRef(0);
  const newestKey = newest ? `${newest.id}` : '';
  const lastKey = useRef('');

  if (newestKey !== lastKey.current) {
    lastKey.current = newestKey;
    newestAt.current = Date.now();
  }

  useEffect(() => {
    if (open || !newestKey) return;
    const timer = window.setTimeout(() => setTick((n) => n + 1), COLLAPSED_TTL_MS + 200);
    return () => window.clearTimeout(timer);
  }, [newestKey, open]);

  const withinTtl = Date.now() - newestAt.current < COLLAPSED_TTL_MS;

  /** Per-message display, matching the prototype's open/collapsed rules. */
  function presentation(index: number) {
    const fromEnd = messages.length - 1 - index;
    const isLast = fromEnd === 0;
    const fsClass = isLast ? 'msg-xl' : 'msg-xl b60';
    if (!open) {
      const show = isLast && messages[index].who === 'vyom' && withinTtl;
      return { fsClass, opacity: show ? 1 : 0, display: show ? 'flex' : 'none', pointerEvents: show ? 'auto' : 'none' } as const;
    }
    return {
      fsClass,
      opacity: fromEnd < OPACITY_BY_RECENCY.length ? OPACITY_BY_RECENCY[fromEnd] : 0.1,
      display: 'flex',
      pointerEvents: 'auto',
    } as const;
  }

  return (
    <>
      {/* chat window — floating layer, anchored left, always present */}
      <div style={css('position:absolute;left:0;top:0;bottom:0;z-index:30;width:372px;overflow:visible;pointer-events:none;')}>
        <div style={css('width:372px;height:100%;display:flex;flex-direction:column;overflow:visible;position:relative;')}>
          <div style={css('flex:1;display:flex;flex-direction:column;min-height:0;')}>
            <div
              ref={logRef}
              className="tr-scroll"
              style={{
                ...css('flex:1;padding:16px 16px 74px;display:flex;flex-direction:column;gap:14px;'),
                overflowY: open ? 'auto' : 'hidden',
                pointerEvents: open ? 'auto' : 'none',
              }}
            >
              <div style={css('margin-top:auto;')} />
              {messages.map((message, index) => {
                const view = presentation(index);
                const rowStyle = {
                  display: view.display,
                  opacity: view.opacity,
                  pointerEvents: view.pointerEvents,
                  ['--brow-op' as string]: String(view.opacity),
                };
                return message.who === 'vyom' ? (
                  <div className="brow" key={message.id} style={{ ...css('gap:10px;align-items:flex-start;'), ...rowStyle }}>
                    <div style={css('min-width:0;')}>
                      <div className={view.fsClass} style={css('background:rgba(244,241,255,.95);color:#3a3450;padding:10px 13px;border-radius:14px 14px 14px 4px;font-size:14px;line-height:1.5;')}>
                        {message.text}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="brow" key={message.id} style={{ ...css('justify-content:flex-end;'), ...rowStyle }}>
                    <div className={view.fsClass} style={css('max-width:82%;background:linear-gradient(45deg,rgba(34,139,230,.95),rgba(21,170,191,.95));color:#fff;padding:10px 13px;border-radius:14px 14px 4px 14px;font-size:14px;line-height:1.5;')}>
                      {message.text}
                    </div>
                  </div>
                );
              })}
              {typing && (
                <div style={css('display:flex;gap:10px;align-items:center;')}>
                  <div style={css('background:#f4f1ff;padding:12px 15px;border-radius:14px 14px 14px 4px;display:flex;gap:5px;')}>
                    <span style={css('width:7px;height:7px;border-radius:50%;background:#adb5bd;animation:dots 1.2s infinite;')} />
                    <span style={css('width:7px;height:7px;border-radius:50%;background:#adb5bd;animation:dots 1.2s .2s infinite;')} />
                    <span style={css('width:7px;height:7px;border-radius:50%;background:#adb5bd;animation:dots 1.2s .4s infinite;')} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* docked mascot slot + morphing composer */}
      <div style={css('position:absolute;left:16px;bottom:8px;z-index:30;pointer-events:none;')}>
        {/* Vyom's chat seat, centred 3vw from the left of the chat interface.
            The parent sits at left:16px and the slot is 60px wide, so the
            offset is measured back from the seat's centre. The ripples ride
            with it, since they mark where he is standing. */}
        <div id="dockSlot" style={css('position:absolute;left:calc(3vw - 46px);bottom:0;width:60px;height:60px;display:grid;place-items:center;')}>
          <div id="dockMax" style={css('position:relative;width:60px;height:60px;display:grid;place-items:center;')}>
            {typing && (
              <>
                <span className="dock-ripple-lg" />
                <span className="dock-ripple-lg" style={css('animation-delay:.87s;')} />
                <span className="dock-ripple-lg" style={css('animation-delay:1.73s;')} />
              </>
            )}
            {/* Vyom's docked seat — the prototype's `<vyom-rive>` dock mount. */}
            <VyomAnchor slot="chat" x="50%" y="50%" />
          </div>
        </div>

        <div
          id="dockPill"
          style={{
            // Nudged 2vw right of the prototype's 72px so it clears Vyom's
            // dock seat, which stays where it is.
            ...css('pointer-events:auto;position:absolute;left:calc(72px + 2vw);bottom:6px;height:48px;border-radius:14px;overflow:hidden;background:#fff;transition:width .44s cubic-bezier(.34,1.12,.5,1),box-shadow .4s ease,border-color .4s ease;'),
            width: composerW,
            border: `1px solid ${open ? '#e9ecef' : 'transparent'}`,
            boxShadow: open ? '0 6px 18px rgba(80,60,140,.14)' : '0 8px 22px -10px rgba(12,133,153,.7)',
          }}
        >
          <div
            style={{
              ...css('position:absolute;inset:0;background:linear-gradient(45deg,#0c8599,#15aabf);transition:opacity .4s ease;pointer-events:none;'),
              opacity: open ? 0 : 1,
            }}
          />

          {/* closed state: message + mic */}
          <div
            style={{
              ...css('position:absolute;inset:0;display:flex;align-items:center;transition:opacity .26s ease;'),
              opacity: open ? 0 : 1,
              pointerEvents: open ? 'none' : 'auto',
            }}
          >
            <div
              onClick={() => onOpen('message')}
              title="Message"
              style={css('width:54px;height:48px;display:grid;place-items:center;cursor:pointer;color:#fff;border-right:1px solid rgba(255,255,255,.32);')}
            >
              <i className="ti ti-message-2" style={css('font-size:20px;')} />
            </div>
            <div
              onClick={() => onOpen('mic')}
              title="Speak"
              style={css('width:54px;height:48px;display:grid;place-items:center;cursor:pointer;color:#fff;')}
            >
              <i className="ti ti-microphone" style={css('font-size:20px;')} />
            </div>
          </div>

          {/* open state: the input row */}
          <div
            id="chatInputRow"
            style={{
              ...css('position:absolute;inset:0;display:flex;align-items:center;gap:10px;padding:0 12px;transition:opacity .32s ease .06s;'),
              opacity: open ? 1 : 0,
              pointerEvents: open ? 'auto' : 'none',
            }}
          >
            <i className="ti ti-paperclip" style={css('font-size:16px;color:#adb5bd;cursor:pointer;flex:none;')} />
            {recording ? (
              <div style={css('flex:1;min-width:0;display:flex;align-items:center;gap:8px;color:#e03131;font-size:12px;font-weight:700;')}>
                <span style={css('width:9px;height:9px;border-radius:50%;background:#e03131;animation:recpulse 1s infinite;')} />
                Listening…
              </div>
            ) : (
              <input
                ref={inputRef}
                value={draft}
                onChange={(event) => onDraft(event.target.value)}
                // Enter is handled explicitly; implicit form submission does not
                // fire here, and the prototype bound the key directly too.
                onKeyDown={(event) => {
                  if (event.key !== 'Enter' || event.shiftKey) return;
                  event.preventDefault();
                  onSend();
                }}
                placeholder="What's on your mind?"
                aria-label="Message Vyom"
                style={css('flex:1;min-width:0;border:none;outline:none;background:transparent;font-size:12px;font-weight:500;color:#212529;font-family:inherit;')}
              />
            )}
            <div
              onClick={onToggleMic}
              style={{
                ...css('width:32px;height:32px;flex:none;border-radius:50%;display:grid;place-items:center;cursor:pointer;'),
                color: recording ? '#fff' : '#868e96',
                background: recording ? '#e03131' : '#f1f3f5',
              }}
            >
              <i className="ti ti-microphone" style={css('font-size:16px;')} />
            </div>
            <div
              onClick={onSend}
              style={css('width:34px;height:34px;flex:none;border-radius:10px;display:grid;place-items:center;cursor:pointer;color:#fff;background:linear-gradient(45deg,#228be6,#15aabf);box-shadow:0 3px 8px rgba(34,139,230,.35);')}
            >
              <i className="ti ti-send" style={css('font-size:16px;')} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

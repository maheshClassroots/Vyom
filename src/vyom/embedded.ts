/**
 * Bytes embedded by the single-file build (`scripts/build-artifact.mjs`).
 *
 * A normal build resolves the runtime WASM from a CDN and the .riv files over
 * HTTP. Neither is possible inside a sandboxed single page, so that build
 * injects them as base64 globals and the app boots from memory instead. In
 * every other build these are absent and nothing changes.
 */
declare global {
  interface Window {
    __RIVE_WASM_B64?: string;
    __RIVE_FILES_B64?: Record<string, string>;
  }
}

function decode(base64: string | undefined): ArrayBuffer | null {
  if (!base64) return null;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

const files = typeof window === 'undefined' ? undefined : window.__RIVE_FILES_B64;

/** Runtime WASM, when embedded. */
export const EMBEDDED_WASM = typeof window === 'undefined' ? null : decode(window.__RIVE_WASM_B64);

/**
 * Looks up an embedded .riv by the src path the app would otherwise fetch.
 *
 * Decoded once per path and cached: this is called during render, and handing
 * back a fresh ArrayBuffer each time makes the Rive file re-initialise on every
 * pass — which loses the artboard list and wastes a copy of the file.
 */
const decoded = new Map<string, ArrayBuffer | null>();

export function embeddedRive(src: string): ArrayBuffer | null {
  if (!files) return null;
  if (!decoded.has(src)) decoded.set(src, decode(files[src]));
  return decoded.get(src) ?? null;
}

/** True when the app is running from embedded bytes rather than over HTTP. */
export const IS_EMBEDDED = Boolean(EMBEDDED_WASM);

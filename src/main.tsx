import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RuntimeLoader } from '@rive-app/react-canvas';
import App from './App';
import { EMBEDDED_WASM } from './vyom/embedded';
import './index.css';

// The single-file build embeds the runtime; hand it over before anything asks
// for it, so Rive never reaches for the CDN copy.
if (EMBEDDED_WASM) RuntimeLoader.setWasmBinary(EMBEDDED_WASM);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

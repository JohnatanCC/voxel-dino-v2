import { registerSW } from 'virtual:pwa-register';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';


// Suppress Three.js deprecation warnings caused by R3F
const originalWarn = console.warn;
console.warn = (...args) => {
  const msg = args[0] || '';
  if (typeof msg === 'string' && (msg.includes('THREE.Clock') || msg.includes('PCFSoftShadowMap'))) {
    return;
  }
  originalWarn(...args);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

registerSW({ immediate: true });

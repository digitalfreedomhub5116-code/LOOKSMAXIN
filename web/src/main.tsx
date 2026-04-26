import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

const root = document.getElementById('root')!;

try {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
} catch (e) {
  root.innerHTML = `<div style="padding:20px;color:#fff;font-family:sans-serif">
    <h2>App failed to load</h2>
    <pre style="color:#ef4444">${e}</pre>
  </div>`;
}

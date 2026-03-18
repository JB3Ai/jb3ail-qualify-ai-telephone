import React from 'react';
import { createRoot } from 'react-dom/client';
import './app.css';
import App from './App';
import { TerminalProvider } from './TerminalContext';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <TerminalProvider>
        <App />
      </TerminalProvider>
    </React.StrictMode>
  );
}

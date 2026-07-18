import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { installQuoteFormEnhancer } from './services/quoteFormEnhancer';
import { registerSW } from 'virtual:pwa-register';
import './styles.css';
import './quote-redesign.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

installQuoteFormEnhancer();
registerSW({ immediate: true });

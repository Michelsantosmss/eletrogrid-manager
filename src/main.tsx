import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { installQuoteFormEnhancer } from './services/quoteFormEnhancer';
import { installIntakeEnhancer } from './services/intakeEnhancer';
import { installNavigationClarity } from './services/navigationClarity';
import './styles.css';
import './quote-redesign.css';
import './mobile.css';
import './intake.css';
import './navigation-clarity.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

installQuoteFormEnhancer();
installIntakeEnhancer();
installNavigationClarity();

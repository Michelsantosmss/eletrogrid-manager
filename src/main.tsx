import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { installQuoteFormEnhancer } from './services/quoteFormEnhancer';
import { installIntakeEnhancer } from './services/intakeEnhancer';
import { installNavigationClarity } from './services/navigationClarity';
import { installStatusWorkflowEnhancer } from './services/statusWorkflowEnhancer';
import './styles.css';
import './quote-redesign.css';
import './mobile.css';
import './intake.css';
import './navigation-clarity.css';
import './status-workflow.css';
import './eletrogrid-app-theme.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

installQuoteFormEnhancer();
installIntakeEnhancer();
installNavigationClarity();
installStatusWorkflowEnhancer();
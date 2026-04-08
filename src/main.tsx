import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './i18n';
import './index.css';
import './App.css';
import App from './App';

// Set RTL based on language
const updateDirection = () => {
  const lang = document.documentElement.lang || 'en';
  document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
};

updateDirection();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

import {createRoot} from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import './index.css';

// Register Service Worker for PWA Offline & Fast Crawler Access
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // Automatically check for updates on each page load
        registration.update();
      })
      .catch((err) => {
        console.warn('Service worker registration failed:', err);
      });
  });
}

// Automatically reload page if a dynamic chunk preload fails due to a new deployment
window.addEventListener('vite:preloadError', (event) => {
  console.warn('Vite preload chunk mismatch detected, reloading to fetch latest assets...', event);
  window.location.reload();
});

createRoot(document.getElementById('root')!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);

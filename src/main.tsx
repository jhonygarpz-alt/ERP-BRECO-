import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

/*
 * Los links de recuperacion de contrasena de Supabase llegan como
 * "#access_token=...&type=recovery&refresh_token=...", pero la app usa
 * HashRouter (todo despues de "#" es una ruta). Antes de que el router
 * lea el hash, se reescribe a una ruta real "#/restablecer-password?..."
 * para que ambos convivan.
 */
const hashCrudo = window.location.hash;
if (hashCrudo.startsWith('#access_token=') && hashCrudo.includes('type=recovery')) {
  window.location.hash = `#/restablecer-password?${hashCrudo.slice(1)}`;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// PWA: registra el service worker solo para que el navegador considere la
// app instalable ("Agregar a pantalla de inicio"). No cachea datos -- la
// app sigue siendo 100% online/tiempo real, igual que en el navegador.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.error('No se pudo registrar el service worker:', err);
    });
  });
}

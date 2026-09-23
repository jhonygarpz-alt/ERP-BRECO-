import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

/** Evento no estandar que dispara Chrome/Edge/Android cuando la PWA cumple los criterios de instalacion. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'breco-pwa-instalar-descartado';

/**
 * Boton "Instalar app" que solo aparece cuando el navegador ofrece el
 * prompt nativo de instalacion (Chrome/Edge en Android y escritorio). En
 * iOS Safari no existe este evento -- ahi la instalacion es manual
 * (Compartir > Agregar a pantalla de inicio), asi que el boton
 * simplemente no aparece.
 */
export function InstallPwaButton() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    function onBeforeInstallPrompt(e: Event) {
      if (localStorage.getItem(DISMISSED_KEY)) return;
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', () => setPrompt(null));
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
  }, []);

  if (!prompt) return null;

  async function instalar() {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'dismissed') {
      try {
        localStorage.setItem(DISMISSED_KEY, '1');
      } catch {
        // no critico
      }
    }
    setPrompt(null);
  }

  return (
    <button
      onClick={instalar}
      title="Instalar Flota Segura ERP como app"
      className="flex items-center gap-1.5 rounded-lg border border-breco-500/40 bg-breco-500/10 px-2.5 py-1.5 text-xs font-medium text-breco-500 transition hover:bg-breco-500/20"
    >
      <Download size={14} />
      <span className="hidden sm:inline">Instalar app</span>
    </button>
  );
}

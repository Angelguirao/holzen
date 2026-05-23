import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Detect PWA standalone mode synchronously so consumers don't flash
 * install UI on mount before a `useEffect` has a chance to run.
 * Covers Chrome/Edge/Android (display-mode), iOS Safari (navigator.standalone),
 * and Android TWAs (android-app referrer).
 */
function detectStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (window.matchMedia?.('(display-mode: standalone)').matches) return true;
    if (window.matchMedia?.('(display-mode: minimal-ui)').matches) return true;
    if (window.matchMedia?.('(display-mode: fullscreen)').matches) return true;
    const navStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone;
    if (navStandalone === true) return true;
    if (typeof document !== 'undefined' && document.referrer.startsWith('android-app://')) return true;
  } catch { /* ignore */ }
  return false;
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(() => detectStandalone());

  useEffect(() => {
    if (isInstalled) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const onInstalled = () => setIsInstalled(true);

    const mql = window.matchMedia?.('(display-mode: standalone)');
    const onDisplayModeChange = (e: MediaQueryListEvent) => {
      if (e.matches) setIsInstalled(true);
    };
    mql?.addEventListener?.('change', onDisplayModeChange);

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', onInstalled);
      mql?.removeEventListener?.('change', onDisplayModeChange);
    };
  }, [isInstalled]);

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setDeferredPrompt(null);
  };

  return { canInstall: !!deferredPrompt && !isInstalled, isInstalled, install };
}

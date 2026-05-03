import { useCallback, useEffect, useState } from 'react';

const ZEN_KEY = 'holzen_zen_mode';
const ZEN_RESET_KEY = 'holzen_zen_mode_reset_v1';

function readZenFromStorage(): boolean {
  try {
    return localStorage.getItem(ZEN_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Zen mode: minimal Home focused on the current reflection. Includes a one-time
 * migration that cleared a stale default flag for some browsers.
 */
export function useHomeZenMode(pathname: string): {
  zenMode: boolean;
  setZenModePersist: (zen: boolean) => void;
} {
  const [zenMode, setZenModeState] = useState(() => {
    try {
      if (typeof window !== 'undefined' && !localStorage.getItem(ZEN_RESET_KEY)) {
        localStorage.removeItem(ZEN_KEY);
        localStorage.setItem(ZEN_RESET_KEY, '1');
        return false;
      }
      return readZenFromStorage();
    } catch {
      return false;
    }
  });

  const setZenModePersist = useCallback((zen: boolean) => {
    setZenModeState(zen);
    try {
      localStorage.setItem(ZEN_KEY, String(zen));
    } catch {
      /* private mode / quota */
    }
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === ZEN_KEY && e.newValue != null) {
        setZenModeState(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    if (pathname !== '/') return;
    setZenModeState(readZenFromStorage());
  }, [pathname]);

  return { zenMode, setZenModePersist };
}

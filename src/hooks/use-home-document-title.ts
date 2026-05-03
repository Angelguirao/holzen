import { useEffect } from 'react';

const HOME_TITLE = 'Holzen — Home';
const DEFAULT_TITLE = 'Holzen — Pause before you act';

export function useHomeDocumentTitle(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    document.title = HOME_TITLE;
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [active]);
}

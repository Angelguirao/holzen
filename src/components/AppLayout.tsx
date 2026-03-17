import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { NotificationBell } from './NotificationBell';
import { PauseReadyBanner } from './PauseReadyBanner';
import { useHolzen } from '@/hooks/use-holzen';
import { useLanguageSync } from '@/hooks/use-language-sync';
import { useAutoTrigger } from '@/hooks/use-auto-trigger';

export function AppLayout() {
  const { language } = useHolzen();
  useLanguageSync(language);
  const { pauseReady, dismiss } = useAutoTrigger();
  const location = useLocation();
  const isHome = location.pathname === '/' || location.pathname === '/index';

  return (
    <div className="min-h-screen flex items-start justify-center p-6 pb-20">
      {/* Show banner on non-Home pages when auto-trigger fires */}
      {!isHome && <PauseReadyBanner visible={pauseReady} onDismiss={dismiss} />}
      <div className="w-full max-w-sm pt-4">
        {/* Header */}
        <div className="mb-10 flex items-center justify-between">
          <h1 className="text-sm font-mono tracking-widest uppercase text-muted-foreground">
            Holzen
          </h1>
          <NotificationBell />
        </div>
        <Outlet context={{ pauseReady, dismissPauseReady: dismiss }} />
      </div>
      <BottomNav />
    </div>
  );
}

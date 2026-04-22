import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { NotificationBell } from './NotificationBell';
import { PauseReadyBanner } from './PauseReadyBanner';
import { CheckoutConfirmation } from './CheckoutConfirmation';
import { useHolzen } from '@/hooks/use-holzen';
import { useLanguageSync } from '@/hooks/use-language-sync';
import { useAutoTrigger } from '@/hooks/use-auto-trigger';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Lightweight fallback shown while a lazy page chunk downloads *within*
 * the authenticated shell. Keeps the header + bottom nav visible so the
 * transition doesn't full-screen-flash between tabs.
 */
function PageChunkFallback() {
  return (
    <div
      className="space-y-6"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="space-y-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

/**
 * Warm up the main-tab route chunks so switching tabs feels instant the first
 * time. Runs once when the authenticated shell mounts, on an idle callback so
 * it never competes with critical rendering.
 */
function useTabChunkPrefetch() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const run = () => {
      void import('@/pages/Home').catch(() => {});
      void import('@/pages/Library').catch(() => {});
      void import('@/pages/Profile').catch(() => {});
      void import('@/pages/Settings').catch(() => {});
    };
    const ric = (window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    }).requestIdleCallback;
    if (typeof ric === 'function') {
      const id = ric(run, { timeout: 2000 });
      return () => {
        (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback?.(id);
      };
    }
    const t = window.setTimeout(run, 1500);
    return () => window.clearTimeout(t);
  }, []);
}

export function AppLayout() {
  const { language } = useHolzen();
  useLanguageSync(language);
  useTabChunkPrefetch();
  const { pauseReady, dismiss } = useAutoTrigger();
  const location = useLocation();
  const isHome = location.pathname === '/' || location.pathname === '/index';

  return (
    <div className="min-h-screen flex items-start justify-center p-6 pb-20">
      {/* Show banner on non-Home pages when auto-trigger fires */}
      {!isHome && <PauseReadyBanner visible={pauseReady} onDismiss={dismiss} />}
      <CheckoutConfirmation />
      <div className="w-full max-w-sm pt-4">
        <header className="mb-10 flex items-center justify-between">
          <h1 className="text-sm font-mono tracking-[0.25em] uppercase" style={{ color: '#DBB366' }}>
            Holzen
          </h1>
          <NotificationBell />
        </header>
        <main id="main-content">
          {/* Inner Suspense keeps the chrome (header + bottom nav) mounted while
              a lazy page chunk loads, avoiding full-screen spinner flashes on
              tab switches between Home / Library / Profile / Settings. */}
          <Suspense fallback={<PageChunkFallback />}>
            <Outlet context={{ pauseReady, dismissPauseReady: dismiss }} />
          </Suspense>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}

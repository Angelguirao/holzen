import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { NotificationBell } from './NotificationBell';
import { useHolzen } from '@/hooks/use-holzen';
import { useLanguageSync } from '@/hooks/use-language-sync';

export function AppLayout() {
  const { language } = useHolzen();
  useLanguageSync(language);

  return (
    <div className="min-h-screen flex items-start justify-center p-6 pb-20">
      <div className="w-full max-w-sm pt-4">
        {/* Header */}
        <div className="mb-10 flex items-center justify-between">
          <h1 className="text-sm font-mono tracking-widest uppercase text-muted-foreground">
            Holzen
          </h1>
          <NotificationBell />
        </div>
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}

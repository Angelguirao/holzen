import { NavLink, useLocation } from 'react-router-dom';
import { Home, BookOpen, User, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { JOURNEY_PREFIX } from '@/lib/app-routes';

const tabs = [
  { to: '/', icon: Home, key: 'home' },
  { to: '/library', icon: BookOpen, key: 'library' },
  { to: '/journey/stats', icon: User, key: 'journey' },
  { to: '/settings', icon: Settings, key: 'settings' },
] as const;

export function BottomNav() {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-sm items-center justify-around py-2">
        {tabs.map(({ to, icon: Icon, key }) => {
          const journey = key === 'journey';
          return (
            <NavLink
              key={key}
              to={to}
              end={!journey && to === '/'}
              className={({ isActive }) => {
                const active = journey
                  ? pathname.startsWith(JOURNEY_PREFIX)
                  : isActive;
                return cn(
                  'flex flex-col items-center gap-0.5 px-4 py-1.5 text-[10px] font-mono transition-colors',
                  active ? 'text-foreground' : 'text-muted-foreground',
                );
              }}
            >
              <Icon className="h-4 w-4" />
              <span className="text-sm font-sans">{t(`nav.${key}`)}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

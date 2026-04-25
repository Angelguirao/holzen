import { NavLink, useLocation } from 'react-router-dom';
import { Home, BookOpen, LayoutGrid, User, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { JOURNEY_PREFIX, TOOLS_PREFIX } from '@/lib/app-routes';

const tabs = [
  { to: '/', icon: Home, key: 'home' },
  { to: '/library', icon: BookOpen, key: 'library' },
  { to: TOOLS_PREFIX, icon: LayoutGrid, key: 'tools' },
  { to: '/journey/stats', icon: User, key: 'journey' },
  { to: '/settings', icon: Settings, key: 'settings' },
] as const;

export function BottomNav() {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-sm items-center justify-between gap-0.5 px-1 py-2">
        {tabs.map(({ to, icon: Icon, key }) => {
          const journey = key === 'journey';
          const tools = key === 'tools';
          const settings = key === 'settings';
          return (
            <NavLink
              key={key}
              to={to}
              end={!journey && !tools && !settings && to === '/'}
              className={({ isActive }) => {
                const active = journey
                  ? pathname.startsWith(JOURNEY_PREFIX)
                  : tools
                    ? pathname === TOOLS_PREFIX
                    : settings
                      ? pathname.startsWith('/settings')
                      : isActive;
                return cn(
                  'flex flex-col items-center gap-0.5 px-1.5 sm:px-2 py-1.5 min-w-0 text-[9px] sm:text-[10px] font-mono transition-colors',
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

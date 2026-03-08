import { NavLink } from 'react-router-dom';
import { Home, Clock, User, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

const tabs = [
  { to: '/', icon: Home, key: 'home' },
  { to: '/history', icon: Clock, key: 'history' },
  { to: '/profile', icon: User, key: 'profile' },
  { to: '/settings', icon: Settings, key: 'settings' },
] as const;

export function BottomNav() {
  const { t } = useTranslation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-sm items-center justify-around py-2">
        {tabs.map(({ to, icon: Icon, key }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 px-4 py-1.5 text-[10px] font-mono transition-colors',
                isActive ? 'text-foreground' : 'text-muted-foreground'
              )
            }
          >
            <Icon className="h-4 w-4" />
            <span>{t(`nav.${key}`)}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

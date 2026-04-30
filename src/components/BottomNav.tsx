import { NavLink, useLocation } from 'react-router-dom';
import { Home, BookOpen, Wrench, Compass, Settings as SettingsIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { JOURNEY_PREFIX, TOOLS_PREFIX } from '@/lib/app-routes';
import { trackEvent } from '@/lib/posthog';

const tabs = [
  { to: '/', icon: Home, key: 'home' },
  { to: TOOLS_PREFIX, icon: Wrench, key: 'tools' },
  { to: '/journey/stats', icon: Compass, key: 'journey' },
  { to: '/library', icon: BookOpen, key: 'library' },
  { to: '/settings', icon: SettingsIcon, key: 'settings' },
] as const;

export type PrimaryTabKey = (typeof tabs)[number]['key'];

/** Matches which bottom tab is “current” (same rules as `NavLink` active styling). */
export function isPrimaryTabActive(pathname: string, key: PrimaryTabKey): boolean {
  if (key === 'home') return pathname === '/';
  if (key === 'tools') return pathname === TOOLS_PREFIX || pathname.startsWith(`${TOOLS_PREFIX}/`);
  if (key === 'journey') return pathname.startsWith(JOURNEY_PREFIX);
  if (key === 'library') return pathname === '/library' || pathname.startsWith('/library/');
  if (key === 'settings') return pathname === '/settings' || pathname.startsWith('/settings/');
  return false;
}

export function BottomNav() {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-sm items-center justify-between gap-0.5 px-1 py-2">
        {tabs.map(({ to, icon: Icon, key }) => {
          return (
            <NavLink
              key={key}
              to={to}
              end={to === '/'}
              onClick={() => {
                if (!isPrimaryTabActive(pathname, key)) {
                  trackEvent('navigation.primary_tab_opened', { tab: key });
                }
              }}
              className={() =>
                cn(
                  'flex flex-col items-center gap-0.5 px-1.5 sm:px-2 py-1.5 min-w-0 text-[9px] sm:text-[10px] font-mono transition-colors',
                  isPrimaryTabActive(pathname, key) ? 'text-foreground' : 'text-muted-foreground',
                )
              }
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

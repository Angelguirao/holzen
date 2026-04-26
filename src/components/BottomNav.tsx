import { NavLink, useLocation } from 'react-router-dom';
import { Home, BookOpen, Sparkles, CalendarDays, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { JOURNEY_PREFIX, PRACTICE_PREFIX, CALENDAR_PREFIX } from '@/lib/app-routes';
import { trackEvent } from '@/lib/posthog';

const tabs = [
  { to: '/', icon: Home, key: 'home' },
  { to: PRACTICE_PREFIX, icon: Sparkles, key: 'practice' },
  { to: CALENDAR_PREFIX, icon: CalendarDays, key: 'calendar' },
  { to: '/library', icon: BookOpen, key: 'library' },
  // Tab is labelled "Profile" per the IA refactor; route still points to the
  // existing Journey hub until Step 4 rebuilds Profile as a single page.
  { to: '/journey/stats', icon: User, key: 'profile' },
] as const;

export type PrimaryTabKey = (typeof tabs)[number]['key'];

/** Matches which bottom tab is “current” (same rules as `NavLink` active styling). */
export function isPrimaryTabActive(pathname: string, key: PrimaryTabKey): boolean {
  if (key === 'profile') return pathname.startsWith(JOURNEY_PREFIX);
  if (key === 'practice') return pathname.startsWith(PRACTICE_PREFIX);
  if (key === 'calendar') return pathname.startsWith(CALENDAR_PREFIX);
  if (key === 'home') return pathname === '/';
  if (key === 'library') return pathname === '/library' || pathname.startsWith('/library/');
  return false;
}

export function BottomNav() {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-sm items-center justify-between gap-0.5 px-1 py-2">
        {tabs.map(({ to, icon: Icon, key }) => {
          const profile = key === 'profile';
          const practice = key === 'practice';
          const calendar = key === 'calendar';
          return (
            <NavLink
              key={key}
              to={to}
              end={!profile && !practice && !calendar && to === '/'}
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

import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

const LINKS = [
  { to: '/admin', end: true, key: 'overview' },
  { to: '/admin/smoke-test', end: false, key: 'smoke' },
  { to: '/admin/sentry-alerts', end: false, key: 'sentry' },
  { to: '/admin/edge-coverage', end: false, key: 'edge' },
] as const;

/** Grouped in-app navigation for allowlisted /admin* routes. */
export function AdminSubNav() {
  const { t } = useTranslation();

  return (
    <nav
      className="flex flex-wrap gap-1.5 border-b border-border/40 pb-3 mb-2"
      aria-label={t('admin.subNavAria', { defaultValue: 'Admin sections' })}
    >
      {LINKS.map(({ to, end, key }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              'rounded-md px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider transition-colors',
              isActive
                ? 'bg-primary/10 text-foreground'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
            )
          }
        >
          {t(`admin.subNav.${key}`)}
        </NavLink>
      ))}
    </nav>
  );
}

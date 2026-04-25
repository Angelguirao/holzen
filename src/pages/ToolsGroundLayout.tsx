import { Link, NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Anchor } from 'lucide-react';
import { TOOLS } from '@/lib/app-routes';
import { cn } from '@/lib/utils';

/**
 * Groups the Ground **session** and **journal** under one full-screen shell (tabs + back to Tools).
 */
export default function ToolsGroundLayout() {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <header className="shrink-0 border-b border-border/30 bg-background/90 backdrop-blur-md z-30">
        <div className="mx-auto flex max-w-md items-center gap-2 px-3 py-2.5 sm:px-5">
          <Link
            to="/tools"
            className="shrink-0 rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
            aria-label={t('common.back', { defaultValue: 'Back' })}
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Anchor className="h-4 w-4 shrink-0 text-primary/40" aria-hidden />
          <div
            className="min-w-0 flex-1 flex justify-stretch gap-1 rounded-lg bg-muted/40 p-1"
            role="tablist"
            aria-label={t('ground.groundToolLabel', { defaultValue: 'Ground' })}
          >
            <NavLink
              to={TOOLS.ground}
              end
              role="tab"
              className={({ isActive }) =>
                cn(
                  'flex-1 rounded-md px-3 py-2 text-center text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )
              }
            >
              {t('ground.tabSession', { defaultValue: 'Session' })}
            </NavLink>
            <NavLink
              to={TOOLS.groundHistory}
              role="tab"
              className={({ isActive }) =>
                cn(
                  'flex-1 rounded-md px-3 py-2 text-center text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )
              }
            >
              {t('ground.tabJournal', { defaultValue: 'Journal' })}
            </NavLink>
          </div>
        </div>
      </header>
      <div className="relative min-h-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}

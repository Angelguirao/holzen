import { type ReactNode } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface HomeSectionCardProps {
  title: string;
  /** When true, title is visually hidden but available to screen readers. */
  hideTitle?: boolean;
  /** Optional icon before title (e.g. moon on Your pause). */
  titleLeading?: ReactNode;
  /** Optional summary on the header row (e.g. hold goal compact line); truncates on small widths. */
  headerSubtitle?: ReactNode;
  headerRight?: ReactNode;
  children: ReactNode;
  /** Pinned below the fold area; still shown when `collapsible` and `collapsed`. */
  footer?: ReactNode;
  className?: string;
  collapsible?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

/**
 * Non-sortable home section (Goal & Why, Market, Your Pause) — no drag handle.
 */
export function HomeSectionCard({
  title,
  hideTitle = false,
  titleLeading,
  headerSubtitle,
  headerRight,
  children,
  footer,
  className = '',
  collapsible = false,
  collapsed = false,
  onToggleCollapse,
}: HomeSectionCardProps) {
  "use memo";
  const prefersReduced = useReducedMotion();
  const showBody = !collapsible || !collapsed;

  return (
    <div className={cn('rounded-xl border border-border/40 bg-card/40', className)}>
      <div className="flex items-center gap-2 px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {titleLeading ? <span className="shrink-0">{titleLeading}</span> : null}
          <span
            className={cn(
              'shrink-0 text-xs font-normal uppercase tracking-wide text-secondary-foreground',
              hideTitle && 'sr-only',
            )}
          >
            {title}
          </span>
          {headerSubtitle ? (
            <span className="min-w-0 truncate text-xs font-medium tabular-nums text-muted-foreground">
              {headerSubtitle}
            </span>
          ) : null}
        </div>
        {headerRight ? <div className="flex shrink-0 items-center gap-1">{headerRight}</div> : null}
        {collapsible && onToggleCollapse ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground/30 transition-colors hover:bg-muted/40 hover:text-muted-foreground/60"
            aria-expanded={!collapsed}
            aria-label={collapsed ? `Expand ${title}` : `Collapse ${title}`}
          >
            <motion.div animate={{ rotate: collapsed ? -90 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="h-4 w-4 text-secondary-foreground" aria-hidden />
            </motion.div>
          </button>
        ) : null}
      </div>

      <AnimatePresence initial={false}>
        {showBody ? (
          <motion.div
            initial={prefersReduced ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={prefersReduced ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {footer ? <div className="border-t border-border/30 px-4 py-3">{footer}</div> : null}
    </div>
  );
}

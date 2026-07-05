import { useState, useCallback, useEffect, type ReactNode } from 'react';
import { normalizeHomeSectionOrder } from '@/screens/home/lib/home-section-order-normalize';
import {
  clearHomeLayoutCollapsed,
  loadHomeLayoutCollapsed,
  loadHomeLayoutOrder,
  saveHomeLayoutCollapsed,
  saveHomeLayoutOrder,
} from '@/screens/home/lib/home-layout-storage';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { GripVertical, ChevronDown } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface HomeWidgetProps {
  id: string;
  title: string;
  children: ReactNode;
  /** If true, the widget cannot be collapsed */
  alwaysOpen?: boolean;
  /** Controlled collapsed state */
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  /** If true, renders without the card wrapper (for transient content) */
  bare?: boolean;
  /** Extra classes on the card wrapper */
  className?: string;
}

export function HomeWidget({
  id,
  title,
  children,
  alwaysOpen = false,
  collapsed = false,
  onToggleCollapse,
  bare = false,
  className = '',
}: HomeWidgetProps) {
  "use memo";
  const prefersReduced = useReducedMotion();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.85 : 1,
  };

  if (bare) {
    return (
      <div ref={setNodeRef} style={style} {...attributes}>
        {children}
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`rounded-xl border border-border/40 bg-card/40 transition-shadow ${isDragging ? 'shadow-lg' : ''} ${className}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3">
        {/* Drag handle — large touch target */}
        <button type="button"
          {...listeners}
          className="touch-none cursor-grab active:cursor-grabbing p-1.5 -ml-1.5 rounded-md text-muted-foreground/40 hover:text-muted-foreground/70 hover:bg-muted/50 active:bg-muted transition-colors"
          aria-label={`Drag to reorder ${title}`}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Section title — matches Nox-style module labels (sans, not body mono) */}
        <span className="flex-1 text-xs uppercase tracking-wide text-secondary-foreground font-normal">
          {title}
        </span>

        {/* Collapse toggle */}
        {!alwaysOpen && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground/30 hover:text-muted-foreground/60 hover:bg-muted/40 transition-colors"
            aria-expanded={!collapsed}
            aria-label={collapsed ? `Expand ${title}` : `Collapse ${title}`}
          >
            <motion.div
              animate={{ rotate: collapsed ? -90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-4 w-4 text-secondary-foreground" aria-hidden />
            </motion.div>
          </button>
        )}
      </div>

      {/* Content */}
      <AnimatePresence initial={false}>
        {(!collapsed || alwaysOpen) && (
          <motion.div
            initial={prefersReduced ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={prefersReduced ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Hook to manage Home section order (core + optional) and per-widget collapse.
export function useWidgetLayout(defaultOrder: string[], userId: string | undefined) {
  const [order, setOrder] = useState<string[]>(() => loadHomeLayoutOrder(userId, defaultOrder));

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => loadHomeLayoutCollapsed(userId));

  useEffect(() => {
    setOrder(loadHomeLayoutOrder(userId, defaultOrder));
    setCollapsed(loadHomeLayoutCollapsed(userId));
  }, [userId, defaultOrder]);

  const reorder = useCallback(
    (newOrder: string[]) => {
      const normalized = normalizeHomeSectionOrder(newOrder, defaultOrder);
      setOrder(normalized);
      saveHomeLayoutOrder(userId, normalized);
    },
    [defaultOrder, userId],
  );

  const toggleCollapsed = useCallback(
    (id: string) => {
      setCollapsed((prev) => {
        const next = { ...prev, [id]: !prev[id] };
        saveHomeLayoutCollapsed(userId, next);
        return next;
      });
    },
    [userId],
  );

  const resetLayout = useCallback(() => {
    // Use `reorder` so defaults are persisted like drag updates; otherwise only `setOrder`
    // runs and dnd-kit can keep a stale visual order until the sheet remounts.
    reorder(normalizeHomeSectionOrder([...defaultOrder], defaultOrder));
    setCollapsed({});
    clearHomeLayoutCollapsed(userId);
  }, [defaultOrder, reorder, userId]);

  return { order, collapsed, reorder, toggleCollapsed, resetLayout };
}

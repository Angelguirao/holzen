import { useState, useCallback, type ReactNode } from 'react';
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
        <button
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
const ORDER_KEY = 'holzen_home_section_order_v1';
const LEGACY_ORDER_KEY = 'holzen_widget_order';
const COLLAPSED_KEY = 'holzen_home_section_collapsed_v1';
const LEGACY_COLLAPSED_KEY = 'holzen_widget_collapsed';

const CORE_PREFIX = ['goal-why', 'market', 'your-pause'] as const;

function loadOrder(defaultOrder: string[]): string[] {
  try {
    const raw = localStorage.getItem(ORDER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as string[];
      const merged = parsed.filter((id) => defaultOrder.includes(id));
      const missing = defaultOrder.filter((id) => !merged.includes(id));
      return [...merged, ...missing];
    }
    const legacy = localStorage.getItem(LEGACY_ORDER_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy) as string[];
      const core = CORE_PREFIX.filter((id) => defaultOrder.includes(id));
      const fromLegacy = parsed.filter((id) => defaultOrder.includes(id) && !core.includes(id));
      const base = [...core, ...fromLegacy];
      const missing = defaultOrder.filter((id) => !base.includes(id));
      return [...base, ...missing];
    }
  } catch {
    void 0;
  }
  return [...defaultOrder];
}

function loadCollapsed(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(COLLAPSED_KEY);
    if (raw) return JSON.parse(raw) as Record<string, boolean>;
    const legacy = localStorage.getItem(LEGACY_COLLAPSED_KEY);
    if (legacy) return JSON.parse(legacy) as Record<string, boolean>;
  } catch {
    void 0;
  }
  return {};
}

export function useWidgetLayout(defaultOrder: string[]) {
  const [order, setOrder] = useState<string[]>(() => loadOrder(defaultOrder));

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(loadCollapsed);

  const reorder = useCallback((newOrder: string[]) => {
    setOrder(newOrder);
    localStorage.setItem(ORDER_KEY, JSON.stringify(newOrder));
  }, []);

  const toggleCollapsed = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem(COLLAPSED_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const resetLayout = useCallback(() => {
    setOrder([...defaultOrder]);
    setCollapsed({});
    localStorage.removeItem(ORDER_KEY);
    localStorage.removeItem(COLLAPSED_KEY);
    localStorage.removeItem(LEGACY_ORDER_KEY);
    localStorage.removeItem(LEGACY_COLLAPSED_KEY);
  }, [defaultOrder]);

  return { order, collapsed, reorder, toggleCollapsed, resetLayout };
}

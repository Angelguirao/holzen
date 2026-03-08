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
}

export function HomeWidget({
  id,
  title,
  children,
  alwaysOpen = false,
  collapsed = false,
  onToggleCollapse,
  bare = false,
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
      className={`rounded-lg border border-border/50 bg-card/50 transition-shadow ${isDragging ? 'shadow-lg' : ''}`}
    >
      {/* Header */}
      <div className="flex items-center gap-1.5 px-3 py-2">
        {/* Drag handle */}
        <button
          {...listeners}
          className="touch-none cursor-grab active:cursor-grabbing p-0.5 -ml-0.5 text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
          aria-label={`Drag to reorder ${title}`}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>

        {/* Title */}
        <span className="flex-1 text-[10px] font-mono tracking-[0.15em] uppercase text-muted-foreground/50">
          {title}
        </span>

        {/* Collapse toggle */}
        {!alwaysOpen && (
          <button
            onClick={onToggleCollapse}
            className="p-0.5 text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
            aria-label={collapsed ? `Expand ${title}` : `Collapse ${title}`}
          >
            <motion.div
              animate={{ rotate: collapsed ? -90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-3 w-3" />
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
            <div className="px-3 pb-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Hook to manage widget order and collapsed state
const STORAGE_KEY = 'holzen_widget_order';
const COLLAPSED_KEY = 'holzen_widget_collapsed';

export function useWidgetLayout(defaultOrder: string[]) {
  const [order, setOrder] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        // Merge: keep stored order but add any new widgets
        const merged = parsed.filter((id) => defaultOrder.includes(id));
        const missing = defaultOrder.filter((id) => !merged.includes(id));
        return [...merged, ...missing];
      }
    } catch { }
    return defaultOrder;
  });

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem(COLLAPSED_KEY);
      if (stored) return JSON.parse(stored);
    } catch { }
    return {};
  });

  const reorder = useCallback((newOrder: string[]) => {
    setOrder(newOrder);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newOrder));
  }, []);

  const toggleCollapsed = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem(COLLAPSED_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const resetLayout = useCallback(() => {
    setOrder(defaultOrder);
    setCollapsed({});
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(COLLAPSED_KEY);
  }, [defaultOrder]);

  return { order, collapsed, reorder, toggleCollapsed, resetLayout };
}

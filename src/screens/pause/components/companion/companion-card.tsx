import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check, Heart, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export type CompanionCardProps = {
  id: string;
  label: string;
  icon: React.ElementType;
  expanded: boolean;
  onToggle: () => void;
  completed?: boolean;
  loading?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  locked?: boolean;
  onUpgrade?: () => void;
  children: React.ReactNode;
};

/** Expandable companion intervention card (header row + animated body). */
export function CompanionCard({
  label,
  icon: Icon,
  expanded,
  onToggle,
  completed,
  loading,
  isFavorite,
  onToggleFavorite,
  locked,
  onUpgrade,
  children,
}: CompanionCardProps) {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();

  if (locked) {
    return (
      <button
        onClick={onUpgrade}
        className="flex w-full items-center gap-3 rounded-xl border border-border/10 bg-card/10 px-4 py-3.5 text-left text-muted-foreground/30 transition-all duration-300 hover:bg-card/20 hover:text-muted-foreground/50"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/20">
          <Lock className="h-3.5 w-3.5" />
        </div>
        <span className="flex-1 text-sm font-medium text-muted-foreground">{label}</span>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-nox-text-highlight/75">
          {t('pro.badge')}
        </span>
      </button>
    );
  }

  return (
    <div className="space-y-0">
      <div
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
        className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all duration-300 ${
          expanded
            ? 'border-primary/15 bg-primary/3'
            : completed
              ? 'border-border/10 bg-card/10'
              : 'border-border/10 bg-card/15 hover:border-border/20 hover:bg-card/25'
        }`}
      >
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-300 ${
            loading && !completed
              ? 'animate-pulse bg-muted/30'
              : completed
                ? 'bg-primary/10'
                : expanded
                  ? 'bg-primary/8'
                  : 'bg-muted/30'
          }`}
        >
          {completed ? (
            <Check className="h-3.5 w-3.5 text-nox-accent-green" />
          ) : (
            <Icon
              className={`h-3.5 w-3.5 ${loading ? 'text-muted-foreground/30' : expanded ? 'text-nox-text-link/80' : 'text-muted-foreground/50'}`}
            />
          )}
        </div>
        <span
          className={`flex-1 text-sm font-medium ${completed ? 'text-muted-foreground/50' : 'text-foreground/80'}`}
        >
          {label}
        </span>
        {onToggleFavorite ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className={`p-1 transition-colors ${isFavorite ? 'text-destructive' : 'text-muted-foreground/20 hover:text-destructive/60'}`}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={`h-3 w-3 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        ) : null}
      </div>
      <AnimatePresence>
        {expanded ? (
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="px-1 pb-1 pt-3">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

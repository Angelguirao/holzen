import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check, ChevronDown, Heart, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { CompanionFrameIconTooltip } from '@/screens/pause/components/companion/companion-frame-icon-tooltip';

export type CompanionCardAppearance = 'default' | 'frame';

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
  /** Frame step wireframe: purple collapsed border, foreground when expanded. */
  appearance?: CompanionCardAppearance;
  /** Brief hover help on the icon when `appearance="frame"`. */
  iconHelp?: string;
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
  appearance = 'default',
  iconHelp,
  children,
}: CompanionCardProps) {
  "use memo";
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

  const frameChrome = appearance === 'frame';

  return (
    <div
      className={cn(
        'space-y-0',
        frameChrome && 'overflow-hidden rounded-2xl border-2 bg-background transition-colors',
        frameChrome && (expanded ? 'border-foreground' : 'border-primary'),
      )}
    >
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
        className={cn(
          'flex w-full cursor-pointer items-center gap-3 text-left transition-all duration-300',
          frameChrome
            ? 'px-4 py-3 hover:bg-primary/5'
            : cn(
                'rounded-xl border px-4 py-3.5',
                expanded
                  ? 'border-primary/15 bg-primary/3'
                  : completed
                    ? 'border-border/10 bg-card/10'
                    : 'border-border/10 bg-card/15 hover:border-border/20 hover:bg-card/25',
              ),
        )}
      >
        {(() => {
          const iconBox = (
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
          );

          return frameChrome && iconHelp ? (
            <CompanionFrameIconTooltip content={iconHelp}>{iconBox}</CompanionFrameIconTooltip>
          ) : (
            iconBox
          );
        })()}
        <span
          className={`flex-1 text-sm font-medium ${completed ? 'text-muted-foreground/50' : 'text-foreground/80'}`}
        >
          {label}
        </span>
        {frameChrome && completed ? (
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {t('pause.frame.companionSeen', { defaultValue: 'Seen' })}
          </span>
        ) : null}
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
        {frameChrome ? (
          <ChevronDown
            className={cn(
              'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
              expanded && 'rotate-180',
            )}
            aria-hidden
          />
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

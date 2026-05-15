import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Activity,
  Anchor,
  ChevronDown,
  ChevronRight,
  Heart,
  History,
  ImageIcon,
  ZoomOut,
} from 'lucide-react';
import { pauseStepLayout } from '@/components/pause/pause-step-layout';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { hapticFeedback } from '@/lib/haptics';
import { cn } from '@/lib/utils';

export interface PauseFrameProps {
  pauseInstanceId: string | null;
  reflectionMessage: string;
  haiku: string | null;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  subscribed: boolean;
  onImDone: () => void;
}

/**
 * Figma "Frame" hub: companion context + links to angles (ground, zoom out, history, signal).
 * Completing the hub logs shift server-side from the parent (skipped mirror mood).
 */
export function PauseFrame({
  pauseInstanceId,
  reflectionMessage,
  haiku,
  isFavorite,
  onToggleFavorite,
  subscribed,
  onImDone,
}: PauseFrameProps) {
  const { t } = useTranslation();
  /** Match Reflect companion pattern: collapsed until the user opens the card. */
  const [haikuOpen, setHaikuOpen] = useState(false);

  const zoomHref = pauseInstanceId ? `/companion/zoom-out/${pauseInstanceId}` : '/tools';
  const signalHref = pauseInstanceId ? `/companion/signal/${pauseInstanceId}` : '/tools';

  const haikuBody = (haiku ?? '').trim() || reflectionMessage.trim();
  const showHaikuCard = Boolean(haikuBody);

  return (
    <motion.div
      className={pauseStepLayout.columnFlow}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.45 }}
    >
      <div className="flex w-full flex-col gap-2 text-center">
        <h2 className={pauseStepLayout.screenTitle}>{t('pause.frame.title', { defaultValue: 'Frame' })}</h2>
        <p className={pauseStepLayout.screenSubtitle}>
          {t('pause.frame.subtitle', { defaultValue: 'Want another angle? Your companions' })}
        </p>
      </div>

      <div className="mt-6 w-full space-y-3">
        {showHaikuCard ? (
          <Collapsible open={haikuOpen} onOpenChange={setHaikuOpen}>
            <div
              className={cn(
                'overflow-hidden rounded-lg border-2 bg-background transition-colors',
                haikuOpen ? 'border-foreground' : 'border-primary',
              )}
            >
              <div className="flex items-center gap-2 px-4 py-3">
                <ImageIcon className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm font-medium text-foreground outline-none"
                    onClick={() => hapticFeedback('light')}
                  >
                    <span className="truncate">{t('pause.frame.haikuLabel', { defaultValue: 'Haiku' })}</span>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="shrink-0 rounded-md p-1 text-muted-foreground outline-none hover:text-foreground"
                    aria-expanded={haikuOpen}
                    aria-label={t('pause.frame.toggleHaikuAria', { defaultValue: 'Expand or collapse haiku' })}
                    onClick={() => hapticFeedback('light')}
                  >
                    <ChevronDown
                      className={cn('h-4 w-4 transition-transform duration-200', haikuOpen && 'rotate-180')}
                      aria-hidden
                    />
                  </button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent>
                {subscribed ? (
                  <div className="flex items-center justify-end gap-2 border-t border-border/40 px-4 py-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {t('pause.frame.haikuSeen', { defaultValue: 'Seen' })}
                    </span>
                    <button
                      type="button"
                      className="rounded-full p-1.5 text-muted-foreground transition-colors hover:text-destructive"
                      aria-label={t('pause.frame.favoriteHaikuAria', { defaultValue: 'Favorite' })}
                      onClick={(e) => {
                        e.preventDefault();
                        hapticFeedback('light');
                        onToggleFavorite();
                      }}
                    >
                      <Heart className={cn('h-4 w-4', isFavorite && 'fill-current text-destructive')} aria-hidden />
                    </button>
                  </div>
                ) : null}
                <p className="px-4 pb-4 text-sm leading-relaxed text-muted-foreground">
                  {haiku?.trim() ? haiku.trim() : reflectionMessage}
                </p>
              </CollapsibleContent>
            </div>
          </Collapsible>
        ) : null}

        <FrameToolRow
          icon={<Anchor className="h-5 w-5 text-primary" aria-hidden />}
          label={t('pause.frame.ground', { defaultValue: 'Ground yourself' })}
          href="/tools/ground"
        />
        <FrameToolRow
          icon={<ZoomOut className="h-5 w-5 text-primary" aria-hidden />}
          label={t('pause.frame.zoomOut', { defaultValue: 'Zoom out' })}
          href={zoomHref}
        />
        <FrameToolRow
          icon={<History className="h-5 w-5 text-primary" aria-hidden />}
          label={t('pause.frame.lookBack', { defaultValue: 'Look back' })}
          href="/tools/ground/history"
        />
        <FrameToolRow
          icon={<Activity className="h-5 w-5 text-primary" aria-hidden />}
          label={t('pause.frame.signal', { defaultValue: 'Signal' })}
          href={signalHref}
        />
      </div>

      <div className="mt-10 flex w-full justify-center">
        <Button
          type="button"
          variant="outline"
          className={pauseStepLayout.ritualPrimaryOutlineCta}
          onClick={() => {
            hapticFeedback('light');
            onImDone();
          }}
        >
          {t('pause.frame.imDone', { defaultValue: "I'm done" })}
          <ChevronRight className="ml-1 h-4 w-4" aria-hidden />
        </Button>
      </div>
    </motion.div>
  );
}

function FrameToolRow({ icon, label, href }: { icon: ReactNode; label: string; href: string }) {
  return (
    <Link
      to={href}
      className="flex items-center justify-between gap-3 rounded-lg border-2 border-primary bg-background px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-primary/5"
      onClick={() => hapticFeedback('light')}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-primary/25 bg-primary/5">
          {icon}
        </span>
        <span className="truncate">{label}</span>
      </span>
      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
    </Link>
  );
}

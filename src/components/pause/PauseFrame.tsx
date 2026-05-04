import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ChevronRight, Compass, ImageIcon } from 'lucide-react';
import { pauseStepLayout } from '@/components/pause/pause-step-layout';
import { Button } from '@/components/ui/button';
import type { CompanionData } from '@/components/CompanionSection';

export interface PauseFrameProps {
  companions: CompanionData;
  pauseInstanceId: string | null;
  reflectionMessage: string;
  onImDone: () => void;
}

/**
 * Figma "Frame" hub: companion context + links to angles (ground, zoom out, history, signal).
 * Completing the hub logs shift server-side from the parent (skipped mirror mood).
 */
export function PauseFrame({
  companions,
  pauseInstanceId,
  reflectionMessage,
  onImDone,
}: PauseFrameProps) {
  const { t } = useTranslation();

  const zoomHref = pauseInstanceId ? `/companion/zoom-out/${pauseInstanceId}` : '/tools';
  const signalHref = pauseInstanceId ? `/companion/signal/${pauseInstanceId}` : '/tools';

  return (
    <motion.div
      className={pauseStepLayout.columnFlow}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.45 }}
    >
      <div className="flex w-full flex-col gap-2 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {t('pause.frame.kicker', { defaultValue: 'Step 4 · Frame' })}
        </p>
        <h2 className={pauseStepLayout.screenTitle}>{t('pause.frame.title', { defaultValue: 'Frame' })}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t('pause.frame.subtitle', { defaultValue: 'Want another angle? Your companions' })}
        </p>
      </div>

      <div className="mt-8 w-full space-y-3">
        {(companions.haiku || reflectionMessage) && (
          <div className="rounded-2xl border-2 border-border bg-card/40 px-4 py-3 text-left">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
              <span className="text-sm font-medium text-foreground">{t('pause.frame.haikuLabel', { defaultValue: 'Haiku' })}</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {companions.haiku ?? reflectionMessage.slice(0, 160)}
              {reflectionMessage.length > 160 ? '…' : ''}
            </p>
          </div>
        )}

        <FrameRow
          label={t('pause.frame.ground', { defaultValue: 'Ground yourself' })}
          href="/tools/ground"
        />
        <FrameRow label={t('pause.frame.zoomOut', { defaultValue: 'Zoom out' })} href={zoomHref} />
        <FrameRow
          label={t('pause.frame.lookBack', { defaultValue: 'Look back' })}
          href="/tools/ground/history"
        />
        <FrameRow label={t('pause.frame.signal', { defaultValue: 'Signal' })} href={signalHref} />
      </div>

      <div className="mt-10 flex w-full justify-center">
        <Button
          type="button"
          variant="outline"
          className="rounded-full border-primary/40 bg-primary/5 px-5 py-2 text-primary hover:bg-primary/10"
          onClick={onImDone}
        >
          {t('pause.frame.imDone', { defaultValue: "I'm done" })}
          <ChevronRight className="ml-1 h-4 w-4" aria-hidden />
        </Button>
      </div>

      <p className="mt-6 flex items-center justify-center gap-1 text-xs text-muted-foreground">
        <Compass className="h-3.5 w-3.5" aria-hidden />
        {t('pause.frame.hint', { defaultValue: 'Open a tool anytime — continue when you feel ready.' })}
      </p>
    </motion.div>
  );
}

function FrameRow({ label, href }: { label: string; href: string }) {
  return (
    <Link
      to={href}
      className="flex items-center justify-between rounded-xl border-2 border-primary/35 bg-background px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-primary/5"
    >
      <span>{label}</span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
    </Link>
  );
}

import { motion } from 'framer-motion';
import { Info, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
  contextLine: string | null;
  onBrief: () => void;
  onDeep: () => void;
  onAboutPauses: () => void;
  onClose: () => void;
  /** When true, deep pause is visually gated; `onDeep` still runs so callers can show paywall / checkout. */
  deepPauseLocked?: boolean;
}

const cardButtonClass = cn(
  'flex flex-col gap-4 rounded-lg border-2 border-border/70 px-4 py-8 text-center transition-colors',
  'hover:border-foreground/30',
);

export function PauseDepthPicker({
  contextLine,
  onBrief,
  onDeep,
  onAboutPauses,
  onClose,
  deepPauseLocked = false,
}: Props) {
  const { t } = useTranslation();

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <header className="sticky top-0 z-[60] bg-background/95 backdrop-blur-sm">
        <div className="relative mx-auto flex h-12 max-w-lg items-center justify-end gap-2.5 px-4 sm:px-8">
          <p className="pointer-events-none absolute inset-x-0 text-center text-sm font-medium leading-5 tracking-[0.01em] text-foreground">
            {t('pause.depthPicker.kicker', { defaultValue: 'What do you need?' })}
          </p>
          <div className="relative z-10 flex items-center gap-2.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={onAboutPauses}
              aria-label={t('pause.aboutPauses.openAria')}
            >
              <Info className="h-6 w-6 text-muted-foreground" aria-hidden />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={onClose}
              aria-label={t('common.close', { defaultValue: 'Close' })}
            >
              <X className="h-6 w-6 text-muted-foreground" aria-hidden />
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 pb-12 pt-[35px] sm:px-8">
        <div className="flex flex-col gap-8">
          <div className="text-center">
            <h1 className="text-[22px] font-normal leading-[28px] tracking-[0.01em] text-foreground">
              <span className="block">{t('pause.depthPicker.headline1', { defaultValue: 'You paused' })}</span>
              <span className="block">{t('pause.depthPicker.headline2', { defaultValue: "That's the hardest part." })}</span>
            </h1>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={onBrief}
              className={cn(cardButtonClass, 'bg-muted/25 hover:bg-muted/40')}
            >
              <span className="text-base font-medium text-muted-foreground">
                {t('pause.depthPicker.brief.label', { defaultValue: 'Brief pause' })}
              </span>
              <span className="text-sm font-normal text-muted-foreground">
                {t('pause.depthPicker.brief.duration', { defaultValue: '~ 2 min' })}
              </span>
              <span className="text-sm leading-5 text-foreground">
                {t('pause.depthPicker.brief.desc', { defaultValue: 'Steady yourself, then decide.' })}
              </span>
            </button>

            <button
              type="button"
              onClick={onDeep}
              className={cn(
                cardButtonClass,
                'bg-muted/50 hover:bg-muted/65',
                deepPauseLocked && 'opacity-80 ring-1 ring-border/60',
              )}
              aria-label={
                deepPauseLocked
                  ? t('pause.depthPicker.deep.ariaLocked')
                  : t('pause.depthPicker.deep.label', { defaultValue: 'Deep pause' })
              }
            >
              <span className="flex w-full items-center justify-center gap-2">
                <span className="text-base font-medium text-muted-foreground">
                  {t('pause.depthPicker.deep.label', { defaultValue: 'Deep pause' })}
                </span>
                {deepPauseLocked ? (
                  <span className="rounded-full border border-border/70 bg-muted/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {t('pause.depthPicker.deep.proRequiredHint', { defaultValue: 'Pro or free trial' })}
                  </span>
                ) : null}
              </span>
              <span className="text-sm font-normal text-muted-foreground">
                {t('pause.depthPicker.deep.duration', { defaultValue: '~ 7 min' })}
              </span>
              <span className="text-sm leading-5 text-foreground">
                {t('pause.depthPicker.deep.desc', {
                  defaultValue: 'Sit with it. Reflect. Decide from your center.',
                })}
              </span>
            </button>
          </div>

          {contextLine ? (
            <p className="text-center text-base font-normal leading-6 text-muted-foreground">{contextLine}</p>
          ) : null}

          <div className="flex justify-center">
            <Button
              type="button"
              variant="ghost"
              onClick={onAboutPauses}
              className="h-auto rounded-2xl px-3 py-2 text-xs font-medium tracking-[0.05em] text-nox-text-link hover:bg-nox-text-link/10 hover:text-nox-text-link"
            >
              {t('pause.aboutPauses.link', { defaultValue: 'About pauses' })}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

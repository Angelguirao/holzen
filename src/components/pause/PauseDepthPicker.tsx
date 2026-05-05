import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
  contextLine: string | null;
  onBrief: () => void;
  onDeep: () => void;
  onAboutPauses: () => void;
  onClose: () => void;
}

export function PauseDepthPicker({ contextLine, onBrief, onDeep, onAboutPauses, onClose }: Props) {
  const { t } = useTranslation();

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      style={{
        background:
          'linear-gradient(160deg, hsl(var(--background)) 0%, hsl(var(--muted)) 50%, hsl(var(--background)) 100%)',
      }}
    >
      <header className="sticky top-0 z-[60] border-b border-border/30 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3 sm:px-6">
          <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={onAboutPauses} aria-label={t('pause.aboutPauses.openAria')}>
            <Info className="h-5 w-5 text-muted-foreground" />
          </Button>
          <Button type="button" variant="ghost" size="sm" className="text-muted-foreground" onClick={onClose}>
            {t('common.close', { defaultValue: 'Close' })}
          </Button>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-8 px-5 py-10 sm:px-8">
        <div className="space-y-3 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {t('pause.depthPicker.kicker', { defaultValue: 'What do you need?' })}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {t('pause.youPaused')}
          </h1>
          {contextLine ? <p className="text-sm text-muted-foreground">{contextLine}</p> : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={onBrief}
            className={cn(
              'flex flex-col gap-2 rounded-2xl border-2 border-border/70 bg-muted/30 p-5 text-left transition-colors',
              'hover:border-foreground/30 hover:bg-muted/50',
            )}
          >
            <span className="text-xs font-semibold uppercase tracking-wide text-nox-text-highlight">
              {t('pause.depthPicker.brief.label', { defaultValue: 'Brief pause' })}
            </span>
            <span className="text-lg font-semibold text-foreground">~2 min</span>
            <span className="text-sm leading-relaxed text-muted-foreground">
              {t('pause.depthPicker.brief.desc', { defaultValue: 'Steady yourself, then decide.' })}
            </span>
          </button>

          <button
            type="button"
            onClick={onDeep}
            className={cn(
              'flex flex-col gap-2 rounded-2xl border-2 border-border/70 bg-background/60 p-5 text-left transition-colors',
              'hover:border-foreground/30 hover:bg-muted/30',
            )}
          >
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t('pause.depthPicker.deep.label', { defaultValue: 'Deep pause' })}
            </span>
            <span className="text-lg font-semibold text-foreground">~7 min</span>
            <span className="text-sm leading-relaxed text-muted-foreground">
              {t('pause.depthPicker.deep.desc', {
                defaultValue: 'Sit with it. Reflect. Decide from your center.',
              })}
            </span>
          </button>
        </div>

        <button type="button" onClick={onAboutPauses} className="text-center text-sm font-medium text-nox-text-link underline-offset-4 transition-colors hover:text-nox-text-link/80 hover:underline">
          {t('pause.aboutPauses.link', { defaultValue: 'About pauses' })}
        </button>
      </div>
    </motion.div>
  );
}

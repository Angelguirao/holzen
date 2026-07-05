import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import {
  formatPauseOpenMaxRemaining,
  pauseOpenMaxDeadlineMs,
} from '@/features/pause/public-session';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: () => void;
  onStartOver: () => void;
  onDiscard: () => void;
  busy?: boolean;
  /** Figma 411:8073 — engaged open pause while a cron pending row exists. */
  hasPendingOffer?: boolean;
  openPauseOpenMaxAnchorAt?: string | null;
};

function useOpenMaxRemainingLabel(anchorIso: string | null | undefined): string | null {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!anchorIso) return;
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, [anchorIso]);

  if (!anchorIso) return null;
  const deadline = pauseOpenMaxDeadlineMs(anchorIso);
  return formatPauseOpenMaxRemaining(deadline, now);
}

/** Figma 411:7503 / 411:8073 — half sheet when resuming an engaged (post-Reflect) pause from Home. */
export function PauseWelcomeBackSheet({
  open,
  onOpenChange,
  onContinue,
  onStartOver,
  onDiscard,
  busy = false,
  hasPendingOffer = false,
  openPauseOpenMaxAnchorAt = null,
}: Props) {
  "use memo";
  const { t } = useTranslation();
  const remaining = useOpenMaxRemainingLabel(openPauseOpenMaxAnchorAt);

  const discardLabel = hasPendingOffer
    ? t('home.welcomeBack.discardThisPause', { defaultValue: 'Discard this pause' })
    : t('home.pauseWidget.discard', { defaultValue: 'Discard' });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="z-[200] gap-0 rounded-t-3xl border-0 bg-muted p-0 sm:mx-auto sm:max-w-lg [&>button.absolute]:hidden"
      >
        <SheetTitle className="sr-only">
          {t('home.welcomeBack.title', { defaultValue: 'Welcome back' })}
        </SheetTitle>

        <div className="relative px-8 pb-8 pt-9">
          <p className="text-center text-sm font-medium leading-5 tracking-[0.01em] text-foreground">
            {t('home.welcomeBack.title', { defaultValue: 'Welcome back' })}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-6 top-8 h-6 w-6 shrink-0"
            onClick={() => onOpenChange(false)}
            disabled={busy}
            aria-label={t('common.close', { defaultValue: 'Close' })}
          >
            <X className="h-6 w-6 text-muted-foreground" aria-hidden />
          </Button>

          <div className="mt-8 space-y-6">
            {hasPendingOffer ? (
              <div className="space-y-4 text-center text-foreground">
                <p className="text-2xl leading-8 tracking-wide">
                  {t('home.welcomeBack.pendingHeadline', {
                    defaultValue: 'You have a pause waiting',
                  })}
                </p>
                <p className="text-base leading-6 tracking-wide">
                  {remaining
                    ? t('home.welcomeBack.pendingBodyWithRemaining', {
                        remaining,
                        defaultValue:
                          'The market context has changed since you started. You have {{remaining}} left to finish this pause before it closes.',
                      })
                    : t('home.welcomeBack.pendingBodyNoAnchor', {
                        defaultValue:
                          'The market context has changed since you started. Finish this pause before it closes — the window starts once the market settles.',
                      })}
                </p>
              </div>
            ) : (
              <p className="text-center text-base leading-6 tracking-wide text-foreground">
                {t('home.welcomeBack.body', {
                  defaultValue: 'Continue your pause where you left it.',
                })}
              </p>
            )}

            <div className="flex gap-6">
              <button
                type="button"
                disabled={busy}
                onClick={onContinue}
                className={cn(
                  'flex flex-1 items-center justify-center rounded-[20px] bg-primary/10 px-4 py-2.5',
                  'text-sm font-medium text-primary transition-colors hover:bg-primary/15 disabled:opacity-60',
                )}
              >
                {t('home.pauseWidget.continue', { defaultValue: 'Continue' })}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={onStartOver}
                className={cn(
                  'flex flex-1 items-center justify-center rounded-[20px] bg-primary px-4 py-2.5',
                  'text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60',
                )}
              >
                {t('home.welcomeBack.startOver', { defaultValue: 'Start over' })}
              </button>
            </div>

            <button
              type="button"
              disabled={busy}
              onClick={onDiscard}
              className="w-full py-2.5 text-center text-sm font-medium text-primary transition-colors hover:text-primary/90 disabled:opacity-60"
            >
              {discardLabel}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

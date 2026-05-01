import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Share2, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { CompanionSection, type CompanionData, type CompanionPrefs } from '@/components/CompanionSection';
import { CollapsibleReflectionHeader } from '@/components/pause/CollapsibleReflectionHeader';
import { PauseNote } from '@/components/pause/PauseNote';
import { PauseTags } from '@/components/pause/PauseTags';
import { pauseStepLayout } from '@/components/pause/pause-step-layout';
import { Button } from '@/components/ui/button';
import { trackEvent } from '@/lib/posthog';

interface Props {
  companions: CompanionData;
  companionPrefs: CompanionPrefs;
  severity: 'mild' | 'moderate' | 'high';
  pauseInstanceId: string | null;
  context: string | null;
  reflectionMessage: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  subscribed: boolean;
  onContinue: () => void;
  onBack?: () => void;
  /** Current mood selected by the user in the Feel step */
  mood?: string | null;
}

export function PauseReflect({
  companions,
  companionPrefs,
  severity,
  pauseInstanceId,
  context,
  reflectionMessage,
  isFavorite,
  onToggleFavorite,
  subscribed,
  onContinue,
  onBack,
  mood,
}: Props) {
  const { t } = useTranslation();

  const buildShareText = useCallback(() => {
    const parts = [reflectionMessage.trim()];
    if (context?.trim()) parts.push(context.trim());
    return parts.filter(Boolean).join('\n\n');
  }, [reflectionMessage, context]);

  const handleShareReflection = useCallback(async () => {
    const text = buildShareText();
    if (!text) {
      toast.message(t('pause.reflect.shareEmpty', { defaultValue: 'Nothing to share yet.' }));
      return;
    }
    trackEvent('pause_reflect_share_tap', { surface: 'pause_reflect', has_pause_id: !!pauseInstanceId });
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: t('pause.reflect.shareTitle', { defaultValue: 'Reflection from Holzen' }),
          text,
        });
        return;
      } catch {
        /* user cancelled or share failed */
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t('pause.reflect.shareCopied', { defaultValue: 'Reflection copied to clipboard.' }));
    } catch {
      toast.error(t('pause.reflect.shareCopyFailed', { defaultValue: 'Could not copy. Try again.' }));
    }
  }, [buildShareText, pauseInstanceId, t]);

  const handleWallpaperHint = useCallback(() => {
    const text = buildShareText();
    trackEvent('pause_reflect_wallpaper_tap', { surface: 'pause_reflect' });
    void (async () => {
      if (text) {
        try {
          await navigator.clipboard.writeText(text);
          toast.success(
            t('pause.reflect.wallpaperCopied', {
              defaultValue: 'Copied. Paste into your wallpaper or lock-screen widget when you edit it.',
            }),
          );
          return;
        } catch {
          /* fall through */
        }
      }
      toast.message(
        t('pause.reflect.wallpaperHint', {
          defaultValue: 'Copy your reflection and paste it into a wallpaper or lock-screen quote widget.',
        }),
      );
    })();
  }, [buildShareText, t]);

  return (
    <motion.div
      className={`${pauseStepLayout.columnFlow} scroll-mt-36 gap-8 pt-6 sm:scroll-mt-40 sm:pt-10`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6 }}
    >
      <div className="space-y-2 text-center">
        <p className={pauseStepLayout.screenTitle}>
          {t('pause.reflect.heading', { defaultValue: 'Sit with this reflection' })}
        </p>
        <p className={pauseStepLayout.screenSubtitle}>
          {t('pause.reflect.subcopy', {
            defaultValue:
              'Read at your own pace. Notes and tags are optional; open a companion when you want another angle.',
          })}
        </p>
      </div>

      <section className="space-y-3" aria-labelledby="pause-reflect-block1">
        <h2 id="pause-reflect-block1" className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {t('pause.reflect.block1Title', { defaultValue: 'The reflection' })}
        </h2>
        <div className="rounded-2xl border border-border/40 bg-card/40 px-4 py-5 shadow-sm backdrop-blur-sm sm:px-5">
          <CollapsibleReflectionHeader
            message={reflectionMessage}
            context={context}
            haiku={companions?.haiku ?? null}
            isFavorite={isFavorite}
            onToggleFavorite={onToggleFavorite}
            subscribed={subscribed}
            defaultExpanded
          />

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => void handleShareReflection()}>
              <Share2 className="h-3.5 w-3.5" aria-hidden />
              {t('pause.reflect.shareCta', { defaultValue: 'Share' })}
            </Button>
            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={handleWallpaperHint}>
              <ImageIcon className="h-3.5 w-3.5" aria-hidden />
              {t('pause.reflect.wallpaperCta', { defaultValue: 'Wallpaper' })}
            </Button>
          </div>

          {pauseInstanceId && subscribed && (
            <motion.div
              className="mt-6 space-y-4 border-t border-border/30 pt-5"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
            >
              <p className="text-sm font-medium text-muted-foreground">
                {t('pause.reflect.proTools', { defaultValue: 'Your note & tags' })}
              </p>
              <PauseNote pauseInstanceId={pauseInstanceId} />
              <PauseTags pauseInstanceId={pauseInstanceId} />
            </motion.div>
          )}

          {pauseInstanceId && !subscribed && (
            <p className="mt-5 border-t border-border/30 pt-4 text-center text-xs leading-relaxed text-muted-foreground">
              {t('pause.reflect.freeHint', {
                defaultValue:
                  'Holzen Pro adds an optional private note and tags on each pause — useful when you look back in your Library.',
              })}
            </p>
          )}
        </div>
      </section>

      <section className="space-y-3" aria-labelledby="pause-reflect-block2">
        <h2 id="pause-reflect-block2" className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {t('pause.reflect.block2Title', { defaultValue: 'Take what you need' })}
        </h2>
        <CompanionSection
          companions={companions}
          prefs={companionPrefs}
          severity={severity}
          pauseInstanceId={pauseInstanceId}
          context={context}
          reflectionMessage={reflectionMessage}
          mood={mood}
          sectionLead={t('pause.reflect.companionsLead', {
            defaultValue: 'Open one angle at a time — each card expands below.',
          })}
        />
      </section>

      <motion.div
        className="flex flex-col items-center gap-3 pt-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <button type="button" onClick={onContinue} className={pauseStepLayout.textContinue}>
          {t('pause.steps.continue', { defaultValue: 'Continue' })}
        </button>
        <p className="max-w-xs text-center text-xs text-muted-foreground">
          {t('pause.reflect.continueHint', {
            defaultValue: 'There is no "right" amount of time — continue when you feel done.',
          })}
        </p>
      </motion.div>

      {onBack && (
        <motion.div
          className={pauseStepLayout.backRow}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <button type="button" onClick={onBack} className={pauseStepLayout.backButton}>
            <ChevronLeft className="h-3 w-3" />
            {t('pause.steps.back', { defaultValue: 'Back' })}
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}

import { useCallback } from 'react';
import type { TFunction } from 'i18next';
import { toast } from 'sonner';
import { SITE_ORIGIN } from '@/config/site';
import { buildReflectionShareText } from '@/features/pause/domain/reflect/share/reflection-share-text';
import {
  buildReflectionShareTelegramUrl,
  buildReflectionShareTweetUrl,
  buildReflectionShareWhatsAppUrl,
} from '@/features/pause/domain/reflect/share/reflection-share-channel-urls';
import { runReflectionShareImage } from '@/features/pause/application/use-cases/ritual/reflect/share/run-reflection-share-image';

export type UseReflectionShareHandlersParams = {
  message: string;
  context?: string | null;
  haiku?: string | null;
  t: TFunction;
};

/** Copy / image / social share actions for Reflect step share menu. */
export function useReflectionShareHandlers({
  message,
  context,
  haiku,
  t,
}: UseReflectionShareHandlersParams) {
  const copyText = useCallback(async () => {
    const text = buildReflectionShareText(message);
    await navigator.clipboard.writeText(text);
    toast(t('share.copied'));
  }, [message, t]);

  const shareImage = useCallback(async () => {
    try {
      const outcome = await runReflectionShareImage(message, context, haiku);
      if (outcome === 'downloaded') {
        toast(t('share.imageDownloaded'));
      }
    } catch {
      toast.error(t('share.couldNotShareImage'));
    }
  }, [message, context, haiku, t]);

  const shareToX = useCallback(() => {
    const text = buildReflectionShareText(message);
    const url = buildReflectionShareTweetUrl(text);
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [message]);

  const shareToWhatsApp = useCallback(() => {
    const text = buildReflectionShareText(message);
    const url = buildReflectionShareWhatsAppUrl(text);
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [message]);

  const shareToTelegram = useCallback(() => {
    const text = buildReflectionShareText(message);
    const url = buildReflectionShareTelegramUrl(text, SITE_ORIGIN);
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [message]);

  return { copyText, shareImage, shareToX, shareToWhatsApp, shareToTelegram };
}

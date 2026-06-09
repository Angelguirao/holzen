import { useCallback } from 'react';
import { toast } from 'sonner';
import { SITE_ORIGIN } from '@/config/site';
import {
  buildReflectionShareTelegramUrl,
  buildReflectionShareText,
  buildReflectionShareTweetUrl,
  buildReflectionShareWhatsAppUrl,
  pauseReflectionShareImage,
} from './pause-reflect-share-io';
import type { UseReflectionShareHandlersParams } from './reflection-share-handler-types';

export type { UseReflectionShareHandlersParams } from './reflection-share-handler-types';

/** Copy / image / social share actions for Reflect step share menu. */
export function useReflectionShareHandlers({
  message,
  context,
  haiku,
  wallpaperMood,
  t,
}: UseReflectionShareHandlersParams) {
  const copyText = useCallback(async () => {
    const text = buildReflectionShareText(message);
    await navigator.clipboard.writeText(text);
    toast(t('share.copied'));
  }, [message, t]);

  const shareImage = useCallback(async () => {
    try {
      const outcome = await pauseReflectionShareImage(message, context, haiku, wallpaperMood);
      if (outcome === 'downloaded') {
        toast(t('share.imageDownloaded'));
      }
    } catch {
      toast.error(t('share.couldNotShareImage'));
    }
  }, [message, context, haiku, wallpaperMood, t]);

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

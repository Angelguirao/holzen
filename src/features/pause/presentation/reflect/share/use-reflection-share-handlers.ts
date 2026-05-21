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
import { generateReflectionShareImage } from './reflection-share-canvas';

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
      const blob = await generateReflectionShareImage(message, context, haiku);
      const file = new File([blob], 'holzen-reflection.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Holzen Reflection',
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'holzen-reflection.png';
        a.click();
        URL.revokeObjectURL(url);
        toast(t('share.imageDownloaded'));
      }
    } catch (e: unknown) {
      if (!(e instanceof DOMException && e.name === 'AbortError')) {
        toast.error(t('share.couldNotShareImage'));
      }
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

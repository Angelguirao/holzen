import { useCallback, forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Share2, Copy, Image, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { SITE_ORIGIN } from '@/config/site';
import { buildReflectionShareText } from '@/screens/pause/lib/reflection-share-text';
import { generateReflectionShareImage } from '@/screens/pause/lib/reflection-share-canvas';

interface Props {
  message: string;
  context?: string | null;
  haiku?: string | null;
  /** Fires when the share menu opens (product analytics). */
  onMenuOpen?: () => void;
}

export const ShareReflection = forwardRef<HTMLButtonElement, Props>(
  function ShareReflection({ message, context, haiku, onMenuOpen }, ref) {
    const { t } = useTranslation();

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
      const url = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }, [message]);

    const shareToWhatsApp = useCallback(() => {
      const text = buildReflectionShareText(message);
      const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }, [message]);

    const shareToTelegram = useCallback(() => {
      const text = buildReflectionShareText(message);
      const url = `https://t.me/share/url?url=${encodeURIComponent(SITE_ORIGIN)}&text=${encodeURIComponent(text)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }, [message]);

    return (
      <DropdownMenu
        onOpenChange={(open) => {
          if (open) onMenuOpen?.();
        }}
      >
        <DropdownMenuTrigger asChild>
          <Button
            ref={ref}
            variant="ghost"
            size="sm"
            className="text-xs font-mono text-muted-foreground gap-1.5"
          >
            <Share2 className="h-3 w-3" />
            {t('share.share')}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          <DropdownMenuItem onClick={copyText} className="text-xs gap-2">
            <Copy className="h-3 w-3" />
            {t('share.copyText')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={shareImage} className="text-xs gap-2">
            <Image className="h-3 w-3" />
            {t('share.shareAsImage')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={shareToX} className="text-xs gap-2">
            <ExternalLink className="h-3 w-3" />
            {t('share.postOnX')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={shareToWhatsApp} className="text-xs gap-2">
            <ExternalLink className="h-3 w-3" />
            {t('share.whatsApp')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={shareToTelegram} className="text-xs gap-2">
            <ExternalLink className="h-3 w-3" />
            {t('share.telegram')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  },
);

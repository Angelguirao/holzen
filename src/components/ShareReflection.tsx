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
import { SITE_HOST, SITE_ORIGIN } from '@/config/site';

interface Props {
  message: string;
  context?: string | null;
  haiku?: string | null;
  /** Fires when the share menu opens (product analytics). */
  onMenuOpen?: () => void;
}

function buildShareText(message: string): string {
  return `${message}\n\n— Holzen\n${SITE_HOST}`;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (const word of words) {
    const testLine = line + (line ? ' ' : '') + word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = word;
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
  return currentY;
}

function generateShareImage(
  message: string,
  context?: string | null,
  haiku?: string | null
): Promise<Blob> {
  return new Promise((resolve) => {
    const scale = 2;
    const width = 600;
    const pad = 48;
    const contentWidth = width - pad * 2;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width * scale;
    tempCanvas.height = 1000 * scale;
    const tmpCtx = tempCanvas.getContext('2d')!;
    tmpCtx.scale(scale, scale);

    let estimatedHeight = pad + 20;

    if (context) {
      tmpCtx.font = '11px "IBM Plex Mono", monospace';
      estimatedHeight += 24;
    }

    tmpCtx.font = '20px "Inter", system-ui, sans-serif';
    const msgWords = message.split(' ');
    let msgLine = '';
    let msgLines = 1;
    for (const word of msgWords) {
      const test = msgLine + (msgLine ? ' ' : '') + word;
      if (tmpCtx.measureText(test).width > contentWidth && msgLine) {
        msgLines++;
        msgLine = word;
      } else {
        msgLine = test;
      }
    }
    estimatedHeight += msgLines * 30 + 24;

    if (haiku) {
      const haikuLines = haiku.split(/\\n|\n/).filter(Boolean);
      estimatedHeight += 24 + haikuLines.length * 22 + 16;
    }

    estimatedHeight += 48 + pad;
    const height = Math.max(320, estimatedHeight);

    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(scale, scale);

    ctx.fillStyle = 'rgb(245 242 236)';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = 'rgb(42 42 42)';
    ctx.fillRect(0, 0, width, 3);

    let y = pad + 16;

    if (context) {
      ctx.font = '11px "IBM Plex Mono", monospace';
      ctx.fillStyle = 'rgb(154 148 136)';
      ctx.fillText(context.toUpperCase(), pad, y);
      y += 28;
    }

    ctx.font = '20px "Inter", system-ui, sans-serif';
    ctx.fillStyle = 'rgb(42 42 42)';
    y = wrapText(ctx, message, pad, y, contentWidth, 30);
    y += 32;

    if (haiku) {
      const haikuLines = haiku.split(/\\n|\n/).map((l: string) => l.trim()).filter(Boolean);

      ctx.strokeStyle = 'rgb(216 212 204)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(pad, y);
      ctx.lineTo(pad + 120, y);
      ctx.stroke();
      y += 20;

      ctx.font = 'italic 14px "IBM Plex Mono", monospace';
      ctx.fillStyle = 'rgb(107 101 96)';
      for (const line of haikuLines) {
        ctx.fillText(line, pad, y);
        y += 22;
      }
      y += 8;
    }

    const footerY = height - pad + 4;

    ctx.strokeStyle = 'rgb(216 212 204)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(pad, footerY - 20);
    ctx.lineTo(width - pad, footerY - 20);
    ctx.stroke();

    ctx.font = '9px "IBM Plex Mono", monospace';
    ctx.fillStyle = 'rgb(154 148 136)';
    ctx.fillText('HOLZEN', pad, footerY);

    ctx.font = '9px "IBM Plex Mono", monospace';
    ctx.fillStyle = 'rgb(184 180 172)';
    const tagline = 'PAUSE BEFORE YOU ACT';
    const tagWidth = ctx.measureText(tagline).width;
    ctx.fillText(tagline, width - pad - tagWidth, footerY);

    canvas.toBlob((blob) => resolve(blob!), 'image/png');
  });
}

export const ShareReflection = forwardRef<HTMLButtonElement, Props>(
  function ShareReflection({ message, context, haiku, onMenuOpen }, ref) {
    const { t } = useTranslation();

    const copyText = useCallback(async () => {
      const text = buildShareText(message);
      await navigator.clipboard.writeText(text);
      toast(t('share.copied'));
    }, [message, t]);

    const shareImage = useCallback(async () => {
      try {
        const blob = await generateShareImage(message, context, haiku);
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
      const text = buildShareText(message);
      const url = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }, [message]);

    const shareToWhatsApp = useCallback(() => {
      const text = buildShareText(message);
      const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }, [message]);

    const shareToTelegram = useCallback(() => {
      const text = buildShareText(message);
      const url = `https://t.me/share/url?url=${encodeURIComponent(SITE_ORIGIN)}&text=${encodeURIComponent(text)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }, [message]);

    return (
      <DropdownMenu onOpenChange={(open) => { if (open) onMenuOpen?.(); }}>
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
  }
);

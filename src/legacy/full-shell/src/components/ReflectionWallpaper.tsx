import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Download, Loader2 } from 'lucide-react';
import { invokeEdge } from '@/lib/invoke-edge';
import { toast } from 'sonner';
import { parseEdgeFunctionError, toUserFacingAiErrorMessage } from '@/lib/edge-function-error';
import { useSubscription } from '@/features/subscription/public-hooks';
import { useProGate } from '@/features/subscription/public-hooks';
import { showLimitReachedToast, isPaidLimitReached } from '@/lib/limit-upsell';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Props {
  message: string;
  mood?: string | null;
  context?: string | null;
  haiku?: string | null;
  variant?: 'icon' | 'button';
  /** Fires when the user starts wallpaper generation from this control. */
  onGenerateIntent?: () => void;
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

function compositeWallpaper(
  imageUrl: string,
  message: string,
  haiku?: string | null
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const W = 1080;
      const H = 1920;
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d')!;

      const scale = Math.max(W / img.width, H / img.height);
      const sw = img.width * scale;
      const sh = img.height * scale;
      ctx.drawImage(img, (W - sw) / 2, (H - sh) / 2, sw, sh);

      const grad = ctx.createLinearGradient(0, H * 0.45, 0, H);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(0.4, 'rgba(0,0,0,0.3)');
      grad.addColorStop(1, 'rgba(0,0,0,0.75)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, H * 0.45, W, H * 0.55);

      const pad = 72;
      const maxWidth = W - pad * 2;

      ctx.textBaseline = 'top';
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.font = '500 36px "Inter", system-ui, sans-serif';
      let y = H * 0.62;
      y = wrapText(ctx, `"${message}"`, pad, y, maxWidth, 50);
      y += 40;

      if (haiku) {
        const lines = haiku.split(/\\n|\n/).map(l => l.trim()).filter(Boolean);
        ctx.font = 'italic 26px "IBM Plex Mono", monospace';
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        for (const line of lines) {
          ctx.fillText(line, pad, y);
          y += 36;
        }
        y += 16;
      }

      ctx.font = '600 18px "IBM Plex Mono", monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillText('HOLZEN', pad, H - pad);

      const tagline = 'PAUSE BEFORE YOU ACT';
      const tw = ctx.measureText(tagline).width;
      ctx.fillText(tagline, W - pad - tw, H - pad);

      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Failed to load generated image'));
    img.src = imageUrl;
  });
}

export function ReflectionWallpaper({ message, mood, context, haiku, variant = 'icon', onGenerateIntent }: Props) {
  const { t } = useTranslation();
  const [generating, setGenerating] = useState(false);
  const [compositeUrl, setCompositeUrl] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const {
    applyOptimisticDecrement,
    refresh: refreshSubscription,
    wallpaperRemaining,
    flexCreditsBalance,
    startCheckout,
  } = useSubscription();
  const { isPro, requirePro } = useProGate();

  const generate = useCallback(async () => {
    onGenerateIntent?.();
    // Mirror the regenerate paywall: free users see the upgrade toast,
    // Pro users with no wallpaper bucket and no flex credits see the
    // limit-reached toast — never the raw edge function error.
    if (!isPro) {
      requirePro('wallpapers');
      return;
    }
    if (isPaidLimitReached({ remaining: wallpaperRemaining, flexCreditsBalance })) {
      showLimitReachedToast({ feature: 'wallpaper', startCheckout });
      return;
    }
    setGenerating(true);
    setOpen(true);
    setCompositeUrl(null);
    // Reflect the wallpaper spend instantly; refresh below reconciles.
    applyOptimisticDecrement('wallpaper');
    try {
      const { data, error } = await invokeEdge<{ image?: string; error?: string }>('generate-wallpaper', {
        body: { message, mood, context },
      });

      if (error) {
        const parsed = await parseEdgeFunctionError(error);
        if (parsed.code === 'companions_upgrade_required' || parsed.code === 'wallpaper_upgrade_required') {
          requirePro('wallpapers');
          setOpen(false);
          return;
        }
        if (parsed.code === 'companions_quota_exceeded' || parsed.code === 'wallpaper_quota_exceeded') {
          showLimitReachedToast({ feature: 'wallpaper', startCheckout });
          setOpen(false);
          return;
        }
        throw new Error(toUserFacingAiErrorMessage(parsed, t('wallpaper.failedToGenerate')));
      }
      if (data?.error) throw new Error(data.error);

      const finalUrl = await compositeWallpaper(data.image, message, haiku);
      setCompositeUrl(finalUrl);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t('wallpaper.failedToGenerate');
      toast.error(msg);
      setOpen(false);
    } finally {
      setGenerating(false);
      void refreshSubscription();
    }
  }, [
    message,
    mood,
    context,
    haiku,
    t,
    applyOptimisticDecrement,
    refreshSubscription,
    isPro,
    requirePro,
    wallpaperRemaining,
    flexCreditsBalance,
    startCheckout,
    onGenerateIntent,
  ]);

  const download = useCallback(() => {
    if (!compositeUrl) return;
    const a = document.createElement('a');
    a.href = compositeUrl;
    a.download = 'holzen-wallpaper.png';
    a.click();
    toast(t('wallpaper.downloaded'));
  }, [compositeUrl, t]);

  return (
    <>
      {variant === 'button' ? (
        <button
          onClick={generate}
          disabled={generating}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          title={t('wallpaper.generateTitle')}
        >
          {generating ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Sparkles className="h-3 w-3" />
          )}
          {t('wallpaper.wallpaper')}
        </button>
      ) : (
        <button
          onClick={generate}
          disabled={generating}
          className="inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground/60 hover:text-foreground transition-colors disabled:opacity-50"
          title={t('wallpaper.generateFromReflection')}
        >
          {generating ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Sparkles className="h-3 w-3" />
          )}
          {t('wallpaper.wallpaper')}
        </button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm p-0 overflow-y-auto max-h-[90vh] bg-card border-border [&>button]:z-10 [&>button]:bg-background/80 [&>button]:backdrop-blur-sm [&>button]:rounded-full [&>button]:p-1 [&>button]:right-3 [&>button]:top-3 [&>button]:sticky">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="text-sm font-mono tracking-wider">
              {t('wallpaper.reflectionWallpaper')}
            </DialogTitle>
          </DialogHeader>

          <div className="p-4 space-y-4">
            {generating ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <p className="text-xs text-muted-foreground font-mono">
                  {t('wallpaper.generating')}
                </p>
              </div>
            ) : compositeUrl ? (
              <>
                <div className="relative rounded-lg overflow-hidden border border-border/60 aspect-[9/16] bg-muted/30">
                  <img
                    src={compositeUrl}
                    alt={t('wallpaper.reflectionWallpaper')}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={download}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md bg-primary text-primary-foreground text-xs font-mono transition-colors hover:bg-primary/90"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {t('wallpaper.download')}
                  </button>
                  <button
                    onClick={() => {
                      setCompositeUrl(null);
                      generate();
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border border-border text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {t('wallpaper.regenerate')}
                  </button>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-full py-2.5 rounded-md border border-border text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('common.done')}
                </button>
              </>
            ) : null}

            <p className="text-[10px] text-muted-foreground/60 font-mono text-center">
              {t('wallpaper.carry')}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

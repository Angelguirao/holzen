import { forwardRef } from 'react';
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
import { useReflectionShareHandlers } from '@/features/pause/public-ritual-reflect';

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
    const { copyText, shareImage, shareToX, shareToWhatsApp, shareToTelegram } =
      useReflectionShareHandlers({ message, context, haiku, t });

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

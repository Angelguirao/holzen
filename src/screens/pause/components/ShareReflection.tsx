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

export type ShareReflectionHandlers = {
  copyText: () => Promise<void>;
  shareImage: () => Promise<void>;
  shareToX: () => void;
  shareToWhatsApp: () => void;
  shareToTelegram: () => void;
};

type Props = ShareReflectionHandlers & {
  /** Fires when the share menu opens (product analytics). */
  onMenuOpen?: () => void;
  triggerClassName?: string;
  triggerLabel?: string;
};

export const ShareReflection = forwardRef<HTMLButtonElement, Props>(
  function ShareReflection(
    {
      copyText,
      shareImage,
      shareToX,
      shareToWhatsApp,
      shareToTelegram,
      onMenuOpen,
      triggerClassName,
      triggerLabel,
    },
    ref,
  ) {
    "use memo";
    const { t } = useTranslation();

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
            className={
              triggerClassName ??
              'text-xs font-mono text-muted-foreground gap-1.5'
            }
          >
            <Share2 className="h-3 w-3" />
            {triggerLabel ?? t('share.share')}
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

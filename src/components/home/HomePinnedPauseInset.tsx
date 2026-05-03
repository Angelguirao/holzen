import { useTranslation } from 'react-i18next';
import { Pin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { homeInWidget } from '@/components/home/home-widget-styles';
import { HomePauseContextMeta } from '@/components/home/HomePauseContextMeta';

interface HomePinnedPauseInsetProps {
  btc24h: string | null;
  marketSentiment: string | null;
  onUnpin: () => void;
}

/** Pinned pause preview strip (inset + unpin) for Home empty / zen flows. */
export function HomePinnedPauseInset({ btc24h, marketSentiment, onUnpin }: HomePinnedPauseInsetProps) {
  const { t } = useTranslation();
  return (
    <div className={cn(homeInWidget.inset, 'space-y-3')}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Pin className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className={homeInWidget.kicker}>{t('common.pinned')}</span>
        </div>
        <button
          type="button"
          onClick={onUnpin}
          className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {t('common.unpin')}
        </button>
      </div>
      <HomePauseContextMeta btc24h={btc24h} marketSentiment={marketSentiment} />
    </div>
  );
}

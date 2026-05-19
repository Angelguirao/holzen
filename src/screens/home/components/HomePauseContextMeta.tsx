import { cn } from '@/lib/utils';
import { homeInWidget } from '@/screens/home/components/home-widget-styles';

interface HomePauseContextMetaProps {
  btc24h: string | null;
  marketSentiment: string | null;
  /** Extra classes on the outer wrapper (e.g. `min-w-0` in the pause card). */
  className?: string;
}

/** Renders 24h move + Fear & Greed lines from `parsePauseContextForHomePreview`. */
export function HomePauseContextMeta({ btc24h, marketSentiment, className }: HomePauseContextMetaProps) {
  if (!btc24h && !marketSentiment) return null;
  return (
    <div className={cn(homeInWidget.meta, 'space-y-1', className)}>
      {btc24h ? <p className="leading-snug">{btc24h}</p> : null}
      {marketSentiment ? <p className="leading-snug">{marketSentiment}</p> : null}
    </div>
  );
}

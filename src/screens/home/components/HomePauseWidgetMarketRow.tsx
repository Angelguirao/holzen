import { useTranslation } from 'react-i18next';
import { homeInWidget } from '@/screens/home/components/home-widget-styles';
import type { HomePauseMarketBlock } from '@/features/pause/domain/home/format-home-pause-market-block';

type Props = {
  block: HomePauseMarketBlock;
};

function formatUpdatedTime(iso: string | null, locale: string): string | null {
  if (!iso) return null;
  try {
    return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(
      new Date(iso),
    );
  } catch {
    return null;
  }
}

/** Compact BTC/F&G row + Updated HH:mm for Home pause widget. */
export function HomePauseWidgetMarketRow({ block }: Props) {
  "use memo";
  const { t, i18n } = useTranslation();
  const updated = formatUpdatedTime(block.updatedAtIso, i18n.language);

  if (!block.moveLine && !block.sentimentLine && !updated) return null;

  return (
    <div className={homeInWidget.meta}>
      {block.moveLine || block.sentimentLine ? (
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          {block.moveLine ? (
            <span className="font-medium tabular-nums text-foreground/90">{block.moveLine}</span>
          ) : null}
          {block.sentimentLine ? <span>{block.sentimentLine}</span> : null}
        </div>
      ) : null}
      {updated ? (
        <p className={`${homeInWidget.metaFaint} mt-1`}>
          {t('home.pauseWidget.updatedAt', { time: updated, defaultValue: 'Updated {{time}}' })}
        </p>
      ) : null}
    </div>
  );
}

import { useHolzen } from '@/hooks/use-holzen';
import { useTranslation } from 'react-i18next';
import { Heart } from 'lucide-react';
import { homeInWidget } from '@/components/home/home-widget-styles';

export function MyWhyWidget() {
  const { motivations, mantra } = useHolzen();
  const { t } = useTranslation();

  if (!mantra && motivations.length === 0) return null;

  return (
    <div className={`${homeInWidget.inset} space-y-2`}>
      <div className="flex items-center gap-1.5 mb-4">
        <Heart className="h-3 w-3 shrink-0 text-primary/50" />
        <p className={homeInWidget.kicker}>{t('myWhy.title')}</p>
      </div>
      {mantra && (
        <p className={`${homeInWidget.bodyMuted} italic line-clamp-2`}>&ldquo;{mantra}&rdquo;</p>
      )}
      {motivations.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {motivations.map((m) => (
            <span
              key={m}
              className={homeInWidget.chipTone}
            >
              {t(`settings.motivations.${m}`, m)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

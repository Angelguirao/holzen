import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Pencil } from 'lucide-react';
import { useProfile } from '@/features/user/public-hooks';
import { settingsSectionPath } from '@/lib/app-routes';
import { homeInWidget } from '@/screens/home/components/home-widget-styles';
import { cn } from '@/lib/utils';

/**
 * Home “Your whys” card (Wireframes 546:8945): mantra + motivations only — no hold goal / commitment.
 */
export function HomeGoalWhyCard() {
  "use memo";
  const { t } = useTranslation();
  const { motivations, mantra } = useProfile();

  const motivationLine = useMemo(
    () => motivations.map((m) => t(`settings.motivations.${m}`, m)).join(' \u00B7 '),
    [motivations, t],
  );

  const mantraLine = mantra?.trim() ?? '';

  return (
    <div className={cn('rounded-lg border border-border/40 bg-card/40 p-4')}>
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 flex-1 text-sm font-medium leading-snug text-foreground">
          {mantraLine
            ? `"${mantraLine}"`
            : t('home.goalWhy.mantraPlaceholder', {
                defaultValue: 'Add a personal mantra in Settings to anchor your pauses.',
              })}
        </p>
        <Link
          to={settingsSectionPath('you')}
          className={homeInWidget.iconBtn}
          aria-label={t('home.goalWhy.editWhys')}
        >
          <Pencil className="h-4 w-4 shrink-0" aria-hidden />
        </Link>
      </div>

      {motivationLine ? (
        <p className="pt-2 text-xs font-medium italic tracking-wide text-muted-foreground">{motivationLine}</p>
      ) : (
        <p className="pt-2 text-xs text-muted-foreground">
          {t('home.goalWhy.motivationsPlaceholder')}
        </p>
      )}
    </div>
  );
}

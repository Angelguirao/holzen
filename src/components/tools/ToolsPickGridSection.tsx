import { useTranslation } from 'react-i18next';
import { moreToolEntries, spotlightToolEntries } from '@/lib/tools-catalog';
import { ToolsHubToolCard } from '@/components/tools/ToolsHubToolCard';

export function ToolsPickGridSection() {
  const { t } = useTranslation();
  const spotlight = spotlightToolEntries();
  const more = moreToolEntries();

  return (
    <section className="space-y-3">
      <h2 className="text-base font-medium text-foreground">{t('tools.hub.orPick')}</h2>
      <p className="text-xs text-muted-foreground leading-relaxed">{t('tools.hub.pickIntro')}</p>

      <div className="grid grid-cols-2 gap-3">
        {spotlight.map((entry) => (
          <ToolsHubToolCard key={entry.id} entry={entry} variant="spotlight" />
        ))}
      </div>

      <div className="space-y-2 pt-1">
        <h3 className="text-sm font-medium text-foreground">{t('tools.hub.moreTools')}</h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {more.map((entry) => (
            <ToolsHubToolCard key={entry.id} entry={entry} variant="compact" />
          ))}
        </div>
      </div>
    </section>
  );
}

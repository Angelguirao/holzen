import { useTranslation } from 'react-i18next';
import { useToolsHubData } from '@/hooks/use-tools-hub-data';
import { ToolsGoodNextStepSection } from '@/components/tools/ToolsGoodNextStepSection';
import { ToolsPickGridSection } from '@/components/tools/ToolsPickGridSection';
import { ToolsYourActivitiesSection } from '@/components/tools/ToolsYourActivitiesSection';

/**
 * Tools hub: suggested next practices, last check-in, curated grid, and grounding
 * activities from profile (same as Ground + Settings → You).
 */
export default function ToolsHub() {
  const { t } = useTranslation();
  const { lastCheckIn, suggestions, loading } = useToolsHubData();

  return (
    <div className="space-y-8 pb-8">
      <div className="space-y-2 border-b border-border pb-4">
        <p className="text-base leading-relaxed text-muted-foreground">{t('tools.subtitle')}</p>
        <p className="text-xs text-muted-foreground/90 leading-relaxed">{t('tools.hub.shellNote')}</p>
      </div>

      <ToolsGoodNextStepSection loading={loading} lastCheckIn={lastCheckIn} suggestions={suggestions} />

      <ToolsPickGridSection />

      <ToolsYourActivitiesSection />
    </div>
  );
}

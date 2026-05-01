import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/use-auth';
import { useToolsHubData } from '@/hooks/use-tools-hub-data';
import { useToolsFavoriteActivities } from '@/hooks/use-tools-favorite-activities';
import { ToolsGoodNextStepSection } from '@/components/tools/ToolsGoodNextStepSection';
import { ToolsPickGridSection } from '@/components/tools/ToolsPickGridSection';
import { ToolsYourActivitiesSection } from '@/components/tools/ToolsYourActivitiesSection';

/**
 * Tools hub: suggested next practices, last check-in, curated grid, and optional
 * “your activities” chips (local). Full-screen tool routes are unchanged.
 */
export default function ToolsHub() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { lastCheckIn, suggestions, loading } = useToolsHubData();
  const { favoriteIds, setFavoriteIds, allSelectableIds } = useToolsFavoriteActivities(user?.id);

  return (
    <div className="space-y-8 pb-8">
      <div className="space-y-2 border-b border-border pb-4">
        <p className="text-base leading-relaxed text-muted-foreground">{t('tools.subtitle')}</p>
        <p className="text-xs text-muted-foreground/90 leading-relaxed">{t('tools.hub.shellNote')}</p>
      </div>

      <ToolsGoodNextStepSection loading={loading} lastCheckIn={lastCheckIn} suggestions={suggestions} />

      <ToolsPickGridSection />

      <ToolsYourActivitiesSection
        favoriteIds={favoriteIds}
        allSelectableIds={allSelectableIds}
        onSaveFavorites={setFavoriteIds}
      />
    </div>
  );
}

import { useToolsHubData } from '@/hooks/use-tools-hub-data';
import { ToolsGoodNextStepSection } from '@/legacy/full-shell/src/components/tools/ToolsGoodNextStepSection';
import { ToolsPickGridSection } from '@/legacy/full-shell/src/components/tools/ToolsPickGridSection';
import { ToolsYourActivitiesSection } from '@/legacy/full-shell/src/components/tools/ToolsYourActivitiesSection';
import { CurrentPauseCard } from '@/components/library/CurrentPauseCard';

/**
 * Tools hub: suggested next practices, last check-in, curated grid, and grounding
 * activities from profile (same as Ground + Settings → You).
 */
export default function ToolsHub() {
  const { lastCheckIn, suggestions, loading } = useToolsHubData();

  return (
    <div className="space-y-8 pb-8">
      <CurrentPauseCard />

      <ToolsGoodNextStepSection loading={loading} lastCheckIn={lastCheckIn} suggestions={suggestions} />

      <ToolsPickGridSection />

      <ToolsYourActivitiesSection />
    </div>
  );
}

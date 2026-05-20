import type { RegenerateCompanionSlot } from '@/features/pause/public';
import { CompanionCard, type CompanionCardProps } from '@/screens/pause/components/companion/companion-card';
import { CompanionOrchestratedSlotChrome } from '@/screens/pause/components/companion/companion-orchestrated-slot-chrome';
import type { CompanionFullViewRouteSegment } from '@/screens/pause/components/companion/companion-open-full-view-button';

export type CompanionOrchestratedCardProps = {
  id: string;
  label: string;
  icon: CompanionCardProps['icon'];
  expanded: boolean;
  onToggleExpand: () => void;
  completed: boolean;
  /** Fires once when the user expands before UI completion is recorded (e.g. RPC persist). */
  onFirstExpandComplete?: () => void;
  loading: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  pauseInstanceId?: string | null;
  hasContent: boolean;
  relaxationKey: string | null | undefined;
  companionType: string;
  cacheId?: string | null;
  regenerateSlot: RegenerateCompanionSlot;
  onRegenerate: () => void;
  routeSegment: CompanionFullViewRouteSegment;
  children: React.ReactNode;
};

/** Expandable companion card with orchestration chrome (cache note, feedback, full view). */
export function CompanionOrchestratedCard({
  id,
  label,
  icon,
  expanded,
  onToggleExpand,
  completed,
  onFirstExpandComplete,
  loading,
  isFavorite,
  onToggleFavorite,
  pauseInstanceId,
  hasContent,
  relaxationKey,
  companionType,
  cacheId,
  regenerateSlot,
  onRegenerate,
  routeSegment,
  children,
}: CompanionOrchestratedCardProps) {
  return (
    <CompanionCard
      id={id}
      label={label}
      icon={icon}
      expanded={expanded}
      onToggle={() => {
        onToggleExpand();
        if (!completed) onFirstExpandComplete?.();
      }}
      completed={completed}
      loading={loading}
      isFavorite={isFavorite}
      onToggleFavorite={onToggleFavorite}
    >
      <CompanionOrchestratedSlotChrome
        pauseInstanceId={pauseInstanceId}
        hasContent={hasContent}
        loading={loading}
        relaxationKey={relaxationKey}
        companionType={companionType}
        cacheId={cacheId}
        regenerateSlot={regenerateSlot}
        onRegenerate={onRegenerate}
        regenerating={loading}
        routeSegment={routeSegment}
      >
        {children}
      </CompanionOrchestratedSlotChrome>
    </CompanionCard>
  );
}

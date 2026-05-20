import type { RegenerateCompanionSlot } from '@/features/pause/public-hooks';
import { CompanionCacheRelaxationNote } from '@/screens/pause/components/companion/companion-cache-relaxation-note';
import { CompanionFeedback } from '@/screens/pause/components/CompanionFeedback';
import {
  CompanionOpenFullViewButton,
  type CompanionFullViewRouteSegment,
} from '@/screens/pause/components/companion/companion-open-full-view-button';

export type CompanionOrchestratedSlotChromeProps = {
  pauseInstanceId?: string | null;
  /** True when slot has renderable content (drives cache note + feedback). */
  hasContent: boolean;
  loading: boolean;
  relaxationKey: string | null | undefined;
  companionType: string;
  cacheId?: string | null;
  regenerateSlot: RegenerateCompanionSlot;
  onRegenerate: () => void;
  regenerating: boolean;
  routeSegment: CompanionFullViewRouteSegment;
  children: React.ReactNode;
};

/** Shared footer chrome for orchestrated companion slots (relaxation, feedback, full view). */
export function CompanionOrchestratedSlotChrome({
  pauseInstanceId,
  hasContent,
  loading,
  relaxationKey,
  companionType,
  cacheId,
  regenerateSlot,
  onRegenerate,
  regenerating,
  routeSegment,
  children,
}: CompanionOrchestratedSlotChromeProps) {
  return (
    <>
      {children}
      {hasContent ? <CompanionCacheRelaxationNote relaxationKey={relaxationKey} /> : null}
      {hasContent ? (
        <CompanionFeedback
          pauseInstanceId={pauseInstanceId}
          companionType={companionType}
          cacheId={cacheId}
          regenerateSlot={regenerateSlot}
          onRegenerate={onRegenerate}
          regenerating={regenerating}
        />
      ) : null}
      {pauseInstanceId && (hasContent || loading) ? (
        <CompanionOpenFullViewButton pauseInstanceId={pauseInstanceId} routeSegment={routeSegment} />
      ) : null}
    </>
  );
}

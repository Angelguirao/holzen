import type { RegenerateCompanionSlot } from '@/features/pause/public-ritual-frame';
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
  /** Frame Signal / Look back provide their own full-story CTA; Frame Ground yourself / Zoom out are inline only. */
  showFullViewButton?: boolean;
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
  showFullViewButton = true,
  children,
}: CompanionOrchestratedSlotChromeProps) {
  "use memo";
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
      {showFullViewButton && pauseInstanceId && (hasContent || loading) ? (
        <CompanionOpenFullViewButton pauseInstanceId={pauseInstanceId} routeSegment={routeSegment} />
      ) : null}
    </>
  );
}

import { Pin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { InterventionState, RegenerateCompanionSlot } from '@/features/pause/public';

/**
 * Mapping from orchestrator slot → intervention types that, when featured,
 * use this companion's payload as their headline. See the trap / pattern /
 * zoom-out duplicate-avoidance logic in `CompanionSection`.
 */
const MATCHING_TYPES: Record<RegenerateCompanionSlot, string[]> = {
  signal: [],
  grounding: ['trap'],
  history: ['pattern'],
  zoomOut: ['zoom_out'],
};

interface Props {
  companion: RegenerateCompanionSlot;
  intervention: InterventionState | null;
  className?: string;
}

/**
 * Small "This was also today's headline" badge shown on the Full View pages
 * whose companion fed the featured intervention (trap → grounding,
 * pattern → history, secondary → zoomOut).
 *
 * Signal never feeds interventions, so this always renders `null` for it —
 * the mapping is kept for completeness so future intervention types can add
 * themselves without touching callsites.
 */
export function InterventionCrossRefBadge({ companion, intervention, className = '' }: Props) {
  const { t } = useTranslation();
  if (!intervention) return null;

  const types = MATCHING_TYPES[companion];
  if (types.length === 0) return null;

  const primaryMatches = intervention.primary && types.includes(intervention.primary.type);
  const secondaryMatches = intervention.secondary && types.includes(intervention.secondary.type);
  if (!primaryMatches && !secondaryMatches) return null;

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/30 px-2.5 py-1 text-[10px] font-mono text-muted-foreground ${className}`}
      role="status"
    >
      <Pin className="h-2.5 w-2.5" aria-hidden />
      <span>{t('companions.fullview.crossRef.headline')}</span>
    </div>
  );
}

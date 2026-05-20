import type { CompanionData } from '@/features/pause/public';
import { HaikuDisplay } from '@/screens/pause/components/HaikuDisplay';
import { CompanionCard } from '@/screens/pause/components/companion/companion-card';
import { COMPANION_SECTION_ICONS } from '@/screens/pause/components/companion/companion-section-icons';
import type { CompanionSectionProFavoriteProps } from '@/screens/pause/lib/companion-section-pro-favorite';

export type CompanionSectionHaikuSlotProps = {
  haiku: NonNullable<CompanionData['haiku']>;
  label: string;
  expanded: boolean;
  onToggleExpand: () => void;
  completed: boolean;
  onFirstExpandComplete: () => void;
  proFavorite: CompanionSectionProFavoriteProps;
};

export function CompanionSectionHaikuSlot({
  haiku,
  label,
  expanded,
  onToggleExpand,
  completed,
  onFirstExpandComplete,
  proFavorite,
}: CompanionSectionHaikuSlotProps) {
  return (
    <CompanionCard
      id="haiku"
      label={label}
      icon={COMPANION_SECTION_ICONS.haiku}
      expanded={expanded}
      onToggle={() => {
        onToggleExpand();
        if (!completed) onFirstExpandComplete();
      }}
      completed={completed}
      {...proFavorite}
    >
      <HaikuDisplay haiku={haiku} />
    </CompanionCard>
  );
}

import { useEffect } from 'react';
import type { CompanionData } from '@/features/pause/public-ritual-frame';
import { HaikuDisplay } from '@/screens/pause/components/HaikuDisplay';
import {
  CompanionCard,
  type CompanionCardAppearance,
} from '@/screens/pause/components/companion/companion-card';
import { COMPANION_SECTION_ICONS } from '@/screens/pause/components/companion/companion-section-icons';
import type { CompanionSectionProFavoriteProps } from '@/features/pause/public-ritual-frame';

export type CompanionSectionHaikuSlotProps = {
  haiku: NonNullable<CompanionData['haiku']>;
  label: string;
  expanded: boolean;
  onToggleExpand: () => void;
  completed: boolean;
  onFirstExpandComplete: () => void;
  proFavorite: CompanionSectionProFavoriteProps;
  appearance?: CompanionCardAppearance;
  iconHelp?: string;
};

export function CompanionSectionHaikuSlot({
  haiku,
  label,
  expanded,
  onToggleExpand,
  completed,
  onFirstExpandComplete,
  proFavorite,
  appearance = 'default',
  iconHelp,
}: CompanionSectionHaikuSlotProps) {
  "use memo";
  const hasDisplayableHaiku = haiku.trim().length > 0;

  useEffect(() => {
    if (expanded && hasDisplayableHaiku && !completed) {
      onFirstExpandComplete();
    }
  }, [expanded, hasDisplayableHaiku, completed, onFirstExpandComplete]);

  return (
    <CompanionCard
      id="haiku"
      label={label}
      icon={COMPANION_SECTION_ICONS.haiku}
      expanded={expanded}
      onToggle={onToggleExpand}
      completed={completed}
      appearance={appearance}
      iconHelp={iconHelp}
      {...proFavorite}
    >
      <HaikuDisplay haiku={haiku} variant={appearance === 'frame' ? 'verse' : 'default'} />
    </CompanionCard>
  );
}

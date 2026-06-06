import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import {
  PROFILE_MOTIVATION_IDS,
  type ProfileMotivationId,
} from '@/features/user/domain/profile-motivations';
import { cn } from '@/lib/utils';

interface MotivationPickerGridProps {
  selected: readonly string[];
  onChange: (next: string[]) => void;
  showMinimumError?: boolean;
  /** When true, the last selected chip cannot be toggled off (Settings auto-save). */
  lockLastSelected?: boolean;
  className?: string;
}

export function MotivationPickerGrid({
  selected,
  onChange,
  showMinimumError = false,
  lockLastSelected = false,
  className,
}: MotivationPickerGridProps) {
  "use memo";
  const { t } = useTranslation();

  const toggle = (value: ProfileMotivationId) => {
    const isSelected = selected.includes(value);
    if (isSelected && lockLastSelected && selected.length <= 1) return;
    const next = isSelected ? selected.filter((v) => v !== value) : [...selected, value];
    onChange(next);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {showMinimumError ? (
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
          <p className="text-xs font-medium tracking-wide">
            {t('home.goalWhy.chooseAtLeastOne', { defaultValue: 'Choose at least one.' })}
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4">
        {PROFILE_MOTIVATION_IDS.map((value) => {
          const isSelected = selected.includes(value);
          return (
            <button
              key={value}
              type="button"
              onClick={() => toggle(value)}
              className={cn(
                'flex h-24 flex-col items-start rounded-lg border p-2.5 text-left transition-colors',
                isSelected
                  ? 'border-primary bg-muted/30 text-foreground'
                  : 'border-border/60 bg-background text-muted-foreground hover:text-foreground',
              )}
            >
              <p className="text-xs font-medium leading-5 text-foreground">
                {t(`settings.motivations.${value}`, value)}
              </p>
              <p className="mt-1 text-xs leading-4 text-muted-foreground">
                {t(`settings.motivations.${value}Desc`)}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

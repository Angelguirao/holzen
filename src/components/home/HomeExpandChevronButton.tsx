import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { homeInWidget } from '@/components/home/home-widget-styles';

interface HomeExpandChevronButtonProps {
  expanded: boolean;
  onToggle: () => void;
  disabled?: boolean;
  /** When `disabled`, `aria-expanded` is forced false for assistive tech. */
  ariaExpandedWhenEnabled: boolean;
  ariaLabel: string;
  title?: string;
}

/** Shared chevron control for expandable Home widget headers (market chart, goal/why). */
export function HomeExpandChevronButton({
  expanded,
  onToggle,
  disabled,
  ariaExpandedWhenEnabled,
  ariaLabel,
  title: titleProp,
}: HomeExpandChevronButtonProps) {
  const title = titleProp ?? ariaLabel;
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={cn(homeInWidget.iconBtn, disabled && 'disabled:cursor-not-allowed disabled:opacity-40')}
      aria-expanded={disabled ? false : ariaExpandedWhenEnabled}
      aria-label={ariaLabel}
      title={title}
    >
      <ChevronDown
        className={cn(
          'h-4 w-4 text-secondary-foreground transition-transform duration-200',
          !expanded && '-rotate-90',
        )}
        aria-hidden
      />
    </button>
  );
}

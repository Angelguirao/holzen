import { cn } from '@/lib/utils';

const baseClass =
  'text-sm font-medium text-nox-text-link underline underline-offset-4 transition-colors hover:text-nox-text-link/80';

interface HomeCustomizeLinkButtonProps {
  label: string;
  onClick: () => void;
  /** Use `shrink-0` when placed beside a heading row. */
  variant?: 'default' | 'shrink';
}

export function HomeCustomizeLinkButton({ label, onClick, variant = 'default' }: HomeCustomizeLinkButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(baseClass, variant === 'shrink' && 'shrink-0')}
    >
      {label}
    </button>
  );
}

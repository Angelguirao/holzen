import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { hapticFeedback } from '@/lib/haptics';

export type PauseFrameToolRowProps = {
  icon: ReactNode;
  label: string;
  href: string;
};

/** Frame step link row to a companion full-view route. */
export function PauseFrameToolRow({ icon, label, href }: PauseFrameToolRowProps) {
  return (
    <Link
      to={href}
      className="flex items-center justify-between gap-3 rounded-lg border-2 border-primary bg-background px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-primary/5"
      onClick={() => hapticFeedback('light')}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-primary/25 bg-primary/5">
          {icon}
        </span>
        <span className="truncate">{label}</span>
      </span>
      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
    </Link>
  );
}

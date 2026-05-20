import { ThumbsUp, ThumbsDown } from 'lucide-react';
import type { CompanionFeedbackVote } from '@/features/pause/public-hooks';

export type CompanionFeedbackVoteButtonsProps = {
  vote: CompanionFeedbackVote | null;
  loading: boolean;
  disabled: boolean;
  onVote: (type: CompanionFeedbackVote) => void;
  compact?: boolean;
};

function voteButtonClass(
  vote: CompanionFeedbackVote | null,
  side: CompanionFeedbackVote,
  compact: boolean,
): string {
  const pad = compact ? 'p-0.5' : 'p-1';
  if (vote === side) {
    return `${pad} rounded transition-colors ${
      side === 'up' ? 'text-nox-text-highlight/90' : 'text-destructive/70'
    }`;
  }
  if (vote) {
    return `${pad} rounded transition-colors text-muted-foreground/10`;
  }
  return `${pad} rounded transition-colors ${
    side === 'up'
      ? compact
        ? 'text-muted-foreground/20 hover:text-nox-text-highlight/60'
        : 'text-muted-foreground/25 hover:text-nox-text-highlight/60'
      : compact
        ? 'text-muted-foreground/20 hover:text-destructive/50'
        : 'text-muted-foreground/25 hover:text-destructive/50'
  }`;
}

/** Thumbs up/down controls for companion feedback (compact or default sizing). */
export function CompanionFeedbackVoteButtons({
  vote,
  loading,
  disabled,
  onVote,
  compact = false,
}: CompanionFeedbackVoteButtonsProps) {
  const iconClass = compact ? 'h-2.5 w-2.5' : 'h-3 w-3';

  return (
    <>
      <button
        type="button"
        onClick={() => onVote('up')}
        disabled={disabled}
        className={voteButtonClass(vote, 'up', compact)}
        aria-label="Thumbs up"
      >
        <ThumbsUp className={iconClass} />
      </button>
      <button
        type="button"
        onClick={() => onVote('down')}
        disabled={disabled}
        className={voteButtonClass(vote, 'down', compact)}
        aria-label="Thumbs down"
      >
        <ThumbsDown className={iconClass} />
      </button>
    </>
  );
}

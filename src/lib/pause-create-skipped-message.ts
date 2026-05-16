import type { PauseCreateOrReuseResult } from '@/lib/pause-api';

/** User-facing copy when `pause_create_or_reuse` returns no `instance_id`. */
export function pauseCreateSkippedUserMessage(
  reusedReason: PauseCreateOrReuseResult['reused_reason'],
): string {
  if (reusedReason === 'recent_dismissal') {
    return 'You recently dismissed a pause in similar market conditions. Wait a bit or try again after the market moves.';
  }
  if (reusedReason === 'fingerprint_match') {
    return 'You already have an open pause for this market moment — use Start this pause below.';
  }
  return 'Could not open a pause right now. Try again shortly.';
}

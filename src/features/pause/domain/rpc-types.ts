import type { PauseCompanionNonCountingReason, PauseState } from '@/features/pause/domain/pause-state';

/** Shape of the JSONB envelope returned by `pause_create_or_reuse`. */
export interface PauseCreateOrReuseResult {
  instance_id: string | null;
  created: boolean;
  reused_reason: 'fingerprint_match' | 'recent_dismissal' | null;
  pending_offer?: boolean;
  prior_open_instance_id?: string | null;
}

export interface PauseAdoptPendingResult {
  ok: boolean;
  instance_id?: string;
  error?: string;
}

export interface PauseLogCompanionResult {
  counts_for_pause: boolean;
  non_counting_reason: PauseCompanionNonCountingReason | null;
  resulting_state: PauseState | null;
}

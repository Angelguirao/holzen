/** Minimal archive row fields for retrospective outcome eligibility (full row: `v_pause_full`). */
export type PauseArchiveRetrospectiveRow = {
  id: string | null;
  state: string | null;
  has_outcome_logged: boolean | null;
};

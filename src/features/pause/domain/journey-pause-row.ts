/** Minimal pause_instances row for Journey overview (streak + totals). */
export type JourneyPauseRow = {
  state: string;
  completed_at: string | null;
  engaged_at: string | null;
  created_at: string;
};

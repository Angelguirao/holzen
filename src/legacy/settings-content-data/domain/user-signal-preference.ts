/** Legacy row shape — `user_signal_preferences` dropped in pause-first schema cleanup. */
export interface UserSignalPreference {
  id: string;
  source_id: string | null;
  custom_name: string | null;
  custom_url: string | null;
  custom_type: string | null;
  active: boolean;
  category: string;
}

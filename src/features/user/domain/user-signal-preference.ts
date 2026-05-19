/** Row shape for `user_signal_preferences` (settings signal sources). */
export interface UserSignalPreference {
  id: string;
  source_id: string | null;
  custom_name: string | null;
  custom_url: string | null;
  custom_type: string | null;
  active: boolean;
  category: string;
}

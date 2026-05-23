/** Mood + dedup hints for edge `holzen-reflect` (mirrors pause-cron-parity shapes). */
export type ReflectMoodHistoryEntry = {
  mood: string;
  outcome: string | null;
  created_at: string | undefined;
};

export type ReflectRecencyHints = {
  moodHistory?: ReflectMoodHistoryEntry[];
  recentMessages?: string[];
  recentHaikus?: string[];
};

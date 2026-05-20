/** Snapshot passed into pause done / brief check-in UI. */
export type PauseDonePauseData = {
  mood: string | null;
  moodAfter: string | null;
  breathingCompleted: boolean;
  decision: string | null;
  context: string | null;
  engagedTools: number;
  wroteNote: boolean;
  usedTags: boolean;
  feelIntensity?: number | null;
  shiftIntensity?: number | null;
  reinforcementQuote?: string | null;
  reflectionMessage?: string | null;
  haiku?: string | null;
};

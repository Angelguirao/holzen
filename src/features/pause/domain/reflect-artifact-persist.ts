/** Input for upserting `pause_ai_artifacts` after `holzen-reflect` or a silent Home reflection stub. */
export type ReflectArtifactPersistInput = {
  pauseInstanceId: string;
  userId: string;
  context: string;
  message: string;
  haiku?: string | null;
  groundingTitle?: string | null;
  groundingBody?: string | null;
  groundingCitation?: string | null;
  groundingUrl?: string | null;
};

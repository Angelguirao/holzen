/** `note_updated` step payload for Reflect post-it blur. */
export function buildReflectNoteUpdatedPayload(text: string): { text: string } {
  return { text };
}

/** `tag_updated` step payload for Reflect tag commit. */
export function buildReflectTagUpdatedPayload(tags: string[]): { tags: string[] } {
  return { tags };
}

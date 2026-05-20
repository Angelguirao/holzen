export type PendingPauseOfferDisplayInput = {
  preview_message?: string | null;
  context_snapshot?: unknown;
};

export type PendingPauseOfferDisplay = {
  contextText: string | null;
  previewMessage: string | null;
  showPreviewLine: boolean;
};

/** Copy lines for pending-offer UI (modal + leave sheet). */
export function getPendingPauseOfferDisplay(
  pending: PendingPauseOfferDisplayInput | null | undefined,
): PendingPauseOfferDisplay {
  const previewMessage = pending?.preview_message?.trim() || null;
  const contextText =
    pending?.context_snapshot && typeof pending.context_snapshot.context_text === 'string'
      ? (pending.context_snapshot.context_text as string)
      : null;
  const showPreviewLine = Boolean(previewMessage && previewMessage !== contextText?.trim());
  return { contextText, previewMessage, showPreviewLine };
}

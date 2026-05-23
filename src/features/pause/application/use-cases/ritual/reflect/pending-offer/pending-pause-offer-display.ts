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
  const snapshot = pending?.context_snapshot as { context_text?: unknown } | null | undefined;
  const contextText =
    snapshot && typeof snapshot.context_text === 'string' ? snapshot.context_text : null;
  const showPreviewLine = Boolean(previewMessage && previewMessage !== contextText?.trim());
  return { contextText, previewMessage, showPreviewLine };
}

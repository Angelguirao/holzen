/**
 * Fragment included in `error` when persisting a pause (e.g. `pause_ai_artifacts` upsert)
 * fails after a successful generate — Home uses this to show the banner even when `btcData` exists.
 * Legacy marker kept so `isReflectionPersistError` still matches older client sessions.
 */
export const PAUSE_PERSIST_ERROR_MARKER = 'Could not save your pause';
/** @deprecated Prefer PAUSE_PERSIST_ERROR_MARKER; still matched for backwards compatibility */
export const REFLECTION_PERSIST_ERROR_MARKER = 'Could not save your reflection';

export function isReflectionPersistError(error: string | null | undefined): boolean {
  return Boolean(
    error?.includes(PAUSE_PERSIST_ERROR_MARKER) || error?.includes(REFLECTION_PERSIST_ERROR_MARKER),
  );
}

export function reflectionPersistErrorMessage(insertErr: { message?: string } | null): string {
  const raw = insertErr?.message ?? '';
  const net = /network|fetch|Failed to fetch|timeout|ECONNRESET/i.test(raw);
  return net
    ? `${PAUSE_PERSIST_ERROR_MARKER}. Check your connection and try again.`
    : `${PAUSE_PERSIST_ERROR_MARKER}. Try again in a moment or sign in again.`;
}

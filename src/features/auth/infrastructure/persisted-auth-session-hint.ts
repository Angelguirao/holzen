/**
 * Sync localStorage probe for a persisted Supabase session.
 * Used by public routes so anonymous visitors are not blocked on AuthLoading.
 */

function supabaseAuthStorageKey(supabaseUrl: string | undefined): string | null {
  if (!supabaseUrl) return null;
  try {
    const ref = new URL(supabaseUrl).hostname.split(".")[0];
    return ref ? `sb-${ref}-auth-token` : null;
  } catch {
    return null;
  }
}

function looksLikeStoredSession(raw: string | null): boolean {
  return Boolean(raw && raw !== "null");
}

/** True when localStorage likely has a Supabase auth token (no network). */
export function hasPersistedAuthSessionHint(): boolean {
  if (typeof localStorage === "undefined") return false;
  try {
    const key = supabaseAuthStorageKey(import.meta.env.VITE_SUPABASE_URL);
    if (key) return looksLikeStoredSession(localStorage.getItem(key));

    for (let i = 0; i < localStorage.length; i += 1) {
      const storedKey = localStorage.key(i);
      if (!storedKey?.startsWith("sb-") || !storedKey.endsWith("-auth-token")) continue;
      if (looksLikeStoredSession(localStorage.getItem(storedKey))) return true;
    }
  } catch {
    return false;
  }
  return false;
}

/**
 * Lightweight reachability check (browser is "online" but Supabase may still be unreachable).
 * Uses GoTrue health — same origin as the rest of the Supabase client.
 */
export async function pingSupabaseReachability(): Promise<boolean> {
  const base = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (typeof base !== 'string' || !base.trim() || typeof key !== 'string' || !key.trim()) {
    return true;
  }

  const url = `${base.replace(/\/$/, '')}/auth/v1/health`;
  const ac = new AbortController();
  const timeoutId = window.setTimeout(() => ac.abort(), 10_000);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      cache: 'no-store',
      signal: ac.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

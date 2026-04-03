import type { QueryClient } from '@tanstack/react-query';
import { holzenLog, isHolzenVerbose } from '@/lib/holzen-console';

function shortKey(key: unknown): string {
  try {
    const s = JSON.stringify(key);
    return s.length > 160 ? `${s.slice(0, 157)}...` : s;
  } catch {
    return String(key);
  }
}

/** Subscribe to query cache updates; no-op unless {@link isHolzenVerbose} is true. */
export function attachHolzenQueryLogging(client: QueryClient): () => void {
  if (!isHolzenVerbose()) return () => {};

  const cache = client.getQueryCache();
  const lastSnap = new Map<string, string>();

  return cache.subscribe((event) => {
    const q = event.query;
    const keyStr = shortKey(q.queryKey);
    const hash = String(q.queryHash);

    if (event.type === 'added') {
      holzenLog.query('cache added', { queryKey: keyStr });
      return;
    }
    if (event.type === 'removed') {
      holzenLog.query('cache removed', { queryKey: keyStr });
      lastSnap.delete(hash);
      return;
    }
    if (event.type !== 'updated') return;

    const snap = `${q.state.status}:${q.state.fetchStatus}`;
    if (lastSnap.get(hash) === snap) return;
    lastSnap.set(hash, snap);

    const payload: Record<string, unknown> = {
      queryKey: keyStr,
      status: q.state.status,
      fetchStatus: q.state.fetchStatus,
    };
    if (q.state.status === 'error' && q.state.error) {
      const err = q.state.error;
      payload.error = err instanceof Error ? err.message : String(err);
    }
    holzenLog.query('state', payload);
  });
}

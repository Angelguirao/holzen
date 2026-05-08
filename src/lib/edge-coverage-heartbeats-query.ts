import { supabase } from '@/integrations/supabase/client';

export const EDGE_COVERAGE_HEARTBEATS_QUERY_KEY = ['admin', 'edge-coverage', 'heartbeats'] as const;

/** BetterStack heartbeat UUIDs keyed by cron job name (`heartbeat.*` in `app_config`). */
export async function fetchHeartbeatConfigMap(): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from('app_config')
    .select('key,value')
    .like('key', 'heartbeat.%');
  if (error || !data) return {};
  const map: Record<string, string> = {};
  for (const row of data as Array<{ key: string; value: unknown }>) {
    const job = row.key.replace(/^heartbeat\./, '');
    const uuid = typeof row.value === 'string' ? row.value : String(row.value ?? '');
    if (job && uuid) map[job] = uuid;
  }
  return map;
}

export function getEdgeCoverageHeartbeatsQueryOptions(adminGateEnabled: boolean) {
  return {
    queryKey: EDGE_COVERAGE_HEARTBEATS_QUERY_KEY,
    queryFn: fetchHeartbeatConfigMap,
    enabled: adminGateEnabled,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  } as const;
}

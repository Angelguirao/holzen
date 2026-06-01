import type { UseQueryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { holzenLog } from '@/lib/holzen-console';
import {
  computePresenceXpFromCompletedPauses,
  type HomePracticePauseInstanceRow,
} from '@/features/pause/domain/home/compute-pause-practice-xp';
import type { HomePracticeStepEventRow } from '@/features/pause/domain/home/build-pause-impact-from-step-events';
import {
  HOME_PRACTICE_STATS_NONE_KEY,
  HOME_PRACTICE_STATS_QUERY_KEY,
} from './home-practice-stats-query-key';

export {
  HOME_PRACTICE_STATS_DISABLED_USER_ID,
  HOME_PRACTICE_STATS_NONE_KEY,
  HOME_PRACTICE_STATS_QUERY_PREFIX,
  HOME_PRACTICE_STATS_QUERY_KEY,
} from './home-practice-stats-query-key';

const HOME_PRACTICE_STATS_STALE_MS = 60_000;
const HOME_PRACTICE_STATS_INSTANCE_LIMIT = 200;

export type HomePracticeStats = {
  completedPauseCount: number;
  presenceXp: number;
};

type CompletedInstanceRow = {
  id: string;
  context_snapshot: unknown;
};

type StepEventRow = HomePracticeStepEventRow & {
  pause_instance_id: string;
};

type CompanionRow = {
  pause_instance_id: string | null;
};

function contextLineFromSnapshot(snapshot: unknown): string | null {
  if (!snapshot || typeof snapshot !== 'object') return null;
  const text = (snapshot as { text?: unknown }).text;
  return typeof text === 'string' ? text : null;
}

function groupEventsByInstance(rows: readonly StepEventRow[]): Map<string, HomePracticeStepEventRow[]> {
  const map = new Map<string, HomePracticeStepEventRow[]>();
  for (const row of rows) {
    const list = map.get(row.pause_instance_id) ?? [];
    list.push({ step_type: row.step_type, payload: row.payload });
    map.set(row.pause_instance_id, list);
  }
  return map;
}

function countCompanionCompletes(rows: readonly CompanionRow[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows) {
    if (!row.pause_instance_id) continue;
    map.set(row.pause_instance_id, (map.get(row.pause_instance_id) ?? 0) + 1);
  }
  return map;
}

export async function fetchHomePracticeStats(userId: string): Promise<HomePracticeStats> {
  const { data: instanceRows, error: instanceError, count } = await supabase
    .from('pause_instances' as never)
    .select('id, context_snapshot', { count: 'exact' })
    .eq('user_id', userId)
    .eq('state', 'completed')
    .order('completed_at', { ascending: false })
    .limit(HOME_PRACTICE_STATS_INSTANCE_LIMIT);

  if (instanceError) {
    holzenLog.home('home_practice_stats_instances_unavailable', { message: instanceError.message });
    return { completedPauseCount: 0, presenceXp: 0 };
  }

  const instances = (instanceRows ?? []) as CompletedInstanceRow[];
  const completedPauseCount = count ?? instances.length;

  if (instances.length === 0) {
    return { completedPauseCount, presenceXp: 0 };
  }

  const instanceIds = instances.map((row) => row.id);

  const [stepResult, companionResult] = await Promise.all([
    supabase
      .from('pause_step_events' as never)
      .select('pause_instance_id, step_type, payload')
      .eq('user_id', userId)
      .in('pause_instance_id', instanceIds),
    supabase
      .from('pause_companion_events' as never)
      .select('pause_instance_id')
      .eq('user_id', userId)
      .in('pause_instance_id', instanceIds)
      .eq('action', 'complete')
      .eq('counts_for_pause', true),
  ]);

  if (stepResult.error) {
    holzenLog.home('home_practice_stats_steps_unavailable', { message: stepResult.error.message });
  }
  if (companionResult.error) {
    holzenLog.home('home_practice_stats_companions_unavailable', {
      message: companionResult.error.message,
    });
  }

  const practiceInstances: HomePracticePauseInstanceRow[] = instances.map((row) => ({
    id: row.id,
    context: contextLineFromSnapshot(row.context_snapshot),
  }));

  const eventsByInstance = groupEventsByInstance((stepResult.data ?? []) as StepEventRow[]);
  const companionCounts = countCompanionCompletes((companionResult.data ?? []) as CompanionRow[]);

  const presenceXp = computePresenceXpFromCompletedPauses(
    practiceInstances,
    eventsByInstance,
    companionCounts,
  );

  return { completedPauseCount, presenceXp };
}

export function getHomePracticeStatsQueryOptions(
  userId: string | undefined,
): Pick<
  UseQueryOptions<HomePracticeStats>,
  'queryKey' | 'queryFn' | 'enabled' | 'staleTime' | 'refetchOnWindowFocus' | 'retry'
> {
  return {
    queryKey: userId ? HOME_PRACTICE_STATS_QUERY_KEY(userId) : HOME_PRACTICE_STATS_NONE_KEY,
    queryFn: () => fetchHomePracticeStats(userId!),
    enabled: Boolean(userId),
    staleTime: HOME_PRACTICE_STATS_STALE_MS,
    refetchOnWindowFocus: false,
    retry: false,
  };
}

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CacheHitRow {
  companion_type: string | null;
  total_serves: number | null;
  cache_hits: number | null;
  live_generated: number | null;
  curated_fallbacks: number | null;
  cache_hit_pct: number | null;
}

interface CostRow {
  day: string | null;
  companion_type: string | null;
  attempts: number | null;
  total_cost_usd: number | null;
  total_input_tokens: number | null;
  total_output_tokens: number | null;
}

interface FailureRow {
  companion_type: string | null;
  provider: string | null;
  model: string | null;
  total_attempts: number | null;
  successes: number | null;
  errors: number | null;
  timeouts: number | null;
  quality_gate_failures: number | null;
  failure_pct: number | null;
  avg_latency_ms: number | null;
  p95_latency_ms: number | null;
}

interface FeedbackRow {
  companion_type: string | null;
  total_thumbs_up: number | null;
  total_thumbs_down: number | null;
  items_with_feedback: number | null;
  approval_pct: number | null;
}

export interface AdminStats {
  cacheHits: CacheHitRow[];
  costs: CostRow[];
  failures: FailureRow[];
  feedback: FeedbackRow[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  lastUpdated: Date | null;
}

export function useAdminStats(): AdminStats {
  const [cacheHits, setCacheHits] = useState<CacheHitRow[]>([]);
  const [costs, setCosts] = useState<CostRow[]>([]);
  const [failures, setFailures] = useState<FailureRow[]>([]);
  const [feedback, setFeedback] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [cacheRes, costRes, failRes, feedRes] = await Promise.all([
        supabase.from('v_companion_cache_hit_rate').select('*'),
        supabase.from('v_companion_cost_per_day').select('*').order('day', { ascending: false }).limit(100),
        supabase.from('v_generation_failure_rate').select('*'),
        supabase.from('v_companion_feedback_ratio').select('*'),
      ]);

      if (cacheRes.error) throw new Error(`Cache hits: ${cacheRes.error.message}`);
      if (costRes.error) throw new Error(`Costs: ${costRes.error.message}`);
      if (failRes.error) throw new Error(`Failures: ${failRes.error.message}`);
      if (feedRes.error) throw new Error(`Feedback: ${feedRes.error.message}`);

      setCacheHits((cacheRes.data ?? []) as CacheHitRow[]);
      setCosts((costRes.data ?? []) as CostRow[]);
      setFailures((failRes.data ?? []) as FailureRow[]);
      setFeedback((feedRes.data ?? []) as FeedbackRow[]);
      setLastUpdated(new Date());
    } catch (e: any) {
      setError(e.message || 'Failed to load monitoring data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { cacheHits, costs, failures, feedback, loading, error, refresh: fetchAll, lastUpdated };
}

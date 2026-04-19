/**
 * Client-side read model for a specific past reflection, including the user's
 * note and any linked `practice_entries` (replay responses) in chronological
 * order.
 *
 * Used by `ReflectionReplay` to render the "thread" view (AI prompt →
 * user notes/replays → textarea for the new entry). Mirrors the edge-side
 * `fetchPastReflectionWithWords` helper (see
 * `supabase/functions/_shared/past-reflections.ts`); both compose the same
 * pure helpers in `_shared/past-reflection-util.ts`.
 */
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import {
  assemblePastReflectionPool,
  type PastReflectionWithWords,
  type PracticeEntryRow,
  type ReflectionRow,
} from '../../supabase/functions/_shared/past-reflection-util';

export type { PastReflectionWithWords };

export interface UsePastReflectionResult {
  loading: boolean;
  /** The reflection + assembled userWords. `null` during load or when missing. */
  past: PastReflectionWithWords | null;
  /**
   * True when the reflection exists but has no user-authored entries. Replay
   * still lets the user write the first entry — the thread view shows only the
   * AI prompt and invites them to contribute.
   */
  existsWithoutWords: boolean;
  error: boolean;
  refetch: () => void;
}

const EMPTY_STATE: UsePastReflectionResult = {
  loading: false,
  past: null,
  existsWithoutWords: false,
  error: false,
  refetch: () => {},
};

export function usePastReflection(
  reflectionId: string | null | undefined,
): UsePastReflectionResult {
  const { user } = useAuth();
  const [past, setPast] = useState<PastReflectionWithWords | null>(null);
  const [existsWithoutWords, setExistsWithoutWords] = useState(false);
  const [loading, setLoading] = useState<boolean>(!!reflectionId);
  const [error, setError] = useState(false);
  const [nonce, setNonce] = useState(0);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!user || !reflectionId) {
      setPast(null);
      setExistsWithoutWords(false);
      setLoading(false);
      setError(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(false);
    (async () => {
      try {
        const { data: reflection, error: rErr } = await supabase
          .from('reflections')
          .select('id, message, note, mood, outcome, context, created_at')
          .eq('user_id', user.id)
          .eq('id', reflectionId)
          .maybeSingle();
        if (cancelled) return;
        if (rErr) throw rErr;
        if (!reflection) {
          setPast(null);
          setExistsWithoutWords(false);
          setLoading(false);
          return;
        }
        const { data: entries, error: eErr } = await supabase
          .from('practice_entries')
          .select('source_reflection_id, body, created_at')
          .eq('source_reflection_id', reflectionId)
          .eq('type', 'replay');
        if (cancelled) return;
        if (eErr) throw eErr;
        const pool = assemblePastReflectionPool(
          [reflection as ReflectionRow],
          (entries ?? []) as PracticeEntryRow[],
        );
        const first = pool[0];
        if (first) {
          setPast(first);
          setExistsWithoutWords(false);
        } else {
          // Reflection exists but has no note and no replays yet — expose a
          // stub with empty `userWords` so the caller can still render the
          // AI prompt / date header and invite the user to write the first
          // entry. Honest framing lives in the component.
          setPast({
            id: reflection.id,
            created_at: reflection.created_at,
            mood: reflection.mood ?? null,
            outcome: reflection.outcome ?? null,
            context: reflection.context ?? null,
            aiPrompt: reflection.message ?? null,
            userWords: [],
          });
          setExistsWithoutWords(true);
        }
        setLoading(false);
      } catch {
        if (cancelled) return;
        setError(true);
        setPast(null);
        setExistsWithoutWords(false);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, reflectionId, nonce]);

  if (!reflectionId) return { ...EMPTY_STATE, refetch };
  return { loading, past, existsWithoutWords, error, refetch };
}

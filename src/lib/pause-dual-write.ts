/**
 * Pause V2 dual-write helper for the client-side manual-pause hook.
 *
 * During cutover (Phases D–J), `useHolzen.generateMessage` continues to
 * insert a row into `reflections` (legacy) so every Phase D–E–F–G–H
 * surface keeps rendering. In parallel, when `pause_v2_enabled` is on,
 * this helper creates a `pause_instances` row via the Phase B RPC and
 * writes the `reflection_text` / `haiku` artifacts to
 * `pause_ai_artifacts`.
 *
 * The V2 write is advisory: any failure is swallowed and logged — we
 * never break the manual flow on a V2 mirror error.
 *
 * See: `supabase/migrations/20260423201000_pause_rpc_functions.sql`,
 *      `docs/systems/pause-system.md`.
 */

import { supabase } from '@/integrations/supabase/client';
import { pauseCreateOrReuse } from '@/lib/pause-api';
import { bucketChangePercent, computeContextFingerprint } from '@/lib/pause-fingerprint';
import { severityFromBtcChangePercent } from '@/lib/btc-move-severity';
import { holzenLog } from '@/lib/holzen-console';

export interface PauseV2DualWriteInput {
  userId: string;
  reflectionMessage: string;
  context: string;
  haiku: string | null;
  groundingTitle: string | null;
  groundingBody: string | null;
  groundingCitation: string | null;
  groundingUrl: string | null;
  btcChangePct: number;
  cumulativeChangePct: number | null;
  initialMood: string | null;
}

/** Returns the created (or reused) `pause_instance_id`, or null on any failure. */
export async function runPauseV2DualWrite(
  input: PauseV2DualWriteInput,
): Promise<string | null> {
  try {
    const directionBucket = input.btcChangePct < 0 ? 'down' : 'up';
    const severity = severityFromBtcChangePercent(input.btcChangePct);
    const severityBand = severity ?? 'mild';
    const fingerprint = await computeContextFingerprint({
      templateSlug: 'volatility_v1',
      directionBucket,
      severityBand,
      dailyBucketPct: bucketChangePercent(input.btcChangePct),
      cumulativeBucketPct: bucketChangePercent(input.cumulativeChangePct ?? 0),
    });

    const res = await pauseCreateOrReuse({
      templateSlug: 'volatility_v1',
      source: 'manual',
      contextSnapshot: {
        change_24h_pct: input.btcChangePct,
        change_7d_pct: input.cumulativeChangePct ?? null,
        direction: directionBucket,
        severity: severityBand,
        initial_mood: input.initialMood ?? null,
        context_text: input.context,
      },
      contextRuleResult: { triggered: ['manual'] },
      contextFingerprint: fingerprint,
    });

    if (!res.instance_id) {
      holzenLog.manual('pause_v2 manual: recent_dismissal rejected', {
        reason: res.reused_reason,
      });
      return null;
    }

    if (res.created) {
      // Newly created pause: write the reflection_text + haiku artifacts.
      const artifacts: Array<{
        pause_instance_id: string;
        user_id: string;
        kind: string;
        content: Record<string, unknown>;
      }> = [
        {
          pause_instance_id: res.instance_id,
          user_id: input.userId,
          kind: 'reflection_text',
          content: {
            message: input.reflectionMessage,
            context: input.context,
          },
        },
      ];
      if (input.haiku) {
        artifacts.push({
          pause_instance_id: res.instance_id,
          user_id: input.userId,
          kind: 'haiku',
          content: { haiku: input.haiku },
        });
      }
      if (input.groundingTitle || input.groundingBody) {
        artifacts.push({
          pause_instance_id: res.instance_id,
          user_id: input.userId,
          kind: 'ground_nudge',
          content: {
            title: input.groundingTitle ?? '',
            body: input.groundingBody ?? '',
            citation: input.groundingCitation ?? '',
            url: input.groundingUrl ?? '',
          },
        });
      }

      const { error: artErr } = await supabase
        .from('pause_ai_artifacts' as never)
        .upsert(artifacts as never, {
          onConflict: 'pause_instance_id,kind',
        } as never);
      if (artErr) {
        holzenLog.manual('pause_v2 manual: artifact upsert failed', {
          message: artErr.message,
        });
      }
    } else {
      holzenLog.manual('pause_v2 manual: reused existing instance', {
        instanceIdPrefix: res.instance_id.slice(0, 8),
        reason: res.reused_reason,
      });
    }

    return res.instance_id;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    holzenLog.manual('pause_v2 manual: dual-write threw', { message: msg });
    return null;
  }
}

import { supabase } from '@/integrations/supabase/client';
import type { CompanionData } from '@/features/pause/domain/companion-card-types';
import type { ReflectArtifactPersistInput } from '@/features/pause/domain/reflect/generation/reflect-artifact-persist';
import { invokeHolzenReflect } from './holzen-reflect-edge';
import type { ReflectRecencyHints } from '@/features/pause/domain/reflect/generation/reflect-recency-hints';

/** @deprecated Prefer `ReflectArtifactPersistInput` from `domain/reflect/generation/reflect-artifact-persist.ts`. */
export type PersistReflectionArtifactsParams = ReflectArtifactPersistInput;

/** Upserts reflection (+ optional haiku / ground nudge) after `holzen-reflect`. */
export async function persistReflectionArtifacts(params: ReflectArtifactPersistInput): Promise<void> {
  const {
    pauseInstanceId,
    userId,
    context,
    message,
    haiku,
    groundingTitle,
    groundingBody,
    groundingCitation,
    groundingUrl,
  } = params;

  const artifacts: Array<{
    pause_instance_id: string;
    user_id: string;
    kind: string;
    content: Record<string, unknown>;
  }> = [
    {
      pause_instance_id: pauseInstanceId,
      user_id: userId,
      kind: 'reflection_text',
      content: { message, context },
    },
  ];

  if (haiku?.trim()) {
    artifacts.push({
      pause_instance_id: pauseInstanceId,
      user_id: userId,
      kind: 'haiku',
      content: { haiku: haiku.trim() },
    });
  }

  if (groundingTitle?.trim() || groundingBody?.trim()) {
    artifacts.push({
      pause_instance_id: pauseInstanceId,
      user_id: userId,
      kind: 'ground_nudge',
      content: {
        title: groundingTitle ?? '',
        body: groundingBody ?? '',
        citation: groundingCitation ?? '',
        url: groundingUrl ?? '',
      },
    });
  }

  const { error } = await supabase
    .from('pause_ai_artifacts' as never)
    .upsert(artifacts as never, { onConflict: 'pause_instance_id,kind' } as never);
  if (error) throw error;
}

export type GenerateReflectionAtReflectParams = {
  pauseInstanceId: string;
  userId: string;
  context: string;
  severity: number;
  tone: string;
  style: string;
  customPrompt?: string;
  motivations?: string[];
  mantra?: string;
  groundingActivities?: string[];
  currency: string;
  language: string;
  recencyHints: ReflectRecencyHints;
  /** Cancels the edge invoke when the run is superseded, `pauseInstanceId` changes, reflect generation is disabled in `PauseSession`, or the effect cleans up. */
  signal?: AbortSignal;
};

export type GenerateReflectionAtReflectResult = {
  message: string;
  companions: CompanionData;
};

/** Invokes `holzen-reflect` and persists artifacts for the pause instance. */
export async function generateReflectionAtReflectStep(
  params: GenerateReflectionAtReflectParams,
): Promise<GenerateReflectionAtReflectResult> {
  const { moodHistory, recentMessages, recentHaikus } = params.recencyHints;

  const { data: fnData, error: fnError } = await invokeHolzenReflect(
    {
      context: params.context,
      tone: params.tone,
      customPrompt: params.customPrompt || undefined,
      style: params.style,
      severity: params.severity,
      motivations: params.motivations && params.motivations.length > 0 ? params.motivations : undefined,
      mantra: params.mantra || undefined,
      groundingActivities:
        params.groundingActivities && params.groundingActivities.length > 0
          ? params.groundingActivities
          : undefined,
      currency: params.currency,
      language: params.language,
      ...(moodHistory && moodHistory.length > 0 ? { moodHistory } : {}),
      ...(recentMessages && recentMessages.length > 0 ? { recentMessages } : {}),
      ...(recentHaikus && recentHaikus.length > 0 ? { recentHaikus } : {}),
    },
    params.signal,
  );
  if (fnError) throw fnError;

  const message = fnData?.message?.trim();
  if (!message) throw new Error('No pause message returned');

  const companions: CompanionData = {
    haiku: fnData?.haiku ?? null,
    groundingTitle: fnData?.grounding_title ?? null,
    groundingBody: fnData?.grounding_body ?? null,
  };

  await persistReflectionArtifacts({
    pauseInstanceId: params.pauseInstanceId,
    userId: params.userId,
    context: params.context,
    message,
    haiku: companions.haiku,
    groundingTitle: companions.groundingTitle,
    groundingBody: companions.groundingBody,
    groundingCitation: fnData?.grounding_citation ?? null,
    groundingUrl: fnData?.grounding_url ?? null,
  });

  return { message, companions };
}

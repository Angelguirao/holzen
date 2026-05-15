import { supabase } from '@/integrations/supabase/client';
import type { CompanionData } from '@/components/CompanionSection';
import { invokeEdge } from '@/lib/invoke-edge';
import { loadReflectRecencyHints } from '@/lib/load-reflect-recency-hints';

/** Reads persisted reflect-step copy (`pause_ai_artifacts.kind === 'reflection_text'`). */
export async function fetchReflectionTextForPauseInstance(pauseInstanceId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('pause_ai_artifacts' as never)
    .select('content')
    .eq('pause_instance_id', pauseInstanceId)
    .eq('kind', 'reflection_text')
    .maybeSingle();
  if (error || !data) return null;
  const row = data as { content: unknown };
  const c = row.content as Record<string, unknown> | null;
  return typeof c?.message === 'string' ? (c.message as string).trim() || null : null;
}

export type PersistReflectionArtifactsParams = {
  pauseInstanceId: string;
  userId: string;
  context: string;
  message: string;
  haiku?: string | null;
  groundingTitle?: string | null;
  groundingBody?: string | null;
  groundingCitation?: string | null;
  groundingUrl?: string | null;
};

/** Upserts reflection (+ optional haiku / ground nudge) after `holzen-reflect`. */
export async function persistReflectionArtifacts(params: PersistReflectionArtifactsParams): Promise<void> {
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
};

export type GenerateReflectionAtReflectResult = {
  message: string;
  companions: CompanionData;
};

/** Invokes `holzen-reflect` and persists artifacts for the pause instance. */
export async function generateReflectionAtReflectStep(
  params: GenerateReflectionAtReflectParams,
): Promise<GenerateReflectionAtReflectResult> {
  const { moodHistory, recentMessages, recentHaikus } = await loadReflectRecencyHints();

  const { data: fnData, error: fnError } = await invokeEdge<{
    message?: string;
    haiku?: string | null;
    grounding_title?: string | null;
    grounding_body?: string | null;
    grounding_citation?: string | null;
    grounding_url?: string | null;
  }>('holzen-reflect', {
    body: {
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
  });
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

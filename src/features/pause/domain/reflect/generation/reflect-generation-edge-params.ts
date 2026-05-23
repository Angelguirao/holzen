/** Profile fields consumed by edge `holzen-reflect` during Reflect-step generation. */
export type ReflectGenerationProfileInput = {
  reflectionTone: string;
  reflectionStyle: string;
  customPrompt: string;
  motivations: string[];
  mantra: string;
  groundingActivities: string[];
  currency: string;
  language: string;
};

export type ReflectGenerationEdgeInvokeInput = {
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
  signal?: AbortSignal;
};

export function buildReflectGenerationEdgeInvokeInput(input: {
  pauseInstanceId: string;
  userId: string;
  context: string;
  severityAbsPct: number;
  profile: ReflectGenerationProfileInput;
  signal?: AbortSignal;
}): ReflectGenerationEdgeInvokeInput {
  const { profile } = input;
  return {
    pauseInstanceId: input.pauseInstanceId,
    userId: input.userId,
    context: input.context,
    severity: input.severityAbsPct,
    tone: profile.reflectionTone,
    style: profile.reflectionStyle,
    customPrompt: profile.customPrompt || undefined,
    motivations: profile.motivations.length > 0 ? profile.motivations : undefined,
    mantra: profile.mantra || undefined,
    groundingActivities:
      profile.groundingActivities.length > 0 ? profile.groundingActivities : undefined,
    currency: profile.currency,
    language: profile.language,
    signal: input.signal,
  };
}

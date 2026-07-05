import type { MarketQuote } from '@/features/market/public';
import { isPauseReflectGenerationEnabled } from '@/features/pause/domain/reflect/generation/reflect-generation-enabled';
import { resolveEffectiveReflectionMessage } from '@/features/pause/domain/reflect/generation/resolve-effective-reflection-message';
import { resolveReflectGenerationSeverityAbsPct } from '@/features/pause/domain/reflect/generation/reflect-generation-severity-abs-pct';
import type { PauseStep } from '@/features/pause/domain/pause-ritual-steps';
import type { RitualDepth } from '@/features/pause/domain/ritual-types';

export type PauseSessionReflectAndDecideViewInput = {
  ritualEntry: RitualDepth | 'picker';
  step: PauseStep;
  /** Nav / session seed before holzen-reflect overwrites. */
  seedMessage: string;
  /** Latest generated copy from `usePauseReflectGeneration`. */
  generatedReflectionMessage: string;
  marketData: MarketQuote | null;
};

/** Pure Reflect + Decide step inputs for the session conductor (generation gate, severity, effective copy). */
export function buildPauseSessionReflectAndDecideView(input: PauseSessionReflectAndDecideViewInput) {
  const reflectGenEnabled = isPauseReflectGenerationEnabled(input.ritualEntry, input.step);
  const severityAbsPct = resolveReflectGenerationSeverityAbsPct(input.marketData?.changePercent);
  const effectiveReflectionMessage = resolveEffectiveReflectionMessage(
    input.generatedReflectionMessage,
    input.seedMessage,
  );
  return { reflectGenEnabled, severityAbsPct, effectiveReflectionMessage };
}

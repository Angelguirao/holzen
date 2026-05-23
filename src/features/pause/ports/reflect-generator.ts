import type { ReflectArtifactPersistInput } from '@/features/pause/domain/reflect/generation/reflect-artifact-persist';
import type { ReflectGenerationEdgeInvokeInput } from '@/features/pause/domain/reflect/generation/reflect-generation-edge-params';
import type { ReflectRecencyHints } from '@/features/pause/domain/reflect/generation/reflect-recency-hints';
import type {
  PauseReflectStepLatestRow,
  PauseReflectStepType,
} from '@/features/pause/domain/reflect/steps/reflect-step-latest';

/** Port for reflect-step copy: artifact cache reads + `holzen-reflect` edge invoke. */
export interface ReflectGenerator {
  fetchReflectionText(pauseInstanceId: string): Promise<string | null>;
  fetchHaikuText(pauseInstanceId: string): Promise<string | null>;
  fetchLatestReflectStep(
    pauseInstanceId: string,
    stepType: PauseReflectStepType,
  ): Promise<PauseReflectStepLatestRow | null>;
  loadRecencyHints(): Promise<ReflectRecencyHints>;
  generateReflection(
    params: ReflectGenerationEdgeInvokeInput,
    recencyHints: ReflectRecencyHints,
  ): Promise<{ message: string }>;
  persistReflectionArtifacts(params: ReflectArtifactPersistInput): Promise<void>;
}

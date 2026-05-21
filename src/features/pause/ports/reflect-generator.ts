import type { ReflectGenerationEdgeInvokeInput } from '@/features/pause/domain/reflect-generation-edge-params';
import type { ReflectRecencyHints } from '@/features/pause/domain/reflect-recency-hints';
import type {
  PauseReflectStepLatestRow,
  PauseReflectStepType,
} from '@/features/pause/domain/reflect-step-latest';

/** Port for reflect-step copy: artifact cache reads + `holzen-reflect` edge invoke. */
export interface ReflectGenerator {
  fetchReflectionText(pauseInstanceId: string): Promise<string | null>;
  fetchHaikuText(pauseInstanceId: string): Promise<string | null>;
  fetchLatestReflectStep(
    pauseInstanceId: string,
    stepType: PauseReflectStepType,
  ): Promise<PauseReflectStepLatestRow | null>;
  loadRecencyHints(): Promise<ReflectRecencyHints>;
  generateReflection(params: ReflectGenerationEdgeInvokeInput): Promise<{ message: string }>;
}

import type { ReflectGenerationEdgeInvokeInput } from '@/features/pause/domain/reflect-generation-edge-params';

/** Port for reflect-step copy: artifact cache read + `holzen-reflect` edge invoke. */
export interface ReflectGenerator {
  fetchReflectionText(pauseInstanceId: string): Promise<string | null>;
  generateReflection(params: ReflectGenerationEdgeInvokeInput): Promise<{ message: string }>;
}

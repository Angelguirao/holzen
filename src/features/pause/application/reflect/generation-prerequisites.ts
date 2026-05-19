/** Gate for starting edge `holzen-reflect` in the Reflect-step hook. */
export type ReflectGenerationPrerequisite =
  | 'ok'
  | 'idle'
  | 'missing_context';

export function reflectGenerationPrerequisite(input: {
  enabled: boolean;
  pauseInstanceId: string | null;
  userId: string | undefined;
  context: string | null | undefined;
}): ReflectGenerationPrerequisite {
  if (!input.enabled || !input.pauseInstanceId || !input.userId) return 'idle';
  if (!input.context?.trim()) return 'missing_context';
  return 'ok';
}

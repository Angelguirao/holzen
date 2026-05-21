/** Outcome of `runReflectGeneration` — hook maps to UI state via `messageFromReflectGenerationResult`. */
export type ReflectGenerationResult =
  | { status: 'seed'; message: string }
  | { status: 'cached'; message: string }
  | { status: 'generated'; message: string }
  | { status: 'aborted' };

/** Input for Home silent-mode `reflection_text` stub persist (subset of reflect artifact persist). */
export type PersistSilentReflectionStubInput = {
  pauseInstanceId: string;
  userId: string;
  context: string;
  message: string;
};

export type PersistSilentReflectionStubResult =
  | { outcome: 'ok' }
  | { outcome: 'error'; userMessage: string };

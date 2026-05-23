/** Tab-scoped dedupe port for `reflection_step` progression logging. */
export type ReflectionStepLogStoragePort = {
  /** When false, skip logging (e.g. sessionStorage unavailable). */
  canRead: () => boolean;
  isLogged: (storageKey: string) => boolean;
  markLogged: (storageKey: string) => void;
};

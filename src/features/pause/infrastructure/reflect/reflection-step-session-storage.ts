import type { ReflectionStepLogStoragePort } from '../../application/use-cases/reflect/run-pause-reflection-step-log';

/** Tab-scoped dedupe for `reflection_step` progression logging. */
export const reflectionStepSessionStorage: ReflectionStepLogStoragePort = {
  canRead() {
    try {
      sessionStorage.getItem('');
      return true;
    } catch {
      return false;
    }
  },
  isLogged(key) {
    try {
      return sessionStorage.getItem(key) != null;
    } catch {
      return true;
    }
  },
  markLogged(key) {
    try {
      sessionStorage.setItem(key, '1');
    } catch {
      /* no-op */
    }
  },
};

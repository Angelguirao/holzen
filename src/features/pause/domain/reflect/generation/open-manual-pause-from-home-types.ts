import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import type { ReflectGenerator } from '@/features/pause/ports/reflect-generator';

export type { OpenManualPauseFromHomeParams } from '@/features/pause/domain/reflect/generation/open-manual-pause-from-home-params';

export type OpenManualPauseFromHomeSuccess = {
  outcome: 'opened';
  instanceId: string;
  context: string;
  pendingOffer: boolean;
  created: boolean;
  /** When true, caller should set Home message to `silentMessage`. */
  silentStubPersisted: boolean;
};

export type OpenManualPauseFromHomeIdle = {
  outcome: 'idle';
  userMessage: string;
};

export type OpenManualPauseFromHomeError = {
  outcome: 'error';
  userMessage: string;
  isNetwork: boolean;
};

export type OpenManualPauseFromHomeResult =
  | OpenManualPauseFromHomeSuccess
  | OpenManualPauseFromHomeIdle
  | OpenManualPauseFromHomeError;

export type OpenManualPauseFromHomePorts = {
  repository: PauseRepository;
  reflect: ReflectGenerator;
};

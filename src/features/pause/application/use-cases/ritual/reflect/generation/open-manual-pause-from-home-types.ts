import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import type { ReflectGenerator } from '@/features/pause/ports/reflect-generator';

export type OpenManualPauseFromHomeParams = {
  userId: string;
  silentMode: boolean;
  contextText: string;
  silentMessage: string;
  mood?: string | null;
  changePercent: number;
  cumulativeChangePercent: number | null;
  trackedAssetId: string;
  severityBand: string;
  fearGreedLabel: string | null;
  onChainBand: string | null;
};

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

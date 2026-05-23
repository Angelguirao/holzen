export type RunOpenManualPauseSilentModeAfterCreateInput = {
  pauseInstanceId: string;
  userId: string;
  contextText: string;
  silentMessage: string;
  pendingOffer: boolean;
  created: boolean;
};

export type RunOpenManualPauseSilentModeAfterCreateOpened = {
  outcome: 'opened';
  instanceId: string;
  context: string;
  pendingOffer: boolean;
  created: boolean;
  silentStubPersisted: true;
};

export type RunOpenManualPauseSilentModeAfterCreateError = {
  outcome: 'error';
  userMessage: string;
  isNetwork: false;
};

export type RunOpenManualPauseSilentModeAfterCreateResult =
  | RunOpenManualPauseSilentModeAfterCreateOpened
  | RunOpenManualPauseSilentModeAfterCreateError;

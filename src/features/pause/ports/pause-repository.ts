import type {
  PauseAdoptPendingResult,
  PauseCreateOrReuseResult,
  PauseLogCompanionResult,
} from '@/features/pause/domain/rpc-types';
import type {
  PauseCompanionAction,
  PauseState,
  PauseStepType,
} from '@/features/pause/domain/pause-state';

/** Port for pause V2 RPC mutations — implemented by `infrastructure/pause-rpc-client`. */
export interface PauseRepository {
  createOrReuse(params: {
    templateSlug: string;
    source: string;
    contextSnapshot: Record<string, unknown>;
    contextRuleResult: Record<string, unknown>;
    contextFingerprint: string;
  }): Promise<PauseCreateOrReuseResult>;

  adoptPendingOffer(): Promise<PauseAdoptPendingResult>;
  declinePendingOffer(): Promise<{ ok: boolean; cleared: number }>;

  logStep(params: {
    instanceId: string;
    stepType: PauseStepType;
    payload?: Record<string, unknown>;
  }): Promise<PauseState | null>;

  logCompanion(params: {
    instanceId: string | null;
    companionType: string;
    action: PauseCompanionAction;
    entryPoint: string;
  }): Promise<PauseLogCompanionResult>;

  dismissCurrent(): Promise<PauseState | null>;

  applyCronCalmSweepForSelf(input: {
    changePercent: number;
    direction: 'up' | 'down';
  }): Promise<Record<string, unknown> | null>;

  evaluateTransitions(instanceId: string): Promise<PauseState | null>;

  /** Companion slot heart — `pause_instances.metadata` (not `pause_log_step`). */
  toggleCompanionSlotFavorite(params: {
    pauseInstanceId: string;
    nextBucket: Record<string, boolean>;
    onBucketComputed?: (bucket: Record<string, boolean>) => void;
  }): Promise<boolean>;
}

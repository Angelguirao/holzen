import { describe, expect, it, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {},
}));

vi.mock('@/features/pause/public-rpc', () => ({
  supabaseCompanionOrchestrator: { port: 'companionOrchestrator' },
  supabasePauseRepository: { port: 'companionPauseRepository' },
}));

import { applyCompanionOrchestrateRetryReset as applyRetryResetDirect } from '@/features/pause/application/use-cases/ritual/frame/apply-companion-orchestrate-retry-reset';
import { applyCompanionSlotOrchestrateOutcome as applyOutcomeDirect } from '@/features/pause/application/use-cases/ritual/frame/apply-companion-slot-orchestrate-outcome';
import { logCompanionSlotOrchestrateInvoke as logInvokeDirect } from '@/features/pause/application/use-cases/ritual/frame/companion-slot-orchestrate-telemetry';
import { trackCompanionGenerationInitiated as trackGenerationDirect } from '@/features/pause/application/use-cases/ritual/frame/companion-generation-telemetry';
import {
  setCompanionSlotError as setErrorDirect,
  setCompanionSlotLoading as setLoadingDirect,
} from '@/features/pause/application/use-cases/ritual/frame/companion-slot-ui-state';
import {
  EMPTY_COMPANION_SLOT_RELAXATIONS as emptyRelaxationsDirect,
} from '@/features/pause/application/use-cases/ritual/frame/orchestrate-slot-apply';
import { runCompanionSlotOrchestrate as runSlotOrchestrateDirect } from '@/features/pause/application/use-cases/ritual/frame/run-companion-slot-orchestrate';
import {
  applyCompanionOrchestrateRetryReset,
  applyCompanionSlotOrchestrateOutcome,
  companionOrchestrator,
  EMPTY_COMPANION_SLOT_RELAXATIONS,
  logCompanionSlotOrchestrateInvoke,
  runCompanionSlotOrchestrate,
  setCompanionSlotError,
  setCompanionSlotLoading,
  trackCompanionGenerationInitiated,
} from './pause-companion-orchestrate-io';
import {
  applyCompanionOrchestrateRetryReset as applyRetryResetFromOrchestrateFlow,
  applyCompanionSlotOrchestrateOutcome as applyOutcomeFromOrchestrateFlow,
  EMPTY_COMPANION_SLOT_RELAXATIONS as emptyRelaxationsFromOrchestrateFlow,
  logCompanionSlotOrchestrateInvoke as logInvokeFromOrchestrateFlow,
  runCompanionSlotOrchestrate as runSlotOrchestrateFromOrchestrateFlow,
  setCompanionSlotError as setErrorFromOrchestrateFlow,
  setCompanionSlotLoading as setLoadingFromOrchestrateFlow,
  trackCompanionGenerationInitiated as trackGenerationFromOrchestrateFlow,
} from '@/features/pause/application/use-cases/ritual/frame/pause-companion-orchestrate-flow';
import { companionOrchestrator as companionOrchestratorDirect } from './pause-companion-orchestration-io';

describe('pause-companion-orchestrate-io re-exports', () => {
  it('re-exports ritual/frame leaf modules with identity bindings', () => {
    expect(applyCompanionOrchestrateRetryReset).toBe(applyRetryResetDirect);
    expect(applyCompanionSlotOrchestrateOutcome).toBe(applyOutcomeDirect);
    expect(EMPTY_COMPANION_SLOT_RELAXATIONS).toBe(emptyRelaxationsDirect);
    expect(logCompanionSlotOrchestrateInvoke).toBe(logInvokeDirect);    expect(runCompanionSlotOrchestrate).toBe(runSlotOrchestrateDirect);
    expect(setCompanionSlotError).toBe(setErrorDirect);
    expect(setCompanionSlotLoading).toBe(setLoadingDirect);
    expect(trackCompanionGenerationInitiated).toBe(trackGenerationDirect);
  });

  it('re-exports companionOrchestrator from orchestration I/O', () => {
    expect(companionOrchestrator).toBe(companionOrchestratorDirect);
  });

  it('presentation I/O orchestrate bindings match pause-companion-orchestrate-flow CI umbrella (leaf parity)', () => {
    expect(applyCompanionOrchestrateRetryReset).toBe(applyRetryResetFromOrchestrateFlow);
    expect(applyCompanionSlotOrchestrateOutcome).toBe(applyOutcomeFromOrchestrateFlow);
    expect(EMPTY_COMPANION_SLOT_RELAXATIONS).toBe(emptyRelaxationsFromOrchestrateFlow);
    expect(logCompanionSlotOrchestrateInvoke).toBe(logInvokeFromOrchestrateFlow);    expect(runCompanionSlotOrchestrate).toBe(runSlotOrchestrateFromOrchestrateFlow);
    expect(setCompanionSlotError).toBe(setErrorFromOrchestrateFlow);
    expect(setCompanionSlotLoading).toBe(setLoadingFromOrchestrateFlow);
    expect(trackCompanionGenerationInitiated).toBe(trackGenerationFromOrchestrateFlow);
  });
});

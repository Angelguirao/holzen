/**
 * Presentation I/O parity (colocated beside `pause-companion-orchestrate-io.ts`).
 * Imports `pause-companion-orchestrate-flow` CI umbrella for `.toBe` identity pins only — production orchestrate I/O keeps ritual/frame leaf imports.
 * Application mirror: `application/use-cases/ritual/frame/pause-companion-orchestrate-io-parity.test.ts`.
 * Orchestration-io sibling: `pause-companion-orchestrate-orchestration-io-sibling-parity.test.ts` (application + presentation).
 */
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {},
}));

vi.mock('@/features/pause/public-rpc', () => ({
  supabaseCompanionOrchestrator: { port: 'companionOrchestrator' },
  supabasePauseRepository: { port: 'companionPauseRepository' },
}));

import {
  loadCompanionOrchestrateSession as loadSessionFromOrchestrationFlow,
  nextExpandedWithLazyFetch as nextExpandedFromOrchestrationFlow,
} from '@/features/pause/application/use-cases/ritual/frame/pause-companion-orchestration-flow';
import { applyCompanionOrchestrateRetryReset as applyRetryResetDirect } from '@/features/pause/application/use-cases/ritual/frame/apply-companion-orchestrate-retry-reset';
import { applyCompanionSlotOrchestrateOutcome as applyOutcomeDirect } from '@/features/pause/application/use-cases/ritual/frame/apply-companion-slot-orchestrate-outcome';
import { logCompanionSlotOrchestrateInvoke as logInvokeDirect } from '@/features/pause/application/use-cases/ritual/frame/companion-slot-orchestrate-telemetry';
import { trackCompanionGenerationInitiated as trackGenerationDirect } from '@/features/pause/application/use-cases/ritual/frame/companion-generation-telemetry';
import {
  setCompanionSlotError as setErrorDirect,
  setCompanionSlotLoading as setLoadingDirect,
} from '@/features/pause/application/use-cases/ritual/frame/companion-slot-ui-state';
import { EMPTY_COMPANION_SLOT_RELAXATIONS as emptyRelaxationsDirect } from '@/features/pause/application/use-cases/ritual/frame/orchestrate-slot-apply';
import { resetInterventionIdempotency as resetInterventionDirect } from '@/features/pause/application/use-cases/ritual/frame/intervention-idempotency';
import { runCompanionInterventionBootstrap as runInterventionDirect } from '@/features/pause/application/use-cases/ritual/frame/run-companion-intervention-bootstrap';
import { runCompanionSlotOrchestrate as runSlotOrchestrateDirect } from '@/features/pause/application/use-cases/ritual/frame/run-companion-slot-orchestrate';
import {
  applyCompanionOrchestrateRetryReset,
  applyCompanionSlotOrchestrateOutcome,
  EMPTY_COMPANION_SLOT_RELAXATIONS,
  logCompanionSlotOrchestrateInvoke,
  resetInterventionIdempotency,
  runCompanionInterventionBootstrap,
  runCompanionSlotOrchestrate,
  setCompanionSlotError,
  setCompanionSlotLoading,
  trackCompanionGenerationInitiated,
} from '@/features/pause/application/use-cases/ritual/frame/pause-companion-orchestrate-flow';
import * as orchestrateFlow from '@/features/pause/application/use-cases/ritual/frame/pause-companion-orchestrate-flow';
import {
  applyCompanionOrchestrateRetryReset as applyRetryResetFromOrchestrateIo,
  applyCompanionSlotOrchestrateOutcome as applyOutcomeFromOrchestrateIo,
  EMPTY_COMPANION_SLOT_RELAXATIONS as emptyRelaxationsFromOrchestrateIo,
  logCompanionSlotOrchestrateInvoke as logInvokeFromOrchestrateIo,
  resetInterventionIdempotency as resetInterventionFromOrchestrateIo,
  runCompanionInterventionBootstrap as runInterventionFromOrchestrateIo,
  runCompanionSlotOrchestrate as runSlotOrchestrateFromOrchestrateIo,
  setCompanionSlotError as setErrorFromOrchestrateIo,
  setCompanionSlotLoading as setLoadingFromOrchestrateIo,
  trackCompanionGenerationInitiated as trackGenerationFromOrchestrateIo,
} from './pause-companion-orchestrate-io';
import * as orchestrateIo from './pause-companion-orchestrate-io';
import {
  invalidateCompanionUiCompletionQuery,
  loadCompanionOrchestrateSession,
  nextExpandedWithLazyFetch,
  pauseCompanionUiStepCompletion,
  pauseLoadCompanionOrchestrateSession,
  pauseToggleCompanionLibraryFavorite,
} from './pause-companion-orchestration-io';

describe('pause-companion-orchestrate-io parity', () => {
  it('presentation I/O orchestrate exports match pause-companion-orchestrate-flow CI umbrella', () => {
    expect(applyCompanionOrchestrateRetryReset).toBe(applyRetryResetFromOrchestrateIo);
    expect(applyCompanionSlotOrchestrateOutcome).toBe(applyOutcomeFromOrchestrateIo);
    expect(EMPTY_COMPANION_SLOT_RELAXATIONS).toBe(emptyRelaxationsFromOrchestrateIo);
    expect(logCompanionSlotOrchestrateInvoke).toBe(logInvokeFromOrchestrateIo);
    expect(resetInterventionIdempotency).toBe(resetInterventionFromOrchestrateIo);
    expect(runCompanionInterventionBootstrap).toBe(runInterventionFromOrchestrateIo);
    expect(runCompanionSlotOrchestrate).toBe(runSlotOrchestrateFromOrchestrateIo);
    expect(setCompanionSlotError).toBe(setErrorFromOrchestrateIo);
    expect(setCompanionSlotLoading).toBe(setLoadingFromOrchestrateIo);
    expect(trackCompanionGenerationInitiated).toBe(trackGenerationFromOrchestrateIo);

    expect(applyCompanionOrchestrateRetryReset).toBe(applyRetryResetDirect);
    expect(applyCompanionSlotOrchestrateOutcome).toBe(applyOutcomeDirect);
    expect(EMPTY_COMPANION_SLOT_RELAXATIONS).toBe(emptyRelaxationsDirect);
    expect(logCompanionSlotOrchestrateInvoke).toBe(logInvokeDirect);
    expect(resetInterventionIdempotency).toBe(resetInterventionDirect);
    expect(runCompanionInterventionBootstrap).toBe(runInterventionDirect);
    expect(runCompanionSlotOrchestrate).toBe(runSlotOrchestrateDirect);
    expect(setCompanionSlotError).toBe(setErrorDirect);
    expect(setCompanionSlotLoading).toBe(setLoadingDirect);
    expect(trackCompanionGenerationInitiated).toBe(trackGenerationDirect);
  });

  it('orchestrate-flow CI umbrella composes ritual/frame leaf modules (presentation I/O matches)', () => {
    expect('loadCompanionOrchestrateSession' in orchestrateFlow).toBe(false);
    expect('nextExpandedWithLazyFetch' in orchestrateFlow).toBe(false);
    expect('runCompanionSlotOrchestrate' in orchestrateFlow).toBe(true);
    expect('runCompanionInterventionBootstrap' in orchestrateFlow).toBe(true);
    expect('applyCompanionSlotOrchestrateOutcome' in orchestrateFlow).toBe(true);
    expect('trackCompanionGenerationInitiated' in orchestrateFlow).toBe(true);
  });

  it('orchestrate I/O exports stay distinct from orchestration-flow session load and expansion siblings', () => {
    expect(runCompanionSlotOrchestrate).not.toBe(loadSessionFromOrchestrationFlow);
    expect(runCompanionInterventionBootstrap).not.toBe(nextExpandedFromOrchestrationFlow);
    expect(applyCompanionSlotOrchestrateOutcome).not.toBe(loadSessionFromOrchestrationFlow);
    expect(logCompanionSlotOrchestrateInvoke).not.toBe(nextExpandedFromOrchestrationFlow);
    expect(trackCompanionGenerationInitiated).not.toBe(loadSessionFromOrchestrationFlow);
    expect(runCompanionSlotOrchestrate).not.toBe(loadCompanionOrchestrateSession);
    expect(runCompanionInterventionBootstrap).not.toBe(nextExpandedWithLazyFetch);
    expect(applyCompanionSlotOrchestrateOutcome).not.toBe(pauseLoadCompanionOrchestrateSession);
    expect(logCompanionSlotOrchestrateInvoke).not.toBe(pauseToggleCompanionLibraryFavorite);
    expect(trackCompanionGenerationInitiated).not.toBe(pauseCompanionUiStepCompletion);
    expect(setCompanionSlotLoading).not.toBe(invalidateCompanionUiCompletionQuery);
    expect(resetInterventionIdempotency).not.toBe(pauseLoadCompanionOrchestrateSession);
    // Reciprocal inline pins: `application/.../ritual/frame/pause-companion-orchestrate-io-parity.test.ts`,
    // `pause-companion-orchestration-io-parity.test.ts`.
    // Dedicated siblings: `pause-companion-orchestrate-orchestration-io-sibling-parity.test.ts` (application + presentation).
  });

  it('presentation orchestrate-io stays off orchestration-io session/favorite wrappers', () => {
    expect('pauseLoadCompanionOrchestrateSession' in orchestrateIo).toBe(false);
    expect('pauseToggleCompanionLibraryFavorite' in orchestrateIo).toBe(false);
    expect('nextExpandedWithLazyFetch' in orchestrateIo).toBe(false);
    expect('invalidateCompanionUiCompletionQuery' in orchestrateIo).toBe(false);
    expect('companionOrchestrator' in orchestrateIo).toBe(true);
  });
});

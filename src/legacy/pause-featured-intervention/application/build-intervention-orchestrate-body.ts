import type { CompanionOrchestrateSessionContext } from '@/features/pause/application/use-cases/ritual/frame/build-companion-orchestrate-body';

/** Body for intervention-only `companion-orchestrate` (legacy headline surface). */
export function buildInterventionOrchestrateBody(
  session: CompanionOrchestrateSessionContext,
): Record<string, unknown> {
  return {
    holzenInvokeSource: 'browser_pause_intervention',
    ...session,
    enableSignal: false,
    enableGrounding: false,
    enableHistory: false,
    enableZoomOut: false,
    useIntervention: true,
  };
}

import { buildPauseSessionScaffoldRitualDerived } from '@/features/pause/application/use-cases/session/scaffold-ritual-derived';
import {
  buildPauseSessionScaffoldRitualPayloads,
  type PauseSessionScaffoldRitualPayloadsParams,
} from './scaffold-ritual-payloads';

export type PauseSessionScaffoldRitualDerivedParams = Parameters<
  typeof buildPauseSessionScaffoldRitualDerived
>[0];

export interface UsePauseSessionScaffoldRitualParams {
  derived: PauseSessionScaffoldRitualDerivedParams;
  payloads: PauseSessionScaffoldRitualPayloadsParams;
}

/** Maps pause session orchestration deps to scaffold shell + brief/deep ritual body props. */
export function usePauseSessionScaffoldRitual({ derived, payloads }: UsePauseSessionScaffoldRitualParams) {
  const scaffoldRitualDerived = buildPauseSessionScaffoldRitualDerived(derived);
  const { briefRitual, deepRitual } = buildPauseSessionScaffoldRitualPayloads(payloads);
  return { scaffoldRitualDerived, briefRitual, deepRitual };
}

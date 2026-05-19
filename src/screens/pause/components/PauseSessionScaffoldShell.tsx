import type { ComponentProps } from 'react';
import { PauseSessionScaffold } from '@/screens/pause/components/PauseSessionScaffold';
import {
  PauseSessionScaffoldBody,
  type PauseSessionScaffoldBodyProps,
} from '@/screens/pause/components/PauseSessionScaffoldBody';

export type PauseSessionScaffoldShellProps = Omit<ComponentProps<typeof PauseSessionScaffold>, 'children'> &
  PauseSessionScaffoldBodyProps;

/** `PauseSessionScaffold` + ritual / done body — used when depth has been chosen (not on picker). */
export function PauseSessionScaffoldShell(props: PauseSessionScaffoldShellProps) {
  const {
    ritualEntry,
    briefRitual,
    deepRitual,
    decision,
    onDoneReturn,
    onSaveToJourney,
    pauseImpactData,
    pauseInstanceIdForDone,
    ...scaffold
  } = props;

  return (
    <PauseSessionScaffold {...scaffold}>
      <PauseSessionScaffoldBody
        phase={scaffold.phase}
        ritualEntry={ritualEntry}
        briefRitual={briefRitual}
        deepRitual={deepRitual}
        decision={decision}
        onDoneReturn={onDoneReturn}
        onSaveToJourney={onSaveToJourney}
        pauseImpactData={pauseImpactData}
        pauseInstanceIdForDone={pauseInstanceIdForDone}
      />
    </PauseSessionScaffold>
  );
}

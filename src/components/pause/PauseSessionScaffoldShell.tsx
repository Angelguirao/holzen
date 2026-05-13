import type { ComponentProps } from 'react';
import { PauseSessionScaffold } from '@/components/pause/PauseSessionScaffold';
import {
  PauseSessionScaffoldBody,
  type PauseSessionScaffoldBodyProps,
} from '@/components/pause/PauseSessionScaffoldBody';

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
      />
    </PauseSessionScaffold>
  );
}

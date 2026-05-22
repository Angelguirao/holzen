import { describe, expect, it } from 'vitest';

import {
  getCompanionSectionVisibility,
  isCompanionSectionVisible,
} from '@/features/pause/application/use-cases/ritual/frame/pause-companion-section-visibility-flow';
import {
  getCompanionSectionVisibility as getVisibilityFromFrameUiFlow,
  isCompanionSectionVisible as isVisibleFromFrameUiFlow,
} from '@/features/pause/application/use-cases/ritual/frame/pause-companion-frame-ui-flow';
import {
  loadCompanionOrchestrateSession,
  nextExpandedWithLazyFetch,
} from '@/features/pause/application/use-cases/ritual/frame/pause-companion-orchestration-flow';
import { nextExpandedWithLazyFetch as nextExpandedFromExpansionFlow } from '@/features/pause/application/use-cases/ritual/frame/pause-companion-section-expansion-flow';
import * as orchestrationFlow from '@/features/pause/application/use-cases/ritual/frame/pause-companion-orchestration-flow';
import * as sectionVisibilityFlow from '@/features/pause/application/use-cases/ritual/frame/pause-companion-section-visibility-flow';

describe('pause-companion-orchestration ↔ section-visibility sibling parity', () => {
  it('orchestration-flow and section-visibility-flow are distinct sibling CI anchors', () => {
    expect(typeof loadCompanionOrchestrateSession).toBe('function');
    expect(typeof nextExpandedWithLazyFetch).toBe('function');
    expect(typeof getCompanionSectionVisibility).toBe('function');
    expect(typeof isCompanionSectionVisible).toBe('function');

    expect('getCompanionSectionVisibility' in orchestrationFlow).toBe(false);
    expect('isCompanionSectionVisible' in orchestrationFlow).toBe(false);
    expect('loadCompanionOrchestrateSession' in sectionVisibilityFlow).toBe(false);
    expect('nextExpandedWithLazyFetch' in sectionVisibilityFlow).toBe(false);
  });

  it('orchestration-flow lazy expansion matches section-expansion-flow (orchestration subcluster)', () => {
    expect(nextExpandedWithLazyFetch).toBe(nextExpandedFromExpansionFlow);
  });

  it('frame-ui-flow composes visibility from section-visibility-flow (orchestration uses expansion sibling)', () => {
    expect(getVisibilityFromFrameUiFlow).toBe(getCompanionSectionVisibility);
    expect(isVisibleFromFrameUiFlow).toBe(isCompanionSectionVisible);
  });
});

import { describe, expect, it } from 'vitest';

import { EMPTY_COMPANION_SLOT_RELAXATIONS as emptyRelaxationsDirect } from './orchestrate-slot-apply';

import { EMPTY_COMPANION_SLOT_RELAXATIONS } from './pause-companion-orchestrate-slot-apply-flow';

describe('pause-companion-orchestrate-slot-apply-flow', () => {
  it('re-exports slot apply types and empty relaxations from orchestrate-slot-apply', () => {
    expect(EMPTY_COMPANION_SLOT_RELAXATIONS).toBe(emptyRelaxationsDirect);
    expect(EMPTY_COMPANION_SLOT_RELAXATIONS).toMatchObject({
      grounding: null,
      signal: null,
      history: null,
      zoomOut: null,
    });
  });
});

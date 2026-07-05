import { describe, expect, it } from 'vitest';
import { applyHomeWidgetVisibilityChange } from './apply-home-widget-visibility-change';
import { JOURNEY_STAT_TILES_VISIBILITY_ID } from './home-section-visibility-constants';

describe('applyHomeWidgetVisibilityChange', () => {
  it('appends id when enabling a widget missing from order', () => {
    expect(
      applyHomeWidgetVisibilityChange({
        id: JOURNEY_STAT_TILES_VISIBILITY_ID,
        value: true,
        order: ['goal-why', 'market'],
      }),
    ).toEqual(['goal-why', 'market', JOURNEY_STAT_TILES_VISIBILITY_ID]);
  });

  it('returns the same order when enabling an id already present', () => {
    const order = ['goal-why', JOURNEY_STAT_TILES_VISIBILITY_ID];
    expect(
      applyHomeWidgetVisibilityChange({ id: JOURNEY_STAT_TILES_VISIBILITY_ID, value: true, order }),
    ).toBe(order);
  });

  it('returns the same order when disabling', () => {
    const order = ['goal-why', 'market'];
    expect(
      applyHomeWidgetVisibilityChange({ id: 'market', value: false, order }),
    ).toBe(order);
  });
});

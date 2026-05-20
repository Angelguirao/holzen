import { describe, expect, it } from 'vitest';
import { applyHomeWidgetVisibilityChange } from './apply-home-widget-visibility-change';

describe('applyHomeWidgetVisibilityChange', () => {
  it('appends id to order when enabling a widget not yet in order', () => {
    expect(
      applyHomeWidgetVisibilityChange({
        id: 'quick-capture',
        value: true,
        order: ['goal-why', 'market'],
      }),
    ).toEqual(['goal-why', 'market', 'quick-capture']);
  });

  it('leaves order unchanged when disabling or id already present', () => {
    const order = ['goal-why', 'quick-capture'];
    expect(
      applyHomeWidgetVisibilityChange({ id: 'quick-capture', value: true, order }),
    ).toBe(order);
    expect(
      applyHomeWidgetVisibilityChange({ id: 'night', value: false, order }),
    ).toBe(order);
  });
});

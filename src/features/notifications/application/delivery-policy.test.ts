import { describe, expect, it } from 'vitest';
import { buildPauseOfferNotifyIntent, channelsForPauseOffer } from './delivery-policy';

describe('channelsForPauseOffer', () => {
  it('always includes inbox', () => {
    expect(channelsForPauseOffer({ emailNotifications: false })).toEqual(['inbox']);
  });

  it('adds email and push when enabled', () => {
    expect(
      channelsForPauseOffer({ emailNotifications: true, pushSubscribedOnDevice: true }),
    ).toEqual(['inbox', 'email', 'push']);
  });
});

describe('buildPauseOfferNotifyIntent', () => {
  it('builds pause kind with instance id', () => {
    expect(
      buildPauseOfferNotifyIntent('user-1', 'pause-1', {
        emailNotifications: true,
        pushSubscribedOnDevice: false,
      }),
    ).toEqual({
      userId: 'user-1',
      kind: 'pause',
      channels: ['inbox', 'email'],
      pauseInstanceId: 'pause-1',
    });
  });
});

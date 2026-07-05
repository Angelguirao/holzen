import { describe, expect, it } from 'vitest';
import { buildPauseOfferNotifyIntent, channelsForPauseOffer } from './pause-offer-policy';

describe('channelsForPauseOffer', () => {
  it('always includes inbox and email', () => {
    expect(channelsForPauseOffer({})).toEqual(['inbox', 'email']);
  });

  it('adds push when device is subscribed', () => {
    expect(channelsForPauseOffer({ pushSubscribedOnDevice: true })).toEqual([
      'inbox',
      'email',
      'push',
    ]);
  });
});

describe('buildPauseOfferNotifyIntent', () => {
  it('builds intent with pause instance id', () => {
    expect(
      buildPauseOfferNotifyIntent('user-1', 'pause-1', {
        pushSubscribedOnDevice: true,
      }),
    ).toEqual({
      userId: 'user-1',
      kind: 'pause',
      channels: ['inbox', 'email', 'push'],
      pauseInstanceId: 'pause-1',
    });
  });
});

import { describe, expect, it } from 'vitest';

import * as cluster from './pause-session-providers-cluster';

describe('pause-session-providers-cluster', () => {
  it('exports no runtime bindings (application session providers CI cluster marker)', () => {
    expect(Object.keys(cluster)).toEqual([]);
  });
});

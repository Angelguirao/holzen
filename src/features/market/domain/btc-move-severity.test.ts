import { describe, expect, it } from 'vitest';
import { severityFromBtcChangePercent } from './btc-move-severity';

describe('severityFromBtcChangePercent', () => {
  it('uses whole percentage points, not tenths, for band thresholds', () => {
    expect(severityFromBtcChangePercent(4.9)).toBe('mild');
    expect(severityFromBtcChangePercent(5.0)).toBe('moderate');
    expect(severityFromBtcChangePercent(5.1)).toBe('moderate');
    expect(severityFromBtcChangePercent(9.9)).toBe('moderate');
    expect(severityFromBtcChangePercent(10.0)).toBe('high');
  });

  it('does not flip severity on 0.1-point noise below the next integer', () => {
    expect(severityFromBtcChangePercent(4.91)).toBe('mild');
    expect(severityFromBtcChangePercent(4.99)).toBe('mild');
    expect(severityFromBtcChangePercent(9.91)).toBe('moderate');
  });
});

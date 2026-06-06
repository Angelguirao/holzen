import { describe, expect, it } from 'vitest';
import { severityFromMarketChangePercent } from './market-move-severity';

describe('severityFromMarketChangePercent', () => {
  it('maps absolute 24h move to severity bands', () => {
    expect(severityFromMarketChangePercent(4.9)).toBe('mild');
    expect(severityFromMarketChangePercent(5.0)).toBe('moderate');
    expect(severityFromMarketChangePercent(5.1)).toBe('moderate');
    expect(severityFromMarketChangePercent(9.9)).toBe('moderate');
    expect(severityFromMarketChangePercent(10.0)).toBe('high');
  });

  it('uses truncated whole percent points', () => {
    expect(severityFromMarketChangePercent(4.91)).toBe('mild');
    expect(severityFromMarketChangePercent(4.99)).toBe('mild');
    expect(severityFromMarketChangePercent(9.91)).toBe('moderate');
  });
});

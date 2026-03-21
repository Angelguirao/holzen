/**
 * Tests for the shared quality gate logic used by all companion edge functions.
 * 
 * These test the pure functions from supabase/functions/_shared/quality.ts
 * (imported via relative path since they have no Deno dependencies).
 */
import { describe, it, expect } from 'vitest';

// Import directly from the shared module (no Deno deps in these functions)
import {
  containsSlop,
  qualityGate,
  isValidUrl,
  normalizeUrl,
  normalizeTitle,
  contentFingerprint,
  contentFingerprintSync,
  BANNED_PHRASES,
} from '../../supabase/functions/_shared/quality';

describe('containsSlop', () => {
  it('detects banned phrases', () => {
    expect(containsSlop('Let\'s dive into Bitcoin philosophy')).toBe(true);
    expect(containsSlop('This is a game-changer for holders')).toBe(true);
    expect(containsSlop('At the end of the day, Bitcoin endures')).toBe(true);
    expect(containsSlop('In the world of cryptocurrency')).toBe(true);
  });

  it('passes clean text', () => {
    expect(containsSlop('Bitcoin teaches patience through proof of work')).toBe(false);
    expect(containsSlop('Sound money extends the planning horizon of civilization')).toBe(false);
    expect(containsSlop('')).toBe(false);
  });

  it('is case insensitive', () => {
    expect(containsSlop('DIVE INTO the meaning of Bitcoin')).toBe(true);
    expect(containsSlop('This Is A Game-Changer')).toBe(true);
  });

  it('handles null/undefined gracefully', () => {
    expect(containsSlop(null as any)).toBe(false);
    expect(containsSlop(undefined as any)).toBe(false);
  });
});

describe('qualityGate - signal', () => {
  const validSignal = {
    title: 'Proof of work is proof of sacrifice',
    body: 'Gigi argues that Bitcoin\'s proof-of-work mechanism mirrors a universal truth: nothing of value comes without cost. The energy expended isn\'t wasted — it\'s transformed into trust.',
    source: 'Gigi — 21 Lessons',
    url: 'https://21lessons.com/',
  };

  it('passes valid signal content', () => {
    const result = qualityGate('signal', validSignal);
    expect(result.pass).toBe(true);
  });

  it('rejects null content', () => {
    expect(qualityGate('signal', null).pass).toBe(false);
    expect(qualityGate('signal', null).reason).toBe('null_or_invalid');
  });

  it('rejects missing title', () => {
    const result = qualityGate('signal', { ...validSignal, title: '' });
    expect(result.pass).toBe(false);
    expect(result.reason).toContain('title');
  });

  it('rejects missing source', () => {
    const result = qualityGate('signal', { ...validSignal, source: '' });
    expect(result.pass).toBe(false);
    expect(result.reason).toBe('missing_source');
  });

  it('rejects body too short', () => {
    const result = qualityGate('signal', { ...validSignal, body: 'Too short.' });
    expect(result.pass).toBe(false);
    expect(result.reason).toBe('body_too_short');
  });

  it('rejects body too long', () => {
    const result = qualityGate('signal', { ...validSignal, body: 'x'.repeat(601) });
    expect(result.pass).toBe(false);
    expect(result.reason).toBe('body_too_long');
  });

  it('rejects body with slop', () => {
    const result = qualityGate('signal', {
      ...validSignal,
      body: 'Let\'s dive into why Bitcoin is revolutionary and unprecedented as a game-changer in the world of finance. This is truly something.',
    });
    expect(result.pass).toBe(false);
    expect(result.reason).toBe('body_contains_slop');
  });

  it('rejects title with slop', () => {
    const result = qualityGate('signal', {
      ...validSignal,
      title: 'A revolutionary paradigm shift in money',
    });
    expect(result.pass).toBe(false);
    expect(result.reason).toBe('title_contains_slop');
  });

  it('rejects market data in body', () => {
    const result = qualityGate('signal', {
      ...validSignal,
      body: 'Bitcoin rose 25% this quarter, hitting $100,000. This is a significant milestone in the history of monetary evolution that signals real adoption.',
    });
    expect(result.pass).toBe(false);
    expect(result.reason).toBe('body_contains_market_data');
  });

  it('rejects title with too many words', () => {
    const result = qualityGate('signal', {
      ...validSignal,
      title: 'This is a very very very very very very very very very very very very very very long title that has too many words',
    });
    expect(result.pass).toBe(false);
    expect(result.reason).toBe('title_too_many_words');
  });
});

describe('qualityGate - ground_nudge', () => {
  const validNudge = {
    title: 'Loss aversion doubles the sting of dropping prices',
    body: 'Kahneman and Tversky\'s 1979 prospect theory study showed that losses feel roughly twice as painful as equivalent gains feel good. When BTC drops 5%, your brain processes it as if you lost 10%.',
    citation: 'Kahneman & Tversky (1979)',
    url: 'https://scholar.google.com/scholar?q=kahneman',
  };

  it('passes valid grounding nudge', () => {
    expect(qualityGate('ground_nudge', validNudge).pass).toBe(true);
  });

  it('allows market data in grounding (unlike signal)', () => {
    const result = qualityGate('ground_nudge', {
      ...validNudge,
      body: 'Studies show that when assets drop 15%, panic selling increases by 300%. This is a well-documented phenomenon in behavioral finance research.',
    });
    expect(result.pass).toBe(true);
  });
});

describe('qualityGate - historical_insight', () => {
  const validInsight = {
    title: 'When gold crashed 26% in 2013',
    btcInsight: 'Between April 12-15, 2013, gold plummeted from $1,560 to $1,321 per ounce — a 26% crash in three days. Panic sellers locked in generational losses.',
    analogy: 'Bitcoin has experienced five drawdowns of 70%+ in its history.',
    assetClass: 'Gold',
    period: 'April 2013',
  };

  it('passes valid historical insight', () => {
    expect(qualityGate('historical_insight', validInsight).pass).toBe(true);
  });

  it('rejects missing btcInsight', () => {
    const result = qualityGate('historical_insight', { ...validInsight, btcInsight: '' });
    expect(result.pass).toBe(false);
    expect(result.reason).toBe('missing_btcInsight');
  });
});

describe('qualityGate - zoom_out_deep_time', () => {
  const validDeepTime = {
    title: 'Fifteen years in five thousand',
    body: 'Humans have used money for roughly 5,000 years. Bitcoin is 15 years old. You\'re watching the first chapter of a new monetary epoch being written.',
  };

  it('passes valid deep time content', () => {
    expect(qualityGate('zoom_out_deep_time', validDeepTime).pass).toBe(true);
  });

  it('rejects title with too few words', () => {
    const result = qualityGate('zoom_out_deep_time', { ...validDeepTime, title: 'Short' });
    expect(result.pass).toBe(false);
  });

  it('rejects market data in deep time', () => {
    const result = qualityGate('zoom_out_deep_time', {
      ...validDeepTime,
      body: 'Bitcoin rose 25% this quarter to $100,000, making it the best performing asset. This represents a fundamental shift in monetary history.',
    });
    expect(result.pass).toBe(false);
    expect(result.reason).toBe('body_contains_market_data');
  });
});

describe('qualityGate - unknown type', () => {
  it('passes content with title or body for unknown types', () => {
    expect(qualityGate('unknown_type', { title: 'Some title' }).pass).toBe(true);
    expect(qualityGate('unknown_type', { body: 'Some body' }).pass).toBe(true);
  });

  it('rejects content without title or body for unknown types', () => {
    expect(qualityGate('unknown_type', { foo: 'bar' }).pass).toBe(false);
  });
});

describe('isValidUrl', () => {
  it('accepts valid URLs', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
    expect(isValidUrl('http://example.com/path')).toBe(true);
    expect(isValidUrl('https://scholar.google.com/scholar?q=test')).toBe(true);
  });

  it('rejects invalid URLs', () => {
    expect(isValidUrl('')).toBe(false);
    expect(isValidUrl('N/A')).toBe(false);
    expect(isValidUrl('short')).toBe(false);
    expect(isValidUrl('not a url at all')).toBe(false);
  });

  it('normalizes URLs without protocol', () => {
    expect(isValidUrl('example.com/path')).toBe(true);
  });
});

describe('normalizeUrl', () => {
  it('adds https:// prefix when missing', () => {
    expect(normalizeUrl('example.com')).toBe('https://example.com');
    expect(normalizeUrl('scholar.google.com/path')).toBe('https://scholar.google.com/path');
  });

  it('preserves existing protocol', () => {
    expect(normalizeUrl('https://example.com')).toBe('https://example.com');
    expect(normalizeUrl('http://example.com')).toBe('http://example.com');
  });

  it('handles empty strings', () => {
    expect(normalizeUrl('')).toBe('');
  });
});

describe('normalizeTitle', () => {
  it('lowercases and strips non-alphanumeric', () => {
    expect(normalizeTitle('Proof of Work — Is It Worth It?')).toBe('proof of work  is it worth it');
    expect(normalizeTitle("Sound Money's Promise")).toBe('sound moneys promise');
  });

  it('trims whitespace', () => {
    expect(normalizeTitle('  hello world  ')).toBe('hello world');
  });
});

describe('BANNED_PHRASES', () => {
  it('contains expected phrases', () => {
    expect(BANNED_PHRASES).toContain('dive into');
    expect(BANNED_PHRASES).toContain('game-changer');
    expect(BANNED_PHRASES).toContain('paradigm shift');
    expect(BANNED_PHRASES).toContain('at the end of the day');
  });

  it('has a reasonable number of phrases', () => {
    expect(BANNED_PHRASES.length).toBeGreaterThan(10);
    expect(BANNED_PHRASES.length).toBeLessThan(100);
  });
});

describe('contentFingerprint', () => {
  it('returns a 32-char hex string', async () => {
    const fp = await contentFingerprint('proof of work is proof of sacrifice');
    expect(fp).toMatch(/^[0-9a-f]{32}$/);
    expect(fp.length).toBe(32);
  });

  it('is deterministic', async () => {
    const fp1 = await contentFingerprint('sound money');
    const fp2 = await contentFingerprint('sound money');
    expect(fp1).toBe(fp2);
  });

  it('produces different hashes for different inputs', async () => {
    const fp1 = await contentFingerprint('bitcoin philosophy');
    const fp2 = await contentFingerprint('ethereum philosophy');
    expect(fp1).not.toBe(fp2);
  });
});

describe('contentFingerprintSync', () => {
  it('returns a 32-char hex string', () => {
    const fp = contentFingerprintSync('proof of work is proof of sacrifice');
    expect(fp).toMatch(/^[0-9a-f]{32}$/);
    expect(fp.length).toBe(32);
  });

  it('is deterministic', () => {
    const fp1 = contentFingerprintSync('sound money');
    const fp2 = contentFingerprintSync('sound money');
    expect(fp1).toBe(fp2);
  });

  it('produces different hashes for different inputs', () => {
    const fp1 = contentFingerprintSync('bitcoin philosophy');
    const fp2 = contentFingerprintSync('ethereum philosophy');
    expect(fp1).not.toBe(fp2);
  });
});

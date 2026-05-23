/**
 * Deterministic daily hero quote on Home (UTC calendar day + stable user id).
 */

export function utcYmd(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/** FNV-1a 32-bit */
function fnv1a32(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Index 0..9 into {@link HERO_QUOTE_LINE_KEY_GROUPS}. */
export function heroQuoteIndexForDay(userId: string | undefined, ymd: string): number {
  return fnv1a32(`${userId ?? 'anon'}|${ymd}`) % 10;
}

/** i18n key groups: one string per line, shown top-to-bottom. */
export const HERO_QUOTE_LINE_KEY_GROUPS: readonly (readonly string[])[] = [
  ['home.heroQuote.direct.q1'],
  ['home.heroQuote.direct.q2'],
  ['home.heroQuote.direct.q3'],
  ['home.heroQuote.direct.q4'],
  ['home.heroQuote.direct.q5'],
  ['home.heroQuote.behavioral.q1'],
  ['home.heroQuote.behavioral.q2'],
  ['home.heroQuote.behavioral.q3a', 'home.heroQuote.behavioral.q3b'],
  ['home.heroQuote.behavioral.q4'],
  ['home.heroQuote.behavioral.q5'],
] as const;

/**
 * Crude char → read-time estimator shared by `ReadTime` and its tests.
 *
 * Assumes ~5 chars/word and ~200 wpm (typical mindful-prose pace), so
 * one word takes ~300 ms and one char ~60 ms.
 *
 * Buckets:
 *   < 150 chars  -> "a glance" (~15s)
 *   < 500 chars  -> "~30 s read"
 *   < 1200 chars -> "~90 s read"
 *   otherwise    -> "~<N> min read" (ceil to minute, floor at 2)
 *
 * Lives in its own file so the unit test can import it without pulling in
 * React (keeps the test cheap and avoids the Fast-Refresh complaint about
 * files that export both components and helpers).
 */
export function estimateReadTime(chars: number): {
  kind: 'glance' | 'thirty' | 'ninety' | 'minutes';
  minutes?: number;
} {
  if (!chars || chars < 150) return { kind: 'glance' };
  if (chars < 500) return { kind: 'thirty' };
  if (chars < 1200) return { kind: 'ninety' };
  const minutes = Math.max(2, Math.ceil(chars / 60 / 60));
  return { kind: 'minutes', minutes };
}

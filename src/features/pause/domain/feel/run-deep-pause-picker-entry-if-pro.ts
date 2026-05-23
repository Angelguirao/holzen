/** Pro gate for depth picker → deep ritual; returns whether deep entry ran. */
export function runDeepPausePickerEntryIfPro(
  requirePro: (feature: 'deep_pause') => boolean,
  onDeep: () => void,
): boolean {
  if (!requirePro('deep_pause')) return false;
  onDeep();
  return true;
}

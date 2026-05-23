/** Market severity input for `holzen-reflect` (absolute BTC change %). */
export function resolveReflectGenerationSeverityAbsPct(
  changePercent: number | null | undefined,
): number {
  return Math.abs(changePercent ?? 0);
}

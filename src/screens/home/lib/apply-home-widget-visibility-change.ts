/**
 * When enabling an optional widget, append it to layout order if missing.
 * Always-visible sections ignore visibility toggles (caller checks first).
 */
export function applyHomeWidgetVisibilityChange(args: {
  id: string;
  value: boolean;
  order: string[];
}): string[] {
  const { id, value, order } = args;
  if (value && !order.includes(id)) {
    return [...order, id];
  }
  return order;
}

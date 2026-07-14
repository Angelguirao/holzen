/**
 * Nox Components file key — for docs and scripts only.
 * Code Connect `.figma.tsx` files must use full literal Figma URLs (CLI parser requirement).
 *
 * @see docs/design/code-connect.md
 */
export const NOX_COMPONENTS_FILE_KEY = "5CTApv6IlReBfdB0YS6zxq";

/** Build a design URL; do not pass the result into figma.connect() — use string literals there. */
export function noxComponentUrl(nodeId: string): string {
  const dashed = nodeId.replace(":", "-");
  return `https://www.figma.com/design/${NOX_COMPONENTS_FILE_KEY}/Nox-Components?node-id=${dashed}`;
}

/** Known component-set node ids (from docs/design/nox/components/README.md). */
export const NOX_COMPONENT_NODES = {
  button: "23:432",
  textField: "111:67",
  tag: "203:193",
  loadingSpinner: "71:434",
  processStepper: "61:217",
} as const;

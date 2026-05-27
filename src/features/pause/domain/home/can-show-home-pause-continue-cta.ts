/** Continue + Discard (Figma C) only after deep ritual reaches Reflect. */
export function canShowHomePauseContinueCta(input: {
  hasReachedReflect: boolean;
  isBriefRitual: boolean;
}): boolean {
  return input.hasReachedReflect && !input.isBriefRitual;
}

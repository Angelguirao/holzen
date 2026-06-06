/** Canonical motivation chip ids stored on `profiles.motivations`. */
export const PROFILE_MOTIVATION_IDS = [
  'freedom',
  'family',
  'generational',
  'discipline',
  'conviction',
  'sovereignty',
  'inflation',
  'curiosity',
] as const;

export type ProfileMotivationId = (typeof PROFILE_MOTIVATION_IDS)[number];

/** Home anchor / onboarding mantra limit (Wireframes 532:33580). */
export const ANCHOR_MANTRA_MAX_LENGTH = 80;

export function isProfileMotivationId(value: string): value is ProfileMotivationId {
  return (PROFILE_MOTIVATION_IDS as readonly string[]).includes(value);
}

export function hasMinimumMotivations(motivations: readonly string[]): boolean {
  return motivations.length >= 1;
}

export function formatMotivationLine(
  motivations: readonly string[],
  label: (id: ProfileMotivationId) => string,
): string {
  return motivations
    .filter(isProfileMotivationId)
    .map((id) => label(id))
    .join(' \u00B7 ');
}

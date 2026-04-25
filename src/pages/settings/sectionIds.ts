export const SETTINGS_SECTION_IDS = [
  'you',
  'reflection',
  'experience',
  'companions',
  'notifications',
  'subscription',
  'account',
] as const;

export type SettingsSectionId = (typeof SETTINGS_SECTION_IDS)[number];

export function isSettingsSectionId(s: string | undefined): s is SettingsSectionId {
  return s !== undefined && (SETTINGS_SECTION_IDS as readonly string[]).includes(s);
}

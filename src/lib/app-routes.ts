import type { ProfileTab } from '@/lib/router-location-state';

/** Authenticated “Journey” hub (stats, insights, badges, activity). */
export const JOURNEY_PREFIX = '/journey';

/** In-app tools hub in the shell; immersive `/tools/...` routes are full-screen (no bottom nav). */
export const TOOLS_PREFIX = '/tools';

/**
 * Instance-scoped companion flows (orchestrated from `/pause`). Not under `/tools/*`;
 * that namespace is for regulation / practice / letters.
 */
export const COMPANION_PREFIX = '/companion' as const;

/** Build a bookmarkable Journey URL. */
export function journeyPath(tab: ProfileTab): string {
  return `${JOURNEY_PREFIX}/${tab}`;
}

/** Full-screen in shell: letters to future self; optional `letter` for notification deep link. */
export function toolsLettersPath(opts?: { letterId?: string }): string {
  if (opts?.letterId) {
    return `${TOOLS.letters}?letter=${encodeURIComponent(opts.letterId)}`;
  }
  return TOOLS.letters;
}

/** Immersive regulation / practice tools (single namespace). */
export const TOOLS = {
  hub: '/tools',
  letters: '/tools/letters',
  breathe: '/tools/breathe',
  ground: '/tools/ground',
  groundHistory: '/tools/ground/history',
  ambient: '/tools/ambient',
  practice: {
    checkin: '/tools/practice/checkin',
    journal: '/tools/practice/journal',
    bodyscan: '/tools/practice/bodyscan',
    replay: '/tools/practice/replay',
  },
} as const;

export function isProfileTab(s: string | undefined): s is ProfileTab {
  return s === 'stats' || s === 'insights' || s === 'badges' || s === 'activity';
}

/**
 * Shallow “section” path for settings (serves shareable URL → `/settings` + hash in-app).
 * Valid ids: you, reflection, experience, companions, notifications, subscription, account.
 */
export function settingsSectionPath(section: string): string {
  return `/settings/section/${encodeURIComponent(section)}`;
}

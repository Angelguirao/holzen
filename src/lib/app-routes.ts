import type { ProfileTab } from '@/lib/router-location-state';

/** Authenticated “Journey” hub (stats, insights, badges, letters, activity). */
export const JOURNEY_PREFIX = '/journey';

/** In-app tools hub in the shell; immersive `/tools/...` routes are full-screen (no bottom nav). */
export const TOOLS_PREFIX = '/tools';

/** Build a bookmarkable Journey URL; optional `letter` opens that letter on the letters tab. */
export function journeyPath(tab: ProfileTab, opts?: { letterId?: string }): string {
  const path = `${JOURNEY_PREFIX}/${tab}`;
  if (opts?.letterId) {
    return `${path}?letter=${encodeURIComponent(opts.letterId)}`;
  }
  return path;
}

/** Immersive regulation / practice tools (single namespace). */
export const TOOLS = {
  hub: '/tools',
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
  return (
    s === 'stats' ||
    s === 'insights' ||
    s === 'badges' ||
    s === 'letters' ||
    s === 'activity'
  );
}

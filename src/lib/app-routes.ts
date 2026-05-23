/** Authenticated Journey overview (shipped shell — no tab subpaths). */
export const JOURNEY_PREFIX = '/journey' as const;

/** Shipped primary shell tabs (order matches BottomNav). */
export const APP_SHELL_TABS = [
  { to: '/', key: 'home' },
  { to: '/archive', key: 'archive' },
  { to: JOURNEY_PREFIX, key: 'journey' },
  { to: '/settings', key: 'settings' },
] as const;

export type AppShellTabKey = (typeof APP_SHELL_TABS)[number]['key'];

/** True for primary bottom-nav destinations (incl. `/settings/*` subpaths). */
export function isAppShellPath(pathname: string): boolean {
  if (pathname === '/' || pathname === '/index') return true;
  if (pathname === '/archive' || pathname.startsWith('/archive/')) return true;
  if (pathname === JOURNEY_PREFIX) return true;
  if (pathname === '/settings' || pathname.startsWith('/settings/')) return true;
  return false;
}

/** Registered authenticated shell paths (404 for anything else). */
export const APP_SHELL_ROUTES = ['/', '/archive', JOURNEY_PREFIX, '/settings'] as const;

/** Shipped full-view companion routes (`App.tsx`). */
export function companionHistoryPath(pauseInstanceId: string): string {
  return `/companion/history/${encodeURIComponent(pauseInstanceId)}`;
}

export function companionZoomOutPath(pauseInstanceId: string): string {
  return `/companion/zoom-out/${encodeURIComponent(pauseInstanceId)}`;
}

/**
 * Bookmarkable settings section URL (`/settings/<id>`).
 * Valid ids: you, companions, notifications, subscription, account.
 */
export function settingsSectionPath(section: string): string {
  return `/settings/${encodeURIComponent(section)}`;
}

/** @deprecated Full-IA tools namespace — not registered in shipped router; reference/legacy only. */
export const TOOLS_PREFIX = '/tools';

/** @deprecated Full-IA companion/tools helpers — legacy imports until Step 3 move. */
export const TOOLS = {
  hub: '/tools',
  letters: '/tools/letters',
  breathe: '/tools/breathe',
  ground: '/tools/ground',
  groundHistory: '/tools/ground/history',
  practice: {
    checkin: '/tools/practice/checkin',
    journal: '/tools/practice/journal',
    bodyscan: '/tools/practice/bodyscan',
    replay: '/tools/practice/replay',
  },
} as const;

/** @deprecated Use `/journey` — full-IA tab paths are not registered. */
export function journeyPath(_tab: 'stats' | 'insights' | 'badges' | 'activity'): string {
  return JOURNEY_PREFIX;
}

/** @deprecated Full-IA tools letters deep link. */
export function toolsLettersPath(opts?: { letterId?: string }): string {
  if (opts?.letterId) {
    return `${TOOLS.letters}?letter=${encodeURIComponent(opts.letterId)}`;
  }
  return TOOLS.letters;
}

/** @deprecated Full-IA Profile tab guard. */
export function isProfileTab(_s: string | undefined): _s is 'stats' | 'insights' | 'badges' | 'activity' {
  return false;
}

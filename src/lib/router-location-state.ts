import type { CompanionData, CompanionPrefs } from '@/components/CompanionSection';

/** Severity passed with pause navigation (Home, hook-aligned data). */
export type PauseSeverity = 'mild' | 'moderate' | 'high';

const PAUSE_SEVERITIES: readonly PauseSeverity[] = ['mild', 'moderate', 'high'];

/** Payload for `navigate('/pause', { state })` — all fields optional at the wire. */
export interface PauseSessionLocationState {
  /** Legacy reflection id — retained while the client rewrite is in flight. */
  reflectionId?: string;
  /** Pause V2 instance id. Set by Bell + Library current-pause card. */
  pauseInstanceId?: string;
  reflectionMessage?: string;
  context?: string | null;
  companions?: CompanionData;
  companionPrefs?: CompanionPrefs;
  severity?: PauseSeverity;
}

export interface PauseSessionNavParsed {
  reflectionId: string | null;
  pauseInstanceId: string | null;
  reflectionMessage: string;
  context: string | null;
  companions: CompanionData | undefined;
  companionPrefs: CompanionPrefs | undefined;
  severity: PauseSeverity | undefined;
}

function isCompanionData(v: unknown): v is CompanionData {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  const strOrNull = (x: unknown) => x === null || typeof x === 'string';
  return strOrNull(o.haiku) && strOrNull(o.groundingTitle) && strOrNull(o.groundingBody);
}

function isCompanionPrefs(v: unknown): v is CompanionPrefs {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.breathing === 'boolean' &&
    typeof o.haiku === 'boolean' &&
    typeof o.grounding === 'boolean' &&
    typeof o.signal === 'boolean' &&
    typeof o.zoomOut === 'boolean' &&
    typeof o.history === 'boolean'
  );
}

export function parsePauseSessionLocationState(state: unknown): PauseSessionNavParsed {
  const empty: PauseSessionNavParsed = {
    reflectionId: null,
    pauseInstanceId: null,
    reflectionMessage: '',
    context: null,
    companions: undefined,
    companionPrefs: undefined,
    severity: undefined,
  };
  if (!state || typeof state !== 'object') return empty;
  const o = state as Record<string, unknown>;

  const reflectionId = typeof o.reflectionId === 'string' ? o.reflectionId : null;
  const pauseInstanceId =
    typeof o.pauseInstanceId === 'string' ? o.pauseInstanceId : null;
  const reflectionMessage =
    typeof o.reflectionMessage === 'string' ? o.reflectionMessage.trim() : '';
  const context = typeof o.context === 'string' ? o.context : null;
  const companions = isCompanionData(o.companions) ? o.companions : undefined;
  const companionPrefs = isCompanionPrefs(o.companionPrefs) ? o.companionPrefs : undefined;
  const sev = o.severity;
  const severity =
    typeof sev === 'string' && (PAUSE_SEVERITIES as readonly string[]).includes(sev)
      ? (sev as PauseSeverity)
      : undefined;

  return {
    reflectionId,
    pauseInstanceId,
    reflectionMessage,
    context,
    companions,
    companionPrefs,
    severity,
  };
}

/** Pre-generated grounding card from Home → `/ground`. */
export interface GroundPreGenerated {
  activity: string;
  suggestion: string;
  duration: number;
  insight: string | null;
  article: { snippet: string; url: string | null } | null;
}

export interface GroundLocationState {
  preGenerated?: GroundPreGenerated;
}

function isGroundArticle(v: unknown): v is { snippet: string; url: string | null } {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return typeof o.snippet === 'string' && (o.url === null || typeof o.url === 'string');
}

export function parseGroundLocationState(state: unknown): GroundLocationState {
  if (!state || typeof state !== 'object') return {};
  const o = state as Record<string, unknown>;
  const pg = o.preGenerated;
  if (!pg || typeof pg !== 'object') return {};
  const p = pg as Record<string, unknown>;
  if (typeof p.activity !== 'string' || typeof p.suggestion !== 'string') return {};
  const duration = typeof p.duration === 'number' && Number.isFinite(p.duration) ? p.duration : 10;
  const insight: string | null = typeof p.insight === 'string' ? p.insight : null;
  let article: GroundPreGenerated['article'] = null;
  if (p.article === null) article = null;
  else if (isGroundArticle(p.article)) article = p.article;

  return {
    preGenerated: {
      activity: p.activity,
      suggestion: p.suggestion,
      duration,
      insight,
      article,
    },
  };
}

export const PROFILE_TAB_IDS = ['stats', 'insights', 'badges', 'letters', 'activity'] as const;
export type ProfileTab = (typeof PROFILE_TAB_IDS)[number];

export interface ProfileLocationState {
  tab?: ProfileTab;
  letterId?: string;
}

export function parseProfileLocationState(state: unknown): ProfileLocationState {
  if (!state || typeof state !== 'object') return {};
  const o = state as Record<string, unknown>;
  const tab = o.tab;
  const letterId = o.letterId;
  return {
    tab:
      typeof tab === 'string' && (PROFILE_TAB_IDS as readonly string[]).includes(tab)
        ? (tab as ProfileTab)
        : undefined,
    letterId: typeof letterId === 'string' ? letterId : undefined,
  };
}

/** Router state passed from notification actions (profile + pause deep links). */
export type NotificationNavigateState = ProfileLocationState | PauseSessionLocationState;

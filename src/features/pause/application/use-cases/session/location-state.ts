import type { CompanionData, CompanionPrefs } from '@/features/pause/domain/companion-card-types';

/** Severity passed with pause navigation (Home, hook-aligned data). */
export type PauseSeverity = 'mild' | 'moderate' | 'high';

const PAUSE_SEVERITIES: readonly PauseSeverity[] = ['mild', 'moderate', 'high'];

/** Payload for `navigate('/pause', { state })` — all fields optional at the wire. */
export interface PauseSessionLocationState {
  /** Pause V2 instance id. Set by Bell + Library current-pause card. */
  pauseInstanceId?: string;
  reflectionMessage?: string;
  context?: string | null;
  companions?: CompanionData;
  companionPrefs?: CompanionPrefs;
  severity?: PauseSeverity;
}

export interface PauseSessionNavParsed {
  pauseInstanceId: string | null;
  reflectionMessage: string;
  context: string | null;
  companions: CompanionData | undefined;
  companionPrefs: CompanionPrefs | undefined;
  severity: PauseSeverity | undefined;
}

/** Router state passed from notification actions (pause deep links use `action_state`). */
export type NotificationNavigateState = PauseSessionLocationState;

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
    pauseInstanceId: null,
    reflectionMessage: '',
    context: null,
    companions: undefined,
    companionPrefs: undefined,
    severity: undefined,
  };
  if (!state || typeof state !== 'object') return empty;
  const o = state as Record<string, unknown>;

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
    pauseInstanceId,
    reflectionMessage,
    context,
    companions,
    companionPrefs,
    severity,
  };
}

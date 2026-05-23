/** Legacy full-IA ground route state (`/tools/ground`). Shipped pause nav types: `@/features/pause/public`. */
/** Pre-generated grounding card from Home → `/tools/ground`. */
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

export const PROFILE_TAB_IDS = ['stats', 'insights', 'badges', 'activity'] as const;
export type ProfileTab = (typeof PROFILE_TAB_IDS)[number];

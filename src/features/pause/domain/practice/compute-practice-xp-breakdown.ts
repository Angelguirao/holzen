import { parseCompanionSlotFavoritesFromMetadata } from '@/features/pause/domain/companion/companion-slot-favorites-metadata';
import { pauseInstanceHasBriefRitualTag } from '@/features/pause/domain/pause-state';
import type { PauseStepType } from '@/features/pause/domain/pause-state';
import { volatilityV1RitualBeatsMet } from '@/features/pause/domain/pause-state';
import {
  PRACTICE_XP_BREATH_SECOND_BONUS,
  PRACTICE_XP_BRIEF_BASE,
  PRACTICE_XP_COMPANION_EACH,
  PRACTICE_XP_COMPANION_MAX,
  PRACTICE_XP_COMPANION_SLOT_FAVORITE_EACH,
  PRACTICE_XP_COMPANION_SLOT_FAVORITE_MAX,
  PRACTICE_XP_DEEP_BASE,
  PRACTICE_XP_FAVORITE_BONUS,
  PRACTICE_XP_NOTE_BONUS,
  PRACTICE_XP_SHIFT_MOOD_BONUS,
} from './practice-xp-constants';
import type { PracticeXpBySignal } from './practice-xp-by-signal';
import { EMPTY_PRACTICE_XP_BY_SIGNAL } from './practice-xp-by-signal';

export type PracticeXpStepEventRow = {
  pause_instance_id?: string;
  step_type: PauseStepType | string;
  payload?: Record<string, unknown> | null;
};

function payloadSkipped(payload: Record<string, unknown> | null | undefined): boolean {
  if (!payload) return false;
  const v = payload.skipped;
  if (v === true) return true;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    return s === 'true' || s === 't' || s === '1';
  }
  return false;
}

function breathSegment(payload: Record<string, unknown> | null | undefined): number {
  const raw = payload?.breath_segment;
  if (typeof raw === 'number' && raw >= 1 && raw <= 2) return raw;
  if (typeof raw === 'string' && raw !== '') {
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 1 && n <= 2) return n;
  }
  return 1;
}

function countCompanionSlotFavoriteXp(metadata: unknown): number {
  const bucket = parseCompanionSlotFavoritesFromMetadata(metadata);
  const n = Object.values(bucket).filter(Boolean).length;
  if (n <= 0) return 0;
  return Math.min(PRACTICE_XP_COMPANION_SLOT_FAVORITE_MAX, PRACTICE_XP_COMPANION_SLOT_FAVORITE_EACH * n);
}

/** Per-pause breakdown — parity with `pause_compute_practice_xp_breakdown`. */
export function computePracticeXpBreakdown(input: {
  instanceId: string;
  events: readonly PracticeXpStepEventRow[];
  engagedTools: number;
  instanceMetadata?: unknown;
}): PracticeXpBySignal {
  const { instanceId, events, engagedTools, instanceMetadata } = input;
  const out = { ...EMPTY_PRACTICE_XP_BY_SIGNAL };

  const scoped = events.filter((e) => !e.pause_instance_id || e.pause_instance_id === instanceId);
  const stepEvents = scoped.map((e) => ({
    pause_instance_id: instanceId,
    step_type: e.step_type as PauseStepType,
    created_at: '',
    payload: e.payload ?? undefined,
  }));

  if (!volatilityV1RitualBeatsMet(stepEvents, instanceId)) {
    return out;
  }

  const isBrief = pauseInstanceHasBriefRitualTag(stepEvents, instanceId);

  if (isBrief) {
    out.base_brief = PRACTICE_XP_BRIEF_BASE;
    return out;
  }

  out.base_deep = PRACTICE_XP_DEEP_BASE;

  let favorited = false;
  let noted = false;
  let shiftMood = false;
  let breathSecondComplete = false;

  for (const e of scoped) {
    switch (e.step_type) {
      case 'favorite_toggled': {
        const fav = e.payload?.is_favorite;
        if (fav === true || fav === 'true') favorited = true;
        break;
      }
      case 'note_updated': {
        const text = typeof e.payload?.text === 'string' ? e.payload.text.trim() : '';
        if (text.length > 0) noted = true;
        break;
      }
      case 'shift_emotion_logged': {
        const mood = typeof e.payload?.mood === 'string' ? e.payload.mood.trim() : '';
        const fromHub = e.payload?.from_frame_hub === true;
        if (mood !== '' && !fromHub) shiftMood = true;
        break;
      }
      case 'breath_completed': {
        if (breathSegment(e.payload ?? null) === 2 && !payloadSkipped(e.payload ?? null)) {
          breathSecondComplete = true;
        }
        break;
      }
      default:
        break;
    }
  }

  if (favorited) out.favorite = PRACTICE_XP_FAVORITE_BONUS;
  if (noted) out.note = PRACTICE_XP_NOTE_BONUS;
  if (engagedTools > 0) {
    out.companions = Math.min(PRACTICE_XP_COMPANION_MAX, PRACTICE_XP_COMPANION_EACH * engagedTools);
  }
  const slotFavXp = countCompanionSlotFavoriteXp(instanceMetadata);
  if (slotFavXp > 0) out.companion_favorites = slotFavXp;
  if (breathSecondComplete) out.breath_second = PRACTICE_XP_BREATH_SECOND_BONUS;
  if (shiftMood) out.shift_mood = PRACTICE_XP_SHIFT_MOOD_BONUS;

  return out;
}

export function sumPracticeXpBreakdown(signals: PracticeXpBySignal): number {
  return (
    signals.base_brief +
    signals.base_deep +
    signals.favorite +
    signals.note +
    signals.companions +
    signals.companion_favorites +
    signals.breath_second +
    signals.shift_mood
  );
}

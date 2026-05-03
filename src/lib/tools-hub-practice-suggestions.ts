import { TOOLS } from '@/lib/app-routes';
import type { PracticeSuggestion } from '@/lib/practice-suggestion';

/** Routes for hub practice suggestions (shared: Tools hub + Home pause empty). */
export const TOOLS_PRACTICE_SUGGESTION_ROUTE: Record<PracticeSuggestion['id'], string> = {
  checkin: TOOLS.practice.checkin,
  journal: TOOLS.practice.journal,
  bodyscan: TOOLS.practice.bodyscan,
  replay: TOOLS.practice.replay,
};

/** i18n keys for practice titles (same as ToolsGoodNextStepSection). */
export const TOOLS_PRACTICE_SUGGESTION_LABEL_KEY: Record<PracticeSuggestion['id'], string> = {
  checkin: 'practice.checkinLabel',
  journal: 'practice.journalLabel',
  bodyscan: 'practice.bodyscanLabel',
  replay: 'practice.replayLabel',
};

export function isToolsPracticeFree(id: PracticeSuggestion['id']): boolean {
  return id === 'checkin';
}

/** Same visibility filter as Tools hub “Good next step” practice cards. */
export function visibleToolsPracticeSuggestions(
  suggestions: PracticeSuggestion[],
  isPro: boolean,
): PracticeSuggestion[] {
  return suggestions.filter((s) => isToolsPracticeFree(s.id) || isPro);
}

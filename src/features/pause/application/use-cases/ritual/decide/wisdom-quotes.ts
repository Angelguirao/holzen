/**
 * CI cluster anchor for ritual decide session quotes (§3 / application imports).
 * Pure quote catalog lives in domain; re-export for application-layer imports.
 */
export {
  getSessionQuote,
  type WisdomQuote,
} from '@/features/pause/domain/decide/session-wisdom-quotes';

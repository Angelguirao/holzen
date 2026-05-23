/**
 * CI cluster anchor for ritual reflect mood — Feel-step presentation helpers (§3 / check:architecture-alignment).
 * Pure UI rollback/reset helpers live in domain; re-export for application-layer imports.
 */
export {
  initialEmotionResetUi,
  initialEmotionSelectRollbackUi,
} from '@/features/pause/domain/feel/initial-emotion-presentation';
export type { InitialEmotionUiState } from '@/features/pause/domain/feel/initial-emotion-presentation';

/**
 * Presentation I/O for `/pause` frame ritual hydration from `PersistedSession`.
 * Session restore hooks import here instead of deep `application/use-cases/ritual/frame/*`.
 */
export { initialFrameDoneFromRestored } from '@/features/pause/application/use-cases/session/pause-session-frame-flow';

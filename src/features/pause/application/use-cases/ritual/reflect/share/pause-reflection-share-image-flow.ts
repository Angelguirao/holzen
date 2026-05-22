/**
 * CI cluster anchor for ritual reflect share — PNG orchestration (§3).
 * Branded canvas render + native share/download for presentation I/O.
 * Presentation: `pause-reflect-share-io.ts` imports `run-reflection-share-image` directly (not this anchor).
 */
export type {
  DeliverReflectionShareImageDeps,
  DeliverReflectionShareImageOutcome,
} from './deliver-reflection-share-image';
export {
  deliverReflectionShareImage,
} from './deliver-reflection-share-image';
export { runReflectionShareImage } from './run-reflection-share-image';

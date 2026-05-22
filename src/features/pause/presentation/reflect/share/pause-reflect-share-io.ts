/**
 * Reflect share presentation I/O — plain-text/channel builders (domain) + PNG orchestration (application).
 * Imports domain builders and `run-reflection-share-image` directly (parity with
 * `pause-reflect-pending-offer-io` → leaf RPC/display modules).
 * Parity pins: `pause-reflect-share-io.test.ts` (hub-io reciprocal inline pins).
 * Sibling parity: `pause-reflect-hub-share-io-sibling-parity.test.ts` ↔ `pause-reflect-hub-io` (application
 * `application/.../hub/pause-reflect-hub-share-io-sibling-parity.test.ts`);
 * `pause-reflect-share-pending-offer-io-sibling-parity.test.ts` ↔ `pause-reflect-pending-offer-io` (application mirror:
 * `application/.../share/pause-reflect-share-pending-offer-io-sibling-parity.test.ts`; reciprocal inline:
 * `pause-reflect-share-io-parity.test.ts` ↔ `pause-reflect-pending-offer-io-parity.test.ts`);
 * `pause-reflect-share-steps-io-sibling-parity.test.ts` ↔ `pause-reflect-steps-io` (application mirror:
 * `application/.../share/pause-reflect-share-steps-io-sibling-parity.test.ts`; reciprocal inline:
 * `pause-reflect-share-io-parity.test.ts` ↔ `pause-reflect-steps-io-parity.test.ts` and
 * `pause-reflect-share-io.test.ts` ↔ `pause-reflect-steps-io.test.ts`);
 * `pause-reflect-share-telemetry-io-sibling-parity.test.ts` ↔ `pause-reflect-telemetry-io` (application mirror:
 * `application/.../share/pause-reflect-share-telemetry-io-sibling-parity.test.ts`; reciprocal inline:
 * `pause-reflect-share-io-parity.test.ts` ↔ `pause-reflect-telemetry-io-parity.test.ts`);
 * `pause-reflect-flows-share-io-sibling-parity.test.ts` ↔ `pause-reflect-flows-io` (application mirror under
 * `application/.../flows/`; reciprocal inline pins in colocated `pause-reflect-flows-io-parity.test.ts` ↔
 * `pause-reflect-share-io-parity.test.ts` and `pause-reflect-share-io.test.ts`), and
 * `pause-reflect-generation-share-io-sibling-parity.test.ts` ↔ `pause-reflect-generation-io`;
 * `pause-reflect-share-ambience-io-sibling-parity.test.ts` + `ambience/pause-reflect-ambience-share-io-sibling-parity.test.ts` ↔ `pause-reflect-ambience-io` (application mirrors:
 * `application/.../share/pause-reflect-share-ambience-io-sibling-parity.test.ts`,
 * `application/.../ambience/pause-reflect-ambience-share-io-sibling-parity.test.ts`);
 * `pause-reflect-share-mood-io-sibling-parity.test.ts` ↔ `pause-reflect-mood-io` (application mirror:
 * `application/.../share/pause-reflect-share-mood-io-sibling-parity.test.ts`);
 * reciprocal inline pins: `pause-reflect-share-io.test.ts` ↔ `pause-reflect-steps-io.test.ts`;
 * presentation `pause-reflect-share-io-parity.test.ts` (colocated) pins share-io ↔ share-orchestration-flow (no `deliverReflectionShareImage` on presentation I/O).
 */
import {
  runReflectionShareImage,
  type DeliverReflectionShareImageDeps,
} from '@/features/pause/application/use-cases/ritual/reflect/share/run-reflection-share-image';
import {
  buildReflectionShareTelegramUrl,
  buildReflectionShareTweetUrl,
  buildReflectionShareWhatsAppUrl,
} from '@/features/pause/domain/reflect/share/reflection-share-channel-urls';
import { buildReflectionShareText } from '@/features/pause/domain/reflect/share/reflection-share-text';

export {
  buildReflectionShareTelegramUrl,
  buildReflectionShareText,
  buildReflectionShareTweetUrl,
  buildReflectionShareWhatsAppUrl,
};

/** Branded PNG render + native share or download (browser APIs). */
export function pauseReflectionShareImage(
  message: string,
  context: string | null | undefined,
  haiku: string | null | undefined,
  deps?: DeliverReflectionShareImageDeps,
): ReturnType<typeof runReflectionShareImage> {
  return runReflectionShareImage(message, context, haiku, deps);
}

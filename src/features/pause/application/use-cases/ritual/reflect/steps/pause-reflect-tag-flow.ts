/**
 * CI cluster anchor for ritual reflect steps — tag update (§3).
 * Sibling pins: `pause-reflect-tag-flow.test.ts` ↔ `pause-reflect-note-flow.test.ts` (inline);
 * `pause-reflect-note-tag-flow-sibling-parity.test.ts` ↔ `pause-reflect-note-flow`;
 * `pause-reflect-steps-note-tag-flow-sibling-parity.test.ts` ↔ `pause-reflect-steps-flow`
 * (reciprocal inline pins in `pause-reflect-tag-flow.test.ts` ↔ `pause-reflect-steps-flow.test.ts`).
 * Presentation + application: `pause-reflect-steps-note-tag-io-sibling-parity.test.ts`.
 */
export { runPauseReflectTagUpdate } from './run-pause-reflect-tag-update';

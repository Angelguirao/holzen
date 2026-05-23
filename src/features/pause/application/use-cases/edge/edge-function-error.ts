/**
 * Pause bounded context facade over shared `@/lib/edge-function-error`.
 * Application use cases import from here — not `@/lib` directly.
 */
export {
  parseEdgeFunctionError,
  toUserFacingAiErrorMessage,
  type ParsedEdgeFunctionError,
} from '@/lib/edge-function-error';

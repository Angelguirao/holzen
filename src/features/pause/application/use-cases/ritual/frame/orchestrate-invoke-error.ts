import {
  parseEdgeFunctionError,
  toUserFacingAiErrorMessage,
} from '@/features/pause/application/use-cases/edge/edge-function-error';

export type CompanionOrchestratePaywallCode =
  | 'companions_quota_exceeded'
  | 'companions_upgrade_required';

export function isOrchestratePayloadError(
  fnError: unknown,
  body: Record<string, unknown> | null,
): boolean {
  return Boolean(fnError) || !body || Boolean(body.error);
}

export function isCompanionOrchestratePaywallCode(
  code: string | null,
): code is CompanionOrchestratePaywallCode {
  return code === 'companions_quota_exceeded' || code === 'companions_upgrade_required';
}

export type CompanionOrchestrateInvokeFailureKind = 'intervention' | 'lazy_fetch' | 'regenerate';

export interface CompanionOrchestrateInvokeFailure {
  kind: CompanionOrchestrateInvokeFailureKind;
  code: string | null;
  userMessage: string;
  isPaywall: boolean;
}

/** When non-null, the invoke returned an error payload the UI should handle. */
export async function resolveCompanionOrchestrateInvokeFailure(
  fnError: unknown,
  body: Record<string, unknown> | null,
  kind: CompanionOrchestrateInvokeFailureKind,
  fallbackMessage: string,
): Promise<CompanionOrchestrateInvokeFailure | null> {
  if (!isOrchestratePayloadError(fnError, body)) return null;
  const { code, userMessage } = await resolveOrchestrateInvokeUserMessage(
    fnError,
    body,
    fallbackMessage,
  );
  return {
    kind,
    code,
    userMessage,
    isPaywall: isCompanionOrchestratePaywallCode(code),
  };
}

export async function resolveOrchestrateInvokeUserMessage(
  fnError: unknown,
  body: Record<string, unknown> | null,
  fallbackMessage: string,
): Promise<{ code: string | null; userMessage: string }> {
  const parsedError = fnError
    ? await parseEdgeFunctionError(fnError)
    : { code: null, message: null, details: null };
  const code = typeof body?.code === 'string' ? body.code : parsedError.code;
  const userMessage = toUserFacingAiErrorMessage(
    {
      ...parsedError,
      message:
        typeof body?.error === 'string'
          ? body.error
          : parsedError.message ?? (fnError instanceof Error ? fnError.message : null),
    },
    fallbackMessage,
  );
  return { code, userMessage };
}

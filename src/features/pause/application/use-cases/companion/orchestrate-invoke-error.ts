import {
  parseEdgeFunctionError,
  toUserFacingAiErrorMessage,
} from '@/lib/edge-function-error';

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

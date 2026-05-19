import { describe, expect, it } from 'vitest';
import {
  isCompanionOrchestratePaywallCode,
  isOrchestratePayloadError,
  resolveOrchestrateInvokeUserMessage,
} from './orchestrate-invoke-error';

describe('isOrchestratePayloadError', () => {
  it('flags missing body', () => {
    expect(isOrchestratePayloadError(null, null)).toBe(true);
  });

  it('flags body.error string', () => {
    expect(isOrchestratePayloadError(null, { error: 'nope' })).toBe(true);
  });

  it('accepts success-shaped body', () => {
    expect(isOrchestratePayloadError(null, { signal: { data: {} } })).toBe(false);
  });
});

describe('isCompanionOrchestratePaywallCode', () => {
  it('recognizes companion paywall codes', () => {
    expect(isCompanionOrchestratePaywallCode('companions_quota_exceeded')).toBe(true);
    expect(isCompanionOrchestratePaywallCode('companions_upgrade_required')).toBe(true);
    expect(isCompanionOrchestratePaywallCode('rate_limited')).toBe(false);
  });
});

describe('resolveOrchestrateInvokeUserMessage', () => {
  it('prefers body.error string over fallback', async () => {
    const { code, userMessage } = await resolveOrchestrateInvokeUserMessage(
      null,
      { error: 'Quota hit', code: 'companions_quota_exceeded' },
      'fallback',
    );
    expect(code).toBe('companions_quota_exceeded');
    expect(userMessage).toBe('Quota hit');
  });
});

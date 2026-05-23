import { describe, expect, it, vi } from 'vitest';
import { loadCompanionOrchestrateSession } from './load-companion-orchestrate-session';

describe('loadCompanionOrchestrateSession', () => {
  it('returns null without pause instance id', async () => {
    const loadMoodHistory = vi.fn();
    await expect(
      loadCompanionOrchestrateSession(
        { pauseInstanceId: null, language: 'en' },
        { loadMoodHistory },
      ),
    ).resolves.toBeNull();
    expect(loadMoodHistory).not.toHaveBeenCalled();
  });

  it('loads mood history and builds session context', async () => {
    const result = await loadCompanionOrchestrateSession(
      {
        pauseInstanceId: 'pi-1',
        context: 'btc',
        language: 'en',
        reflectionMessage: 'steady',
        mood: 'anxious',
        severityNumber: 5,
      },
      {
        loadMoodHistory: vi.fn().mockResolvedValue([{ mood: 'calm' }]),
      },
    );

    expect(result).toEqual({
      pauseInstanceId: 'pi-1',
      context: 'btc',
      language: 'en',
      reflectionMessage: 'steady',
      mood: 'anxious',
      severity: 5,
      moodHistory: [{ mood: 'calm' }],
    });
  });
});

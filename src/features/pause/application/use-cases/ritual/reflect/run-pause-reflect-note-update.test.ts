import { describe, expect, it, vi } from 'vitest';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import { runPauseReflectNoteUpdate } from './run-pause-reflect-note-update';

describe('runPauseReflectNoteUpdate', () => {
  it('logs note_updated payload', async () => {
    const logStep = vi.fn().mockResolvedValue(null);
    const repository = { logStep } as unknown as PauseRepository;

    const result = await runPauseReflectNoteUpdate(repository, {
      pauseInstanceId: 'inst-1',
      text: 'hello',
    });

    expect(result).toEqual({ status: 'success' });
    expect(logStep).toHaveBeenCalledWith({
      instanceId: 'inst-1',
      stepType: 'note_updated',
      payload: { text: 'hello' },
    });
  });

  it('returns sync_failed when RPC throws', async () => {
    const logStep = vi.fn().mockRejectedValue(new Error('network'));
    const repository = { logStep } as unknown as PauseRepository;

    const result = await runPauseReflectNoteUpdate(repository, {
      pauseInstanceId: 'inst-1',
      text: 'x',
    });

    expect(result).toEqual({ status: 'sync_failed' });
  });
});

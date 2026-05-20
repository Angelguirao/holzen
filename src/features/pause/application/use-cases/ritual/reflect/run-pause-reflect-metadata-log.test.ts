import { describe, expect, it, vi } from 'vitest';
import { runPauseReflectNoteUpdate, runPauseReflectTagUpdate } from './run-pause-reflect-metadata-log';

describe('runPauseReflectNoteUpdate', () => {
  it('logs note_updated payload', async () => {
    const logStep = vi.fn().mockResolvedValue(undefined);

    const result = await runPauseReflectNoteUpdate(
      { pauseInstanceId: 'inst-1', text: 'hello' },
      { logStep },
    );

    expect(result).toEqual({ status: 'success' });
    expect(logStep).toHaveBeenCalledWith({
      instanceId: 'inst-1',
      stepType: 'note_updated',
      payload: { text: 'hello' },
    });
  });

  it('returns sync_failed when RPC throws', async () => {
    const logStep = vi.fn().mockRejectedValue(new Error('network'));

    const result = await runPauseReflectNoteUpdate(
      { pauseInstanceId: 'inst-1', text: 'x' },
      { logStep },
    );

    expect(result).toEqual({ status: 'sync_failed' });
  });
});

describe('runPauseReflectTagUpdate', () => {
  it('logs tag_updated payload', async () => {
    const logStep = vi.fn().mockResolvedValue(undefined);

    const result = await runPauseReflectTagUpdate(
      { pauseInstanceId: 'inst-1', tags: ['fomo', 'calm'] },
      { logStep },
    );

    expect(result).toEqual({ status: 'success' });
    expect(logStep).toHaveBeenCalledWith({
      instanceId: 'inst-1',
      stepType: 'tag_updated',
      payload: { tags: ['fomo', 'calm'] },
    });
  });
});

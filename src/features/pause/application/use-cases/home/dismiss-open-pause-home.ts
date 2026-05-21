import type { PauseRepository } from '@/features/pause/ports/pause-repository';

/**
 * Clears Home open-pause preview state and dismisses the current instance via RPC.
 * RPC authority: `pause_dismiss_current` (`PauseRepository.dismissCurrent`; Home conductor uses `public-rpc` dismiss facade).
 */
export async function dismissOpenPauseHome(
  hasUser: boolean,
  ports: { clearPreview: () => void; repository: PauseRepository },
): Promise<void> {
  ports.clearPreview();
  if (!hasUser) return;
  try {
    await ports.repository.dismissCurrent();
  } catch {
    /* non-fatal — preview already cleared locally */
  }
}

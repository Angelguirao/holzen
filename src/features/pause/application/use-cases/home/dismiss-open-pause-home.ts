import { runPauseDismissCurrent } from '@/features/pause/application/use-cases/session/run-pause-dismiss-current';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';

/**
 * Clears Home open-pause preview state and dismisses the current instance via RPC.
 * RPC authority: `pause_dismiss_current` (`runPauseDismissCurrent` → `PauseRepository`; Home conductor wires `supabasePauseRepository`).
 */
export async function dismissOpenPauseHome(
  hasUser: boolean,
  ports: { clearPreview: () => void; repository: PauseRepository },
): Promise<void> {
  ports.clearPreview();
  if (!hasUser) return;
  try {
    await runPauseDismissCurrent(ports.repository);
  } catch {
    /* non-fatal — preview already cleared locally */
  }
}

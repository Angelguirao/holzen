export type DismissOpenPauseHomePorts = {
  clearPreview: () => void;
  dismissCurrent: () => Promise<unknown>;
};

/**
 * Clears Home open-pause preview state and dismisses the current instance via RPC.
 * RPC authority: `pause_dismiss_current` (see `pauseDismissCurrent` in `public-rpc` → `PauseRepository`).
 */
export async function dismissOpenPauseHome(
  hasUser: boolean,
  ports: DismissOpenPauseHomePorts,
): Promise<void> {
  ports.clearPreview();
  if (!hasUser) return;
  try {
    await ports.dismissCurrent();
  } catch {
    /* non-fatal — preview already cleared locally */
  }
}

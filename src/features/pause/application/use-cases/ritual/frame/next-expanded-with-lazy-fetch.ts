import type { RegenerateCompanionSlot } from '@/features/pause/domain/companion-orchestrate';

export type LazyFetchCompanionExpandArgs = {
  data: unknown;
  loading: boolean;
  error: unknown;
  canAccess: () => boolean;
  fetch: (slot: RegenerateCompanionSlot) => void | Promise<void>;
  slot: RegenerateCompanionSlot;
};

/**
 * Toggle expand for a lazy-loaded companion card: when opening and payload is
 * missing, invoke fetch only if the user can access companions (Pro gate).
 */
export function nextExpandedWithLazyFetch(
  currentExpanded: boolean,
  args: LazyFetchCompanionExpandArgs,
): boolean {
  const next = !currentExpanded;
  if (next && !args.data && !args.loading && !args.error) {
    if (!args.canAccess()) return currentExpanded;
    void args.fetch(args.slot);
  }
  return next;
}

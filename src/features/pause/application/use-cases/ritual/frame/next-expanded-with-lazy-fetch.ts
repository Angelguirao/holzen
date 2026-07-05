import type { RegenerateCompanionSlot } from '@/features/pause/domain/companion-orchestrate';
import { companionSlotHasDisplayableContent } from '@/features/pause/domain/companion-slot-display-content';

export type LazyFetchCompanionExpandArgs = {
  data: unknown;
  loading: boolean;
  error: unknown;
  canAccess: () => boolean;
  fetch: (slot: RegenerateCompanionSlot) => void | Promise<void>;
  slot: RegenerateCompanionSlot;
};

function shouldLazyFetchOnExpand(args: LazyFetchCompanionExpandArgs): boolean {
  if (args.error) return true;
  return !companionSlotHasDisplayableContent(args.slot, args.data);
}

/**
 * Toggle expand for a lazy-loaded companion card: when opening and payload is
 * missing, invoke fetch only if the user can access companions (Pro gate).
 */
export function nextExpandedWithLazyFetch(
  currentExpanded: boolean,
  args: LazyFetchCompanionExpandArgs,
): boolean {
  const next = !currentExpanded;
  if (next && shouldLazyFetchOnExpand(args)) {
    if (!args.canAccess()) return currentExpanded;
    void args.fetch(args.slot);
  }
  return next;
}

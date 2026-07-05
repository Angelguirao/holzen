import type { HolzenReflectResponse } from '@/features/pause/domain/reflect/generation/holzen-reflect-response';
import { invokeEdge } from '@/lib/invoke-edge';

export type { HolzenReflectResponse };

export type HolzenReflectResponseWire = HolzenReflectResponse & {
  grounding_title?: string | null;
  grounding_body?: string | null;
  grounding_citation?: string | null;
  grounding_url?: string | null;
};

/** Reflect-step companion generation (`holzen-reflect` edge; `invokeEdge` preserves `x-cid`). */
export function invokeHolzenReflect(body: Record<string, unknown>, signal?: AbortSignal) {
  return invokeEdge<HolzenReflectResponseWire>('holzen-reflect', { body, signal });
}

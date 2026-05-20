import { invokeEdge } from '@/lib/invoke-edge';

/** Deletes the signed-in user via `delete-account` edge (`invokeEdge` preserves `x-cid`). */
export function deleteAccount() {
  return invokeEdge('delete-account');
}

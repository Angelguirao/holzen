/**
 * App boot ↔ subscription checkout guard cleanup (cross-cutting seam).
 * Re-export from subscription `public` — do not import subscription application from app directly.
 */
export { scheduleCheckoutGuardCleanup } from '@/features/subscription/public';

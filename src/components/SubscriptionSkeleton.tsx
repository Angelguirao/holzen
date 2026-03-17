import { Skeleton } from '@/components/ui/skeleton';

interface SubscriptionSkeletonProps {
  className?: string;
  /** "inline" for widget-embedded, "centered" for zen/fullscreen */
  variant?: 'inline' | 'centered';
}

export function SubscriptionSkeleton({ className, variant = 'inline' }: SubscriptionSkeletonProps) {
  const align = variant === 'centered' ? 'mx-auto' : '';

  return (
    <div className={`space-y-3 animate-in fade-in duration-300 ${className ?? ''}`}>
      <Skeleton className={`h-4 w-3/4 ${align}`} />
      <Skeleton className={`h-3 w-1/2 ${align}`} />
    </div>
  );
}

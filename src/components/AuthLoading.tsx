import { Skeleton } from '@/components/ui/skeleton';

const AuthLoading = () => (
  <div className="min-h-screen flex items-center justify-center p-6">
    <div className="w-full max-w-sm space-y-10">
      <Skeleton className="h-4 w-16" />
      <div className="space-y-4">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <Skeleton className="h-px w-full" />
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  </div>
);

export default AuthLoading;

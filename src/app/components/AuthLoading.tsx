import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';

const AuthLoading = () => {
  const { t } = useTranslation();
  const message = t('auth.restoringSession');
  return (
  <div
    className="min-h-screen flex flex-col items-center justify-center p-6"
    role="status"
    aria-live="polite"
    aria-busy="true"
  >
    <p className="sr-only">{message}</p>
    <p className="text-xs font-mono text-muted-foreground mb-8 text-center max-w-xs">
      {message}
    </p>
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
};

export default AuthLoading;

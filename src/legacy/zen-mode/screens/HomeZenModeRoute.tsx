import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import type { ZenModeHomeProps } from '@/screens/home/components/ZenModeHome';

const ZenModeHomeLazy = lazy(() =>
  import('@/screens/home/components/ZenModeHome').then((m) => ({ default: m.ZenModeHome })),
);

function ZenFallback() {
  const { t } = useTranslation();
  return (
    <div className="min-h-[50vh] flex items-center justify-center text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" aria-label={t('common.loading')} />
    </div>
  );
}

/** Lazy Zen Home with a single shared loading shell. */
export function HomeZenModeRoute(props: ZenModeHomeProps) {
  return (
    <Suspense fallback={<ZenFallback />}>
      <ZenModeHomeLazy {...props} />
    </Suspense>
  );
}

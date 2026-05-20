import { useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { trackAppRouteNotFound } from '@/screens/marketing/lib/marketing-screen-telemetry';
import { RobotsNoIndex } from '@/app/components/PageMeta';

const NotFoundScreen = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const trackedPathRef = useRef<string | null>(null);

  useEffect(() => {
    const attempted = location.pathname;
    if (trackedPathRef.current === attempted) return;
    trackedPathRef.current = attempted;
    trackAppRouteNotFound(attempted);
    console.error('404 Error: User attempted to access non-existent route:', attempted);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <RobotsNoIndex />
      <div className="text-center">
        <h1 className="mb-4 font-editorial text-4xl">{t('notFound.title')}</h1>
        <p className="mb-4 text-xl text-muted-foreground">{t('notFound.message')}</p>
        <Button asChild variant="primary">
          <a href="/">{t('notFound.returnHome')}</a>
        </Button>
      </div>
    </div>
  );
};

export default NotFoundScreen;

import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { TOOLS } from '@/lib/app-routes';

/** One compact Tools link for the Home pause widget empty state (keeps the card short). */
export function HomePauseEmptyBetweenContent() {
  const { t } = useTranslation();
  return (
    <div className="flex justify-center sm:justify-start">
      <Link
        to={TOOLS.hub}
        className="group inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-4 hover:underline"
      >
        {t('home.pauseEmpty.toolsHint')}
        <ArrowRight className="h-3 w-3 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </Link>
    </div>
  );
}

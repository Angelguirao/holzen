import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AppVersionBadge } from '@/screens/settings/components/AppVersionBadge';
import { FeedbackForm } from '@/screens/settings/components/FeedbackForm';
import { PageHeading } from '@/components/ui/page-heading';

/**
 * Low-frequency "about" surface: feedback and version — kept out of the main Settings accordion.
 */
export default function SettingsAboutScreen() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <Link
        to="/settings"
        className="inline-flex items-center gap-1 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground shrink-0"
      >
        <ArrowLeft className="h-3 w-3" aria-hidden />
        {t('settingsAbout.back', { defaultValue: 'Settings' })}
      </Link>

      <PageHeading
        className="border-0 pb-0"
        title={t('settingsAbout.title', { defaultValue: 'About & feedback' })}
        subtitle={t('settingsAbout.subtitle', {
          defaultValue: 'App version and a direct line to the team — separate from day-to-day preferences.',
        })}
      />

      <div className="space-y-5">
        <FeedbackForm />
        <div className="border-t border-border/30 pt-4">
          <AppVersionBadge />
        </div>
      </div>
    </div>
  );
}

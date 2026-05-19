import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AppVersionBadge } from '@/app/components/AppVersionBadge';
import { Changelog } from '@/screens/settings/components/Changelog';
import { FeedbackForm } from '@/screens/settings/components/FeedbackForm';
import { useLatestChangelogVersion } from '@/hooks/use-latest-changelog-version';
import { PageHeading } from '@/app/components/PageHeading';

/**
 * Low-frequency "about" surface: feedback, what's new, version — kept out of the main Settings accordion.
 */
export default function SettingsAboutScreen() {
  const { t } = useTranslation();
  const { latestVersion, hasNewVersion, markChangelogSeen } = useLatestChangelogVersion();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <Link
          to="/settings"
          className="inline-flex items-center gap-1 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground shrink-0"
        >
          <ArrowLeft className="h-3 w-3" aria-hidden />
          {t('settingsAbout.back', { defaultValue: 'Settings' })}
        </Link>
        {hasNewVersion && (
          <span className="text-[10px] font-mono bg-muted/50 text-muted-foreground px-1.5 py-0.5 rounded-full">
            {t('common.new')}
          </span>
        )}
      </div>

      <PageHeading
        className="border-0 pb-0"
        title={t('settingsAbout.title', { defaultValue: 'About, changelog & feedback' })}
        subtitle={t('settingsAbout.subtitle', {
          defaultValue:
            "What's new, app version, and a direct line to the team — separate from day-to-day preferences.",
        })}
      />

      <div className="space-y-5">
        <FeedbackForm />
        <div className="border-t border-border/30 pt-4 space-y-3">
          <div className="flex items-center gap-3">
            <Changelog onWhatsNewOpen={markChangelogSeen} />
          </div>
          <AppVersionBadge changelogVersion={latestVersion} />
        </div>
      </div>
    </div>
  );
}

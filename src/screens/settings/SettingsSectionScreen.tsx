import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageHeading } from '@/app/components/PageHeading';
import { isSettingsSectionId, type SettingsSectionId } from '@/screens/settings/section-ids';
import { useSettingsState } from '@/screens/settings/hooks/use-settings-state';
import {
  SettingsYouPanel,
  SettingsReflectionPanel,
  SettingsExperiencePanel,
  SettingsCompanionsPanel,
  SettingsNotificationsPanel,
  SettingsSubscriptionPanel,
  SettingsAccountPanel,
} from '@/screens/settings/components/SettingsSectionPanels';
import type { ComponentType } from 'react';

const PANEL: Record<SettingsSectionId, ComponentType> = {
  you: SettingsYouPanel,
  reflection: SettingsReflectionPanel,
  experience: SettingsExperiencePanel,
  companions: SettingsCompanionsPanel,
  notifications: SettingsNotificationsPanel,
  subscription: SettingsSubscriptionPanel,
  account: SettingsAccountPanel,
};

const HEADER: Record<SettingsSectionId, readonly [string, { defaultValue: string }]> = {
  you: ['settings.accountProfile', { defaultValue: 'Account & profile' }],
  reflection: ['settings.pauseBehavior', { defaultValue: 'Pause behavior' }],
  experience: ['settings.appBehavior', { defaultValue: 'App behavior' }],
  companions: ['settings.contentData', { defaultValue: 'Content & data' }],
  notifications: ['settings.notificationsQuietHours', { defaultValue: 'Notifications & quiet hours' }],
  subscription: ['settings.subscriptionPro', { defaultValue: 'Subscription & Pro' }],
  account: ['settings.accountSecurity', { defaultValue: 'Account & security' }],
};

const SECTION_SUBTITLE: Record<SettingsSectionId, string> = {
  you: 'settings.sectionPageSubtitleYou',
  reflection: 'settings.sectionPageSubtitleReflection',
  experience: 'settings.sectionPageSubtitleExperience',
  companions: 'settings.sectionPageSubtitleCompanions',
  notifications: 'settings.sectionPageSubtitleNotifications',
  subscription: 'settings.sectionPageSubtitleSubscription',
  account: 'settings.sectionPageSubtitleAccount',
};

export default function SettingsSectionScreen() {
  const m = useSettingsState();
  const { section = '' } = useParams();
  if (!isSettingsSectionId(section)) {
    return <Navigate to="/settings" replace />;
  }
  const Panel = PANEL[section];
  const [titleKey, titleOpts] = HEADER[section];
  const subtitleKey = SECTION_SUBTITLE[section];
  return (
    <div className="space-y-6 pb-8">
      <Link
        to="/settings"
        className="inline-flex items-center gap-2 rounded-lg px-1 py-1 -ml-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
        {m.t('settings.backToAll')}
      </Link>
      <PageHeading title={m.t(titleKey, titleOpts)} subtitle={m.t(subtitleKey)} />
      <div className="rounded-xl border border-border/40 bg-muted/15 px-4 py-4">
        <Panel />
      </div>
    </div>
  );
}

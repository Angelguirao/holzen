import { Link, Navigate, useParams } from 'react-router-dom';
import { NoxHeaderMain } from '@/components/ui/nox-header';
import { isSettingsSectionId, type SettingsSectionId } from '@/pages/settings/sectionIds';
import { useSettingsState } from '@/pages/settings/use-settings-state';
import {
  SettingsYouPanel,
  SettingsReflectionPanel,
  SettingsExperiencePanel,
  SettingsCompanionsPanel,
  SettingsNotificationsPanel,
  SettingsSubscriptionPanel,
  SettingsAccountPanel,
} from '@/pages/settings/SettingsSectionPanels';
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

export default function SettingsSectionPage() {
  const m = useSettingsState();
  const { section = '' } = useParams();
  if (!isSettingsSectionId(section)) {
    return <Navigate to="/settings" replace />;
  }
  const Panel = PANEL[section];
  const [titleKey, titleOpts] = HEADER[section];
  return (
    <div className="space-y-6">
      <p>
        <Link
          to="/settings"
          className="text-[10px] font-mono text-primary/90 underline-offset-2 hover:underline"
        >
          {m.t('settings.backToAll', { defaultValue: '← All settings' })}
        </Link>
      </p>
      <NoxHeaderMain title={m.t(titleKey, titleOpts)} subtitle={m.t('settings.pageSubtitle')} />
      <div className="border border-border/40 rounded-md px-4 py-4">
        <Panel />
      </div>
    </div>
  );
}

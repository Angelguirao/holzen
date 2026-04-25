import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { NoxHeaderMain } from '@/components/ui/nox-header';
import { useSettingsState } from '@/pages/settings/use-settings-state';
import { settingsSectionPath } from '@/lib/app-routes';
import { isSettingsSectionId } from '@/pages/settings/sectionIds';

const SECTIONS = [
  ['you', 'settings.accountProfile', { defaultValue: 'Account & profile' }],
  ['reflection', 'settings.pauseBehavior', { defaultValue: 'Pause behavior' }],
  ['experience', 'settings.appBehavior', { defaultValue: 'App behavior' }],
  ['companions', 'settings.contentData', { defaultValue: 'Content & data' }],
  ['notifications', 'settings.notificationsQuietHours', { defaultValue: 'Notifications & quiet hours' }],
  ['subscription', 'settings.subscriptionPro', { defaultValue: 'Subscription & Pro' }],
  ['account', 'settings.accountSecurity', { defaultValue: 'Account & security' }],
] as const;

export default function SettingsHub() {
  const m = useSettingsState();
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    const raw = location.hash.replace(/^#/, '');
    if (!raw.startsWith('settings-section-')) return;
    const id = raw.slice('settings-section-'.length);
    if (isSettingsSectionId(id)) {
      navigate(settingsSectionPath(id), { replace: true });
    }
  }, [location.hash, navigate]);

  return (
    <div className="space-y-6">
      <NoxHeaderMain title={m.t('settings.title')} subtitle={m.t('settings.pageSubtitle')} />

      <p className="text-[10px] font-mono text-muted-foreground/80 uppercase tracking-wider">
        {m.t('settings.jumpNavIntro')}
      </p>
      <div className="flex flex-wrap gap-x-2 gap-y-1.5 -mt-1">
        {SECTIONS.map(([id, key, opts]) => (
          <Link
            key={id}
            to={settingsSectionPath(id)}
            className="text-[10px] font-mono text-primary/90 underline-offset-2 hover:underline"
          >
            {m.t(key, opts)}
          </Link>
        ))}
      </div>

      <div className="border border-border/40 rounded-md px-4 py-3">
        <Link
          to="/settings/about"
          className="flex items-center justify-between gap-3 -mx-1 rounded-md px-1 py-0.5 outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <div className="min-w-0 text-left">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              {m.t('settings.aboutFeedback', { defaultValue: 'About & feedback' })}
            </p>
            <p className="text-xs text-muted-foreground/80 leading-relaxed mt-1">
              {m.t('settings.aboutSubpageHint', {
                defaultValue: "What's new, version, and feedback — in one place",
              })}
            </p>
          </div>
          {m.hasUnseenChangelog ? (
            <span className="shrink-0 text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
              {m.t('common.new')}
            </span>
          ) : null}
        </Link>
      </div>
    </div>
  );
}

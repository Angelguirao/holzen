import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  User,
  PauseCircle,
  SlidersHorizontal,
  Layers,
  Bell,
  CreditCard,
  Shield,
  Info,
  ChevronRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useSettingsState } from '@/pages/settings/use-settings-state';
import { settingsSectionPath } from '@/lib/app-routes';
import { isSettingsSectionId } from '@/pages/settings/sectionIds';
import type { SettingsSectionId } from '@/pages/settings/sectionIds';

const SECTION_ROWS: {
  id: SettingsSectionId;
  titleKey: string;
  titleOpts: { defaultValue: string };
  descKey: string;
  icon: LucideIcon;
}[] = [
  {
    id: 'you',
    titleKey: 'settings.accountProfile',
    titleOpts: { defaultValue: 'Account & profile' },
    descKey: 'settings.hubDescYou',
    icon: User,
  },
  {
    id: 'reflection',
    titleKey: 'settings.pauseBehavior',
    titleOpts: { defaultValue: 'Pause behavior' },
    descKey: 'settings.hubDescReflection',
    icon: PauseCircle,
  },
  {
    id: 'experience',
    titleKey: 'settings.appBehavior',
    titleOpts: { defaultValue: 'App behavior' },
    descKey: 'settings.hubDescExperience',
    icon: SlidersHorizontal,
  },
  {
    id: 'companions',
    titleKey: 'settings.contentData',
    titleOpts: { defaultValue: 'Content & data' },
    descKey: 'settings.hubDescCompanions',
    icon: Layers,
  },
  {
    id: 'notifications',
    titleKey: 'settings.notificationsQuietHours',
    titleOpts: { defaultValue: 'Notifications & quiet hours' },
    descKey: 'settings.hubDescNotifications',
    icon: Bell,
  },
  {
    id: 'subscription',
    titleKey: 'settings.subscriptionPro',
    titleOpts: { defaultValue: 'Subscription & Pro' },
    descKey: 'settings.hubDescSubscription',
    icon: CreditCard,
  },
  {
    id: 'account',
    titleKey: 'settings.accountSecurity',
    titleOpts: { defaultValue: 'Account & security' },
    descKey: 'settings.hubDescAccount',
    icon: Shield,
  },
];

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
    <div className="space-y-6 pb-8">
      <div className="border-b border-border pb-4 space-y-2">
        <p className="text-base leading-relaxed text-muted-foreground">{m.t('settings.pageSubtitle')}</p>
      </div>

      <p className="text-xs text-muted-foreground/90 leading-relaxed">{m.t('settings.hubIntro')}</p>

      <ul className="space-y-1.5">
        {SECTION_ROWS.map(({ id, titleKey, titleOpts, descKey, icon: Icon }) => (
          <li key={id}>
            <Link
              to={settingsSectionPath(id)}
              className="flex w-full items-start gap-3 rounded-xl border border-border/40 bg-muted/20 px-3 py-3 transition-colors hover:bg-muted/40 outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <Icon className="h-4 w-4 shrink-0 mt-0.5 text-secondary-foreground" aria-hidden />
              <div className="min-w-0 flex-1 text-left">
                <span className="text-sm font-medium text-foreground">{m.t(titleKey, titleOpts)}</span>
                <span className="mt-0.5 block text-sm leading-snug text-muted-foreground">{m.t(descKey)}</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50 mt-1" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>

      <ul className="space-y-1.5">
        <li>
          <Link
            to="/settings/about"
            className="flex w-full items-start gap-3 rounded-xl border border-border/50 bg-card/30 px-3 py-3 transition-colors hover:bg-muted/30 outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <Info className="h-4 w-4 shrink-0 mt-0.5 text-primary/80" aria-hidden />
            <div className="min-w-0 flex-1 text-left">
              <span className="text-sm font-medium text-foreground">
                {m.t('settings.aboutFeedback', { defaultValue: 'About & feedback' })}
              </span>
              <span className="mt-0.5 block text-sm leading-snug text-muted-foreground">
                {m.t('settings.aboutSubpageHint', {
                  defaultValue: "What's new, version, and feedback — in one place",
                })}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2 mt-0.5">
              {m.hasUnseenChangelog ? (
                <span className="text-[10px] font-medium bg-primary/15 text-primary px-2 py-0.5 rounded-full">
                  {m.t('common.new')}
                </span>
              ) : null}
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" aria-hidden />
            </div>
          </Link>
        </li>
      </ul>
    </div>
  );
}

import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/features/auth/public';
import { getCompletedPauseCountQueryOptions } from '@/features/pause/public-queries';
import { useSubscription } from '@/features/subscription/public-hooks';
import { useHoldGoalProfile } from '@/features/user/public-hooks';
import { type ProfileTab } from '@/lib/router-location-state';
import { journeyPath, isProfileTab } from '@/lib/app-routes';
import { getHistoryCalendarActivitiesQueryOptions } from '@/legacy/full-shell/src/lib/history-calendar-activities-fetch';
import { BarChart3, Sparkles, Award, CalendarDays } from 'lucide-react';
import HistoryContent from '@/legacy/full-shell/src/components/library/HistoryContent';
import { StatsContentV2 } from '@/legacy/full-shell/src/components/stats/StatsContentV2';
import { Skeleton } from '@/components/ui/skeleton';
import { AIInsightsPanel } from '@/legacy/full-shell/src/components/AIInsightsPanel';
import { ProLock } from '@/components/ui/pro-lock';
import { BadgesPanelV2 } from '@/legacy/full-shell/src/components/BadgesPanelV2';

const Profile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { subscribed } = useSubscription();
  const navigate = useNavigate();
  const { tab: urlTab } = useParams<{ tab: string }>();
  const userId = user?.id;
  const { data: holdGoal } = useHoldGoalProfile();

  const {
    data: completedPauseCount = 0,
    isPending: completedPauseCountPending,
  } = useQuery(getCompletedPauseCountQueryOptions(userId));

  const loading = Boolean(userId) && completedPauseCountPending;

  const tab: ProfileTab = urlTab && isProfileTab(urlTab) ? urlTab : 'stats';

  // Invalid /journey/:tab → /journey/stats
  useEffect(() => {
    if (!urlTab || !isProfileTab(urlTab)) {
      navigate('/journey/stats', { replace: true });
    }
  }, [urlTab, navigate]);

  useEffect(() => {
    document.title = t('journey.documentTitle', { defaultValue: 'Holzen — Journey' });
    return () => {
      document.title = 'Holzen — Pause before you act';
    };
  }, [t]);

  useEffect(() => {
    if (tab !== 'activity' || !userId || !subscribed) return;
    void queryClient.prefetchQuery(getHistoryCalendarActivitiesQueryOptions(userId));
  }, [tab, userId, subscribed, queryClient]);

  const tabs = [
    { id: 'stats' as const, label: t('profile.stats'), icon: BarChart3 },
    { id: 'insights' as const, label: t('profile.insights'), icon: Sparkles },
    { id: 'badges' as const, label: t('profile.badges'), icon: Award },
    { id: 'activity' as const, label: t('profile.activity'), icon: CalendarDays },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <p className="text-base leading-relaxed text-muted-foreground">{t('journey.pageSubtitle')}</p>
      </div>
      <div className="tabs-scroll -mx-1 flex gap-2 overflow-x-auto px-1 pb-4">
        {tabs.map((tabItem) => {
          const Icon = tabItem.icon;
          const isActive = tab === tabItem.id;
          return (
            <button
              key={tabItem.id}
              type="button"
              onClick={() => {
                if (tabItem.id === 'activity' && userId && subscribed) {
                  void queryClient.prefetchQuery(getHistoryCalendarActivitiesQueryOptions(userId));
                }
                navigate(journeyPath(tabItem.id), { replace: true });
              }}
              className={`relative flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 font-medium text-xs uppercase tracking-wide transition-all ${
                isActive
                  ? 'bg-muted/70 text-foreground shadow-sm'
                  : 'border border-border/30 text-muted-foreground/60 hover:bg-muted/50 hover:text-muted-foreground'
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-nox-text-link' : 'text-muted-foreground/40'}`} />
              {tabItem.label}
            </button>
          );
        })}
      </div>

      {tab === 'stats' ? (
        loading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full rounded-md" />
            <Skeleton className="h-40 w-full rounded-md" />
          </div>
        ) : (
          <StatsContentV2 holdGoal={holdGoal ?? null} />
        )
      ) : tab === 'insights' ? (
        <ProLock feature="ai_insights" hideContent>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full rounded-md" />
              <Skeleton className="h-20 w-full rounded-md" />
            </div>
          ) : (
            <AIInsightsPanel completedPauseCount={completedPauseCount} />
          )}
        </ProLock>
      ) : tab === 'badges' ? (
        loading ? (
          <div className="space-y-3">
            <Skeleton className="h-40 w-full rounded-md" />
          </div>
        ) : (
          <BadgesPanelV2 subscribed={subscribed} holdGoal={holdGoal ?? null} />
        )
      ) : (
        <>
          <ProLock feature="history" hideContent>
            <HistoryContent />
          </ProLock>
        </>
      )}
    </div>
  );
};

export default Profile;

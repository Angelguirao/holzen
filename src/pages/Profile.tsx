import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useSubscription } from '@/hooks/use-subscription';
import { useHoldGoalProfile } from '@/hooks/use-hold-goal';
import { type ProfileTab } from '@/lib/router-location-state';
import { journeyPath, isProfileTab } from '@/lib/app-routes';
import { BarChart3, Sparkles, Award, CalendarDays } from 'lucide-react';
import HistoryContent from '@/components/library/HistoryContent';
import { StatsContentV2 } from '@/components/stats/StatsContentV2';
import { Skeleton } from '@/components/ui/skeleton';
import { AIInsightsPanel } from '@/components/AIInsightsPanel';
import { ProLock } from '@/components/ProLock';
import { BadgesPanelV2 } from '@/components/BadgesPanelV2';

const Profile = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { subscribed } = useSubscription();
  const navigate = useNavigate();
  const { tab: urlTab } = useParams<{ tab: string }>();
  const [completedPauseCount, setCompletedPauseCount] = useState(0);
  const { data: holdGoal } = useHoldGoalProfile();
  const [loading, setLoading] = useState(true);

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
    if (!user) return;
    const loadCompletedPauseCount = async () => {
      const { count } = await supabase
        .from('pause_instances' as never)
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('state', 'completed');
      setCompletedPauseCount(count ?? 0);
      setLoading(false);
    };
    loadCompletedPauseCount();
  }, [user]);

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
              onClick={() => navigate(journeyPath(tabItem.id), { replace: true })}
              className={`relative flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 font-medium text-xs uppercase tracking-wide transition-all ${
                isActive
                  ? 'bg-primary/10 text-primary shadow-sm'
                  : 'border border-border/30 text-muted-foreground/60 hover:bg-muted/50 hover:text-muted-foreground'
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-primary' : 'text-muted-foreground/40'}`} />
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

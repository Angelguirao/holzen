import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useTranslation } from 'react-i18next';
import { Copy, Check, Gift, Star, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

interface GrantedReward {
  milestone: number;
  reward_type: string;
  granted_at: string;
}

export function ReferralSection({ defaultExpanded = false }: { defaultExpanded?: boolean }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const MILESTONES = [
    { count: 1, icon: Gift, label: t('referral.milestone1'), reward: t('referral.reward1') },
    { count: 3, icon: Star, label: t('referral.milestone3'), reward: t('referral.reward3') },
    { count: 5, icon: Crown, label: t('referral.milestone5'), reward: t('referral.reward5') },
  ];

  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralCount, setReferralCount] = useState(0);
  const [grantedRewards, setGrantedRewards] = useState<GrantedReward[]>([]);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(defaultExpanded);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('user_id', user.id)
        .single();

      if (profile?.referral_code) {
        setReferralCode(profile.referral_code);
      }

      const { count } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .eq('referrer_id', user.id);

      setReferralCount(count ?? 0);

      const { data: rewards } = await supabase
        .from('referral_rewards')
        .select('milestone, reward_type, granted_at')
        .eq('user_id', user.id);

      if (rewards) {
        setGrantedRewards(rewards as unknown as GrantedReward[]);
      }
    };
    load();
  }, [user]);

  const copyLink = useCallback(async () => {
    if (!referralCode) return;
    const link = `${window.location.origin}/welcome?ref=${referralCode}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast(t('referral.linkCopied'));
    setTimeout(() => setCopied(false), 2000);
  }, [referralCode, t]);

  if (!referralCode) return null;

  const nextMilestone = MILESTONES.find((m) => referralCount < m.count) ?? MILESTONES[MILESTONES.length - 1];
  const maxCount = MILESTONES[MILESTONES.length - 1].count;
  const progressPercent = Math.min((referralCount / maxCount) * 100, 100);

  return (
    <div className="space-y-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs font-sans font-medium text-nox-text-link underline-offset-4 transition-colors hover:text-nox-text-link/80 hover:underline"
      >
        {expanded ? t('referral.hideLink') : t('referral.inviteFriends')}
      </button>

      {expanded && (
        <div className="space-y-4 animate-fade-in">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t('referral.shareDescription')}
          </p>

          <button
            onClick={copyLink}
            className="flex items-center gap-2 w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="truncate flex-1 text-left">
              {window.location.origin}/welcome?ref={referralCode}
            </span>
            {copied ? (
              <Check className="h-3 w-3 shrink-0 text-foreground" />
            ) : (
              <Copy className="h-3 w-3 shrink-0" />
            )}
          </button>

          <div className="space-y-3 rounded-md border border-border bg-muted/20 p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-mono text-muted-foreground">
                {referralCount} / {maxCount} {t('referral.referrals')}
              </p>
              {referralCount >= maxCount && (
                <span className="text-xs font-mono text-foreground">{t('referral.allEarned')} ✦</span>
              )}
            </div>
            <Progress value={progressPercent} className="h-1" />

            <div className="space-y-2">
              {MILESTONES.map((milestone) => {
                const Icon = milestone.icon;
                const reached = referralCount >= milestone.count;
                const granted = grantedRewards.some(r => r.milestone === milestone.count);
                return (
                  <div
                    key={milestone.count}
                    className={`flex items-center gap-2 text-xs font-mono transition-colors ${
                      reached ? 'text-foreground' : 'text-muted-foreground/50'
                    }`}
                  >
                    <Icon className={`h-3 w-3 shrink-0 ${reached ? 'text-foreground' : ''}`} />
                    <span className="flex-1">{milestone.reward}</span>
                    {granted ? (
                      <span className="text-[10px] text-foreground/70">{t('referral.earned')} ✓</span>
                    ) : reached ? (
                      <Check className="h-3 w-3 shrink-0" />
                    ) : null}
                  </div>
                );
              })}
            </div>

            {referralCount < maxCount && (
              <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
                {t('referral.moreUntil', {
                  count: nextMilestone.count - referralCount,
                  reward: nextMilestone.reward,
                })}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

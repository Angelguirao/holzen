import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Copy, Check, Gift, Star, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

const MILESTONES = [
  { count: 1, icon: Gift, label: '1 referral', reward: '1 week free added' },
  { count: 3, icon: Star, label: '3 referrals', reward: '1 month free added' },
  { count: 5, icon: Crown, label: '5 referrals', reward: 'Lifetime access unlocked' },
];

export function ReferralSection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralCount, setReferralCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

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
    };
    load();
  }, [user]);

  const copyLink = useCallback(async () => {
    if (!referralCode) return;
    const link = `${window.location.origin}/welcome?ref=${referralCode}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast({ description: 'Referral link copied' });
    setTimeout(() => setCopied(false), 2000);
  }, [referralCode, toast]);

  if (!referralCode) return null;

  const nextMilestone = MILESTONES.find((m) => referralCount < m.count) ?? MILESTONES[MILESTONES.length - 1];
  const maxCount = MILESTONES[MILESTONES.length - 1].count;
  const progressPercent = Math.min((referralCount / maxCount) * 100, 100);

  return (
    <div className="space-y-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs font-mono text-muted-foreground underline"
      >
        {expanded ? 'Hide referral link' : 'Invite friends'}
      </button>

      {expanded && (
        <div className="space-y-4 animate-fade-in">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Share Holzen with someone who could use a moment of pause.
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

          {/* Reward milestones */}
          <div className="space-y-3 rounded-md border border-border bg-muted/20 p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-mono text-muted-foreground">
                {referralCount} / {maxCount} referrals
              </p>
              {referralCount >= maxCount && (
                <span className="text-xs font-mono text-foreground">All rewards earned ✦</span>
              )}
            </div>
            <Progress value={progressPercent} className="h-1" />

            <div className="space-y-2">
              {MILESTONES.map((milestone) => {
                const Icon = milestone.icon;
                const reached = referralCount >= milestone.count;
                return (
                  <div
                    key={milestone.count}
                    className={`flex items-center gap-2 text-xs font-mono transition-colors ${
                      reached ? 'text-foreground' : 'text-muted-foreground/50'
                    }`}
                  >
                    <Icon className={`h-3 w-3 shrink-0 ${reached ? 'text-foreground' : ''}`} />
                    <span className="flex-1">{milestone.reward}</span>
                    {reached && <Check className="h-3 w-3 shrink-0" />}
                  </div>
                );
              })}
            </div>

            {referralCount < maxCount && (
              <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
                {nextMilestone.count - referralCount} more {nextMilestone.count - referralCount === 1 ? 'referral' : 'referrals'} until: {nextMilestone.reward}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
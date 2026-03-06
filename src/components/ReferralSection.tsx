import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

  return (
    <div className="space-y-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs font-mono text-muted-foreground underline"
      >
        {expanded ? 'Hide referral link' : 'Invite friends'}
      </button>

      {expanded && (
        <div className="space-y-3 animate-fade-in">
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

          {referralCount > 0 && (
            <p className="text-xs font-mono text-muted-foreground">
              {referralCount} {referralCount === 1 ? 'person' : 'people'} joined through you
            </p>
          )}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface FollowUp {
  id: string;
  reflection_id: string;
  original_decision: string;
  decision_held: boolean | null;
  created_at: string;
}

export function FollowUpCard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [followUp, setFollowUp] = useState<FollowUp | null>(null);
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('follow_ups')
      .select('id, reflection_id, original_decision, decision_held, created_at')
      .eq('user_id', user.id)
      .is('decision_held', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setFollowUp(data[0] as unknown as FollowUp);
        }
      });
  }, [user]);

  const respond = useCallback(async (held: boolean) => {
    if (!followUp || responding) return;
    setResponding(true);
    const { error } = await supabase
      .from('follow_ups')
      .update({ decision_held: held, responded_at: new Date().toISOString() })
      .eq('id', followUp.id);

    if (error) {
      toast.error(t('followUp.error', 'Failed to save response'));
      setResponding(false);
      return;
    }

    toast(held
      ? t('followUp.heldToast', '💪 Decision held. That\'s composure in action.')
      : t('followUp.changedToast', 'No judgment. Awareness is the first step.')
    );
    setFollowUp(null);
    setResponding(false);
  }, [followUp, responding, t]);

  if (!followUp) return null;

  const decisionLabel = followUp.original_decision === 'held' || followUp.original_decision === 'nothing'
    ? t('followUp.decisionHold', 'hold')
    : followUp.original_decision === 'sold'
      ? t('followUp.decisionSell', 'sell')
      : t('followUp.decisionBuy', 'buy');

  const timeAgo = formatDistanceToNow(new Date(followUp.created_at), { addSuffix: true });

  return (
    <div className="rounded-md border border-primary/20 bg-primary/5 px-4 py-4 space-y-3">
      <div className="flex items-center gap-2">
        <Clock className="h-3.5 w-3.5 text-primary" />
        <p className="text-[10px] font-mono tracking-widest uppercase text-primary/80">
          {t('followUp.title', '24h Check-in')}
        </p>
      </div>

      <p className="text-sm leading-relaxed">
        {t('followUp.question', 'You decided to {{decision}} {{time}}. Did that decision hold?', {
          decision: decisionLabel,
          time: timeAgo,
        })}
      </p>

      <div className="flex gap-2">
        <button
          onClick={() => respond(true)}
          disabled={responding}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-primary/30 bg-primary/10 text-primary text-xs font-mono hover:bg-primary/20 transition-colors disabled:opacity-50"
        >
          <CheckCircle className="h-3.5 w-3.5" />
          {t('followUp.yes', 'Yes, it held')}
        </button>
        <button
          onClick={() => respond(false)}
          disabled={responding}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-border/60 bg-muted/30 text-muted-foreground text-xs font-mono hover:bg-muted/50 transition-colors disabled:opacity-50"
        >
          <XCircle className="h-3.5 w-3.5" />
          {t('followUp.no', 'No, I changed')}
        </button>
      </div>
    </div>
  );
}

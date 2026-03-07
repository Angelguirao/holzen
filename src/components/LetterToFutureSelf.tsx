import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Lock, Send, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Letter {
  id: string;
  body: string;
  written_during: string;
  deliver_during: string;
  btc_price_at_write: number;
  written_at: string;
  delivered: boolean;
  delivered_at: string | null;
  btc_price_at_delivery: number | null;
}

interface Props {
  currentPrice: number | null;
  changePercent: number | null;
  threshold?: number;
}

export function LetterToFutureSelf({ currentPrice, changePercent, threshold = 5 }: Props) {
  const { user } = useAuth();
  const [letters, setLetters] = useState<Letter[]>([]);
  const [pendingLetters, setPendingLetters] = useState<Letter[]>([]);
  const [deliveredLetters, setDeliveredLetters] = useState<Letter[]>([]);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('future_letters')
      .select('*')
      .eq('user_id', user.id)
      .order('written_at', { ascending: false })
      .then(({ data }) => {
        const all = (data as unknown as Letter[]) ?? [];
        setLetters(all);
        setPendingLetters(all.filter((l) => !l.delivered));
        setDeliveredLetters(all.filter((l) => l.delivered));
        setLoaded(true);
      });
  }, [user]);

  if (!loaded || !user) return null;

  // Determine current market condition
  const isCrash = changePercent !== null && changePercent <= -5;
  const isATH = changePercent !== null && changePercent >= 5;
  const canWrite = isCrash || isATH;

  const writtenDuring = isCrash ? 'crash' : 'ath';
  const deliverDuring = isCrash ? 'ath' : 'crash';

  const handleSend = async () => {
    if (!body.trim() || !currentPrice || !canWrite) return;
    setSending(true);

    try {
      const { data, error } = await supabase
        .from('future_letters')
        .insert({
          user_id: user.id,
          body: body.trim(),
          written_during: writtenDuring,
          deliver_during: deliverDuring,
          btc_price_at_write: currentPrice,
        } as any)
        .select()
        .single();

      if (error) throw error;

      const newLetter = data as unknown as Letter;
      setLetters((prev) => [newLetter, ...prev]);
      setPendingLetters((prev) => [newLetter, ...prev]);
      setBody('');
      toast('Letter sealed', {
        description: `It will be delivered when the market ${deliverDuring === 'ath' ? 'reaches new highs' : 'drops sharply'}.`,
      });
    } catch {
      toast('Failed to save letter');
    } finally {
      setSending(false);
    }
  };

  const fmtPrice = (p: number) =>
    p.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  return (
    <div className="space-y-4">
      {/* Write section — only during volatility */}
      {canWrite ? (
        <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-4 space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-3 w-3" />
            <p className="text-[10px] font-mono tracking-widest uppercase">
              Letter to future self
            </p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isCrash
              ? "The market is falling. Write something to yourself — you'll receive it during the next surge."
              : "The market is surging. Write something to yourself — you'll receive it during the next drop."}
          </p>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={
              isCrash
                ? "What do you want to remember when euphoria returns?"
                : "What do you want to remember when fear takes over?"
            }
            className="text-xs font-mono min-h-[80px] resize-none bg-background/50"
            maxLength={500}
          />
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground/40">{body.length}/500</p>
            <Button
              onClick={handleSend}
              disabled={sending || !body.trim()}
              size="sm"
              className="font-mono text-xs gap-1.5"
            >
              <Send className="h-3 w-3" />
              {sending ? 'Sealing…' : 'Seal letter'}
            </Button>
          </div>
        </div>
      ) : pendingLetters.length > 0 ? (
        <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-3 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Lock className="h-3 w-3" />
            <p className="text-[10px] font-mono tracking-widest uppercase">Sealed letters</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            You have {pendingLetters.length} sealed letter{pendingLetters.length !== 1 ? 's' : ''} waiting to be delivered.
          </p>
          {pendingLetters.map((l) => (
            <div key={l.id} className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground/60">
              <Clock className="h-2.5 w-2.5" />
              <span>
                Written {format(new Date(l.written_at), 'MMM d')} during{' '}
                {l.written_during === 'crash' ? 'a drop' : 'a surge'} at{' '}
                {fmtPrice(l.btc_price_at_write)} — delivers during next{' '}
                {l.deliver_during === 'ath' ? 'surge' : 'drop'}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {/* Delivered letters */}
      {deliveredLetters.length > 0 && (
        <div className="space-y-3">
          {deliveredLetters.map((l) => (
            <div
              key={l.id}
              className="rounded-md border border-primary/20 bg-primary/5 px-4 py-3 space-y-2"
            >
              <div className="flex items-center gap-2">
                <Mail className="h-3 w-3 text-primary" />
                <p className="text-[10px] font-mono text-primary uppercase tracking-wider">
                  Delivered
                </p>
              </div>
              <p className="text-sm leading-relaxed">{l.body}</p>
              <p className="text-[10px] font-mono text-muted-foreground/50">
                Written {format(new Date(l.written_at), 'MMM d, yyyy')} at{' '}
                {fmtPrice(l.btc_price_at_write)}
                {l.btc_price_at_delivery &&
                  ` · Delivered at ${fmtPrice(l.btc_price_at_delivery)}`}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

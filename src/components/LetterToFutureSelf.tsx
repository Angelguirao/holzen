import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Send } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

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

const LETTER_THRESHOLD = 5;

const WRITING_PROMPTS = {
  crash: [
    "What do you want to remember when euphoria returns?",
    "What would your calm self say to your excited self?",
    "Write what you know to be true right now.",
  ],
  ath: [
    "What do you want to remember when fear takes over?",
    "What would your grounded self tell your panicking self?",
    "Write what this moment has taught you.",
  ],
};

interface Props {
  currentPrice: number | null;
  changePercent: number | null;
}

export function LetterToFutureSelf({ currentPrice, changePercent }: Props) {
  const { user } = useAuth();
  const [letters, setLetters] = useState<Letter[]>([]);
  const [pendingLetters, setPendingLetters] = useState<Letter[]>([]);
  const [deliveredLetters, setDeliveredLetters] = useState<Letter[]>([]);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [justSealed, setJustSealed] = useState(false);
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

  const isCrash = changePercent !== null && changePercent <= -LETTER_THRESHOLD;
  const isATH = changePercent !== null && changePercent >= LETTER_THRESHOLD;
  const canWrite = isCrash || isATH;

  const writtenDuring = isCrash ? 'crash' : 'ath';
  const deliverDuring = isCrash ? 'ath' : 'crash';

  const prompts = isCrash ? WRITING_PROMPTS.crash : WRITING_PROMPTS.ath;
  const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];

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
      setJustSealed(true);
      setTimeout(() => setJustSealed(false), 3000);
      toast('Letter sealed', {
        description: deliverDuring === 'ath'
          ? 'Sealed in fear · Opens when confidence returns'
          : 'Sealed in euphoria · Opens when doubt arrives',
      });
    } catch {
      toast('Failed to save letter');
    } finally {
      setSending(false);
    }
  };

  const fmtPrice = (p: number) =>
    p.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  const getStatusCopy = (l: Letter) => {
    if (l.written_during === 'crash') {
      return 'Sealed in fear · Opens when confidence returns';
    }
    return 'Sealed in euphoria · Opens when doubt arrives';
  };

  const getDaysElapsed = (from: string, to: string) => {
    const days = Math.round((new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getPriceDelta = (writePrice: number, deliveryPrice: number) => {
    const delta = ((deliveryPrice - writePrice) / writePrice) * 100;
    return delta > 0 ? `+${delta.toFixed(1)}%` : `${delta.toFixed(1)}%`;
  };

  return (
    <div className="space-y-4">
      {/* Seal animation overlay */}
      <AnimatePresence>
        {justSealed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/90"
          >
            <div className="flex flex-col items-center gap-4">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
                className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center"
              >
                <div className="w-8 h-8 rounded-full bg-primary/30" />
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-sm font-mono text-foreground"
              >
                Sealed.
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Write section */}
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
            placeholder={randomPrompt}
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
        /* Sealed letters — completely opaque, no peeking */
        <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-3 space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-3 h-3 rounded-full bg-primary/30 border border-primary/40" />
            <p className="text-[10px] font-mono tracking-widest uppercase">Sealed letters</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {pendingLetters.length} letter{pendingLetters.length !== 1 ? 's' : ''} sealed and waiting.
          </p>
          {pendingLetters.map((l) => (
            <div key={l.id} className="flex items-start gap-2 text-[10px] font-mono text-muted-foreground/50">
              <div className="w-2 h-2 rounded-full bg-primary/20 border border-primary/30 shrink-0 mt-0.5" />
              <span className="italic">{getStatusCopy(l)}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-3 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-3 w-3" />
            <p className="text-[10px] font-mono tracking-widest uppercase">Letter to future self</p>
          </div>
          <p className="text-xs text-muted-foreground/60 leading-relaxed">
            When BTC moves ±{LETTER_THRESHOLD}% or more, you can write a letter to your future self. It will be sealed and delivered when the market flips.
          </p>
        </div>
      )}

      {/* Delivered letters — with emotional context */}
      {deliveredLetters.length > 0 && (
        <div className="space-y-3">
          {deliveredLetters.map((l) => {
            const days = l.delivered_at ? getDaysElapsed(l.written_at, l.delivered_at) : null;
            const priceDelta = l.btc_price_at_delivery
              ? getPriceDelta(l.btc_price_at_write, l.btc_price_at_delivery)
              : null;

            return (
              <motion.div
                key={l.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-md border border-primary/20 bg-primary/5 px-4 py-4 space-y-3"
              >
                {/* Wax seal break indicator */}
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary/30 border border-primary/50 relative">
                    <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" style={{ animationDuration: '3s', animationIterationCount: '1' }} />
                  </div>
                  <p className="text-[10px] font-mono text-primary uppercase tracking-wider">
                    Delivered
                  </p>
                </div>

                <p className="text-sm leading-relaxed">{l.body}</p>

                {/* Emotional journey context */}
                <div className="space-y-1 pt-1 border-t border-primary/10">
                  <p className="text-[10px] font-mono text-muted-foreground/50">
                    Written {format(new Date(l.written_at), 'MMM d, yyyy')} during{' '}
                    {l.written_during === 'crash' ? 'a drop' : 'a surge'} · BTC at {fmtPrice(l.btc_price_at_write)}
                  </p>
                  {l.delivered_at && (
                    <p className="text-[10px] font-mono text-muted-foreground/50">
                      Opened {format(new Date(l.delivered_at), 'MMM d, yyyy')}
                      {days !== null && ` · ${days} day${days !== 1 ? 's' : ''} later`}
                      {l.btc_price_at_delivery && ` · BTC at ${fmtPrice(l.btc_price_at_delivery)}`}
                      {priceDelta && ` (${priceDelta})`}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

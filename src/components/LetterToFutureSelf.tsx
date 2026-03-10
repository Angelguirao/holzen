import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useHolzen } from '@/hooks/use-holzen';
import { formatBtcPrice } from '@/lib/btc';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Mail, Send, Info } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

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

// LETTER_THRESHOLD removed — now uses user's actual thresholds from profile

const WRITING_PROMPTS = {
  crash: [
    "What do you want to remember when euphoria returns?",
    "What would your calm self say to your excited self?",
    "Write what you know to be true right now.",
  ],
  surge: [
    "What do you want to remember when fear takes over?",
    "What would your grounded self tell your panicking self?",
    "Write what this moment has taught you.",
  ],
  calm: [
    "What would you tell yourself when the market panics?",
    "What's true right now that fear will make you forget?",
    "Write advice for the version of you that wants to sell everything.",
  ],
};

interface Props {
  currentPrice: number | null;
  changePercent: number | null;
}

// Wax seal SVG component
function WaxSeal({ size = 48, breaking = false, className = '' }: { size?: number; breaking?: boolean; className?: string }) {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-primary/40"
        style={{ background: 'radial-gradient(circle at 35% 35%, hsl(var(--primary) / 0.25), hsl(var(--primary) / 0.1))' }}
        animate={breaking ? { scale: [1, 1.15, 0.95, 1.05], opacity: [1, 0.8, 1, 0.6] } : {}}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />
      <motion.div
        className="absolute rounded-full border border-primary/30"
        style={{
          top: '20%', left: '20%', right: '20%', bottom: '20%',
          background: 'radial-gradient(circle at 40% 40%, hsl(var(--primary) / 0.35), hsl(var(--primary) / 0.15))',
        }}
        animate={breaking ? { rotate: [0, 15, -10, 5], scale: [1, 0.9, 1.1, 1] } : {}}
        transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
      />
      <div
        className="absolute rounded-full bg-primary/20"
        style={{ top: '38%', left: '38%', right: '38%', bottom: '38%' }}
      />
      <div
        className="absolute rounded-full bg-primary/15"
        style={{ width: '12%', height: '18%', bottom: '-6%', left: '30%', borderRadius: '0 0 50% 50%' }}
      />
      <div
        className="absolute rounded-full bg-primary/10"
        style={{ width: '10%', height: '14%', bottom: '-4%', right: '25%', borderRadius: '0 0 50% 50%' }}
      />
    </div>
  );
}

function SealCracks() {
  return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <motion.path
        d="M24 8 L26 20 L32 24 L26 26 L24 38"
        stroke="hsl(var(--background))"
        strokeWidth="1.5"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.6 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      />
      <motion.path
        d="M12 20 L20 22 L24 24 L28 22 L36 18"
        stroke="hsl(var(--background))"
        strokeWidth="1"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.4 }}
        transition={{ duration: 0.6, delay: 0.7 }}
      />
    </svg>
  );
}

export function LetterToFutureSelf({ currentPrice, changePercent }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { currency, threshold, thresholdDown } = useHolzen();
  const prefersReducedMotion = useReducedMotion();
  const [letters, setLetters] = useState<Letter[]>([]);
  const [pendingLetters, setPendingLetters] = useState<Letter[]>([]);
  const [deliveredLetters, setDeliveredLetters] = useState<Letter[]>([]);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sealPhase, setSealPhase] = useState<'idle' | 'sealing' | 'sealed'>('idle');
  const [loaded, setLoaded] = useState(false);
  // Calm-mode recipient: who should receive this letter?
  const [calmTarget, setCalmTarget] = useState<'crash' | 'surge'>('crash');

  const isCrash = changePercent !== null && changePercent <= -thresholdDown;
  const isSurge = changePercent !== null && changePercent >= threshold;
  const isVolatile = isCrash || isSurge;
  const isCalm = !isVolatile;

  const effectiveMode = isVolatile ? 'storm' : 'calm';
  const canWrite = isVolatile || (isCalm && currentPrice !== null);

  const writtenDuring = effectiveMode === 'calm' ? 'calm' : (isCrash ? 'crash' : 'surge');
  const deliverDuring = effectiveMode === 'calm' ? calmTarget : (isCrash ? 'surge' : 'crash');

  const prompts = effectiveMode === 'calm'
    ? (calmTarget === 'crash' ? WRITING_PROMPTS.calm : WRITING_PROMPTS.crash)
    : (isCrash ? WRITING_PROMPTS.crash : WRITING_PROMPTS.surge);
  const randomPrompt = useMemo(() => prompts[Math.floor(Math.random() * prompts.length)], [isCrash, effectiveMode, calmTarget]);

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

  const handleSend = async () => {
    if (!body.trim() || !currentPrice || !canWrite) return;
    setSending(true);
    setSealPhase('sealing');

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

      setTimeout(() => {
        setSealPhase('sealed');
        setLetters((prev) => [newLetter, ...prev]);
        setPendingLetters((prev) => [newLetter, ...prev]);
        setBody('');

        setTimeout(() => {
          setSealPhase('idle');
        }, 2200);
      }, 1200);

      toast(t('letter.letterSealed'), {
        description: effectiveMode === 'calm'
          ? t('letter.sealedInCalm')
          : deliverDuring === 'surge'
          ? t('letter.sealedInFear')
          : t('letter.sealedInEuphoria'),
      });
    } catch {
      toast.error(t('letter.letterNotSaved'), { description: t('letter.letterNotSavedDesc') });
      setSealPhase('idle');
    } finally {
      setSending(false);
    }
  };

  const fmtPrice = (p: number) => formatBtcPrice(p, currency);

  const getStatusCopy = (l: Letter) => {
    if (l.written_during === 'calm') return t('letter.sealedInCalm');
    if (l.written_during === 'crash') return t('letter.sealedInFear');
    return t('letter.sealedInEuphoria');
  };

  const getTimeCopy = (l: Letter) => {
    const days = Math.round((Date.now() - new Date(l.written_at).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return t('letter.sealedToday');
    if (days === 1) return t('letter.sealedYesterday');
    return t('letter.sealedDaysAgo', { count: days });
  };

  const getDaysElapsed = (from: string, to: string) => {
    return Math.round((new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24));
  };

  const getPriceDelta = (writePrice: number, deliveryPrice: number) => {
    const delta = ((deliveryPrice - writePrice) / writePrice) * 100;
    return delta > 0 ? `+${delta.toFixed(1)}%` : `${delta.toFixed(1)}%`;
  };

  const getWrittenDuringLabel = (during: string) => {
    if (during === 'crash') return t('letter.duringDrop');
    if (during === 'calm') return t('letter.duringCalm');
    return t('letter.duringSurge');
  };

  return (
    <div className="space-y-4">
      {/* Seal ceremony overlay */}
      <AnimatePresence>
        {sealPhase !== 'idle' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm"
          >
            <div className="flex flex-col items-center gap-6">
              {sealPhase === 'sealing' ? (
                <>
                  <motion.div
                    initial={{ scaleY: 1, opacity: 1 }}
                    animate={{ scaleY: 0.1, opacity: 0.5 }}
                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                    className="w-32 h-20 rounded-sm border border-border/60 bg-muted/40 flex items-center justify-center overflow-hidden origin-bottom"
                  >
                    <p className="text-[8px] font-mono text-muted-foreground/30 truncate px-3">
                      {body.slice(0, 40)}
                    </p>
                  </motion.div>
                  <motion.div
                    initial={{ scale: 0, y: -20 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.5, ease: 'easeOut' }}
                  >
                    <WaxSeal size={56} />
                  </motion.div>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-widest"
                  >
                    {t('letter.sealing')}
                  </motion.p>
                </>
              ) : (
                <>
                  <motion.div
                    initial={prefersReducedMotion ? {} : { scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  >
                    <WaxSeal size={64} />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    className="text-center space-y-2"
                  >
                    <p className="text-sm font-mono text-foreground">{t('letter.sealed')}</p>
                    <p className="text-[10px] font-mono text-muted-foreground/50 max-w-[200px] leading-relaxed">
                      {effectiveMode === 'calm'
                        ? t('letter.waitsForStorm')
                        : deliverDuring === 'surge'
                          ? t('letter.waitsForConfidence')
                          : t('letter.waitsForDoubt')}
                    </p>
                  </motion.div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Write section */}
      {canWrite ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-md border border-border/60 bg-muted/30 px-4 py-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-3 w-3" />
              <p className="text-[10px] font-mono tracking-widest uppercase">
                {effectiveMode === 'calm' ? t('letter.calmTitle') : t('letter.stormTitle')}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {effectiveMode === 'calm'
              ? t('letter.calmDesc')
              : isCrash
                ? t('letter.crashDesc')
                : t('letter.surgeDesc')}
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
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" className="text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors">
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent side="top" align="end" className="max-w-[240px] text-xs leading-relaxed p-3">
                  {effectiveMode === 'calm'
                    ? t('letter.deliveryHintCalm', `If BTC drops ${LETTER_THRESHOLD}%+ or surges ${LETTER_THRESHOLD}%+, this letter will be opened for you.`)
                    : isCrash
                      ? t('letter.deliveryHintCrash', `When the market recovers and surges ${LETTER_THRESHOLD}%+, this letter will be opened for you.`)
                      : t('letter.deliveryHintSurge', `When the market drops ${LETTER_THRESHOLD}%+, this letter will be opened for you.`)}
                </PopoverContent>
              </Popover>
              <Button
                onClick={handleSend}
                disabled={sending || !body.trim()}
                size="sm"
                className="font-mono text-xs gap-1.5"
              >
                <Send className="h-3 w-3" />
                {sending ? t('letter.sealing') : t('letter.seal')}
              </Button>
            </div>
          </div>
        </motion.div>
      ) : pendingLetters.length > 0 ? (
        <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-4 space-y-4">
          <div className="flex items-center gap-2.5 text-muted-foreground">
            <WaxSeal size={20} />
            <p className="text-[10px] font-mono tracking-widest uppercase">{t('letter.sealedLetters')}</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t('letter.lettersSealedWaiting', { count: pendingLetters.length })}
          </p>
          <div className="space-y-2.5">
            {pendingLetters.map((l) => (
              <div key={l.id} className="flex items-center gap-3 rounded-sm border border-border/40 bg-background/30 px-3 py-2.5">
                <WaxSeal size={16} />
                <div className="min-w-0 space-y-0.5">
                  <p className="text-[10px] font-mono text-muted-foreground/60 italic">
                    {getStatusCopy(l)}
                  </p>
                  <p className="text-[9px] font-mono text-muted-foreground/30">
                    {getTimeCopy(l)} · BTC at {fmtPrice(l.btc_price_at_write)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-3 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-3 w-3" />
            <p className="text-[10px] font-mono tracking-widest uppercase">{t('letter.letterToFutureSelf')}</p>
          </div>
          <p className="text-xs text-muted-foreground/60 leading-relaxed">
            {t('letter.letterThresholdDesc', { threshold: LETTER_THRESHOLD })}
          </p>
        </div>
      )}

      {/* Delivered letters */}
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
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="rounded-md border border-primary/20 bg-primary/5 px-4 py-4 space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <WaxSeal size={24} breaking />
                    <SealCracks />
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-primary uppercase tracking-wider">
                      {t('letter.opened')}
                    </p>
                    {l.delivered_at && (
                      <p className="text-[9px] font-mono text-muted-foreground/40">
                        {format(new Date(l.delivered_at), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                </div>

                <p className="text-sm leading-relaxed pl-1">{l.body}</p>

                <div className="space-y-2 pt-2 border-t border-primary/10">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-wider">{t('letter.written')}</p>
                      <p className="text-[10px] font-mono text-muted-foreground/60">
                        {format(new Date(l.written_at), 'MMM d, yyyy')}
                      </p>
                      <p className="text-[10px] font-mono text-muted-foreground/50">
                        {getWrittenDuringLabel(l.written_during)}
                      </p>
                      <p className="text-[10px] font-mono text-muted-foreground/40">
                        BTC {fmtPrice(l.btc_price_at_write)}
                      </p>
                    </div>
                    {l.delivered_at && (
                      <div className="space-y-0.5">
                        <p className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-wider">{t('letter.opened')}</p>
                        <p className="text-[10px] font-mono text-muted-foreground/60">
                          {format(new Date(l.delivered_at), 'MMM d, yyyy')}
                        </p>
                        {days !== null && (
                          <p className="text-[10px] font-mono text-muted-foreground/50">
                            {t('letter.daysLater', { count: days })}
                          </p>
                        )}
                        {l.btc_price_at_delivery && (
                          <p className="text-[10px] font-mono text-muted-foreground/40">
                            BTC {fmtPrice(l.btc_price_at_delivery)}
                            {priceDelta && (
                              <span className={priceDelta.startsWith('+') ? 'text-primary/60' : 'text-destructive/60'}>
                                {' '}{priceDelta}
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

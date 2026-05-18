import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { X } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { formatBtcPrice } from '@/features/market/public';
import { useHolzen } from '@/hooks/use-holzen';

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
  delivery_threshold: number | null;
}

interface Props {
  letter: Letter | null;
  onClose: () => void;
}

type Phase = 'seal' | 'cracking' | 'revealed';

function WaxSealLarge({ phase }: { phase: Phase }) {
  const isCracking = phase === 'cracking';

  return (
    <div className="relative w-24 h-24">
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-primary/40"
        style={{
          background:
            'radial-gradient(circle at 35% 35%, hsl(var(--primary) / 0.3), hsl(var(--primary) / 0.12))',
        }}
        animate={
          isCracking
            ? { scale: [1, 1.12, 0.92, 1.06, 1], opacity: [1, 0.85, 1, 0.7, 0] }
            : {}
        }
        transition={{ duration: 1.4, ease: 'easeOut' }}
      />
      <motion.div
        className="absolute rounded-full border border-primary/30"
        style={{
          top: '20%', left: '20%', right: '20%', bottom: '20%',
          background:
            'radial-gradient(circle at 40% 40%, hsl(var(--primary) / 0.4), hsl(var(--primary) / 0.18))',
        }}
        animate={
          isCracking
            ? { rotate: [0, 12, -8, 4, 0], scale: [1, 0.88, 1.08, 1, 0], opacity: [1, 1, 1, 0.5, 0] }
            : {}
        }
        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.15 }}
      />
      <div
        className="absolute rounded-full bg-primary/25"
        style={{ top: '38%', left: '38%', right: '38%', bottom: '38%' }}
      />
      {/* Crack lines */}
      {isCracking && (
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 96 96"
          fill="none"
        >
          <motion.path
            d="M48 12 L52 40 L64 48 L52 52 L48 84"
            stroke="hsl(var(--background))"
            strokeWidth="2.5"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.7 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          />
          <motion.path
            d="M20 36 L40 44 L48 48 L56 44 L76 32"
            stroke="hsl(var(--background))"
            strokeWidth="1.5"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.5 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          />
        </svg>
      )}
    </div>
  );
}

export function LetterViewer({ letter, onClose }: Props) {
  const { t } = useTranslation();
  const { currency } = useHolzen();
  const prefersReducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<Phase>('seal');
  const letterId = letter?.id;

  const fmtPrice = (p: number) => formatBtcPrice(p, currency);

  useEffect(() => {
    if (!letter) {
      setPhase('seal');
      return;
    }

    // Only play the seal-breaking ceremony the first time a letter is opened
    const seenKey = 'holzen_seen_letters';
    const seen: string[] = JSON.parse(localStorage.getItem(seenKey) || '[]');
    const alreadySeen = seen.includes(letterId);

    if (prefersReducedMotion || alreadySeen) {
      setPhase('revealed');
      if (!alreadySeen) {
        localStorage.setItem(seenKey, JSON.stringify([...seen, letterId]));
      }
      return;
    }

    // First time — play ceremony then mark as seen
    setPhase('seal');
    const t1 = setTimeout(() => setPhase('cracking'), 800);
    const t2 = setTimeout(() => {
      setPhase('revealed');
      localStorage.setItem(seenKey, JSON.stringify([...seen, letterId]));
    }, 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [letter, letterId, prefersReducedMotion]);

  const getWrittenDuringLabel = (during: string) => {
    if (during === 'crash') return t('letter.duringDrop');
    if (during === 'calm') return t('letter.duringCalm');
    return t('letter.duringSurge');
  };

  const priceDelta = letter?.btc_price_at_delivery
    ? (((letter.btc_price_at_delivery - letter.btc_price_at_write) / letter.btc_price_at_write) * 100)
    : null;
  const priceDeltaStr = priceDelta !== null
    ? (priceDelta > 0 ? `+${priceDelta.toFixed(1)}%` : `${priceDelta.toFixed(1)}%`)
    : null;

  const days = letter?.delivered_at
    ? Math.round((new Date(letter.delivered_at).getTime() - new Date(letter.written_at).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <AnimatePresence>
      {letter && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-background/97 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Ambient orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              className="absolute w-64 h-64 rounded-full opacity-[0.04]"
              style={{ background: 'radial-gradient(circle, hsl(var(--primary)), transparent)', top: '10%', left: '15%' }}
              animate={{ x: [0, 20, 0], y: [0, -15, 0] }}
              transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute w-48 h-48 rounded-full opacity-[0.03]"
              style={{ background: 'radial-gradient(circle, hsl(var(--primary)), transparent)', bottom: '15%', right: '10%' }}
              animate={{ x: [0, -15, 0], y: [0, 10, 0] }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-[60] p-3 rounded-full bg-muted/50 hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>

          {/* Content */}
          <div className="relative z-10 w-full max-w-md mx-auto px-6">
            {/* Seal phase */}
            <AnimatePresence mode="wait">
              {phase !== 'revealed' ? (
                <motion.div
                  key="seal"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col items-center gap-5"
                >
                  <WaxSealLarge phase={phase} />
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-[0.25em]"
                  >
                    {phase === 'seal'
                      ? t('letter.aLetterFromYourPast', { defaultValue: 'A letter from your past self' })
                      : t('letter.breakingSeal', { defaultValue: 'Breaking the seal…' })}
                  </motion.p>
                </motion.div>
              ) : (
                <motion.div
                  key="letter"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="space-y-6"
                >
                  {/* Header */}
                  <div className="text-center space-y-1">
                    <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.2em]">
                      {t('letter.opened')}
                    </p>
                    {letter.delivered_at && (
                      <p className="text-[9px] font-mono text-muted-foreground/40">
                        {format(new Date(letter.delivered_at), 'MMMM d, yyyy')}
                      </p>
                    )}
                  </div>

                  {/* Letter body */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="rounded-lg border border-border/40 bg-muted/20 px-5 py-6 overflow-hidden"
                  >
                    <p className="text-sm leading-[1.8] text-foreground/90 break-words">
                      {letter.body}
                    </p>
                  </motion.div>

                  {/* Metadata */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.4 }}
                    className="grid grid-cols-2 gap-4 pt-2"
                  >
                    <div className="space-y-1">
                      <p className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-wider">
                        {t('letter.written')}
                      </p>
                      <p className="text-[10px] font-mono text-muted-foreground/60">
                        {format(new Date(letter.written_at), 'MMM d, yyyy')}
                      </p>
                      <p className="text-[10px] font-mono text-muted-foreground/50">
                        {getWrittenDuringLabel(letter.written_during)}
                      </p>
                      <p className="text-[10px] font-mono text-muted-foreground/40">
                        BTC {fmtPrice(letter.btc_price_at_write)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-wider">
                        {t('letter.opened')}
                      </p>
                      {letter.delivered_at && (
                        <p className="text-[10px] font-mono text-muted-foreground/60">
                          {format(new Date(letter.delivered_at), 'MMM d, yyyy')}
                        </p>
                      )}
                      {days !== null && (
                        <p className="text-[10px] font-mono text-muted-foreground/50">
                          {t('letter.daysLater', { count: days })}
                        </p>
                      )}
                      {letter.btc_price_at_delivery && (
                        <p className="text-[10px] font-mono text-muted-foreground/40">
                          BTC {fmtPrice(letter.btc_price_at_delivery)}
                          {priceDeltaStr && (
                            <span className={priceDeltaStr.startsWith('+') ? 'text-foreground/65' : 'text-destructive/60'}>
                              {' '}{priceDeltaStr}
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useHolzen } from '@/hooks/use-holzen';
import { formatBtcPrice } from '@/lib/btc';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Mail, Send, Info, Trash2, ChevronRight } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  FUTURE_LETTER_MAX_CHARS,
  FUTURE_LETTER_MIN_CHARS,
  FUTURE_LETTER_MIN_WORDS,
  validateFutureLetterBody,
  type FutureLetterInvalidReason,
} from '@/lib/future-letter-validation';
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
  delivery_threshold: number | null;
}

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

/**
 * Wax seal. Large sizes (ceremony) use Nox mustard + highlight for a warm wax read.
 * Small sizes (under 48px) use primary/muted so the home widget matches Practice/Ground chrome.
 */
function WaxSeal({
  size = 48,
  breaking = false,
  className = '',
}: {
  size?: number;
  breaking?: boolean;
  className?: string;
}) {
  const subtle = size < 48;

  const ringBorder = subtle ? 'border-primary/25' : 'border-nox-text-highlight/50';
  const outerBg = subtle
    ? 'radial-gradient(circle at 35% 35%, hsl(var(--primary) / 0.14), hsl(var(--muted) / 0.45))'
    : 'radial-gradient(circle at 35% 35%, hsl(var(--nox-color-accent-mustard) / 0.35), hsl(var(--nox-color-text-highlight) / 0.2))';
  const innerBg = subtle
    ? 'radial-gradient(circle at 40% 40%, hsl(var(--primary) / 0.22), hsl(var(--muted) / 0.35))'
    : 'radial-gradient(circle at 40% 40%, hsl(var(--nox-color-accent-mustard) / 0.55), hsl(var(--nox-color-text-highlight) / 0.3))';
  const hubBg = subtle ? 'bg-primary/30' : 'bg-nox-text-highlight/40';

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <motion.div
        className={`absolute inset-0 rounded-full border ${ringBorder}`}
        style={{ background: outerBg }}
        animate={breaking ? { scale: [1, 1.15, 0.95, 1.05], opacity: [1, 0.8, 1, 0.6] } : {}}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{
          top: '22%',
          left: '22%',
          right: '22%',
          bottom: '22%',
          background: innerBg,
        }}
        animate={breaking ? { rotate: [0, 15, -10, 5], scale: [1, 0.9, 1.1, 1] } : {}}
        transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
      />
      <div
        className={`absolute rounded-full ${hubBg}`}
        style={{ top: '40%', left: '40%', right: '40%', bottom: '40%' }}
      />
    </div>
  );
}

function SealCracks() {
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <motion.path
        d="M24 8 L26 20 L32 24 L26 26 L24 38"
        stroke="hsl(var(--nox-color-background-primary))"
        strokeWidth="1.5"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.7 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      />
      <motion.path
        d="M12 20 L20 22 L24 24 L28 22 L36 18"
        stroke="hsl(var(--nox-color-background-primary))"
        strokeWidth="1"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.45 }}
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
  // `letters` in the old implementation duplicated pending+delivered, so we only keep the split.
  const [pendingLetters, setPendingLetters] = useState<Letter[]>([]);
  const [deliveredLetters, setDeliveredLetters] = useState<Letter[]>([]);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sealPhase, setSealPhase] = useState<'idle' | 'sealing' | 'sealed'>('idle');
  const [loaded, setLoaded] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  // Calm-mode recipient: who should receive this letter?
  const [calmTarget, setCalmTarget] = useState<'crash' | 'surge'>('crash');

  const isCrash = changePercent !== null && changePercent <= -thresholdDown;
  const isSurge = changePercent !== null && changePercent >= threshold;
  const isVolatile = isCrash || isSurge;
  const isCalm = !isVolatile;

  const effectiveMode = isVolatile ? 'storm' : 'calm';
  const canWrite = isVolatile || (isCalm && currentPrice !== null);

  const writtenDuring = effectiveMode === 'calm' ? 'calm' : isCrash ? 'crash' : 'surge';
  const deliverDuring = effectiveMode === 'calm' ? calmTarget : isCrash ? 'surge' : 'crash';

  const prompts = useMemo(
    () =>
      effectiveMode === 'calm'
        ? calmTarget === 'crash'
          ? WRITING_PROMPTS.calm
          : WRITING_PROMPTS.crash
        : isCrash
          ? WRITING_PROMPTS.crash
          : WRITING_PROMPTS.surge,
    [effectiveMode, isCrash, calmTarget],
  );
  // Pick a stable prompt for the current mode/target so it doesn't flicker while typing.
  const randomPrompt = useMemo(
    () => prompts[Math.floor(Math.random() * prompts.length)],
    [prompts],
  );
  const letterValidation = useMemo(() => validateFutureLetterBody(body), [body]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('future_letters')
      .select('*')
      .eq('user_id', user.id)
      .order('written_at', { ascending: false })
      .then(({ data }) => {
        const all = (data as unknown as Letter[]) ?? [];
        setPendingLetters(all.filter((l) => !l.delivered));
        setDeliveredLetters(all.filter((l) => l.delivered));
        setLoaded(true);
      });
  }, [user]);

  // Discard any draft when the composer closes without sealing.
  useEffect(() => {
    if (!composerOpen) setBody('');
  }, [composerOpen]);

  const handleDeleteDelivered = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('future_letters').delete().eq('id', id);
      if (error) {
        toast.error(t('letter.deleteDeliveredFailed'));
        return;
      }
      setDeliveredLetters((prev) => prev.filter((l) => l.id !== id));
      toast(t('letter.deleted'));
    },
    [t],
  );

  if (!loaded || !user) return null;

  const handleSend = async () => {
    if (!currentPrice || !canWrite) return;
    const v = validateFutureLetterBody(body);
    if (!v.valid) {
      const reason = (v as { valid: false; reason: FutureLetterInvalidReason }).reason;
      if (reason === 'too_short') {
        toast.error(t('letter.validationTooShort', { min: FUTURE_LETTER_MIN_CHARS }));
      } else if (reason === 'too_long') {
        toast.error(t('letter.validationTooLong', { max: FUTURE_LETTER_MAX_CHARS }));
      } else if (reason === 'too_few_words') {
        toast.error(t('letter.validationTooFewWords', { min: FUTURE_LETTER_MIN_WORDS }));
      } else {
        toast.error(t('letter.validationTooRepetitive'));
      }
      return;
    }
    setSending(true);
    setComposerOpen(false);
    setSealPhase('sealing');

    try {
      // Lock the relevant threshold at write time so future setting changes don't affect delivery
      const letterThreshold = deliverDuring === 'crash' ? thresholdDown : threshold;

      const { data, error } = await supabase
        .from('future_letters')
        .insert({
          user_id: user.id,
          body: body.trim(),
          written_during: writtenDuring,
          deliver_during: deliverDuring,
          btc_price_at_write: currentPrice,
          delivery_threshold: letterThreshold,
        })
        .select()
        .single();

      if (error) throw error;

      const newLetter = data as unknown as Letter;

      setTimeout(() => {
        setSealPhase('sealed');
        setPendingLetters((prev) => [newLetter, ...prev]);
        setBody('');

        setTimeout(() => {
          setSealPhase('idle');
        }, 2200);
      }, 1200);

      toast(t('letter.letterSealed'), {
        description:
          effectiveMode === 'calm'
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

  const getDeliveryConditionLabel = (l: Letter) => {
    const pct = l.delivery_threshold ?? 5;
    if (l.deliver_during === 'crash') {
      return t('letter.opensWhenDrops', {
        threshold: pct,
        defaultValue: `Opens when BTC drops ≥${pct}%`,
      });
    }
    return t('letter.opensWhenSurges', {
      threshold: pct,
      defaultValue: `Opens when BTC surges ≥${pct}%`,
    });
  };

  const getTimeCopy = (l: Letter) => {
    const days = Math.round(
      (Date.now() - new Date(l.written_at).getTime()) / (1000 * 60 * 60 * 24),
    );
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

  // Editorial title + description pair for the current mode/target.
  const composerTitle =
    effectiveMode === 'calm'
      ? calmTarget === 'crash'
        ? t('letter.titleToPanicSelf', 'A letter to your panicking self')
        : t('letter.titleToEuphoricSelf', 'A letter to your euphoric self')
      : isCrash
        ? t('letter.titleFromTheDrop', 'A letter from the drop')
        : t('letter.titleFromTheSurge', 'A letter from the surge');

  const composerDescription =
    effectiveMode === 'calm'
      ? calmTarget === 'crash'
        ? t(
            'letter.calmDescCrash',
            'Write to the version of you that panics during a drop. This letter opens when fear hits.',
          )
        : t(
            'letter.calmDescSurge',
            'Write to the version of you that gets carried away during a surge. This letter opens when euphoria strikes.',
          )
      : isCrash
        ? t('letter.crashDesc')
        : t('letter.surgeDesc');

  const deliveryHint =
    effectiveMode === 'calm'
      ? calmTarget === 'crash'
        ? t(
            'letter.deliveryHintCalmCrash',
            `When BTC drops ${thresholdDown}%+, this letter will be opened for you.`,
          )
        : t(
            'letter.deliveryHintCalmSurge',
            `When BTC surges ${threshold}%+, this letter will be opened for you.`,
          )
      : isCrash
        ? t(
            'letter.deliveryHintCrash',
            `When the market recovers and surges ${threshold}%+, this letter will be opened for you.`,
          )
        : t(
            'letter.deliveryHintSurge',
            `When the market drops ${thresholdDown}%+, this letter will be opened for you.`,
          );

  return (
    <div className="space-y-5">
      {/* --- Sealing ceremony overlay --- */}
      <AnimatePresence>
        {sealPhase !== 'idle' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm"
            aria-live="polite"
            aria-label={t('letter.sealing')}
          >
            <div className="flex flex-col items-center gap-6">
              {sealPhase === 'sealing' ? (
                <>
                  <motion.div
                    initial={{ scaleY: 1, opacity: 1 }}
                    animate={{ scaleY: 0.1, opacity: 0.5 }}
                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                    className="flex h-24 w-40 origin-bottom items-center justify-center overflow-hidden rounded-md border border-border bg-card"
                  >
                    <p className="truncate px-4 font-editorial text-xs italic text-muted-foreground">
                      {body.slice(0, 40)}
                    </p>
                  </motion.div>
                  <motion.div
                    initial={{ scale: 0, y: -20 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.5, ease: 'easeOut' }}
                  >
                    <WaxSeal size={64} />
                  </motion.div>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="text-sm font-medium text-primary"
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
                    <WaxSeal size={72} />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    className="space-y-2 text-center"
                  >
                    <p className="font-editorial text-lg">{t('letter.sealed')}</p>
                    <p className="mx-auto max-w-[240px] text-sm leading-relaxed text-muted-foreground">
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

      {/* --- Intro block (flat inside HomeWidget) --- */}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <WaxSeal size={28} className="mt-0.5 shrink-0" />
          <div className="min-w-0 space-y-1">
            <h3 className="font-editorial text-lg leading-tight">
              {effectiveMode === 'calm'
                ? t('letter.calmHeading', 'Write to your future self')
                : isCrash
                  ? t('letter.stormHeadingCrash', 'Write from the drop')
                  : t('letter.stormHeadingSurge', 'Write from the surge')}
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {canWrite
                ? effectiveMode === 'calm'
                  ? t(
                      'letter.introCalm',
                      'A short note, sealed today, delivered when the market flips.',
                    )
                  : isCrash
                    ? t('letter.crashDesc')
                    : t('letter.surgeDesc')
                : t('letter.letterThresholdDesc', {
                    threshold: Math.min(threshold, thresholdDown),
                  })}
            </p>
          </div>
        </div>

        {canWrite && (
          <button
            type="button"
            onClick={() => setComposerOpen(true)}
            className="flex w-full items-center gap-3 rounded-lg border border-primary/15 bg-primary/[0.03] px-3 py-3 text-left transition-colors hover:bg-primary/[0.06]"
          >
            <Mail className="h-3.5 w-3.5 shrink-0 text-primary/50" />
            <span className="flex-1 text-sm font-medium text-foreground">{t('letter.writeCta', 'Write a letter')}</span>
            <ChevronRight className="h-3 w-3 shrink-0 text-primary/30" />
          </button>
        )}
      </div>

      {/* --- Pending letters (flat list, no inner card) --- */}
      {pendingLetters.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t('letter.sealedLetters')}
          </p>
          <ul className="space-y-1.5">
            {pendingLetters.map((l) => (
              <li
                key={l.id}
                className="flex items-center gap-3 rounded-md border border-border/50 bg-card/30 px-3 py-2.5"
              >
                <WaxSeal size={18} className="shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">
                    {getDeliveryConditionLabel(l)}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {getTimeCopy(l)} · BTC {fmtPrice(l.btc_price_at_write)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* --- Delivered letters --- */}
      {deliveredLetters.length > 0 && (
        <div className="space-y-3">
          {deliveredLetters.map((l) => {
            const days = l.delivered_at ? getDaysElapsed(l.written_at, l.delivered_at) : null;
            const priceDelta = l.btc_price_at_delivery
              ? getPriceDelta(l.btc_price_at_write, l.btc_price_at_delivery)
              : null;

            return (
              <motion.article
                key={l.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-4 rounded-xl border border-border/40 bg-card/40 px-4 py-4 shadow-sm backdrop-blur-sm"
              >
                <header className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative shrink-0">
                      <WaxSeal size={28} breaking />
                      <SealCracks />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {t('letter.opened')}
                      </p>
                      {l.delivered_at && (
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(l.delivered_at), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        type="button"
                        className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        aria-label={t('letter.deleteDelivered')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('letter.deleteDeliveredTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('letter.deleteDeliveredDesc')}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => handleDeleteDelivered(l.id)}
                        >
                          {t('common.delete')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </header>

                <p className="whitespace-pre-wrap break-words font-editorial text-base leading-relaxed text-foreground">
                  {l.body}
                </p>

                <footer className="grid grid-cols-2 gap-3 border-t border-border/30 pt-3 text-xs text-muted-foreground">
                  <div className="space-y-0.5">
                    <p className="uppercase tracking-wider text-muted-foreground/80">
                      {t('letter.written')}
                    </p>
                    <p>{format(new Date(l.written_at), 'MMM d, yyyy')}</p>
                    <p>{getWrittenDuringLabel(l.written_during)}</p>
                    <p className="font-mono">BTC {fmtPrice(l.btc_price_at_write)}</p>
                  </div>
                  {l.delivered_at && (
                    <div className="space-y-0.5">
                      <p className="uppercase tracking-wider text-muted-foreground/80">
                        {t('letter.opened')}
                      </p>
                      <p>{format(new Date(l.delivered_at), 'MMM d, yyyy')}</p>
                      {days !== null && <p>{t('letter.daysLater', { count: days })}</p>}
                      {l.btc_price_at_delivery && (
                        <p className="font-mono">
                          BTC {fmtPrice(l.btc_price_at_delivery)}
                          {priceDelta && (
                            <span
                              className={
                                priceDelta.startsWith('+')
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-destructive'
                              }
                            >
                              {' '}
                              {priceDelta}
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  )}
                </footer>
              </motion.article>
            );
          })}
        </div>
      )}

      {/* --- Composer Dialog --- */}
      <Dialog open={composerOpen} onOpenChange={setComposerOpen}>
        <DialogContent className="max-w-lg gap-0 p-0">
          <DialogHeader className="border-b border-border px-6 pb-4 pt-6">
            <DialogTitle className="font-editorial text-2xl leading-tight tracking-tight">
              {composerTitle}
            </DialogTitle>
            <DialogDescription className="pt-1 text-sm leading-relaxed">
              {composerDescription}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-6 pt-4">
            {effectiveMode === 'calm' && (
              <div
                role="radiogroup"
                aria-label={t('letter.recipientLabel', 'Recipient')}
                className="inline-flex w-full rounded-md border border-border bg-background p-1"
              >
                {(
                  [
                    { key: 'crash', label: t('letter.forPanicSelf', 'For my panicking self') },
                    { key: 'surge', label: t('letter.forEuphoricSelf', 'For my euphoric self') },
                  ] as const
                ).map((opt) => {
                  const selected = calmTarget === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setCalmTarget(opt.key)}
                      className={`flex-1 rounded-sm px-3 py-1.5 text-xs transition-colors ${
                        selected
                          ? 'bg-primary/10 font-medium text-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            )}

            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={randomPrompt}
              maxLength={FUTURE_LETTER_MAX_CHARS}
              rows={8}
              autoFocus
              className="font-editorial text-base leading-[1.8]"
            />

            {body.trim().length > 0 &&
              !letterValidation.valid &&
              (() => {
                const reason = (letterValidation as {
                  valid: false;
                  reason: FutureLetterInvalidReason;
                }).reason;
                return (
                  <p className="text-xs text-destructive">
                    {reason === 'too_short' &&
                      t('letter.validationTooShort', { min: FUTURE_LETTER_MIN_CHARS })}
                    {reason === 'too_long' &&
                      t('letter.validationTooLong', { max: FUTURE_LETTER_MAX_CHARS })}
                    {reason === 'too_few_words' &&
                      t('letter.validationTooFewWords', { min: FUTURE_LETTER_MIN_WORDS })}
                    {reason === 'too_repetitive' && t('letter.validationTooRepetitive')}
                  </p>
                );
              })()}

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-mono">
                {body.length}/{FUTURE_LETTER_MAX_CHARS}
              </span>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 transition-colors hover:text-foreground"
                  >
                    <Info className="h-3.5 w-3.5" />
                    {t('letter.deliveryInfo', 'When does this open?')}
                  </button>
                </PopoverTrigger>
                <PopoverContent side="top" align="end" className="max-w-[260px] text-sm leading-relaxed">
                  {deliveryHint}
                </PopoverContent>
              </Popover>
            </div>

            <p className="text-xs leading-relaxed text-muted-foreground">
              {t('letter.requirementsHint', {
                minChars: FUTURE_LETTER_MIN_CHARS,
                minWords: FUTURE_LETTER_MIN_WORDS,
                maxChars: FUTURE_LETTER_MAX_CHARS,
              })}
            </p>
          </div>

          <DialogFooter className="gap-2 border-t border-border px-6 py-4">
            <Button
              type="button"
              variant="tertiary"
              onClick={() => setComposerOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              onClick={handleSend}
              disabled={sending || !letterValidation.valid}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              {sending ? t('letter.sealing') : t('letter.seal')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, Play, Pause, Anchor, Loader2, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useHolzen } from '@/hooks/use-holzen';
import { hapticFeedback } from '@/lib/haptics';
import { type MoodValue } from '@/components/MoodCheck';
import { MoodCheck } from '@/components/MoodCheck';
import { useProGate } from '@/hooks/use-pro-gate';

type Phase = 'idle' | 'suggestion' | 'timer' | 'checkin' | 'done';

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function Ground() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const { groundingActivities, btcData, severity, language } = useHolzen();
  const { isPro, isPending } = useProGate();

  const [phase, setPhase] = useState<Phase>('idle');
  const [activity, setActivity] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [insight, setInsight] = useState<string | null>(null);
  const [article, setArticle] = useState<{ snippet: string; url: string | null } | null>(null);
  const [suggestedDuration, setSuggestedDuration] = useState(10);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [ready, setReady] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fetchedRef = useRef(false);

  // Entrance delay
  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 400);
    return () => clearTimeout(timer);
  }, []);

  // Fetch AI suggestion once
  useEffect(() => {
    if (fetchedRef.current) return;
    if (isPending) return;
    if (!isPro || groundingActivities.length === 0) return;

    fetchedRef.current = true;

    const fetchSuggestion = async () => {
      try {
        const context = btcData
          ? `BTC is ${btcData.direction === 'down' ? 'down' : 'up'} ${Math.abs(btcData.changePercent).toFixed(1)}% in the last 24 hours.`
          : undefined;

        const { data, error } = await supabase.functions.invoke('suggest-grounding', {
          body: { groundingActivities, context, severity, language },
        });

        if (error || !data) throw new Error('Failed to get suggestion');

        setActivity(data.activity);
        setSuggestion(data.suggestion);
        setSuggestedDuration(data.duration || 10);
        setInsight(data.insight || null);
        setArticle(data.article || null);
      } catch {
        const fallback = groundingActivities[Math.floor(Math.random() * groundingActivities.length)];
        setActivity(fallback);
        setSuggestion(t('ground.fallbackSuggestion', { activity: fallback }));
        setSuggestedDuration(10);
      }
      setPhase('suggestion');
    };

    fetchSuggestion();
  }, [isPending, isPro, groundingActivities, btcData, severity, language, t]);

  // Timer
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            hapticFeedback('success');
            setPhase('checkin');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, timeLeft]);

  const startTimer = useCallback((minutes: number) => {
    hapticFeedback('light');
    setSelectedDuration(minutes);
    setTimeLeft(minutes * 60);
    setIsRunning(true);
    setPhase('timer');
  }, []);

  const togglePause = useCallback(() => {
    hapticFeedback('light');
    setIsRunning((prev) => !prev);
  }, []);

  const skipTimer = useCallback(() => {
    hapticFeedback('light');
    setIsRunning(false);
    setPhase('checkin');
  }, []);

  const handleMoodSelect = useCallback(async (_mood: MoodValue) => {
    hapticFeedback('light');
    setPhase('done');
  }, []);

  const handleMoodSkip = useCallback(() => {
    setPhase('done');
  }, []);

  const handleReturn = useCallback(() => {
    navigate('/', { replace: true });
  }, [navigate]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress = selectedDuration ? 1 - timeLeft / (selectedDuration * 60) : 0;

  // Show nothing until we know auth + pro status
  if (isPending || !ready) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Loader2 className="h-4 w-4 text-muted-foreground/30 animate-spin" />
        </motion.div>
      </div>
    );
  }

  // Non-Pro: show gentle upsell
  if (!isPro) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
        <button
          onClick={handleReturn}
          className="fixed top-5 right-5 p-3 rounded-full bg-muted/40 text-muted-foreground/40 hover:text-foreground/60 transition-all z-[60]"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        <motion.div
          className="text-center space-y-5 px-8 max-w-xs"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
        >
          <Anchor className="h-5 w-5 text-muted-foreground/30 mx-auto" />
          <p className="text-sm text-muted-foreground/60 leading-relaxed">
            {t('ground.proDesc', 'AI-guided grounding sessions pick the right activity for this moment and share something you didn\'t know about it.')}
          </p>
          <p className="text-[10px] font-mono text-muted-foreground/30 tracking-wider uppercase">
            {t('pro.badge')}
          </p>
        </motion.div>
      </div>
    );
  }

  // No activities
  if (groundingActivities.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
        <button
          onClick={handleReturn}
          className="fixed top-5 right-5 p-3 rounded-full bg-muted/40 text-muted-foreground/40 hover:text-foreground/60 transition-all z-[60]"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        <motion.div
          className="text-center space-y-4 px-8 max-w-xs"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
        >
          <Anchor className="h-5 w-5 text-muted-foreground/30 mx-auto" />
          <p className="text-sm font-mono text-muted-foreground">{t('ground.noActivities')}</p>
          <p className="text-xs text-muted-foreground/50">{t('ground.noActivitiesHint')}</p>
          <button
            onClick={() => navigate('/settings', { replace: true })}
            className="text-xs font-mono text-primary/60 hover:text-primary underline underline-offset-4 transition-colors"
          >
            {t('ground.goToSettings')}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 overflow-y-auto"
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease }}
      style={{
        background: 'linear-gradient(160deg, hsl(var(--background)) 0%, hsl(var(--muted)) 50%, hsl(var(--background)) 100%)',
      }}
    >
      {/* Ambient orb */}
      <motion.div
        className="fixed top-1/3 left-1/2 -translate-x-1/2 w-[300px] h-[300px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, hsl(var(--primary) / 0.04) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
        animate={prefersReducedMotion ? {} : { scale: [1, 1.08, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Close */}
      <button
        onClick={handleReturn}
        className="fixed top-5 right-5 p-3 rounded-full bg-muted/40 backdrop-blur-sm text-muted-foreground/40 hover:text-foreground/60 hover:bg-muted/60 transition-all duration-300 z-[60]"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="relative z-10 max-w-sm mx-auto px-6 flex flex-col items-center justify-center min-h-screen py-12">
        <AnimatePresence mode="wait">
          {/* Loading */}
          {phase === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center space-y-4"
            >
              <Loader2 className="h-4 w-4 text-muted-foreground/30 mx-auto animate-spin" />
              <p className="text-[10px] font-mono text-muted-foreground/30 tracking-[0.2em] uppercase">
                {t('ground.finding', 'Finding what fits...')}
              </p>
            </motion.div>
          )}

          {/* Suggestion */}
          {phase === 'suggestion' && (
            <motion.div
              key="suggestion"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.7, ease }}
              className="text-center space-y-8 w-full"
            >
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <p className="text-[10px] font-mono tracking-[0.25em] uppercase text-muted-foreground/40">
                  {t('ground.title', 'Ground yourself')}
                </p>
                <div className="h-px w-8 bg-foreground/10 mx-auto" />
              </motion.div>

              <motion.div
                className="space-y-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <p className="text-xl font-mono text-foreground/80">{activity}</p>
              </motion.div>

              <motion.p
                className="text-sm text-muted-foreground/60 leading-relaxed max-w-[280px] mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                {suggestion}
              </motion.p>

              {/* Knowledge card */}
              {(insight || article) && (
                <motion.div
                  className="mx-auto max-w-[280px] rounded-lg border border-border/20 bg-muted/15 px-4 py-3.5 space-y-2.5 text-left"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0, duration: 0.5 }}
                >
                  {insight && (
                    <>
                      <p className="text-[9px] font-mono text-muted-foreground/30 tracking-[0.2em] uppercase">
                        {t('ground.didYouKnow', 'Did you know?')}
                      </p>
                      <p className="text-xs text-muted-foreground/50 leading-relaxed">{insight}</p>
                    </>
                  )}
                  {article && (
                    <div className={insight ? 'pt-2 border-t border-border/10' : ''}>
                      <p className="text-xs text-muted-foreground/40 leading-relaxed">{article.snippet}</p>
                      {article.url && (
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 mt-2 text-[10px] font-mono text-primary/40 hover:text-primary/70 transition-colors"
                        >
                          <ExternalLink className="h-2.5 w-2.5" />
                          {t('ground.readMore', 'Read more')}
                        </a>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Timer selection */}
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                <p className="text-[9px] font-mono text-muted-foreground/30 tracking-[0.2em] uppercase">
                  {t('ground.setTimer', 'Set a timer')}
                </p>
                <div className="flex items-center justify-center gap-3">
                  {[5, 10, 15].map((min) => (
                    <button
                      key={min}
                      onClick={() => startTimer(min)}
                      className={`px-5 py-2.5 rounded-lg border transition-all duration-300 ${
                        min === suggestedDuration
                          ? 'border-primary/25 bg-primary/5 text-foreground/80'
                          : 'border-border/20 bg-transparent text-muted-foreground/40 hover:text-foreground/60 hover:border-border/40'
                      }`}
                    >
                      <span className="text-xs font-mono">{min} min</span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={skipTimer}
                  className="text-[10px] font-mono text-muted-foreground/20 hover:text-muted-foreground/50 transition-colors"
                >
                  {t('ground.skipTimer', 'Skip timer')}
                </button>
              </motion.div>
            </motion.div>
          )}

          {/* Timer */}
          {phase === 'timer' && (
            <motion.div
              key="timer"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.5, ease }}
              className="text-center space-y-10 w-full"
            >
              <div className="space-y-2">
                <p className="text-xs font-mono text-muted-foreground/40">{activity}</p>
              </div>

              {/* Circular progress */}
              <div className="relative w-44 h-44 mx-auto">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                  <circle
                    cx="100" cy="100" r="90"
                    fill="none" stroke="hsl(var(--border) / 0.1)" strokeWidth="1.5"
                  />
                  <motion.circle
                    cx="100" cy="100" r="90"
                    fill="none" stroke="hsl(var(--primary) / 0.3)" strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeDasharray={565.48}
                    strokeDashoffset={565.48 * (1 - progress)}
                    transition={{ duration: 0.5 }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-3xl font-mono text-foreground/70 tabular-nums">
                    {formatTime(timeLeft)}
                  </p>
                  <p className="text-[9px] font-mono text-muted-foreground/20 mt-1.5">
                    {t('ground.remaining', 'remaining')}
                  </p>
                </div>
              </div>

              <button
                onClick={togglePause}
                className="p-4 rounded-full border border-border/20 bg-muted/10 hover:bg-muted/30 transition-colors mx-auto block"
              >
                {isRunning ? (
                  <Pause className="h-4 w-4 text-foreground/50" />
                ) : (
                  <Play className="h-4 w-4 text-foreground/50" />
                )}
              </button>

              <button
                onClick={skipTimer}
                className="text-[10px] font-mono text-muted-foreground/20 hover:text-muted-foreground/50 transition-colors"
              >
                {t('ground.imDone', 'I\'m done')}
              </button>
            </motion.div>
          )}

          {/* Check-in */}
          {phase === 'checkin' && (
            <motion.div
              key="checkin"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease }}
              className="text-center space-y-8 w-full"
            >
              <div className="space-y-2">
                <p className="text-[10px] font-mono tracking-[0.25em] uppercase text-muted-foreground/40">
                  {t('ground.checkIn', 'Check in')}
                </p>
                <div className="h-px w-8 bg-foreground/10 mx-auto" />
              </div>

              <p className="text-sm text-muted-foreground/60 leading-relaxed">
                {t('ground.howDoYouFeel', 'How do you feel now?')}
              </p>

              <MoodCheck onSelect={handleMoodSelect} onSkip={handleMoodSkip} />
            </motion.div>
          )}

          {/* Done */}
          {phase === 'done' && (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease }}
              className="text-center space-y-6"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <Anchor className="h-5 w-5 text-primary/30 mx-auto" />
              </motion.div>

              <motion.p
                className="text-sm text-foreground/60 leading-relaxed max-w-[260px] mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                {t('ground.doneMessage', 'You took a moment. That matters.')}
              </motion.p>

              <motion.button
                onClick={handleReturn}
                className="text-xs font-mono text-muted-foreground/30 hover:text-foreground/60 transition-colors underline underline-offset-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                {t('ground.return', 'Return')}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

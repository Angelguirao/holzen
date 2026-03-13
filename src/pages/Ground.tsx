import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, Play, Pause, RotateCcw, Anchor, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useHolzen } from '@/hooks/use-holzen';
import { hapticFeedback } from '@/lib/haptics';
import { type MoodValue } from '@/components/MoodCheck';
import { MoodCheck } from '@/components/MoodCheck';

type Phase = 'loading' | 'suggestion' | 'timer' | 'checkin' | 'done';

export default function Ground() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const { groundingActivities, btcData, severity, language } = useHolzen();

  const [phase, setPhase] = useState<Phase>('loading');
  const [activity, setActivity] = useState<string>('');
  const [suggestion, setSuggestion] = useState<string>('');
  const [insight, setInsight] = useState<string | null>(null);
  const [suggestedDuration, setSuggestedDuration] = useState(10);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [curtainLifted, setCurtainLifted] = useState(false);
  const [moodDone, setMoodDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cinematic entrance
  useEffect(() => {
    const timer = setTimeout(() => setCurtainLifted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Fetch AI suggestion
  useEffect(() => {
    if (groundingActivities.length === 0) {
      setPhase('suggestion');
      return;
    }

    const fetchSuggestion = async () => {
      try {
        const context = btcData
          ? `BTC is ${btcData.direction === 'down' ? 'down' : 'up'} ${Math.abs(btcData.changePercent).toFixed(1)}% in the last 24 hours.`
          : undefined;

        const { data, error } = await supabase.functions.invoke('suggest-grounding', {
          body: {
            groundingActivities,
            context,
            severity,
            language,
          },
        });

        if (error || !data) throw new Error('Failed to get suggestion');

        setActivity(data.activity);
        setSuggestion(data.suggestion);
        setSuggestedDuration(data.duration || 10);
        setInsight(data.insight || null);
        setPhase('suggestion');
      } catch {
        // Fallback: pick random activity
        const fallback = groundingActivities[Math.floor(Math.random() * groundingActivities.length)];
        setActivity(fallback);
        setSuggestion(t('ground.fallbackSuggestion', { activity: t(`settings.grounding.${fallback}`, fallback) }));
        setSuggestedDuration(10);
        setPhase('suggestion');
      }
    };

    fetchSuggestion();
  }, [groundingActivities, btcData, severity, language, t]);

  // Timer logic
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
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
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
    setMoodDone(true);
    setPhase('done');
  }, []);

  const handleMoodSkip = useCallback(() => {
    setMoodDone(true);
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

  // No grounding activities configured
  if (groundingActivities.length === 0 && phase !== 'loading') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <div className="text-center space-y-4 px-6">
          <Anchor className="h-5 w-5 text-muted-foreground/40 mx-auto" />
          <p className="text-sm font-mono text-muted-foreground">{t('ground.noActivities')}</p>
          <p className="text-xs text-muted-foreground/60">{t('ground.noActivitiesHint')}</p>
          <button
            onClick={() => navigate('/settings', { replace: true })}
            className="text-xs font-mono text-primary underline"
          >
            {t('ground.goToSettings')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Dark curtain entrance */}
      <AnimatePresence>
        {!curtainLifted && (
          <motion.div
            className="fixed inset-0 z-[100] bg-background"
            exit={{ opacity: 0 }}
            transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
          />
        )}
      </AnimatePresence>

      <motion.div
        className="fixed inset-0 z-50 overflow-y-auto"
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.3 }}
        style={{
          background: 'linear-gradient(160deg, hsl(var(--background)) 0%, hsl(var(--muted)) 50%, hsl(var(--background)) 100%)',
        }}
      >
        {/* Ambient orb */}
        <motion.div
          className="fixed top-1/3 left-1/2 -translate-x-1/2 w-[350px] h-[350px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary) / 0.05) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
          animate={prefersReducedMotion ? {} : { scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Close button */}
        <button
          onClick={handleReturn}
          className="fixed top-5 right-5 p-3 rounded-full bg-muted/40 backdrop-blur-sm text-muted-foreground/40 hover:text-foreground/60 hover:bg-muted/60 transition-all duration-300 z-[60]"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative z-10 max-w-sm mx-auto px-6 flex flex-col items-center justify-center min-h-screen">
          <AnimatePresence mode="wait">
            {/* Loading */}
            {phase === 'loading' && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center space-y-4"
              >
                <Loader2 className="h-5 w-5 text-muted-foreground/40 mx-auto animate-spin" />
                <p className="text-[10px] font-mono text-muted-foreground/40 tracking-[0.2em] uppercase">
                  {t('ground.finding')}
                </p>
              </motion.div>
            )}

            {/* Suggestion */}
            {phase === 'suggestion' && (
              <motion.div
                key="suggestion"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="text-center space-y-8 w-full"
              >
                <div className="space-y-3">
                  <motion.p
                    className="text-[10px] font-mono tracking-[0.25em] uppercase text-muted-foreground/50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    {t('ground.title')}
                  </motion.p>
                  <div className="h-px w-8 bg-foreground/10 mx-auto" />
                </div>

                <motion.div
                  className="space-y-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <span className="text-4xl block">🌱</span>
                  </span>
                  <p className="text-lg font-mono text-foreground/80">
                    {activity}
                  </p>
                </motion.div>

                <motion.p
                  className="text-sm text-muted-foreground/70 leading-relaxed max-w-xs mx-auto"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  {suggestion}
                </motion.p>

                {insight && (
                  <motion.div
                    className="mx-auto max-w-xs rounded-md border border-border/20 bg-muted/20 px-4 py-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.0 }}
                  >
                    <p className="text-[10px] font-mono text-muted-foreground/40 tracking-wider uppercase mb-1.5">
                      {t('ground.didYouKnow', 'Did you know?')}
                    </p>
                    <p className="text-xs text-muted-foreground/60 leading-relaxed">
                      {insight}
                    </p>
                  </motion.div>
                )}

                  className="space-y-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.1 }}
                >
                  <p className="text-[10px] font-mono text-muted-foreground/40 tracking-wider uppercase">
                    {t('ground.setTimer')}
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    {[5, 10, 15].map((min) => (
                      <button
                        key={min}
                        onClick={() => startTimer(min)}
                        className={`px-5 py-2.5 rounded-md border transition-all duration-300 ${
                          min === suggestedDuration
                            ? 'border-primary/30 bg-primary/5 text-foreground'
                            : 'border-border/30 bg-muted/10 text-muted-foreground/60 hover:text-foreground hover:border-border/50'
                        }`}
                      >
                        <span className="text-xs font-mono">{min} min</span>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={skipTimer}
                    className="text-[10px] font-mono text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors mt-2"
                  >
                    {t('ground.skipTimer')}
                  </button>
                </motion.div>
              </motion.div>
            )}

            {/* Timer */}
            {phase === 'timer' && (
              <motion.div
                key="timer"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="text-center space-y-8 w-full"
              >
                <div className="space-y-2">
                  <span className="text-2xl block">🌱</span>
                  <p className="text-xs font-mono text-muted-foreground/50">
                    {activity}
                  </p>
                </div>

                {/* Circular progress */}
                <div className="relative w-48 h-48 mx-auto">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                    <circle
                      cx="100" cy="100" r="90"
                      fill="none"
                      stroke="hsl(var(--border) / 0.15)"
                      strokeWidth="2"
                    />
                    <motion.circle
                      cx="100" cy="100" r="90"
                      fill="none"
                      stroke="hsl(var(--primary) / 0.4)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeDasharray={565.48}
                      strokeDashoffset={565.48 * (1 - progress)}
                      transition={{ duration: 0.5 }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-3xl font-mono text-foreground/80 tabular-nums">
                      {formatTime(timeLeft)}
                    </p>
                    <p className="text-[10px] font-mono text-muted-foreground/30 mt-1">
                      {t('ground.remaining')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={togglePause}
                    className="p-3 rounded-full border border-border/30 bg-muted/20 hover:bg-muted/40 transition-colors"
                  >
                    {isRunning ? (
                      <Pause className="h-4 w-4 text-foreground/60" />
                    ) : (
                      <Play className="h-4 w-4 text-foreground/60" />
                    )}
                  </button>
                </div>

                <button
                  onClick={skipTimer}
                  className="text-[10px] font-mono text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
                >
                  {t('ground.imDone')}
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
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="text-center space-y-8 w-full"
              >
                <div className="space-y-3">
                  <p className="text-[10px] font-mono tracking-[0.25em] uppercase text-muted-foreground/50">
                    {t('ground.checkIn')}
                  </p>
                  <div className="h-px w-8 bg-foreground/10 mx-auto" />
                </div>

                <p className="text-sm text-muted-foreground/70 leading-relaxed">
                  {t('ground.howDoYouFeel')}
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
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="text-center space-y-6"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <Anchor className="h-6 w-6 text-primary/40 mx-auto" />
                </motion.div>

                <motion.p
                  className="text-sm text-foreground/70 leading-relaxed max-w-xs mx-auto"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  {t('ground.doneMessage')}
                </motion.p>

                <motion.button
                  onClick={handleReturn}
                  className="text-xs font-mono text-muted-foreground/40 hover:text-foreground transition-colors underline underline-offset-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                >
                  {t('ground.return')}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}

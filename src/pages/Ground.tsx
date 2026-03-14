import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, Play, Pause, Anchor, Loader2, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useHolzen } from '@/hooks/use-holzen';
import { useAuth } from '@/hooks/use-auth';
import { hapticFeedback } from '@/lib/haptics';
import { playGroundingChime } from '@/lib/grounding-chime';
import { type MoodValue } from '@/components/MoodCheck';
import { MoodIcon } from '@/components/icons/MoodIcon';
import { useProGate } from '@/hooks/use-pro-gate';

type Phase = 'idle' | 'suggestion' | 'timer' | 'checkin' | 'reflect' | 'done';

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];
const MIN_DURATION = 1;
const MAX_DURATION = 30;

export default function Ground() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const navState = (location.state as any) ?? {};
  const prefersReducedMotion = useReducedMotion();
  const { groundingActivities, btcData, severity, language } = useHolzen();
  const { user } = useAuth();
  const { isPro, isPending } = useProGate();

  const [phase, setPhase] = useState<Phase>('idle');
  const [activity, setActivity] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [insight, setInsight] = useState<string | null>(null);
  const [article, setArticle] = useState<{ snippet: string; url: string | null } | null>(null);
  const [suggestedDuration, setSuggestedDuration] = useState(10);
  const [customDuration, setCustomDuration] = useState(10);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [ambientMode, setAmbientMode] = useState(false);
  const [ready, setReady] = useState(false);
  const [selectedMood, setSelectedMood] = useState<MoodValue | null>(null);
  const [reflectionText, setReflectionText] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fetchedRef = useRef(false);

  // Entrance delay
  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 400);
    return () => clearTimeout(timer);
  }, []);

  // Fetch AI suggestion — skip if pre-generated data was passed from Home
  useEffect(() => {
    if (fetchedRef.current) return;
    if (isPending) return;
    if (!isPro || groundingActivities.length === 0) return;

    fetchedRef.current = true;

    // Use pre-generated data from Home if available
    if (navState.preGenerated) {
      const pg = navState.preGenerated;
      setActivity(pg.activity);
      setSuggestion(pg.suggestion);
      const dur = pg.duration || 10;
      setSuggestedDuration(dur);
      setCustomDuration(dur);
      setInsight(pg.insight || null);
      setArticle(pg.article || null);
      setPhase('suggestion');
      return;
    }

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
        const dur = data.duration || 10;
        setSuggestedDuration(dur);
        setCustomDuration(dur);
        setInsight(data.insight || null);
        setArticle(data.article || null);
      } catch {
        const fallback = groundingActivities[Math.floor(Math.random() * groundingActivities.length)];
        setActivity(fallback);
        setSuggestion(t('ground.fallbackSuggestion', { activity: fallback }));
        setSuggestedDuration(10);
        setCustomDuration(10);
      }
      setPhase('suggestion');
    };

    fetchSuggestion();
  }, [isPending, isPro, groundingActivities, btcData, severity, language, t, navState.preGenerated]);

  // Timer
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            hapticFeedback('success');
            playGroundingChime();
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
    playGroundingChime();
    setPhase('checkin');
  }, []);

  const handleMoodSelect = useCallback((_mood: MoodValue) => {
    hapticFeedback('light');
    setSelectedMood(_mood);
    setPhase('reflect');
  }, []);

  const handleMoodSkip = useCallback(() => {
    setPhase('reflect');
  }, []);

  const handleComplete = useCallback(async () => {
    hapticFeedback('medium');

    // Save as practice_entry
    if (user) {
      const entry: any = {
        user_id: user.id,
        type: 'grounding',
        mood: selectedMood || null,
        duration_seconds: selectedDuration ? selectedDuration * 60 : null,
        body: reflectionText.trim() || null,
        trigger_text: activity || null,
      };
      supabase.from('practice_entries').insert(entry).then(() => {});
    }

    setPhase('done');
  }, [user, selectedMood, selectedDuration, reflectionText, activity]);

  const handleReturn = useCallback(() => {
    navigate('/', { replace: true });
  }, [navigate]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress = selectedDuration ? 1 - timeLeft / (selectedDuration * 60) : 0;

  // Growing plant stages based on progress
  const plantStage = progress < 0.2 ? 0 : progress < 0.4 ? 1 : progress < 0.6 ? 2 : progress < 0.8 ? 3 : 4;

  // Loading
  if (isPending || !ready) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <Loader2 className="h-4 w-4 text-muted-foreground/30 animate-spin" />
        </motion.div>
      </div>
    );
  }

  // Non-Pro
  if (!isPro) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
        <button onClick={handleReturn} className="fixed top-5 right-5 p-3 rounded-full bg-muted/40 text-muted-foreground/40 hover:text-foreground/60 transition-all z-[60]" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
        <motion.div className="text-center space-y-5 px-8 max-w-xs" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
          <Anchor className="h-5 w-5 text-muted-foreground/30 mx-auto" />
          <p className="text-sm text-muted-foreground/60 leading-relaxed">
            {t('ground.proDesc', 'AI-guided grounding sessions pick the right activity for this moment and share something you didn\'t know about it.')}
          </p>
          <p className="text-[10px] font-mono text-muted-foreground/30 tracking-wider uppercase">{t('pro.badge')}</p>
        </motion.div>
      </div>
    );
  }

  // No activities
  if (groundingActivities.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
        <button onClick={handleReturn} className="fixed top-5 right-5 p-3 rounded-full bg-muted/40 text-muted-foreground/40 hover:text-foreground/60 transition-all z-[60]" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
        <motion.div className="text-center space-y-4 px-8 max-w-xs" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
          <Anchor className="h-5 w-5 text-muted-foreground/30 mx-auto" />
          <p className="text-sm font-mono text-muted-foreground">{t('ground.noActivities')}</p>
          <p className="text-xs text-muted-foreground/50">{t('ground.noActivitiesHint')}</p>
          <button onClick={() => navigate('/settings', { replace: true })} className="text-xs font-mono text-primary/60 hover:text-primary underline underline-offset-4 transition-colors">
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
      style={{ background: 'linear-gradient(160deg, hsl(var(--background)) 0%, hsl(var(--muted)) 50%, hsl(var(--background)) 100%)' }}
    >
      {/* Ambient orb */}
      <motion.div
        className="fixed top-1/3 left-1/2 -translate-x-1/2 w-[300px] h-[300px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.04) 0%, transparent 70%)', filter: 'blur(60px)' }}
        animate={prefersReducedMotion ? {} : { scale: [1, 1.08, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Close */}
      <button onClick={handleReturn} className="fixed top-5 right-5 p-3 rounded-full bg-muted/40 backdrop-blur-sm text-muted-foreground/40 hover:text-foreground/60 hover:bg-muted/60 transition-all duration-300 z-[60]" aria-label="Close">
        <X className="h-4 w-4" />
      </button>

      <div className="relative z-10 max-w-sm mx-auto px-6 flex flex-col items-center justify-center min-h-screen py-12">
        <AnimatePresence mode="wait">
          {/* Loading */}
          {phase === 'idle' && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center space-y-4">
              <Loader2 className="h-4 w-4 text-muted-foreground/30 mx-auto animate-spin" />
              <p className="text-[10px] font-mono text-muted-foreground/30 tracking-[0.2em] uppercase">
                {t('ground.finding', 'Finding what fits...')}
              </p>
            </motion.div>
          )}

          {/* Suggestion */}
          {phase === 'suggestion' && (
            <motion.div key="suggestion" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.7, ease }} className="text-center space-y-7 w-full">
              <motion.div className="space-y-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                <p className="text-[10px] font-mono tracking-[0.25em] uppercase text-muted-foreground/40">
                  {t('ground.title', 'Ground yourself')}
                </p>
                <div className="h-px w-8 bg-foreground/10 mx-auto" />
              </motion.div>

              <motion.p className="text-xl font-mono text-foreground/80" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                {activity}
              </motion.p>

              <motion.p className="text-sm text-muted-foreground/60 leading-relaxed max-w-[280px] mx-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
                {suggestion}
              </motion.p>

              {/* Knowledge card */}
              {(insight || article) && (
                <motion.div className="mx-auto max-w-[280px] rounded-lg border border-border/20 bg-muted/15 px-4 py-3.5 space-y-2.5 text-left" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0, duration: 0.5 }}>
                  {insight && (
                    <>
                      <p className="text-[9px] font-mono text-muted-foreground/30 tracking-[0.2em] uppercase">{t('ground.didYouKnow', 'Did you know?')}</p>
                      <p className="text-xs text-muted-foreground/50 leading-relaxed">{insight}</p>
                    </>
                  )}
                  {article && (
                    <div className={insight ? 'pt-2 border-t border-border/10' : ''}>
                      <p className="text-xs text-muted-foreground/40 leading-relaxed">{article.snippet}</p>
                      {article.url && (
                        <a href={article.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-[10px] font-mono text-primary/40 hover:text-primary/70 transition-colors">
                          <ExternalLink className="h-2.5 w-2.5" />
                          {t('ground.readMore', 'Read more')}
                        </a>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Duration slider */}
              <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
                <p className="text-[9px] font-mono text-muted-foreground/30 tracking-[0.2em] uppercase">
                  {t('ground.setTimer', 'Set a timer')}
                </p>

                <div className="space-y-3 max-w-[260px] mx-auto">
                  <p className="text-2xl font-mono text-foreground/70 tabular-nums">
                    {customDuration} <span className="text-sm text-muted-foreground/30">min</span>
                  </p>
                  <input
                    type="range"
                    min={MIN_DURATION}
                    max={MAX_DURATION}
                    value={customDuration}
                    onChange={(e) => setCustomDuration(parseInt(e.target.value))}
                    className="w-full accent-primary/40 h-1 bg-border/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary/50 [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:shadow-none"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-muted-foreground/20">
                    <span>{MIN_DURATION} min</span>
                    <span>{MAX_DURATION} min</span>
                  </div>
                </div>

                <button
                  onClick={() => startTimer(customDuration)}
                  className="px-8 py-2.5 rounded-lg border border-primary/20 bg-primary/5 text-foreground/70 hover:bg-primary/10 transition-colors text-xs font-mono tracking-wider"
                >
                  {t('ground.begin', 'Begin')}
                </button>

                <button onClick={skipTimer} className="block mx-auto text-[10px] font-mono text-muted-foreground/20 hover:text-muted-foreground/50 transition-colors">
                  {t('ground.skipTimer', 'Skip timer')}
                </button>
              </motion.div>
            </motion.div>
          )}

          {/* Timer */}
          {phase === 'timer' && (
            <motion.div key="timer" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.5, ease }} className="text-center space-y-10 w-full">
              {/* Activity label */}
              {!ambientMode && (
                <motion.p className="text-xs font-mono text-muted-foreground/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {activity}
                </motion.p>
              )}

              {/* Plant growth visualization */}
              <div className="relative w-48 h-48 mx-auto flex items-end justify-center">
                {/* Soil/base */}
                <div className="absolute bottom-0 w-full h-3 rounded-full bg-muted/30" />

                {/* Stem */}
                <motion.div
                  className="absolute bottom-3 left-1/2 -translate-x-1/2 w-0.5 rounded-full origin-bottom"
                  style={{ background: 'hsl(var(--primary) / 0.3)' }}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.min(progress * 120, 120)}px` }}
                  transition={{ duration: 1, ease }}
                />

                {/* Leaves — appear at stages */}
                {plantStage >= 1 && (
                  <motion.div
                    className="absolute left-1/2 w-5 h-3 rounded-full origin-bottom-left"
                    style={{ background: 'hsl(var(--primary) / 0.2)', bottom: `${35}px`, transform: 'translateX(-2px) rotate(-30deg)' }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8, ease }}
                  />
                )}
                {plantStage >= 2 && (
                  <motion.div
                    className="absolute left-1/2 w-6 h-3.5 rounded-full origin-bottom-right"
                    style={{ background: 'hsl(var(--primary) / 0.2)', bottom: `${60}px`, transform: 'translateX(-14px) rotate(25deg)' }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8, ease }}
                  />
                )}
                {plantStage >= 3 && (
                  <motion.div
                    className="absolute left-1/2 w-5 h-3 rounded-full origin-bottom-left"
                    style={{ background: 'hsl(var(--primary) / 0.25)', bottom: `${85}px`, transform: 'translateX(-2px) rotate(-20deg)' }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8, ease }}
                  />
                )}
                {plantStage >= 4 && (
                  <motion.div
                    className="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full"
                    style={{ background: 'hsl(var(--primary) / 0.3)', bottom: `${120}px` }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [0, 1.2, 1], opacity: 1 }}
                    transition={{ duration: 1, ease }}
                  />
                )}

                {/* Time display — hidden in ambient mode */}
                {!ambientMode && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-3xl font-mono text-foreground/60 tabular-nums">{formatTime(timeLeft)}</p>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-5">
                <button
                  onClick={() => setAmbientMode(!ambientMode)}
                  className="p-3 rounded-full border border-border/15 bg-transparent text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
                  aria-label={ambientMode ? 'Show time' : 'Hide time'}
                >
                  {ambientMode ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </button>

                <button onClick={togglePause} className="p-4 rounded-full border border-border/20 bg-muted/10 hover:bg-muted/30 transition-colors">
                  {isRunning ? <Pause className="h-4 w-4 text-foreground/50" /> : <Play className="h-4 w-4 text-foreground/50" />}
                </button>

                <div className="w-[42px]" /> {/* Spacer for centering */}
              </div>

              <button onClick={skipTimer} className="text-[10px] font-mono text-muted-foreground/20 hover:text-muted-foreground/50 transition-colors">
                {t('ground.imDone', 'I\'m done')}
              </button>
            </motion.div>
          )}

          {/* Check-in — soft mood picker */}
          {phase === 'checkin' && (
            <motion.div key="checkin" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.8, ease }} className="text-center space-y-10 w-full">
              <div className="space-y-3">
                <p className="text-[10px] font-mono tracking-[0.25em] uppercase text-muted-foreground/40">{t('ground.checkIn', 'Check in')}</p>
                <div className="h-px w-8 bg-foreground/10 mx-auto" />
                <p className="text-sm text-muted-foreground/50 leading-relaxed">
                  {t('moodCheck.howAreYouFeelingNow', 'How are you feeling now?')}
                </p>
              </div>

              <div className="grid grid-cols-4 gap-x-4 gap-y-6 max-w-[280px] mx-auto">
                {(['fomo', 'excited', 'greedy', 'anxious', 'calm', 'detached', 'uncertain', 'fearful'] as const).map((mood, i) => (
                  <motion.button
                    key={mood}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.15 + i * 0.06, ease }}
                    onClick={() => handleMoodSelect(mood)}
                    className="flex flex-col items-center gap-2 group"
                  >
                    <motion.div
                      className="w-12 h-12 rounded-full flex items-center justify-center border border-border/30 bg-muted/30 backdrop-blur-sm transition-all duration-300 group-hover:border-primary/30 group-hover:bg-primary/5 group-hover:scale-110"
                      whileTap={{ scale: 0.92 }}
                    >
                      <MoodIcon mood={mood} size={22} className="text-muted-foreground/60 transition-colors duration-300 group-hover:text-foreground/70" />
                    </motion.div>
                    <span className="text-[8px] font-mono tracking-wider uppercase text-muted-foreground/40 transition-colors duration-300 group-hover:text-muted-foreground/70">
                      {t(`moodCheck.moods.${mood}`)}
                    </span>
                  </motion.button>
                ))}
              </div>

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                onClick={handleMoodSkip}
                className="text-[10px] font-mono text-muted-foreground/30 hover:text-muted-foreground/50 transition-colors duration-300"
              >
                {t('common.skip')}
              </motion.button>
            </motion.div>
          )}

          {/* Post-session reflection */}
          {phase === 'reflect' && (
            <motion.div key="reflect" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.6, ease }} className="text-center space-y-6 w-full">
              <div className="space-y-2">
                <p className="text-[10px] font-mono tracking-[0.25em] uppercase text-muted-foreground/40">
                  {t('ground.reflectTitle', 'A brief note')}
                </p>
                <div className="h-px w-8 bg-foreground/10 mx-auto" />
              </div>

              <p className="text-sm text-muted-foreground/50 leading-relaxed max-w-[260px] mx-auto">
                {t('ground.reflectPrompt', 'Anything you noticed during this moment? This is just for you.')}
              </p>

              <textarea
                value={reflectionText}
                onChange={(e) => setReflectionText(e.target.value)}
                placeholder={t('ground.reflectPlaceholder', 'Optional...')}
                rows={3}
                className="w-full max-w-[280px] mx-auto block bg-transparent border border-border/20 rounded-lg px-4 py-3 text-sm font-mono text-foreground/70 placeholder:text-muted-foreground/20 focus:border-border/40 outline-none resize-none transition-colors"
              />

              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={handleComplete}
                  className="px-8 py-2.5 rounded-lg border border-primary/20 bg-primary/5 text-foreground/70 hover:bg-primary/10 transition-colors text-xs font-mono tracking-wider"
                >
                  {t('common.done', 'Done')}
                </button>
                <button
                  onClick={handleComplete}
                  className="text-[10px] font-mono text-muted-foreground/20 hover:text-muted-foreground/50 transition-colors"
                >
                  {t('common.skip', 'Skip')}
                </button>
              </div>
            </motion.div>
          )}

          {/* Done */}
          {phase === 'done' && (
            <motion.div key="done" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease }} className="text-center space-y-6">
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3, duration: 0.5 }}>
                <Anchor className="h-5 w-5 text-primary/30 mx-auto" />
              </motion.div>

              <motion.p className="text-sm text-foreground/60 leading-relaxed max-w-[260px] mx-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                {t('ground.doneMessage', 'You took a moment. That matters.')}
              </motion.p>

              <motion.div className="flex flex-col items-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
                <button onClick={handleReturn} className="text-xs font-mono text-muted-foreground/30 hover:text-foreground/60 transition-colors underline underline-offset-4">
                  {t('ground.return', 'Return')}
                </button>
                <button onClick={() => navigate('/ground/history', { replace: true })} className="text-[10px] font-mono text-muted-foreground/20 hover:text-muted-foreground/50 transition-colors tracking-[0.15em] uppercase">
                  {t('ground.viewHistory', 'View journal')}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

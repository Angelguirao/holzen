import { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Play, Pause, Anchor, Loader2, ExternalLink, Eye, EyeOff, Sparkles } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useHolzen } from '@/hooks/use-holzen';
import { useAuth } from '@/hooks/use-auth';
import { hapticFeedback } from '@/lib/haptics';
import { playGroundingChime } from '@/lib/grounding-chime';
import { type MoodValue } from '@/components/MoodCheck';
import { MoodIcon } from '@/components/icons/MoodIcon';
import { useProGate } from '@/hooks/use-pro-gate';
import { companionFallbacksDisabledClient } from '@/lib/companion-strict';
import { parseGroundLocationState } from '@/lib/router-location-state';
import { TOOLS, settingsSectionPath } from '@/lib/app-routes';
import { Textarea } from '@/components/ui/textarea';
import { parseEdgeFunctionError, toUserFacingAiErrorMessage } from '@/lib/edge-function-error';
import { trackEvent } from '@/lib/posthog';
import { invokeEdge } from '@/lib/invoke-edge';
import { practiceEntriesWeeklyCountQueryKey } from '@/components/PracticeWidget';
import { practicePrimarySuggestionQueryKey } from '@/lib/practice-primary-suggestion-query';
import { toolsHubDataQueryKey } from '@/lib/tools-hub-data-query';
import { groundHistoryEntriesQueryKey, groundHistoryStatsQueryKey } from '@/lib/ground-history-query';
import { invalidateHistoryCalendarActivities } from '@/lib/history-calendar-activities-query-key';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

type Phase = 'idle' | 'pick' | 'suggestion' | 'timer' | 'checkin' | 'reflect' | 'done';

type SuggestGroundingPayload = {
  activity?: string;
  suggestion?: string;
  duration?: number;
  insight?: string | null;
  article?: { snippet: string; url: string | null } | null;
  error?: string;
  code?: string;
};

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];
const MIN_DURATION = 1;
const MAX_DURATION = 30;

export default function Ground() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const navState = parseGroundLocationState(location.state);
  const prefersReducedMotion = useReducedMotion();
  const { groundingActivities, btcData, severity, language } = useHolzen();
  const { user } = useAuth();
  const queryClient = useQueryClient();
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
  const [hideTimeDisplay, setHideTimeDisplay] = useState(false);
  const [ready, setReady] = useState(false);
  const [selectedMood, setSelectedMood] = useState<MoodValue | null>(null);
  const [reflectionText, setReflectionText] = useState('');
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [refreshDialogOpen, setRefreshDialogOpen] = useState(false);
  const [isRefreshInFlight, setIsRefreshInFlight] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fetchedRef = useRef(false);
  const ritualSuggestedTracked = useRef(false);
  const strictNoFallback = companionFallbacksDisabledClient();
  const fetchAbortRef = useRef<AbortController | null>(null);

  // Entrance delay
  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 400);
    return () => clearTimeout(timer);
  }, []);

  // Free plan: start on activity picker (before paint flash of idle).
  useLayoutEffect(() => {
    if (isPending) return;
    if (isPro) return;
    if (groundingActivities.length === 0) return;
    setPhase((p) => (p === 'idle' ? 'pick' : p));
  }, [isPending, isPro, groundingActivities.length]);

  // If the user upgrades while on the free picker, switch to the Pro loading path.
  useEffect(() => {
    if (isPro && phase === 'pick') setPhase('idle');
  }, [isPro, phase]);

  useEffect(() => {
    return () => {
      fetchAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (phase !== 'suggestion' || !suggestion || suggestionError) return;
    if (ritualSuggestedTracked.current) return;
    ritualSuggestedTracked.current = true;
    try {
      trackEvent('ritual.suggested', { ritual_key: 'ground' });
    } catch {
      /* no-op */
    }
  }, [phase, suggestion, suggestionError]);

  const runSuggestGrounding = useCallback(
    async (opts: { mode: 'initial' | 'regenerate'; signal: AbortSignal }) => {
      const { mode, signal } = opts;
      if (mode === 'regenerate') {
        ritualSuggestedTracked.current = false;
        setPhase('idle');
      }
      setSuggestionError(null);
      try {
        const context = btcData
          ? `BTC is ${btcData.direction === 'down' ? 'down' : 'up'} ${Math.abs(btcData.changePercent).toFixed(1)}% in the last 24 hours.`
          : undefined;

        const { data, error } = await invokeEdge<SuggestGroundingPayload>('suggest-grounding', {
          body: { groundingActivities, context, severity, language, consumeQuota: true },
          signal,
        });

        if (signal.aborted) return;

        const apiError =
          data && typeof data === 'object' && 'error' in data && typeof (data as { error?: unknown }).error === 'string'
            ? (data as { error: string }).error
            : null;
        const apiCode =
          data && typeof data === 'object' && 'code' in data && typeof (data as { code?: unknown }).code === 'string'
            ? (data as { code: string }).code
            : null;

        if (apiCode === 'ai_action_quota_exceeded' || apiCode === 'ai_action_upgrade_required') {
          setSuggestionError(apiError ?? t('ground.suggestionFailed'));
          setActivity('');
          setSuggestion('');
          setInsight(null);
          setArticle(null);
          setPhase('suggestion');
          return;
        }

        if (strictNoFallback) {
          if (error || !data || apiError) {
            setSuggestionError(t('ground.suggestionFailed'));
            setActivity('');
            setSuggestion('');
            setInsight(null);
            setArticle(null);
            setPhase('suggestion');
            return;
          }
        } else {
          if (error || !data) throw new Error('Failed to get suggestion');
        }

        setActivity(data.activity ?? '');
        setSuggestion(data.suggestion ?? '');
        const dur = data.duration || 10;
        setSuggestedDuration(dur);
        setCustomDuration(dur);
        setInsight(data.insight ?? null);
        setArticle(data.article ?? null);
      } catch (error) {
        if (signal.aborted) return;
        const parsed = await parseEdgeFunctionError(error);
        const message = toUserFacingAiErrorMessage(parsed, t('ground.suggestionFailed'));
        if (parsed.code === 'ai_action_quota_exceeded' || parsed.code === 'ai_action_upgrade_required') {
          setSuggestionError(message);
          setActivity('');
          setSuggestion('');
          setInsight(null);
          setArticle(null);
          setPhase('suggestion');
          return;
        }
        if (strictNoFallback) {
          setSuggestionError(message);
          setActivity('');
          setSuggestion('');
          setInsight(null);
          setArticle(null);
        } else {
          const fallback = groundingActivities[Math.floor(Math.random() * groundingActivities.length)];
          setActivity(fallback);
          setSuggestion(t('ground.fallbackSuggestion', { activity: fallback }));
          setSuggestedDuration(10);
          setCustomDuration(10);
        }
      }
      if (!signal.aborted) {
        setPhase('suggestion');
      }
    },
    [groundingActivities, btcData, severity, language, t, strictNoFallback],
  );

  // Pro: fetch AI once on mount (or apply Home pre-generated payload).
  useEffect(() => {
    if (fetchedRef.current) return;
    if (isPending) return;
    if (!isPro || groundingActivities.length === 0) return;

    fetchedRef.current = true;

    if (navState.preGenerated) {
      setSuggestionError(null);
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

    fetchAbortRef.current?.abort();
    const ac = new AbortController();
    fetchAbortRef.current = ac;
    void runSuggestGrounding({ mode: 'initial', signal: ac.signal });
  }, [isPending, isPro, groundingActivities, navState.preGenerated, runSuggestGrounding]);

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
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft]);

  const chooseFreeActivity = useCallback(
    (act: string) => {
      hapticFeedback('light');
      ritualSuggestedTracked.current = false;
      setActivity(act);
      setSuggestion(t('ground.freeLeadIn', { activity: act }));
      setSuggestedDuration(10);
      setCustomDuration(10);
      setInsight(null);
      setArticle(null);
      setSuggestionError(null);
      setPhase('suggestion');
    },
    [t],
  );

  const chooseFreeSurprise = useCallback(() => {
    const act = groundingActivities[Math.floor(Math.random() * groundingActivities.length)];
    chooseFreeActivity(act);
  }, [groundingActivities, chooseFreeActivity]);

  const handleConfirmRefresh = useCallback(async () => {
    if (!isPro || navState.preGenerated) return;
    setIsRefreshInFlight(true);
    try {
      try {
        trackEvent('ritual.suggestion_refreshed', { ritual_key: 'ground' });
      } catch {
        /* no-op */
      }
      fetchAbortRef.current?.abort();
      const ac = new AbortController();
      fetchAbortRef.current = ac;
      await runSuggestGrounding({ mode: 'regenerate', signal: ac.signal });
    } finally {
      setIsRefreshInFlight(false);
      setRefreshDialogOpen(false);
    }
  }, [isPro, navState.preGenerated, runSuggestGrounding]);

  const startTimer = useCallback((minutes: number) => {
    hapticFeedback('light');
    try {
      trackEvent('ritual.accepted', { ritual_key: 'ground' });
    } catch {
      /* no-op */
    }
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
    try {
      trackEvent('ritual.declined', { ritual_key: 'ground' });
    } catch {
      /* no-op */
    }
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

    if (user) {
      const { error } = await supabase.from('practice_entries').insert({
        user_id: user.id,
        type: 'grounding',
        mood: selectedMood || null,
        duration_seconds: selectedDuration ? selectedDuration * 60 : null,
        body: reflectionText.trim() || null,
        trigger_text: activity || null,
      });
      if (!error) {
        void queryClient.invalidateQueries({ queryKey: practiceEntriesWeeklyCountQueryKey(user.id) });
        void queryClient.invalidateQueries({ queryKey: practicePrimarySuggestionQueryKey(user.id) });
        void queryClient.invalidateQueries({ queryKey: toolsHubDataQueryKey(user.id) });
        void queryClient.invalidateQueries({ queryKey: groundHistoryStatsQueryKey(user.id) });
        void queryClient.invalidateQueries({ queryKey: groundHistoryEntriesQueryKey(user.id) });
        invalidateHistoryCalendarActivities(queryClient, user.id);
      }
    }

    setPhase('done');
  }, [user, selectedMood, selectedDuration, reflectionText, activity, queryClient]);

  const handleReturn = useCallback(() => {
    navigate(TOOLS.hub, { replace: true });
  }, [navigate]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress = selectedDuration ? 1 - timeLeft / (selectedDuration * 60) : 0;
  const plantStage = progress < 0.2 ? 0 : progress < 0.4 ? 1 : progress < 0.6 ? 2 : progress < 0.8 ? 3 : 4;

  const showNewSuggestion =
    isPro && !navState.preGenerated && phase === 'suggestion' && !suggestionError && !isRefreshInFlight;

  if (isPending || !ready) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <Loader2 className="h-4 w-4 text-muted-foreground/30 animate-spin" />
        </motion.div>
      </div>
    );
  }

  if (groundingActivities.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background">
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
            type="button"
            onClick={() => navigate(settingsSectionPath('companions'), { replace: true })}
            className="text-xs font-sans font-medium text-nox-text-link/90 underline underline-offset-4 transition-colors hover:text-nox-text-link"
          >
            {t('ground.goToSettings')}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <AlertDialog open={refreshDialogOpen} onOpenChange={setRefreshDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('ground.newSuggestionTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('ground.newSuggestionDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRefreshInFlight}>{t('ground.newSuggestionCancel')}</AlertDialogCancel>
            <Button type="button" disabled={isRefreshInFlight} onClick={() => void handleConfirmRefresh()}>
              {isRefreshInFlight ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  {t('ground.finding')}
                </>
              ) : (
                t('ground.newSuggestionConfirm')
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <motion.div
        className="relative h-full w-full min-h-0 overflow-y-auto"
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease }}
        style={{
          background: 'linear-gradient(160deg, hsl(var(--background)) 0%, hsl(var(--muted)) 50%, hsl(var(--background)) 100%)',
        }}
      >
        <motion.div
          className="pointer-events-none fixed top-1/3 left-1/2 h-[300px] w-[300px] -translate-x-1/2 rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary) / 0.04) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
          animate={prefersReducedMotion ? {} : { scale: [1, 1.08, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative z-10 mx-auto flex min-h-full max-w-md flex-col items-center justify-center px-5 py-12 sm:px-8">
          <AnimatePresence mode="wait">
            {phase === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center space-y-4"
              >
                <Loader2 className="h-4 w-4 text-muted-foreground/30 mx-auto animate-spin" />
                <p className="text-sm text-muted-foreground">{t('ground.finding')}</p>
              </motion.div>
            )}

            {phase === 'pick' && (
              <motion.div
                key="pick"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.6, ease }}
                className="w-full max-w-sm space-y-8 text-center"
              >
                <div className="space-y-3">
                  <Anchor className="h-5 w-5 text-muted-foreground/40 mx-auto" />
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('ground.title')}</p>
                  <div className="mx-auto h-px w-10 bg-border" />
                  <p className="font-editorial text-xl leading-snug text-foreground">{t('ground.freePickTitle')}</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">{t('ground.freeSessionIntro')}</p>
                </div>

                <div className="flex flex-wrap justify-center gap-2">
                  {groundingActivities.map((act) => (
                    <button
                      key={act}
                      type="button"
                      onClick={() => chooseFreeActivity(act)}
                      className="rounded-full border border-border/60 bg-muted/30 px-3 py-1.5 text-sm text-foreground transition-colors hover:border-nox-border-focus/40 hover:bg-muted/50"
                    >
                      {act}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={chooseFreeSurprise}
                  className="text-sm font-medium text-nox-text-link underline-offset-4 transition-colors hover:text-nox-text-link/80 hover:underline"
                >
                  {t('ground.freeSurprise')}
                </button>

                <Link
                  to={settingsSectionPath('subscription')}
                  className="inline-flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  <Sparkles className="h-3.5 w-3.5" aria-hidden />
                  {t('ground.upgradeForAi')}
                </Link>
              </motion.div>
            )}

            {phase === 'suggestion' && (
              <motion.div
                key="suggestion"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.7, ease }}
                className="text-center space-y-7 w-full"
              >
                {suggestionError ? (
                  <div className="space-y-6 px-2">
                    <p className="text-sm leading-relaxed text-muted-foreground">{suggestionError}</p>
                    <button
                      type="button"
                      onClick={handleReturn}
                      className="rounded-lg border border-border bg-muted/30 px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
                    >
                      {t('ground.returnToTools')}
                    </button>
                  </div>
                ) : (
                  <>
                    <motion.div className="space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                      <p className="text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('ground.title')}</p>
                      <div className="mx-auto h-px w-10 bg-border" />
                    </motion.div>

                    <motion.p
                      className="mx-auto max-w-sm text-center font-editorial text-2xl leading-snug text-foreground sm:text-3xl"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      {activity}
                    </motion.p>

                    <motion.p
                      className="mx-auto max-w-sm text-center text-base leading-relaxed text-muted-foreground"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8 }}
                    >
                      {suggestion}
                    </motion.p>

                    <p className="mx-auto max-w-sm text-center text-[11px] leading-relaxed text-muted-foreground/70">
                      {isPro ? t('ground.sessionOneIdeaHintPro') : t('ground.sessionOneIdeaHintFree')}
                    </p>

                    {!isPro && (
                      <Link
                        to={settingsSectionPath('subscription')}
                        className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-nox-text-link underline-offset-4 transition-colors hover:text-nox-text-link/80 hover:underline"
                      >
                        <Sparkles className="h-3 w-3" aria-hidden />
                        {t('ground.upgradeForAi')}
                      </Link>
                    )}

                    {showNewSuggestion && (
                      <button
                        type="button"
                        onClick={() => setRefreshDialogOpen(true)}
                        className="text-xs font-medium uppercase tracking-wide text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                      >
                        {t('ground.newSuggestion')}
                      </button>
                    )}

                    {(insight || article) && (
                      <motion.div
                        className="mx-auto max-w-sm space-y-3 rounded-xl border border-border/40 bg-card/50 px-4 py-4 text-left shadow-sm backdrop-blur-sm"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.0, duration: 0.5 }}
                      >
                        {insight && (
                          <>
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('ground.didYouKnow')}</p>
                            <p className="text-sm leading-relaxed text-foreground/90">{insight}</p>
                          </>
                        )}
                        {article && (
                          <div className={insight ? 'space-y-2 border-t border-border/30 pt-3' : ''}>
                            <p className="text-sm leading-relaxed text-muted-foreground">{article.snippet}</p>
                            {article.url && (
                              <a
                                href={article.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-nox-text-link underline-offset-2 transition-colors hover:text-nox-text-link/80 hover:underline"
                              >
                                <ExternalLink className="h-2.5 w-2.5" />
                                {t('ground.readMore')}
                              </a>
                            )}
                          </div>
                        )}
                      </motion.div>
                    )}

                    <motion.div className="space-y-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('ground.setTimer')}</p>

                      <div className="mx-auto max-w-xs space-y-3">
                        <p className="font-mono text-3xl tabular-nums text-foreground">
                          {customDuration}{' '}
                          <span className="text-base font-sans font-normal text-muted-foreground">min</span>
                        </p>
                        <input
                          type="range"
                          min={MIN_DURATION}
                          max={MAX_DURATION}
                          value={customDuration}
                          onChange={(e) => setCustomDuration(parseInt(e.target.value, 10))}
                          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-border accent-nox-text-link [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:bg-nox-text-link [&::-webkit-slider-thumb]:shadow-none"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{MIN_DURATION} min</span>
                          <span>{MAX_DURATION} min</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => startTimer(customDuration)}
                        className="rounded-lg border border-nox-border-default/60 bg-nox-background-accent/25 px-8 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-nox-background-accent/40"
                      >
                        {t('ground.begin')}
                      </button>

                      <button
                        type="button"
                        onClick={skipTimer}
                        className="mx-auto block text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                      >
                        {t('ground.skipTimer')}
                      </button>
                    </motion.div>
                  </>
                )}
              </motion.div>
            )}

            {phase === 'timer' && (
              <motion.div
                key="timer"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.5, ease }}
                className="text-center space-y-10 w-full"
              >
                {!hideTimeDisplay && (
                  <motion.p className="text-center text-sm font-medium text-muted-foreground" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {activity}
                  </motion.p>
                )}

                <div className="relative w-48 h-48 mx-auto flex items-end justify-center">
                  <div className="absolute bottom-0 w-full h-3 rounded-full bg-muted/30" />

                  <motion.div
                    className="absolute bottom-3 left-1/2 -translate-x-1/2 w-0.5 rounded-full origin-bottom"
                    style={{ background: 'hsl(var(--primary) / 0.3)' }}
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.min(progress * 120, 120)}px` }}
                    transition={{ duration: 1, ease }}
                  />

                  {plantStage >= 1 && (
                    <motion.div
                      className="absolute left-1/2 w-5 h-3 rounded-full origin-bottom-left"
                      style={{
                        background: 'hsl(var(--primary) / 0.2)',
                        bottom: `${35}px`,
                        transform: 'translateX(-2px) rotate(-30deg)',
                      }}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.8, ease }}
                    />
                  )}
                  {plantStage >= 2 && (
                    <motion.div
                      className="absolute left-1/2 w-6 h-3.5 rounded-full origin-bottom-right"
                      style={{
                        background: 'hsl(var(--primary) / 0.2)',
                        bottom: `${60}px`,
                        transform: 'translateX(-14px) rotate(25deg)',
                      }}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.8, ease }}
                    />
                  )}
                  {plantStage >= 3 && (
                    <motion.div
                      className="absolute left-1/2 w-5 h-3 rounded-full origin-bottom-left"
                      style={{
                        background: 'hsl(var(--primary) / 0.25)',
                        bottom: `${85}px`,
                        transform: 'translateX(-2px) rotate(-20deg)',
                      }}
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

                  {!hideTimeDisplay && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className="font-mono text-4xl tabular-nums text-foreground">{formatTime(timeLeft)}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-center gap-5">
                  <button
                    type="button"
                    onClick={() => setHideTimeDisplay(!hideTimeDisplay)}
                    className="rounded-full border border-border bg-muted/20 p-3 text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                    aria-label={hideTimeDisplay ? 'Show time' : 'Hide time'}
                  >
                    {hideTimeDisplay ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={togglePause}
                    className="rounded-full border border-border bg-muted/30 p-4 transition-colors hover:bg-muted/50"
                  >
                    {isRunning ? <Pause className="h-5 w-5 text-foreground" /> : <Play className="h-5 w-5 text-foreground" />}
                  </button>

                  <div className="w-[42px]" />
                </div>

                <button
                  type="button"
                  onClick={skipTimer}
                  className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                >
                  {t('ground.imDone')}
                </button>
              </motion.div>
            )}

            {phase === 'checkin' && (
              <motion.div
                key="checkin"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease }}
                className="text-center space-y-10 w-full"
              >
                <div className="space-y-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('ground.checkIn')}</p>
                  <div className="mx-auto h-px w-10 bg-border" />
                  <p className="mx-auto max-w-xs text-center font-editorial text-xl leading-snug text-foreground">
                    {t('moodCheck.howAreYouFeelingNow')}
                  </p>
                </div>

                <div className="mx-auto grid max-w-sm grid-cols-4 gap-x-3 gap-y-5 sm:gap-x-4 sm:gap-y-6">
                  {(['fomo', 'excited', 'greedy', 'anxious', 'calm', 'detached', 'uncertain', 'fearful'] as const).map((mood, i) => (
                    <motion.button
                      key={mood}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.15 + i * 0.06, ease }}
                      onClick={() => handleMoodSelect(mood)}
                      className="group flex flex-col items-center gap-2"
                    >
                      <motion.div
                        className="flex h-12 w-12 items-center justify-center rounded-full border border-border/60 bg-muted/40 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:border-nox-border-focus/40 group-hover:bg-muted/55"
                        whileTap={{ scale: 0.92 }}
                      >
                        <MoodIcon mood={mood} size={22} className="text-muted-foreground transition-colors duration-300 group-hover:text-foreground" />
                      </motion.div>
                      <span className="max-w-[4.5rem] text-center text-[10px] font-medium leading-tight text-muted-foreground transition-colors duration-300 group-hover:text-foreground sm:max-w-none sm:text-xs">
                        {t(`moodCheck.moods.${mood}`)}
                      </span>
                    </motion.button>
                  ))}
                </div>

                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  type="button"
                  onClick={handleMoodSkip}
                  className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                >
                  {t('common.skip')}
                </motion.button>
              </motion.div>
            )}

            {phase === 'reflect' && (
              <motion.div
                key="reflect"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease }}
                className="text-center space-y-6 w-full"
              >
                <div className="space-y-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('ground.reflectTitle')}</p>
                  <div className="mx-auto h-px w-10 bg-border" />
                </div>

                <p className="mx-auto max-w-sm text-center text-base leading-relaxed text-muted-foreground">{t('ground.reflectPrompt')}</p>

                <Textarea
                  value={reflectionText}
                  onChange={(e) => setReflectionText(e.target.value)}
                  placeholder={t('ground.reflectPlaceholder')}
                  rows={4}
                  className="mx-auto block max-w-sm min-h-[7.5rem] text-base leading-relaxed"
                />

                <div className="flex flex-col items-center gap-3">
                  <button
                    type="button"
                    onClick={handleComplete}
                    className="rounded-lg border border-nox-border-default/60 bg-nox-background-accent/25 px-8 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-nox-background-accent/40"
                  >
                    {t('common.done')}
                  </button>
                  <button
                    type="button"
                    onClick={handleComplete}
                    className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                  >
                    {t('common.skip')}
                  </button>
                </div>
              </motion.div>
            )}

            {phase === 'done' && (
              <motion.div
                key="done"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease }}
                className="text-center space-y-6"
              >
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3, duration: 0.5 }}>
                  <Anchor className="h-5 w-5 text-muted-foreground/40 mx-auto" />
                </motion.div>

                <motion.p
                  className="mx-auto max-w-sm text-center font-editorial text-xl leading-relaxed text-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  {t('ground.doneMessage')}
                </motion.p>

                <motion.div className="flex flex-col items-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
                  <button
                    type="button"
                    onClick={handleReturn}
                    className="text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                  >
                    {t('ground.returnToTools')}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(TOOLS.groundHistory, { replace: true })}
                    className="text-xs font-medium uppercase tracking-wide text-nox-text-link underline-offset-4 transition-colors hover:text-nox-text-link/80 hover:underline"
                  >
                    {t('ground.viewHistory')}
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}

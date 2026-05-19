import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { practiceEntriesWeeklyCountQueryKey } from '@/legacy/full-shell/src/lib/practice-entries-weekly-count-query';
import { practicePrimarySuggestionQueryKey } from '@/legacy/full-shell/src/lib/practice-primary-suggestion-query';
import { toolsHubDataQueryKey } from '@/lib/tools-hub-data-query';
import { invalidateHistoryCalendarActivities } from '@/legacy/full-shell/src/lib/history-calendar-activities-query-key';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/public';
import { toast } from 'sonner';
import { hapticFeedback } from '@/lib/haptics';
import { Check, Loader2 } from 'lucide-react';

/**
 * 5-4-3-2-1 grounding exercise:
 * 5 things you see, 4 you hear, 3 you feel, 2 you smell, 1 you taste
 */
const STEPS = [
  { count: 5, sense: 'see' },
  { count: 4, sense: 'hear' },
  { count: 3, sense: 'feel' },
  { count: 2, sense: 'smell' },
  { count: 1, sense: 'taste' },
] as const;

interface Props {
  onComplete: () => void;
  textColor: string;
  ringColor: string;
  glowColor: string;
}

export function BodyScan({ onComplete, textColor, ringColor, glowColor }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const prefersReducedMotion = useReducedMotion();
  const [stepIndex, setStepIndex] = useState(0);
  const [acknowledged, setAcknowledged] = useState(0);
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const [waitingSave, setWaitingSave] = useState(false);
  const [completionSaveFailed, setCompletionSaveFailed] = useState(false);
  const startTime = useRef(Date.now());

  const currentStep = STEPS[stepIndex];

  const persistBodyScan = useCallback(async () => {
    if (!user) return { ok: false as const };
    const duration = Math.round((Date.now() - startTime.current) / 1000);
    const { error } = await supabase.from('practice_entries').insert({
      user_id: user.id,
      type: 'bodyscan',
      duration_seconds: duration,
    });
    if (error) return { ok: false as const, error };
    void queryClient.invalidateQueries({ queryKey: practiceEntriesWeeklyCountQueryKey(user.id) });
    void queryClient.invalidateQueries({ queryKey: practicePrimarySuggestionQueryKey(user.id) });
    void queryClient.invalidateQueries({ queryKey: toolsHubDataQueryKey(user.id) });
    invalidateHistoryCalendarActivities(queryClient, user.id);
    return { ok: true as const };
  }, [user, queryClient]);

  const finishAfterSave = useCallback(() => {
    setDone(true);
    hapticFeedback('success');
    setTimeout(onComplete, 2000);
  }, [onComplete]);

  const handleRetryBodyScanSave = useCallback(async () => {
    setWaitingSave(true);
    const result = await persistBodyScan();
    setWaitingSave(false);
    if (result.ok) {
      setCompletionSaveFailed(false);
      finishAfterSave();
    } else {
      toast.error(t('practice.bodyScanSaveFailed'));
    }
  }, [persistBodyScan, finishAfterSave, t]);

  const handleContinueWithoutBodyScanSave = useCallback(() => {
    setCompletionSaveFailed(false);
    finishAfterSave();
  }, [finishAfterSave]);

  const handleAck = useCallback(async () => {
    if (waitingSave || completionSaveFailed) return;
    hapticFeedback('light');
    const next = acknowledged + 1;
    if (next >= currentStep.count) {
      if (stepIndex + 1 >= STEPS.length) {
        if (!user) {
          toast.info(t('practice.bodyScanNotSaved'));
          finishAfterSave();
          return;
        }
        setWaitingSave(true);
        const result = await persistBodyScan();
        setWaitingSave(false);
        if (!result.ok) {
          toast.error(t('practice.bodyScanSaveFailed'));
          setCompletionSaveFailed(true);
          return;
        }
        finishAfterSave();
        return;
      }
      setStepIndex(stepIndex + 1);
      setAcknowledged(0);
    } else {
      setAcknowledged(next);
    }
  }, [
    waitingSave,
    completionSaveFailed,
    acknowledged,
    currentStep,
    stepIndex,
    user,
    t,
    persistBodyScan,
    finishAfterSave,
  ]);

  const progress = STEPS.slice(0, stepIndex).reduce((sum, s) => sum + s.count, 0) + acknowledged;
  const total = STEPS.reduce((sum, s) => sum + s.count, 0);
  const progressPercent = (progress / total) * 100;

  return (
    <motion.div
      className="flex flex-col items-center gap-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <AnimatePresence mode="wait">
        {!started ? (
          <motion.div key="intro" className="flex flex-col items-center gap-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p className="text-xs font-mono text-center leading-relaxed max-w-[260px]" style={{ color: textColor, opacity: 0.6 }}>
              {t('practice.groundingIntro')}
            </p>
            <button
              onClick={() => { setStarted(true); startTime.current = Date.now(); hapticFeedback('light'); }}
              className="text-[10px] font-mono tracking-[0.3em] uppercase"
              style={{ color: textColor, opacity: 0.7 }}
            >
              {t('common.begin')}
            </button>
          </motion.div>
        ) : done ? (
          <motion.div key="done" className="flex flex-col items-center gap-4" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
            <Check className="h-8 w-8" style={{ color: textColor, opacity: 0.6 }} />
            <p className="text-[10px] font-mono tracking-[0.3em] uppercase" style={{ color: textColor, opacity: 0.5 }}>
              {t('practice.grounded')}
            </p>
          </motion.div>
        ) : (
          <motion.div key={`step-${stepIndex}`} className="flex flex-col items-center gap-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {completionSaveFailed ? (
              <div className="flex flex-col items-center gap-5 max-w-[280px] text-center">
                <p className="text-xs font-mono leading-relaxed" style={{ color: textColor, opacity: 0.75 }}>
                  {t('practice.bodyScanSaveFailed')}
                </p>
                <button
                  type="button"
                  onClick={() => void handleRetryBodyScanSave()}
                  disabled={waitingSave}
                  className="text-[10px] font-mono tracking-[0.2em] uppercase px-4 py-2 rounded-md border transition-opacity disabled:opacity-40"
                  style={{ borderColor: ringColor, color: textColor }}
                >
                  {waitingSave ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {t('common.loading')}
                    </span>
                  ) : (
                    t('practice.bodyScanRetrySave')
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleContinueWithoutBodyScanSave}
                  disabled={waitingSave}
                  className="text-[10px] font-mono tracking-[0.2em] uppercase opacity-50 hover:opacity-80 transition-opacity disabled:opacity-20"
                  style={{ color: textColor }}
                >
                  {t('practice.bodyScanContinueWithoutSave')}
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <svg width="120" height="120" className={waitingSave ? 'opacity-40' : undefined}>
                    <circle cx="60" cy="60" r="54" fill="none" stroke={ringColor} strokeWidth="1" opacity={0.2} />
                    <circle
                      cx="60" cy="60" r="54" fill="none" stroke={ringColor} strokeWidth="2"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 54}`}
                      strokeDashoffset={`${2 * Math.PI * 54 * (1 - progressPercent / 100)}`}
                      transform="rotate(-90 60 60)"
                      style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    {waitingSave ? (
                      <Loader2 className="h-8 w-8 animate-spin" style={{ color: textColor, opacity: 0.5 }} />
                    ) : (
                      <span className="font-mono text-3xl" style={{ color: textColor, opacity: 0.5 }}>
                        {currentStep.count - acknowledged}
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs font-mono text-center tracking-wider" style={{ color: textColor, opacity: 0.6 }}>
                  {t(`practice.sense_${currentStep.sense}`, { count: currentStep.count - acknowledged })}
                </p>

                <div className="flex gap-2">
                  {Array.from({ length: currentStep.count }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-3 h-3 rounded-full"
                      style={{
                        background: i < acknowledged ? ringColor : 'transparent',
                        border: `1px solid ${ringColor}`,
                        opacity: i < acknowledged ? 0.8 : 0.3,
                      }}
                      animate={i < acknowledged ? { scale: [1, 1.3, 1] } : {}}
                      transition={{ duration: 0.3 }}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => void handleAck()}
                  disabled={waitingSave}
                  className="w-16 h-16 rounded-full transition-all active:scale-95 disabled:opacity-40"
                  style={{
                    border: `1px solid ${ringColor}`,
                    background: `radial-gradient(circle, ${glowColor}, transparent 70%)`,
                  }}
                />

                <p className="text-[8px] font-mono tracking-[0.3em] uppercase" style={{ color: textColor, opacity: 0.2 }}>
                  {t('practice.tapToAck')}
                </p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

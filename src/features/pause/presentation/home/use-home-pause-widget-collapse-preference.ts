import { useEffect, useState } from 'react';
import {
  clearPostManualCooldownIdlePrompt,
  markHomePauseWidgetFirstVisitHandled,
  shouldExpandHomePauseWidgetFirstVisit,
  shouldShowPostManualCooldownIdlePrompt,
} from '@/features/pause/public-queries';

/** Session expand preference + first-visit / post-manual idle localStorage side effects. */
export function useHomePauseWidgetCollapsePreference(input: {
  userId: string | undefined;
  hasOpenPause: boolean;
  loading: boolean;
  manualCooldownRemainingMs: number;
}) {
  const [userExpanded, setUserExpanded] = useState(false);

  useEffect(() => {
    if (!input.userId || input.hasOpenPause || input.loading) return;
    if (input.manualCooldownRemainingMs > 0) return;
    if (!shouldExpandHomePauseWidgetFirstVisit(input.userId)) return;
    setUserExpanded(true);
  }, [input.userId, input.hasOpenPause, input.loading, input.manualCooldownRemainingMs]);

  useEffect(() => {
    if (!input.userId || !input.hasOpenPause) return;
    clearPostManualCooldownIdlePrompt(input.userId);
  }, [input.userId, input.hasOpenPause]);

  useEffect(() => {
    if (!input.userId || !input.hasOpenPause) return;
    if (!shouldExpandHomePauseWidgetFirstVisit(input.userId)) return;
    markHomePauseWidgetFirstVisitHandled(input.userId);
  }, [input.userId, input.hasOpenPause]);

  useEffect(() => {
    if (!input.userId || input.hasOpenPause || input.loading) return;
    if (input.manualCooldownRemainingMs > 0) return;
    if (!shouldShowPostManualCooldownIdlePrompt(input.userId)) return;
    setUserExpanded(true);
  }, [
    input.userId,
    input.hasOpenPause,
    input.loading,
    input.manualCooldownRemainingMs,
  ]);

  const postManualCooldownIdle =
    Boolean(input.userId) &&
    !input.hasOpenPause &&
    input.manualCooldownRemainingMs <= 0 &&
    shouldShowPostManualCooldownIdlePrompt(input.userId);

  return { userExpanded, setUserExpanded, postManualCooldownIdle };
}

import { useEffect, useState } from 'react';
import { Bug, Lightbulb, HelpCircle, MessageSquareText, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { enqueueAction } from '@/lib/offline-queue';
import { useTranslation } from 'react-i18next';
import { getCid } from '@/lib/cid';
import { getPostHog, trackEvent } from '@/lib/posthog';
import type { OpenFeedbackDetail } from '@/components/ErrorBoundary';

type Category = 'bug' | 'feature' | 'question';

const CATEGORIES: ReadonlyArray<{
  value: Category;
  labelKey: string;
  icon: typeof Bug;
  descKey: string;
}> = [
  { value: 'bug', labelKey: 'feedback.bug', icon: Bug, descKey: 'feedback.bugDesc' },
  { value: 'feature', labelKey: 'feedback.feature', icon: Lightbulb, descKey: 'feedback.featureDesc' },
  { value: 'question', labelKey: 'feedback.question', icon: HelpCircle, descKey: 'feedback.questionDesc' },
];

/**
 * Safely read the PostHog session id — PostHog exposes it via `get_session_id`, but only after
 * a session has been established. We guard in case the SDK ever drops / renames the method.
 */
function getPostHogSessionId(): string | undefined {
  const ph = getPostHog();
  if (!ph) return undefined;
  try {
    const getter = (ph as unknown as { get_session_id?: () => string }).get_session_id;
    if (typeof getter === 'function') return getter.call(ph);
  } catch {
    /* no-op */
  }
  return undefined;
}

/**
 * Floating feedback button + sheet.
 *
 * Two entry points:
 *   1. The user clicks the floating button and fills in a freeform report.
 *   2. The root `ErrorBoundary` dispatches `holzen:open-feedback` with the Sentry event id
 *      and error stack. The widget opens pre-filled, defaults the category to `bug`, and
 *      forwards the diagnostic context to `send-feedback`.
 *
 * Observability context attached to every submission:
 *   - `cid` — per-tab correlation id (canonical pivot)
 *   - `page` — `location.pathname + location.search`
 *   - `user_agent` — `navigator.userAgent` (truncated server-side)
 *   - `app_version` — `__APP_VERSION__` from the Vite build
 *   - `sentry_event_id`, `error_stack` — only when arriving from the error boundary
 *   - `posthog_session_id` — UX replay anchor (session replay itself stays disabled)
 */
const DISMISSED_KEY = 'holzen:feedback-widget-dismissed';

export function FeedbackWidget() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<Category>('question');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(DISMISSED_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [errorContext, setErrorContext] = useState<{
    sentryEventId?: string;
    errorStack?: string;
  }>({});

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<OpenFeedbackDetail>).detail;
      setCategory('bug');
      setErrorContext({
        sentryEventId: detail?.sentryEventId,
        errorStack: detail?.errorStack,
      });
      const prefix = detail?.errorMessage
        ? `${t('feedback.errorPrefill', {
            defaultValue: 'Something went wrong: {{message}}\n\nWhat were you doing when this happened?',
            message: detail.errorMessage,
          })}`
        : '';
      setMessage(prefix);
      // Errors from the boundary always force the widget to surface, even if dismissed.
      setDismissed(false);
      try { localStorage.removeItem(DISMISSED_KEY); } catch { /* no-op */ }
      setOpen(true);
    };
    const restoreHandler = () => {
      try { localStorage.removeItem(DISMISSED_KEY); } catch { /* no-op */ }
      setDismissed(false);
    };
    window.addEventListener('holzen:open-feedback', handler);
    window.addEventListener('holzen:restore-feedback-widget', restoreHandler);
    return () => {
      window.removeEventListener('holzen:open-feedback', handler);
      window.removeEventListener('holzen:restore-feedback-widget', restoreHandler);
    };
  }, [t]);

  const dismissWidget = () => {
    try { localStorage.setItem(DISMISSED_KEY, '1'); } catch { /* no-op */ }
    setDismissed(true);
  };

  const reset = () => {
    setMessage('');
    setErrorContext({});
    setCategory('question');
  };

  const submit = async () => {
    if (!message.trim()) return;

    const payload = {
      category,
      message: message.trim(),
      page: `${window.location.pathname}${window.location.search}`,
      user_agent: navigator.userAgent,
      sentry_event_id: errorContext.sentryEventId,
      posthog_session_id: getPostHogSessionId(),
      cid: getCid(),
      error_stack: errorContext.errorStack,
      app_version: __APP_VERSION__,
    };

    if (!navigator.onLine) {
      enqueueAction('feedback', payload as unknown as Record<string, unknown>);
      toast(t('feedback.savedOffline'), { description: t('feedback.savedOfflineDesc') });
      reset();
      setOpen(false);
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.functions.invoke('send-feedback', { body: payload });
    setSubmitting(false);

    if (error) {
      toast.error(t('feedback.failedToSend'), { description: t('feedback.tryAgainLater') });
      return;
    }
    try {
      trackEvent('feedback.submitted', { category });
    } catch {
      /* no-op */
    }
    toast.success(t('feedback.sent'), { description: t('feedback.sentDesc') });
    reset();
    setOpen(false);
  };

  return (
    <>
      {!open && !dismissed && (
      <div className="fixed bottom-32 right-4 z-[60] group">
        <button
          type="button"
          aria-label={t('feedback.openButton', { defaultValue: 'Send feedback' })}
          onClick={() => setOpen(true)}
          className="h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-lg shadow-black/10 hover:opacity-90 flex items-center justify-center"
        >
          <MessageSquareText className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label={t('feedback.dismissWidget', { defaultValue: 'Hide feedback button' })}
          onClick={dismissWidget}
          className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-background border border-border text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md flex flex-col gap-4">
          <SheetHeader className="relative pr-8">
            <SheetTitle className="font-semibold tracking-wider uppercase text-base font-sans text-[#dbb266]">
              {t('feedback.getInTouch')}
            </SheetTitle>
            <SheetDescription className="text-base font-sans text-secondary-foreground">
              {t('feedback.description')}
            </SheetDescription>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t('feedback.close', { defaultValue: 'Close' })}
              className="absolute right-0 top-0 h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </SheetHeader>

          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              const selected = category === c.value;
              return (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={`rounded-md border px-3 py-2.5 text-left transition-colors ${
                    selected
                      ? 'border-primary bg-primary/5 text-foreground'
                      : 'border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 mb-1" />
                  <p className="font-medium font-sans text-secondary-foreground text-sm">{t(c.labelKey)}</p>
                  <p className="mt-0.5 text-sm font-sans text-muted-foreground">{t(c.descKey)}</p>
                </button>
              );
            })}
          </div>

          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('feedback.placeholder')}
            className="text-xs min-h-[140px] resize-none"
            maxLength={4000}
          />

          {errorContext.sentryEventId ? (
            <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-[10px] font-mono text-amber-900 dark:text-amber-200">
              <span className="shrink-0">
                {t('feedback.diagnosticAttached', { defaultValue: 'Diagnostic context attached' })}
              </span>
              <button
                onClick={() => setErrorContext({})}
                className="ml-auto opacity-60 hover:opacity-100"
                aria-label={t('feedback.removeDiagnostic', { defaultValue: 'Remove diagnostics' })}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : null}

          <div className="flex items-center justify-between mt-auto">
            <span className="text-[10px] text-muted-foreground">{message.length}/4000</span>
            <Button
              size="sm"
              onClick={submit}
              disabled={submitting || !message.trim()}
              className="text-xs font-mono gap-1.5"
            >
              <Send className="h-3 w-3" />
              {submitting ? t('feedback.sending') : t('feedback.send')}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

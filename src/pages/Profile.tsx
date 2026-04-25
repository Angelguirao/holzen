import { useTranslation } from 'react-i18next';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useHolzen } from '@/hooks/use-holzen';
import { useSubscription } from '@/hooks/use-subscription';
import { type ProfileTab } from '@/lib/router-location-state';
import { journeyPath, isProfileTab } from '@/lib/app-routes';
import { formatBtcPrice } from '@/lib/btc';
import { format } from 'date-fns';
import { Mail, Lock, Clock, Trash2, BarChart3, Sparkles, Award, CalendarDays, Info } from 'lucide-react';
import HistoryContent from '@/components/library/HistoryContent';
import { StatsContentV2 } from '@/components/stats/StatsContentV2';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { NoxHeaderMain } from '@/components/ui/nox-header';


import { ChartEmptyState } from '@/components/ChartEmptyState';
import { AIInsightsPanel } from '@/components/AIInsightsPanel';
import { ProLock } from '@/components/ProLock';
import { LetterViewer } from '@/components/LetterViewer';

import { BadgesPanelV2 } from '@/components/BadgesPanelV2';




import { toast } from 'sonner';
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

interface PracticeEntry {
  id: string;
  created_at: string;
  type: string;
  mood: string | null;
  intensity: number | null;
  duration_seconds: number | null;
}

const Profile = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { subscribed } = useSubscription();
  const navigate = useNavigate();
  const { tab: urlTab } = useParams<{ tab: string }>();
  const [searchParams] = useSearchParams();
  const letterIdForOpen = searchParams.get('letter');
  const [completedPauseCount, setCompletedPauseCount] = useState(0);
  const [letters, setLetters] = useState<Letter[]>([]);
  const [practiceEntries, setPracticeEntries] = useState<PracticeEntry[]>([]);
  const [holdGoal, setHoldGoal] = useState<{ type: string | null; targetMonths: number | null; targetPrice: number | null; start: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [lettersLoading, setLettersLoading] = useState(true);
  const [viewingLetter, setViewingLetter] = useState<Letter | null>(null);

  const tab: ProfileTab = urlTab && isProfileTab(urlTab) ? urlTab : 'stats';
  const [letterViewerPending, setLetterViewerPending] = useState(!!letterIdForOpen);

  // Invalid /journey/:tab → /journey/stats
  useEffect(() => {
    if (!urlTab || !isProfileTab(urlTab)) {
      navigate('/journey/stats', { replace: true });
    }
  }, [urlTab, navigate]);

  // Open letter from `?letter=`
  useEffect(() => {
    if (!letterIdForOpen) {
      setLetterViewerPending(false);
      return;
    }

    const found = letters.find((l) => l.id === letterIdForOpen && l.delivered);
    if (found) {
      setViewingLetter(found);
      setLetterViewerPending(false);
      return;
    }

    if (lettersLoading) {
      setLetterViewerPending(true);
    } else {
      setLetterViewerPending(false);
    }
  }, [letterIdForOpen, letters, lettersLoading]);

  useEffect(() => {
    document.title = t('journey.documentTitle', { defaultValue: 'Holzen — Journey' });
    return () => { document.title = 'Holzen — Pause before you act'; };
  }, [t]);

  useEffect(() => {
    if (!user) return;
    const loadCompletedPauseCount = async () => {
      const { count } = await supabase
        .from('pause_instances' as never)
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('state', 'completed');
      setCompletedPauseCount(count ?? 0);
      setLoading(false);
    };
    const loadLetters = async () => {
      const { data } = await supabase
        .from('future_letters')
        .select('*')
        .eq('user_id', user.id)
        .order('written_at', { ascending: false });
      const all = (data as unknown as Letter[]) ?? [];
      setLetters(all);
      // Open viewer immediately if navigating from notification (?letter= or legacy state)
      if (letterIdForOpen) {
        const found = all.find((l) => l.id === letterIdForOpen && l.delivered);
        if (found) setViewingLetter(found);
        setLetterViewerPending(false);
      }
      setLettersLoading(false);
    };
    const loadPractice = async () => {
      const { data } = await supabase
        .from('practice_entries')
        .select('id, created_at, type, mood, intensity, duration_seconds')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(500);
      setPracticeEntries((data as unknown as PracticeEntry[]) ?? []);
    };
    const loadProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('hold_goal_type, hold_goal_target_months, hold_goal_target_price, hold_goal_start')
        .eq('user_id', user.id)
        .single();
      if (data) {
        setHoldGoal({
          type: data.hold_goal_type,
          targetMonths: data.hold_goal_target_months,
          targetPrice: data.hold_goal_target_price,
          start: data.hold_goal_start,
        });
      }
    };
    loadCompletedPauseCount();
    loadLetters();
    loadPractice();
    loadProfile();
  }, [letterIdForOpen, user]);

  const deleteLetter = useCallback(async (id: string) => {
    const { error } = await supabase.from('future_letters').delete().eq('id', id);
    if (error) {
      toast.error(t('letter.deleteDeliveredFailed'));
      return;
    }
    setLetters((prev) => prev.filter((l) => l.id !== id));
    toast(t('letter.deleted'));
  }, [t]);

  const pendingLetters = useMemo(() => letters.filter((l) => !l.delivered), [letters]);
  const deliveredLetters = useMemo(() => letters.filter((l) => l.delivered), [letters]);

  const { currency } = useHolzen();
  const fmtPrice = (p: number) => formatBtcPrice(p, currency);

  const tabs = [
    { id: 'stats' as const, label: t('profile.stats'), icon: BarChart3 },
    { id: 'insights' as const, label: t('profile.insights'), icon: Sparkles },
    { id: 'badges' as const, label: t('profile.badges'), icon: Award },
    { id: 'letters' as const, label: t('profile.letters'), icon: Mail, count: pendingLetters.length },
    { id: 'activity' as const, label: t('profile.activity'), icon: CalendarDays },
  ];

  return (
    <div className="space-y-6">
      <NoxHeaderMain title={t('nav.journey')} subtitle={t('journey.pageSubtitle')} />
      {/* Tab header — URL-driven tabs: /journey/:tab */}
      <div className="tabs-scroll -mx-1 flex gap-2 overflow-x-auto px-1 pb-4">
        {tabs.map((tabItem) => {
          const Icon = tabItem.icon;
          const isActive = tab === tabItem.id;
          return (
            <button
              key={tabItem.id}
              type="button"
              onClick={() => navigate(journeyPath(tabItem.id), { replace: true })}
              className={`relative flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 font-medium text-xs uppercase tracking-wide transition-all ${
                isActive
                  ? 'bg-primary/10 text-primary shadow-sm'
                  : 'border border-border/30 text-muted-foreground/60 hover:bg-muted/50 hover:text-muted-foreground'
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-primary' : 'text-muted-foreground/40'}`} />
              {tabItem.label}
              {tabItem.count && tabItem.count > 0 ? (
                <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full leading-none font-medium">
                  {tabItem.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {tab === 'stats' ? (
        loading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full rounded-md" />
            <Skeleton className="h-40 w-full rounded-md" />
          </div>
        ) : (
          <StatsContentV2 holdGoal={holdGoal} />
        )
      ) : tab === 'insights' ? (
        <ProLock feature="ai_insights" hideContent>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full rounded-md" />
              <Skeleton className="h-20 w-full rounded-md" />
            </div>
          ) : (
            <AIInsightsPanel completedPauseCount={completedPauseCount} />
          )}
        </ProLock>
      ) : tab === 'badges' ? (
        loading ? (
          <div className="space-y-3">
            <Skeleton className="h-40 w-full rounded-md" />
          </div>
        ) : (
          <BadgesPanelV2 subscribed={subscribed} holdGoal={holdGoal} />
        )
      ) : tab === 'activity' ? (
        <ProLock feature="history" hideContent>
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">{t('journey.activityExplainer')}</p>
          <HistoryContent />
        </ProLock>
      ) : (
        <ProLock feature="letters" hideContent>
          {lettersLoading || letterViewerPending ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full rounded-md" />
              <Skeleton className="h-20 w-full rounded-md" />
            </div>
          ) : letters.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <Mail className="h-5 w-5 mx-auto text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">
                {t('profile.noLettersYet')}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {pendingLetters.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Lock className="h-3 w-3" />
                    <p className="text-xs font-mono tracking-widest uppercase">
                      {t('profile.sealed')} ({pendingLetters.length})
                    </p>
                  </div>
                  {pendingLetters.map((l) => (
                    <LetterCard key={l.id} letter={l} onDelete={deleteLetter} fmtPrice={fmtPrice} type="sealed" />
                  ))}
                </div>
              )}
              {deliveredLetters.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <p className="text-xs font-mono tracking-widest uppercase">
                      {t('profile.delivered')} ({deliveredLetters.length})
                    </p>
                  </div>
                  {deliveredLetters.map((l) => (
                    <LetterCard key={l.id} letter={l} onDelete={deleteLetter} fmtPrice={fmtPrice} type="delivered" onView={() => setViewingLetter(l)} />
                  ))}
                </div>
              )}
            </div>
          )}
        </ProLock>
      )}

      <LetterViewer letter={viewingLetter} onClose={() => setViewingLetter(null)} />
    </div>
  );
};

function MicroStat({ value, suffix, label, context, isText }: {
  value: string | number;
  suffix?: string;
  label: string;
  context?: string;
  isText?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-1 flex-wrap">
      <span className={`font-sans font-medium leading-none text-primary ${isText ? 'text-base' : 'text-lg'}`}>
        {value}{suffix && <span className="ml-0.5 text-sm" style={{ color: '#C1CBD7' }}>{suffix}</span>}
      </span>
      <span className="lowercase font-sans font-medium text-sm" style={{ color: '#C1CBD7' }}>{label}</span>
      {context && (
        <span className="font-sans text-sm font-normal" style={{ color: '#C1CBD7' }}>{context}</span>
      )}
    </div>
  );
}

function ScoreBarInline({ label, value, hint }: { label: string; value: number; hint?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-2 cursor-pointer" onClick={() => hint && setOpen(!open)}>
      <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
        <span className="font-sans text-base text-secondary-foreground font-normal">{label}</span>
        <span className="text-sm font-sans text-secondary-foreground">{value}</span>
      </div>
      <div className="h-1 rounded-full bg-muted/50 overflow-hidden">
        <div className="h-full rounded-full bg-primary/60 transition-all duration-700 ease-out" style={{ width: `${value}%` }} />
      </div>
      {open && hint && (
        <p className="leading-relaxed pt-0.5 animate-in fade-in duration-200 text-sm text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}

function StatsSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <p className="tracking-widest uppercase border-b border-border/40 pb-1.5 text-sm font-sans font-normal text-[#dbb266]">
        {label}
      </p>
      {children}
    </div>
  );
}
function LetterCard({ letter: l, onDelete, fmtPrice, type, onView }: {
  letter: Letter;
  onDelete: (id: string) => void;
  fmtPrice: (p: number) => string;
  type: 'sealed' | 'delivered';
  onView?: () => void;
}) {
  const { t } = useTranslation();
  const isDelivered = type === 'delivered';

  return (
    <div
      className={`rounded-md border px-4 py-3 space-y-2 ${
        isDelivered ? 'border-primary/20 bg-primary/5 cursor-pointer hover:bg-primary/8 transition-colors' : 'border-border/60 bg-muted/30'
      }`}
      onClick={isDelivered && onView ? onView : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        {isDelivered ? (
          <div className="flex items-center gap-2">
            <Mail className="h-3 w-3 text-primary" />
            <p className="text-[10px] font-mono text-primary uppercase tracking-wider">
              Delivered {l.delivered_at ? format(new Date(l.delivered_at), 'MMM d, yyyy') : ''}
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
            <Clock className="h-2.5 w-2.5" />
            <span>
              Written {format(new Date(l.written_at), 'MMM d, yyyy')}{' '}
              {l.written_during === 'calm' ? 'during calm markets' : l.written_during === 'crash' ? 'during a drop' : 'during a surge'}{' '}
              at {fmtPrice(l.btc_price_at_write)}
            </span>
          </div>
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="shrink-0 text-muted-foreground/40 hover:text-foreground transition-colors p-1" aria-label="Delete letter">
              <Trash2 className="h-3 w-3" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="font-mono text-sm">Delete {type} letter</AlertDialogTitle>
              <AlertDialogDescription className="text-xs">
                This will permanently delete this letter.{!isDelivered && ' It will never be delivered.'} This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="font-mono text-xs">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(l.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-mono text-xs"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      {isDelivered ? (
        <>
          <p className="text-sm leading-relaxed break-words">{l.body}</p>
          <p className="text-[10px] font-mono text-muted-foreground/50">
            Written {format(new Date(l.written_at), 'MMM d, yyyy')} at {fmtPrice(l.btc_price_at_write)}
            {l.btc_price_at_delivery && ` · Delivered at ${fmtPrice(l.btc_price_at_delivery)}`}
          </p>
        </>
      ) : (
        <>
          <p className="text-xs text-muted-foreground/50">
            Delivers during next {l.deliver_during === 'surge' ? 'surge' : 'drop'}
          </p>
          <p className="text-sm leading-relaxed blur-[8px] select-none pointer-events-none break-words">
            {l.body}
          </p>
        </>
      )}
    </div>
  );
}

function ScoreExplainerSheet({ open, onOpenChange, hasHoldGoal }: { open: boolean; onOpenChange: (v: boolean) => void; hasHoldGoal: boolean }) {
  const { t } = useTranslation();

  const components = [
    {
      label: t('holzenScore.emotionalRegulation', { defaultValue: 'Regulation' }),
      weight: hasHoldGoal ? '30%' : '37%',
      desc: t('scoreExplainer.regulation', {
        defaultValue:
          'Measures mood improvement between the Feel and Shift steps of each pause. Breathing completion adds a bonus.',
      }),
    },
    {
      label: t('holzenScore.distressTolerance', { defaultValue: 'Tolerance' }),
      weight: hasHoldGoal ? '25%' : '31%',
      desc: t('scoreExplainer.tolerance', {
        defaultValue:
          'Rewards holding or doing nothing during high volatility. Selling during volatile moments lowers this score.',
      }),
    },
    ...(hasHoldGoal
      ? [
          {
            label: t('holzenScore.decisionAlignment', { defaultValue: 'Alignment' }),
            weight: '20%',
            desc: t('scoreExplainer.alignment', {
              defaultValue:
                'How well your actions align with your hold goal. Holding scores highest, selling scores lowest.',
            }),
          },
        ]
      : []),
    {
      label: t('holzenScore.cognitiveReappraisal', { defaultValue: 'Reappraisal' }),
      weight: hasHoldGoal ? '15%' : '19%',
      desc: t('scoreExplainer.reappraisal', {
        defaultValue:
          'Engaging with perspective tools (Zoom Out, History, Signal, Learning) during a pause. Extra credit during volatile moments.',
      }),
    },
    {
      label: t('holzenScore.selfAwareness', { defaultValue: 'Awareness' }),
      weight: hasHoldGoal ? '10%' : '13%',
      desc: t('scoreExplainer.awareness', {
        defaultValue:
          'Depth of reflection: writing notes, adding tags, marking favorites, and completing the full pause flow.',
      }),
    },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-xl">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-sm font-mono tracking-wider uppercase">
            {t('scoreExplainer.title', { defaultValue: 'How your score works' })}
          </SheetTitle>
        </SheetHeader>

        <p className="text-xs text-muted-foreground leading-relaxed mb-4">
          {t('scoreExplainer.intro', {
            defaultValue:
              'Your composure score (0–100) is calculated from your last 30 pauses. It measures skills, not feelings — how well you regulate emotions and make aligned decisions under pressure.',
          })}
        </p>

        <div className="space-y-3">
          {components.map((c) => (
            <div key={c.label} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-medium">{c.label}</span>
                <span className="text-[10px] font-mono text-muted-foreground/60">{c.weight}</span>
              </div>
              <p className="text-[11px] text-muted-foreground/70 leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>

        {!hasHoldGoal && (
          <p className="text-[10px] text-muted-foreground/40 mt-4 leading-relaxed">
            {t('scoreExplainer.noGoalNote', {
              defaultValue: 'Set a hold goal to unlock the Alignment component and get a more complete score.',
            })}
          </p>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default Profile;

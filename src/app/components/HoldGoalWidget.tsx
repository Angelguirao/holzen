import { useState, useEffect, useCallback, useRef } from 'react';

import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useHolzen } from '@/screens/home/hooks/use-holzen';
import { getProfileRowQueryOptions, PROFILE_QUERY_KEY } from '@/features/user/public-queries';
import { formatBtcPrice, SUPPORTED_CURRENCIES } from '@/features/market/public';
import { computeHoldGoalCompactHeadline } from '@/features/user/public';
import { Target, Calendar, Coins, Infinity as InfinityIcon, X, Check, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { differenceInDays, format } from 'date-fns';
import { toast } from 'sonner';
import { homeInWidget } from '@/screens/home/components/home-widget-styles';
import type { Database } from '@/integrations/supabase/types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type ProfilesHoldGoalUpdate = Pick<
  Database['public']['Tables']['profiles']['Update'],
  | 'hold_goal_type'
  | 'hold_goal_start'
  | 'hold_goal_target_months'
  | 'hold_goal_target_price'
  | 'hold_goal_currency'
>;

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

type GoalType = 'time' | 'price' | 'forever';
type TimeUnit = 'months' | 'years';

interface HoldGoal {
  type: GoalType;
  start: string;
  targetMonths?: number;
  targetPrice?: number;
  currency: string;
}

const MAX_MONTHS = 1200;
const MAX_PRICE = 100_000_000;
const MIN_PRICE = 1;

export function HoldGoalWidget({
  currentPrice,
  variant = 'default',
  /** When `variant` is wireframe and user has a goal: false shows only goal type · primary status. */
  wireframeDetailsExpanded = true,
  /** Fires after initial load and whenever a goal is saved or cleared (not during `loading`). */
  onHoldGoalPresenceChange,
  /** Wireframe Home: compact headline for section header (`Kind · metric`). */
  onCompactHeadlineChange,
}: {
  currentPrice?: number;
  variant?: 'default' | 'wireframe';
  wireframeDetailsExpanded?: boolean;
  onHoldGoalPresenceChange?: (hasGoal: boolean) => void;
  onCompactHeadlineChange?: (headline: string | null) => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { currency } = useHolzen();
  const { user } = useAuth();
  const userId = user?.id;

  const { data: profileRow, status: profileQueryStatus } = useQuery(getProfileRowQueryOptions(userId));
  const loading = Boolean(userId && profileQueryStatus !== 'success' && profileQueryStatus !== 'error');

  const bumpProfileCache = useCallback(() => {
    if (!userId) return;
    void queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY(userId) });
  }, [queryClient, userId]);

  /** Keeps TanStack cache aligned with a successful hold-goal write so sync-from-cache does not race refetch. */
  const mergeHoldGoalIntoProfileCache = useCallback(
    (patch: Partial<Pick<ProfileRow, keyof ProfilesHoldGoalUpdate | 'hold_goal_type'>>) => {
      if (!userId) return;
      queryClient.setQueryData<ProfileRow | null>(PROFILE_QUERY_KEY(userId), (prev) =>
        prev ? { ...prev, ...patch } : prev,
      );
      bumpProfileCache();
    },
    [bumpProfileCache, queryClient, userId],
  );

  const isWire = variant === 'wireframe';
  const wireCompact = isWire && !wireframeDetailsExpanded;
  const [goal, setGoal] = useState<HoldGoal | null>(null);
  const [setting, setSetting] = useState(false);
  const [goalType, setGoalType] = useState<GoalType>('time');
  const [timeUnit, setTimeUnit] = useState<TimeUnit>('months');
  const [inputValue, setInputValue] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const presenceCb = useRef(onHoldGoalPresenceChange);
  presenceCb.current = onHoldGoalPresenceChange;
  const headlineCb = useRef(onCompactHeadlineChange);
  headlineCb.current = onCompactHeadlineChange;

  useEffect(() => {
    if (!userId) {
      setGoal(null);
      return;
    }
    if (setting) return;
    if (profileQueryStatus === 'error') {
      setGoal(null);
      return;
    }
    if (profileQueryStatus !== 'success' || !profileRow) return;
    if (profileRow.hold_goal_type) {
      setGoal({
        type: profileRow.hold_goal_type as GoalType,
        start: profileRow.hold_goal_start ?? '',
        targetMonths: profileRow.hold_goal_target_months ?? undefined,
        targetPrice: profileRow.hold_goal_target_price ?? undefined,
        currency: profileRow.hold_goal_currency || 'USD',
      });
    } else {
      setGoal(null);
    }
  }, [userId, profileQueryStatus, profileRow, setting]);

  useEffect(() => {
    if (loading) return;
    presenceCb.current?.(goal !== null);
  }, [loading, goal]);

  useEffect(() => {
    if (!isWire) return;
    if (loading) return;
    if (setting) {
      headlineCb.current?.(null);
      return;
    }
    const h =
      goal !== null
        ? computeHoldGoalCompactHeadline(
            {
              type: goal.type,
              start: goal.start,
              targetMonths: goal.targetMonths,
              targetPrice: goal.targetPrice,
              currency: goal.currency,
            },
            { currentPrice, t },
          )
        : null;
    headlineCb.current?.(h);
  }, [isWire, loading, setting, goal, currentPrice, t]);

  const validate = (type: GoalType, value: string, unit: TimeUnit): string | null => {
    if (type === 'forever') return null;
    if (!value.trim()) return 'Enter a value';
    const val = parseFloat(value);
    if (isNaN(val) || val <= 0) return 'Must be a positive number';

    if (type === 'time') {
      const months = unit === 'years' ? val * 12 : val;
      if (months < 1) return 'Minimum 1 month';
      if (months > MAX_MONTHS) return 'Maximum 100 years';
      if (unit === 'months' && !Number.isInteger(val)) return 'Whole months only';
      if (unit === 'years' && val % 0.5 !== 0 && !Number.isInteger(val)) return 'Use whole or half years';
    }

    if (type === 'price') {
      const sym = SUPPORTED_CURRENCIES.find(c => c.code === currency)?.symbol ?? currency;
      if (val < MIN_PRICE) return `Minimum ${sym}1`;
      if (val > MAX_PRICE) return `Maximum ${sym}${MAX_PRICE.toLocaleString()}`;
      if (currentPrice && val <= currentPrice) return 'Target should be above current price';
    }

    return null;
  };

  const formatWithSeparators = (val: string) => {
    // Strip non-numeric except decimal point
    const clean = val.replace(/[^\d.]/g, '');
    const parts = clean.split('.');
    // Add thousand separators to integer part
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  const stripSeparators = (val: string) => val.replace(/,/g, '');

  const handleInputChange = (value: string) => {
    if (goalType === 'price') {
      // Allow digits, commas, and one decimal point
      const raw = stripSeparators(value);
      if (raw && !/^\d*\.?\d*$/.test(raw)) return;
      setInputValue(raw ? formatWithSeparators(raw) : '');
      if (raw) {
        setValidationError(validate(goalType, raw, timeUnit));
      } else {
        setValidationError(null);
      }
    } else {
      setInputValue(value);
      if (value) {
        setValidationError(validate(goalType, value, timeUnit));
      } else {
        setValidationError(null);
      }
    }
  };

  const saveGoal = async () => {
    if (!user) return;

    if (goalType === 'forever') {
      const updates = {
        hold_goal_type: 'forever',
        hold_goal_start: startDate.toISOString(),
        hold_goal_target_months: null,
        hold_goal_target_price: null,
        hold_goal_currency: currency,
      };
      const { error: saveError } = await supabase.from('profiles').update(updates).eq('user_id', user.id);
      if (!saveError) mergeHoldGoalIntoProfileCache(updates);
      setSetting(false);
      setInputValue('');
      toast(t('holdGoal.goalSavedForever'));
      return;
    }

    const rawInput = stripSeparators(inputValue);
    if (!rawInput) return;
    const error = validate(goalType, rawInput, timeUnit);
    if (error) { setValidationError(error); return; }

    const val = parseFloat(stripSeparators(inputValue));
    const months = goalType === 'time' ? (timeUnit === 'years' ? Math.round(val * 12) : Math.round(val)) : null;

    const updates: ProfilesHoldGoalUpdate = {
      hold_goal_type: goalType,
      hold_goal_start: startDate.toISOString(),
      hold_goal_target_months: months,
      hold_goal_target_price: goalType === 'price' ? val : null,
      hold_goal_currency: currency,
    };

    const { error: saveError } = await supabase.from('profiles').update(updates).eq('user_id', user.id);
    if (!saveError) mergeHoldGoalIntoProfileCache(updates);
    setSetting(false);
    setInputValue('');
    setValidationError(null);
  };

  const clearGoal = async () => {
    if (!user) return;
    const { error } = await supabase.from('profiles').update({
      hold_goal_type: null,
      hold_goal_start: null,
      hold_goal_target_months: null,
      hold_goal_target_price: null,
    }).eq('user_id', user.id);
    if (!error) {
      mergeHoldGoalIntoProfileCache({
        hold_goal_type: null,
        hold_goal_start: null,
        hold_goal_target_months: null,
        hold_goal_target_price: null,
      });
    }
  };

  if (loading) return null;

  const goalEditorShell = isWire ? 'space-y-3 py-1' : `${homeInWidget.insetMuted} space-y-3 py-4`;

  // Setup mode
  if (setting || !goal) {
    if (!setting && !goal) {
      return (
        <button
          type="button"
          onClick={() => setSetting(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border/40 py-3 transition-colors hover:border-primary/30 hover:bg-primary/5"
        >
          <Target className="h-3.5 w-3.5 text-muted-foreground/50" />
          <span className={homeInWidget.kicker}>{t('holdGoal.setAGoal')}</span>
        </button>
      );
    }

    return (
      <div className={goalEditorShell}>
        <div className="flex items-center justify-between">
          <p className={homeInWidget.kicker}>{t('holdGoal.setYourGoal')}</p>
          <button onClick={() => { setSetting(false); setValidationError(null); setStartDate(new Date()); }} className="text-muted-foreground/40 hover:text-foreground">
            <X className="h-3 w-3" />
          </button>
        </div>

        <div className="flex rounded bg-muted/50 p-0.5">
          {(['time', 'price', 'forever'] as const).map((tp) => (
            <button
              key={tp}
              onClick={() => { setGoalType(tp); setInputValue(''); setValidationError(null); }}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold transition-colors ${
                goalType === tp
                  ? 'bg-muted text-foreground shadow-sm'
                  : 'text-muted-foreground/50 hover:text-muted-foreground'
              }`}
            >
              {tp === 'time' ? <Calendar className="h-2.5 w-2.5" /> : tp === 'price' ? <Coins className="h-2.5 w-2.5" /> : <InfinityIcon className="h-2.5 w-2.5" />}
              {tp === 'time' ? t('holdGoal.time') : tp === 'price' ? t('holdGoal.price') : t('holdGoal.forever')}
            </button>
          ))}
        </div>

        {/* Start date picker — simple month/year selectors */}
        <div className="flex items-center gap-2">
          <p className={`whitespace-nowrap ${homeInWidget.meta}`}>{t('holdGoal.startFrom')}</p>
          <select
            value={startDate.getMonth()}
            onChange={(e) => {
              const m = parseInt(e.target.value);
              const y = startDate.getFullYear();
              const now = new Date();
              const clamped = new Date(y, m, 1) > now ? now : new Date(y, m, 1);
              setStartDate(clamped);
            }}
            className="h-8 flex-1 rounded-lg border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {Array.from({ length: 12 }, (_, i) => {
              const now = new Date();
              const disabled = startDate.getFullYear() === now.getFullYear() && i > now.getMonth();
              return (
                <option key={i} value={i} disabled={disabled}>
                  {format(new Date(2000, i, 1), 'MMMM')}
                </option>
              );
            })}
          </select>
          <select
            value={startDate.getFullYear()}
            onChange={(e) => {
              const y = parseInt(e.target.value);
              const now = new Date();
              const m = y === now.getFullYear() && startDate.getMonth() > now.getMonth()
                ? now.getMonth()
                : startDate.getMonth();
              setStartDate(new Date(y, m, 1));
            }}
            className="h-8 w-20 rounded-lg border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {Array.from({ length: new Date().getFullYear() - 2008 }, (_, i) => 2009 + i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {goalType === 'forever' ? (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('holdGoal.foreverDesc')}{' '}
              {startDate.toDateString() === new Date().toDateString()
                ? t('holdGoal.counterStartsNow')
                : t('holdGoal.counterStartsFrom', { date: format(startDate, 'MMM d, yyyy') })}
            </p>
            <Button size="sm" onClick={saveGoal} className="h-9 w-full rounded-xl text-sm font-semibold">
              <InfinityIcon className="h-3 w-3 mr-1.5" />
              {t('holdGoal.commitForever')}
            </Button>
          </div>
        ) : (
          <>
            {goalType === 'time' && (
              <div className="flex rounded bg-muted/50 p-0.5">
                {(['months', 'years'] as const).map((u) => (
                  <button
                    key={u}
                    onClick={() => { setTimeUnit(u); setInputValue(''); setValidationError(null); }}
                    className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                      timeUnit === u
                        ? 'bg-foreground/10 text-foreground'
                        : 'text-muted-foreground/40 hover:text-muted-foreground'
                    }`}
                  >
                    {u === 'months' ? t('holdGoal.months') : t('holdGoal.years')}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Input
                  id="hold-goal-target"
                  name="hold-goal-target"
                  type={goalType === 'price' ? 'text' : 'number'}
                  inputMode={goalType === 'price' ? 'decimal' : 'numeric'}
                  autoComplete="off"
                  value={inputValue}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder={
                    goalType === 'time'
                      ? timeUnit === 'months' ? 'e.g. 6' : 'e.g. 2'
                      : 'e.g. 150,000'
                  }
                  className={`h-9 text-sm tabular-nums ${validationError ? 'border-destructive/50' : ''}`}
                  min={goalType === 'time' ? 0 : undefined}
                />
                <Button size="sm" onClick={saveGoal} disabled={!inputValue || !!validationError} className="h-8 px-3">
                  <Check className="h-3 w-3" />
                </Button>
              </div>
              {validationError && (
                <p className="text-xs font-medium text-destructive">{validationError}</p>
              )}
            </div>

            <p className={homeInWidget.metaFaint}>
              {goalType === 'time'
                ? t('holdGoal.howManyTime', { unit: timeUnit === 'months' ? t('holdGoal.months').toLowerCase() : t('holdGoal.years').toLowerCase() })
                : t('holdGoal.atWhatPrice')}
            </p>
          </>
        )}
      </div>
    );
  }

  const editGoal = () => {
    if (!goal) return;
    setGoalType(goal.type);
    setStartDate(new Date(goal.start));
    if (goal.type === 'time' && goal.targetMonths) {
      if (goal.targetMonths >= 12 && goal.targetMonths % 12 === 0) {
        setTimeUnit('years');
        setInputValue(String(goal.targetMonths / 12));
      } else {
        setTimeUnit('months');
        setInputValue(String(goal.targetMonths));
      }
    } else if (goal.type === 'price' && goal.targetPrice) {
      setInputValue(formatWithSeparators(String(goal.targetPrice)));
    } else {
      setInputValue('');
    }
    setValidationError(null);
    setSetting(true);
  };

  // Action buttons (edit + clear)
  const goalActions = (
    <div className="flex items-center gap-2">
      <button type="button" onClick={editGoal} className={`${homeInWidget.iconBtn} text-muted-foreground/50`} aria-label="Edit goal">
        <Pencil className="h-3.5 w-3.5 text-secondary-foreground" />
      </button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button type="button" className="font-medium transition-colors text-sm text-secondary-foreground">
            {t('holdGoal.clear')}
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-semibold">{t('holdGoal.clearTitle')}</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">{t('holdGoal.clearDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={clearGoal} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t('holdGoal.clear')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  // Forever goal display
  if (goal.type === 'forever') {
    const start = new Date(goal.start);
    const elapsed = differenceInDays(new Date(), start);
    const years = Math.floor(elapsed / 365);
    const days = elapsed % 365;

    if (isWire) {
      const headline = computeHoldGoalCompactHeadline(
        {
          type: goal.type,
          start: goal.start,
          targetMonths: goal.targetMonths,
          targetPrice: goal.targetPrice,
          currency: goal.currency,
        },
        { currentPrice, t },
      );
      return (
        <div className="flex gap-3">
          <InfinityIcon className="h-6 w-6 shrink-0 text-muted-foreground" aria-hidden />
          <div className="min-w-0 flex-1 space-y-2">
            {headline && !wireCompact ? (
              <p className="text-[13px] font-medium leading-snug text-foreground">{headline}</p>
            ) : null}
            {!wireCompact ? (
              <p className={homeInWidget.metaFaint}>
                {t('holdGoal.since', { date: format(start, 'MMM d, yyyy') })}
                {elapsed > 0 ? ` · ${t('holdGoal.daysHeld', { count: elapsed })}` : ''} · {t('holdGoal.noEndDate')}
              </p>
            ) : null}
          </div>
        </div>
      );
    }

    return (
      <div className={`${homeInWidget.insetMuted} mb-0 pb-[16px]`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <InfinityIcon className="h-3 w-3 text-muted-foreground" />
            <p className={homeInWidget.kicker}>{t('holdGoal.holdForever')}</p>
          </div>
          {goalActions}
        </div>
        <div className="space-y-1">
          <span className="text-sm font-semibold tabular-nums text-foreground/90">
            {years > 0 ? `${years}y ${days}d` : `${elapsed} day${elapsed !== 1 ? 's' : ''}`} {t('holdGoal.andCounting')}
          </span>
          <p className={`${homeInWidget.metaFaint} mb-[16px]`}>
            {t('holdGoal.since', { date: format(start, 'MMM d, yyyy') })}{elapsed > 0 ? ` · ${t('holdGoal.daysHeld', { count: elapsed })}` : ''} · {t('holdGoal.noEndDate')}
          </p>
        </div>
      </div>
    );
  }

  // Active time goal display
  if (goal.type === 'time' && goal.targetMonths) {
    const start = new Date(goal.start);
    const totalDays = goal.targetMonths * 30;
    const elapsed = differenceInDays(new Date(), start);
    const progress = Math.min((elapsed / totalDays) * 100, 100);
    const remaining = Math.max(totalDays - elapsed, 0);
    const completed = remaining === 0;

    const displayTarget = goal.targetMonths >= 12
      ? `${(goal.targetMonths / 12).toFixed(goal.targetMonths % 12 === 0 ? 0 : 1)}y ${t('holdGoal.commitment')}`
      : `${goal.targetMonths}mo ${t('holdGoal.commitment')}`;

    if (isWire) {
      const headline = computeHoldGoalCompactHeadline(
        {
          type: goal.type,
          start: goal.start,
          targetMonths: goal.targetMonths,
          targetPrice: goal.targetPrice,
          currency: goal.currency,
        },
        { currentPrice, t },
      );
      return (
        <div className="flex gap-3">
          <Target className="h-6 w-6 shrink-0 text-muted-foreground" aria-hidden />
          <div className="min-w-0 flex-1 space-y-2">
            {headline && !wireCompact ? (
              <p className="text-[13px] font-medium leading-snug text-foreground">{headline}</p>
            ) : null}
            {!wireCompact ? (
              <>
                <p className={homeInWidget.metaFaint}>
                  {t('holdGoal.started', { date: format(start, 'MMM d, yyyy') })} ·{' '}
                  {t('holdGoal.daysHeld', { count: elapsed })}
                  {' · '}
                  {displayTarget}
                </p>
                <div className="flex items-center gap-2.5">
                  <div className="h-[7px] min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-foreground/90 transition-all duration-700"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                    {Math.round(progress)}%
                  </span>
                </div>
              </>
            ) : null}
          </div>
        </div>
      );
    }

    return (
      <div className={`${homeInWidget.insetMuted} space-y-2.5`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-3 w-3 text-muted-foreground" />
            <p className={homeInWidget.kicker}>{t('holdGoal.title')}</p>
          </div>
          {goalActions}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold tabular-nums text-foreground/90">
              {completed ? t('holdGoal.goalReached') : t('holdGoal.daysToGo', { count: remaining })}
            </span>
            <span className={`shrink-0 ${homeInWidget.meta}`}>{displayTarget}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
            <div
              className={`h-full rounded-full transition-all duration-700 ${completed ? 'bg-primary' : 'bg-primary/50'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className={homeInWidget.metaFaint}>
            {t('holdGoal.started', { date: format(start, 'MMM d, yyyy') })} · {t('holdGoal.daysHeld', { count: elapsed })}
          </p>
        </div>
      </div>
    );
  }

  if (goal.type === 'price' && goal.targetPrice) {
    const start = new Date(goal.start);
    const target = goal.targetPrice;
    const price = currentPrice ?? 0;
    const progress = price > 0 ? Math.min((price / target) * 100, 100) : 0;
    const reached = price >= target;
    const diff = target - price;
    const elapsedDays = differenceInDays(new Date(), start);

    if (isWire) {
      const headline = computeHoldGoalCompactHeadline(
        {
          type: goal.type,
          start: goal.start,
          targetMonths: goal.targetMonths,
          targetPrice: goal.targetPrice,
          currency: goal.currency,
        },
        { currentPrice, t },
      );
      return (
        <div className="flex gap-3">
          <Coins className="h-6 w-6 shrink-0 text-muted-foreground" aria-hidden />
          <div className="min-w-0 flex-1 space-y-2">
            {headline && !wireCompact ? (
              <p className="text-[13px] font-medium leading-snug text-foreground">{headline}</p>
            ) : null}
            {!wireCompact ? (
              <>
                <p className={homeInWidget.metaFaint}>
                  {t('holdGoal.started', { date: format(start, 'MMM d, yyyy') })} ·{' '}
                  {t('holdGoal.daysHeld', { count: elapsedDays })} · {t('holdGoal.target')}:{' '}
                  {formatBtcPrice(target, goal.currency)}
                  {' · '}
                  {t('holdGoal.current')}: {formatBtcPrice(price, goal.currency)}
                </p>
                <div className="flex items-center gap-2.5">
                  <div className="h-[7px] min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-foreground/90 transition-all duration-700"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="max-w-[45%] shrink-0 truncate text-right text-xs font-medium tabular-nums text-muted-foreground">
                    {formatBtcPrice(price, goal.currency)}
                  </span>
                </div>
              </>
            ) : null}
          </div>
        </div>
      );
    }

    return (
      <div className={`${homeInWidget.insetMuted} space-y-2.5`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-3 w-3 text-muted-foreground" />
            <p className={homeInWidget.kicker}>{t('holdGoal.title')}</p>
          </div>
          {goalActions}
        </div>

        <div className="space-y-1.5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm font-semibold tabular-nums text-foreground/90">
              {reached ? t('holdGoal.targetReached') : `${formatBtcPrice(diff, currency)} ${t('holdGoal.toGo')}`}
            </span>
            <span className={homeInWidget.meta}>
              {t('holdGoal.target')}: {formatBtcPrice(target, currency)}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
            <div
              className={`h-full rounded-full transition-all duration-700 ${reached ? 'bg-primary' : 'bg-primary/50'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className={homeInWidget.metaFaint}>
            {t('holdGoal.started', { date: format(start, 'MMM d, yyyy') })} · {t('holdGoal.daysHeld', { count: elapsedDays })} · {t('holdGoal.current')}: {formatBtcPrice(price, currency)}
          </p>
        </div>
      </div>
    );
  }

  return null;
}

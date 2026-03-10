import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useHolzen } from '@/hooks/use-holzen';
import { formatBtcPrice, SUPPORTED_CURRENCIES } from '@/lib/btc';
import { Target, Calendar, Coins, Infinity, X, Check, CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { differenceInDays, format } from 'date-fns';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
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

export function HoldGoalWidget({ currentPrice }: { currentPrice?: number }) {
  const { t } = useTranslation();
  const { currency } = useHolzen();
  const { user } = useAuth();
  const [goal, setGoal] = useState<HoldGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [setting, setSetting] = useState(false);
  const [goalType, setGoalType] = useState<GoalType>('time');
  const [timeUnit, setTimeUnit] = useState<TimeUnit>('months');
  const [inputValue, setInputValue] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date>(new Date());

  const loadGoal = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('hold_goal_type, hold_goal_start, hold_goal_target_months, hold_goal_target_price, hold_goal_currency')
      .eq('user_id', user.id)
      .single();

    if (data?.hold_goal_type) {
      setGoal({
        type: data.hold_goal_type as GoalType,
        start: data.hold_goal_start,
        targetMonths: data.hold_goal_target_months,
        targetPrice: data.hold_goal_target_price,
        currency: data.hold_goal_currency || 'USD',
      });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { loadGoal(); }, [loadGoal]);

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

  const handleInputChange = (value: string) => {
    setInputValue(value);
    if (value) {
      setValidationError(validate(goalType, value, timeUnit));
    } else {
      setValidationError(null);
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
      await supabase.from('profiles').update(updates).eq('user_id', user.id);
      setGoal({ type: 'forever', start: updates.hold_goal_start, currency });
      setSetting(false);
      setInputValue('');
      toast(t('holdGoal.goalSavedForever'));
      return;
    }

    if (!inputValue) return;
    const error = validate(goalType, inputValue, timeUnit);
    if (error) { setValidationError(error); return; }

    const val = parseFloat(inputValue);
    const months = goalType === 'time' ? (timeUnit === 'years' ? Math.round(val * 12) : Math.round(val)) : null;

    const updates: Record<string, any> = {
      hold_goal_type: goalType,
      hold_goal_start: startDate.toISOString(),
      hold_goal_target_months: months,
      hold_goal_target_price: goalType === 'price' ? val : null,
      hold_goal_currency: currency,
    };

    await supabase.from('profiles').update(updates).eq('user_id', user.id);
    setGoal({
      type: goalType,
      start: updates.hold_goal_start,
      targetMonths: updates.hold_goal_target_months,
      targetPrice: updates.hold_goal_target_price,
      currency,
    });
    setSetting(false);
    setInputValue('');
    setValidationError(null);
  };

  const clearGoal = async () => {
    if (!user) return;
    await supabase.from('profiles').update({
      hold_goal_type: null,
      hold_goal_start: null,
      hold_goal_target_months: null,
      hold_goal_target_price: null,
    }).eq('user_id', user.id);
    setGoal(null);
  };

  if (loading) return null;

  // Setup mode
  if (setting || !goal) {
    if (!setting && !goal) {
      return (
        <button
          onClick={() => setSetting(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-md border border-dashed border-border/40 hover:border-primary/30 hover:bg-primary/5 transition-colors"
        >
          <Target className="h-3 w-3 text-muted-foreground/40" />
          <span className="text-[10px] font-mono text-muted-foreground/50 tracking-[0.15em] uppercase">
            {t('holdGoal.setAGoal')}
          </span>
        </button>
      );
    }

    return (
      <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
            {t('holdGoal.setYourGoal')}
          </p>
          <button onClick={() => { setSetting(false); setValidationError(null); setStartDate(new Date()); }} className="text-muted-foreground/40 hover:text-foreground">
            <X className="h-3 w-3" />
          </button>
        </div>

        <div className="flex rounded bg-muted/50 p-0.5">
          {(['time', 'price', 'forever'] as const).map((tp) => (
            <button
              key={tp}
              onClick={() => { setGoalType(tp); setInputValue(''); setValidationError(null); }}
              className={`flex-1 text-[10px] font-mono px-2 py-1.5 rounded transition-colors flex items-center justify-center gap-1.5 ${
                goalType === tp
                  ? 'bg-primary/20 text-primary'
                  : 'text-muted-foreground/50 hover:text-muted-foreground'
              }`}
            >
              {tp === 'time' ? <Calendar className="h-2.5 w-2.5" /> : tp === 'price' ? <Coins className="h-2.5 w-2.5" /> : <Infinity className="h-2.5 w-2.5" />}
              {tp === 'time' ? t('holdGoal.time') : tp === 'price' ? t('holdGoal.price') : t('holdGoal.forever')}
            </button>
          ))}
        </div>

        {/* Start date picker */}
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-mono text-muted-foreground/60 whitespace-nowrap">{t('holdGoal.startFrom')}</p>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-7 flex-1 justify-start text-left text-[10px] font-mono",
                  startDate.toDateString() === new Date().toDateString() && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="h-2.5 w-2.5 mr-1.5" />
                {startDate.toDateString() === new Date().toDateString() ? t('holdGoal.today') : format(startDate, 'MMM d, yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center" side="bottom" sideOffset={8}>
              <div className="p-3 pointer-events-auto">
                {/* Year & Month dropdowns */}
                <div className="flex items-center gap-2 mb-3">
                  <select
                    value={calendarMonth.getFullYear()}
                    onChange={(e) => setCalendarMonth(new Date(parseInt(e.target.value), calendarMonth.getMonth(), 1))}
                    className="flex-1 h-7 rounded-md border border-input bg-background text-xs font-mono px-2 focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {Array.from({ length: new Date().getFullYear() - 2008 }, (_, i) => 2009 + i).map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                  <select
                    value={calendarMonth.getMonth()}
                    onChange={(e) => setCalendarMonth(new Date(calendarMonth.getFullYear(), parseInt(e.target.value), 1))}
                    className="flex-1 h-7 rounded-md border border-input bg-background text-xs font-mono px-2 focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i} value={i} disabled={calendarMonth.getFullYear() === new Date().getFullYear() && i > new Date().getMonth()}>
                        {format(new Date(2000, i, 1), 'MMM')}
                      </option>
                    ))}
                  </select>
                </div>
                <CalendarPicker
                  mode="single"
                  selected={startDate}
                  onSelect={(d) => d && setStartDate(d)}
                  month={calendarMonth}
                  onMonthChange={setCalendarMonth}
                  disabled={(date) => date > new Date() || date < new Date('2009-01-03')}
                  initialFocus
                  className="p-0"
                />
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {goalType === 'forever' ? (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('holdGoal.foreverDesc')}{' '}
              {startDate.toDateString() === new Date().toDateString()
                ? t('holdGoal.counterStartsNow')
                : t('holdGoal.counterStartsFrom', { date: format(startDate, 'MMM d, yyyy') })}
            </p>
            <Button size="sm" onClick={saveGoal} className="w-full h-8 text-xs font-mono">
              <Infinity className="h-3 w-3 mr-1.5" />
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
                    className={`flex-1 text-[10px] font-mono px-3 py-1 rounded transition-colors capitalize ${
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
                  type="number"
                  value={inputValue}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder={
                    goalType === 'time'
                      ? timeUnit === 'months' ? 'e.g. 6' : 'e.g. 2'
                      : 'e.g. 150000'
                  }
                  className={`text-xs font-mono h-8 ${validationError ? 'border-destructive/50' : ''}`}
                  min={0}
                />
                <Button size="sm" onClick={saveGoal} disabled={!inputValue || !!validationError} className="h-8 px-3">
                  <Check className="h-3 w-3" />
                </Button>
              </div>
              {validationError && (
                <p className="text-[10px] font-mono text-destructive">{validationError}</p>
              )}
            </div>

            <p className="text-[10px] text-muted-foreground/40">
              {goalType === 'time'
                ? t('holdGoal.howManyTime', { unit: timeUnit === 'months' ? t('holdGoal.months').toLowerCase() : t('holdGoal.years').toLowerCase() })
                : t('holdGoal.atWhatPrice')}
            </p>
          </>
        )}
      </div>
    );
  }

  // Clear goal dialog (shared)
  const clearDialog = (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button className="text-[10px] font-mono text-muted-foreground/30 hover:text-foreground transition-colors">
          {t('holdGoal.clear')}
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-mono text-sm">{t('holdGoal.clearTitle')}</AlertDialogTitle>
          <AlertDialogDescription className="text-xs">{t('holdGoal.clearDesc')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="font-mono text-xs">{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={clearGoal} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-mono text-xs">{t('holdGoal.clear')}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  // Forever goal display
  if (goal.type === 'forever') {
    const start = new Date(goal.start);
    const elapsed = differenceInDays(new Date(), start);
    const years = Math.floor(elapsed / 365);
    const days = elapsed % 365;

    return (
      <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Infinity className="h-3 w-3 text-primary/60" />
            <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
              {t('holdGoal.holdForever')}
            </p>
          </div>
          {clearDialog}
        </div>
        <div className="space-y-1">
          <span className="text-xs font-mono text-foreground/80">
            {years > 0 ? `${years}y ${days}d` : `${elapsed} day${elapsed !== 1 ? 's' : ''}`} {t('holdGoal.andCounting')}
          </span>
          <p className="text-[9px] font-mono text-muted-foreground/40">
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

    return (
      <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-3 w-3 text-primary/60" />
            <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
              {t('holdGoal.title')}
            </p>
          </div>
          {clearDialog}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-foreground/80">
              {completed ? t('holdGoal.goalReached') : t('holdGoal.daysToGo', { count: remaining })}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground/50">
              {displayTarget}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted/50 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${completed ? 'bg-primary' : 'bg-primary/50'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[9px] font-mono text-muted-foreground/40">
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

    return (
      <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-3 w-3 text-primary/60" />
            <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
              {t('holdGoal.title')}
            </p>
          </div>
          {clearDialog}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-foreground/80">
              {reached ? t('holdGoal.targetReached') : `${formatBtcPrice(diff, currency)} ${t('holdGoal.toGo')}`}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground/50">
              {t('holdGoal.target')}: {formatBtcPrice(target, currency)}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted/50 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${reached ? 'bg-primary' : 'bg-primary/50'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[9px] font-mono text-muted-foreground/40">
            {t('holdGoal.started', { date: format(start, 'MMM d, yyyy') })} · {t('holdGoal.daysHeld', { count: differenceInDays(new Date(), start) })} · {t('holdGoal.current')}: {formatBtcPrice(price, currency)}
          </p>
        </div>
      </div>
    );
  }

  return null;
}

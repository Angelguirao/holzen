import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useHolzen } from '@/hooks/use-holzen';
import { formatBtcPrice } from '@/lib/btc';
import { Target, Calendar, DollarSign, Infinity, X, Check, CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { differenceInDays, format } from 'date-fns';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

type GoalType = 'time' | 'price' | 'forever';
type TimeUnit = 'months' | 'years';

interface HoldGoal {
  type: GoalType;
  start: string;
  targetMonths?: number;
  targetPrice?: number;
  currency: string;
}

const MAX_MONTHS = 1200; // 100 years
const MAX_PRICE = 100_000_000; // $100M
const MIN_PRICE = 1;

export function HoldGoalWidget({ currentPrice }: { currentPrice?: number }) {
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
      if (val < MIN_PRICE) return 'Minimum $1';
      if (val > MAX_PRICE) return `Maximum $${MAX_PRICE.toLocaleString()}`;
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
      toast('Hold forever. Conviction locked in.');
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
      hold_goal_currency: 'USD',
    };

    await supabase.from('profiles').update(updates).eq('user_id', user.id);
    setGoal({
      type: goalType,
      start: updates.hold_goal_start,
      targetMonths: updates.hold_goal_target_months,
      targetPrice: updates.hold_goal_target_price,
      currency: 'USD',
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
            Set a hold goal
          </span>
        </button>
      );
    }

    return (
      <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
            Set Your Goal
          </p>
          <button onClick={() => { setSetting(false); setValidationError(null); setStartDate(new Date()); }} className="text-muted-foreground/40 hover:text-foreground">
            <X className="h-3 w-3" />
          </button>
        </div>

        <div className="flex rounded bg-muted/50 p-0.5">
          {(['time', 'price', 'forever'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setGoalType(t); setInputValue(''); setValidationError(null); }}
              className={`flex-1 text-[10px] font-mono px-2 py-1.5 rounded transition-colors flex items-center justify-center gap-1.5 ${
                goalType === t
                  ? 'bg-primary/20 text-primary'
                  : 'text-muted-foreground/50 hover:text-muted-foreground'
              }`}
            >
              {t === 'time' ? <Calendar className="h-2.5 w-2.5" /> : t === 'price' ? <DollarSign className="h-2.5 w-2.5" /> : <Infinity className="h-2.5 w-2.5" />}
              {t === 'time' ? 'Time' : t === 'price' ? 'Price' : 'Forever'}
            </button>
          ))}
        </div>

        {/* Start date picker */}
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-mono text-muted-foreground/60 whitespace-nowrap">Start from</p>
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
                {startDate.toDateString() === new Date().toDateString() ? 'Today' : format(startDate, 'MMM d, yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarPicker
                mode="single"
                selected={startDate}
                onSelect={(d) => d && setStartDate(d)}
                disabled={(date) => date > new Date()}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>

        {goalType === 'forever' ? (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              No timeline. No target price. Just hold. The counter starts {startDate.toDateString() === new Date().toDateString() ? 'now' : `from ${format(startDate, 'MMM d, yyyy')}`} and never ends.
            </p>
            <Button size="sm" onClick={saveGoal} className="w-full h-8 text-xs font-mono">
              <Infinity className="h-3 w-3 mr-1.5" />
              Commit to holding forever
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
                    {u}
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
                ? `How many ${timeUnit} do you commit to holding?`
                : 'At what price would you consider your goal reached?'}
            </p>
          </>
        )}
      </div>
    );
  }

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
              Hold Forever
            </p>
          </div>
          <button onClick={clearGoal} className="text-[10px] font-mono text-muted-foreground/30 hover:text-foreground transition-colors">
            Clear
          </button>
        </div>
        <div className="space-y-1">
          <span className="text-xs font-mono text-foreground/80">
            {years > 0 ? `${years}y ${days}d` : `${elapsed} day${elapsed !== 1 ? 's' : ''}`} and counting
          </span>
          <p className="text-[9px] font-mono text-muted-foreground/40">
            Since {format(start, 'MMM d, yyyy')}{elapsed > 0 ? ` · ${elapsed} day${elapsed !== 1 ? 's' : ''} ago` : ''} · No end date
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
      ? `${(goal.targetMonths / 12).toFixed(goal.targetMonths % 12 === 0 ? 0 : 1)}y commitment`
      : `${goal.targetMonths}mo commitment`;

    return (
      <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-3 w-3 text-primary/60" />
            <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
              Hold Goal
            </p>
          </div>
          <button onClick={clearGoal} className="text-[10px] font-mono text-muted-foreground/30 hover:text-foreground transition-colors">
            Clear
          </button>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-foreground/80">
              {completed ? '🎉 Goal reached!' : `${remaining} day${remaining !== 1 ? 's' : ''} to go`}
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
            Started {format(start, 'MMM d, yyyy')} · {elapsed} day{elapsed !== 1 ? 's' : ''} held
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
              Hold Goal
            </p>
          </div>
          <button onClick={clearGoal} className="text-[10px] font-mono text-muted-foreground/30 hover:text-foreground transition-colors">
            Clear
          </button>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-foreground/80">
              {reached ? '🎉 Target reached!' : `$${diff.toLocaleString()} to go`}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground/50">
              Target: ${target.toLocaleString()}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted/50 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${reached ? 'bg-primary' : 'bg-primary/50'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[9px] font-mono text-muted-foreground/40">
            Started {format(start, 'MMM d, yyyy')} · {differenceInDays(new Date(), start)} day{differenceInDays(new Date(), start) !== 1 ? 's' : ''} held · Current: ${price.toLocaleString()}
          </p>
        </div>
      </div>
    );
  }

  return null;
}

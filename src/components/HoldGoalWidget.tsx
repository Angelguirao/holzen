import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Target, Calendar, DollarSign, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { differenceInDays, format } from 'date-fns';

interface HoldGoal {
  type: 'time' | 'price';
  start: string;
  targetMonths?: number;
  targetPrice?: number;
  currency: string;
}

export function HoldGoalWidget({ currentPrice }: { currentPrice?: number }) {
  const { user } = useAuth();
  const [goal, setGoal] = useState<HoldGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [setting, setSetting] = useState(false);
  const [goalType, setGoalType] = useState<'time' | 'price'>('time');
  const [inputValue, setInputValue] = useState('');

  const loadGoal = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('hold_goal_type, hold_goal_start, hold_goal_target_months, hold_goal_target_price, hold_goal_currency')
      .eq('user_id', user.id)
      .single();

    if (data?.hold_goal_type) {
      setGoal({
        type: data.hold_goal_type as 'time' | 'price',
        start: data.hold_goal_start,
        targetMonths: data.hold_goal_target_months,
        targetPrice: data.hold_goal_target_price,
        currency: data.hold_goal_currency || 'USD',
      });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { loadGoal(); }, [loadGoal]);

  const saveGoal = async () => {
    if (!user || !inputValue) return;
    const val = parseFloat(inputValue);
    if (isNaN(val) || val <= 0) return;

    const updates: Record<string, any> = {
      hold_goal_type: goalType,
      hold_goal_start: new Date().toISOString(),
      hold_goal_target_months: goalType === 'time' ? Math.round(val) : null,
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
          <button onClick={() => setSetting(false)} className="text-muted-foreground/40 hover:text-foreground">
            <X className="h-3 w-3" />
          </button>
        </div>

        <div className="flex rounded bg-muted/50 p-0.5">
          {(['time', 'price'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setGoalType(t); setInputValue(''); }}
              className={`flex-1 text-[10px] font-mono px-3 py-1.5 rounded transition-colors flex items-center justify-center gap-1.5 ${
                goalType === t
                  ? 'bg-primary/20 text-primary'
                  : 'text-muted-foreground/50 hover:text-muted-foreground'
              }`}
            >
              {t === 'time' ? <Calendar className="h-2.5 w-2.5" /> : <DollarSign className="h-2.5 w-2.5" />}
              {t === 'time' ? 'Time' : 'Price'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={goalType === 'time' ? 'Months (e.g. 6)' : 'Target price (e.g. 150000)'}
            className="text-xs font-mono h-8"
          />
          <Button size="sm" onClick={saveGoal} disabled={!inputValue} className="h-8 px-3">
            <Check className="h-3 w-3" />
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground/40">
          {goalType === 'time'
            ? 'How many months do you commit to holding?'
            : 'At what price would you consider your goal reached?'}
        </p>
      </div>
    );
  }

  // Active goal display
  if (goal.type === 'time' && goal.targetMonths) {
    const start = new Date(goal.start);
    const totalDays = goal.targetMonths * 30;
    const elapsed = differenceInDays(new Date(), start);
    const progress = Math.min((elapsed / totalDays) * 100, 100);
    const remaining = Math.max(totalDays - elapsed, 0);
    const completed = remaining === 0;

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
              {goal.targetMonths}mo commitment
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted/50 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${completed ? 'bg-primary' : 'bg-primary/50'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[9px] font-mono text-muted-foreground/40">
            Since {format(start, 'MMM d, yyyy')} · {elapsed} day{elapsed !== 1 ? 's' : ''} held
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
            Since {format(start, 'MMM d, yyyy')} · Current: ${price.toLocaleString()}
          </p>
        </div>
      </div>
    );
  }

  return null;
}
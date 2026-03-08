import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { differenceInDays } from 'date-fns';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Scatter,
  ComposedChart,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { format, subDays, isAfter } from 'date-fns';

type Period = '7d' | '30d' | '90d' | 'all';

interface Reflection {
  id: string;
  message: string;
  context: string | null;
  created_at: string;
  mood: string | null;
  outcome: string | null;
}

interface RitualCompletion {
  reflection_id: string | null;
  template: string;
  decision: string;
}

interface PricePoint {
  timestamp: number;
  price: number;
  date: string;
  reflection?: Reflection;
  ritual?: RitualCompletion;
  reflectionPrice?: number;
}

const PERIOD_DAYS: Record<Period, number | null> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  all: null,
};

export function VolatilityTimeline() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>('30d');
  const [priceData, setPriceData] = useState<[number, number][]>([]);
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [rituals, setRituals] = useState<RitualCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceLoading, setPriceLoading] = useState(true);

  const memberSince = user?.created_at ? new Date(user.created_at) : null;
  const daysSinceSignup = memberSince ? differenceInDays(new Date(), memberSince) : 365;

  // Clamp requested period to days since signup
  const effectiveDays = useMemo(() => {
    const requested = PERIOD_DAYS[period] ?? daysSinceSignup;
    return Math.min(requested, Math.max(daysSinceSignup, 1));
  }, [period, daysSinceSignup]);

  // Fetch reflections + rituals once
  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: refs }, { data: rits }] = await Promise.all([
        supabase
          .from('reflections')
          .select('id, message, context, created_at, mood, outcome')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
          .limit(1000),
        supabase
          .from('ritual_completions' as any)
          .select('reflection_id, template, decision')
          .eq('user_id', user.id),
      ]);
      setReflections((refs as unknown as Reflection[]) ?? []);
      setRituals((rits as unknown as RitualCompletion[]) ?? []);
      setLoading(false);
    })();
  }, [user]);

  // Fetch price data capped to signup date
  useEffect(() => {
    setPriceLoading(true);
    const days = Math.max(effectiveDays, 1);
    fetch(`https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${days}`)
      .then((r) => r.json())
      .then((data) => {
        let prices: [number, number][] = data.prices ?? [];
        if (memberSince) {
          const signupTs = memberSince.getTime();
          prices = prices.filter(([ts]) => ts >= signupTs);
        }
        setPriceData(prices);
        setPriceLoading(false);
      })
      .catch(() => setPriceLoading(false));
  }, [effectiveDays, memberSince]);

  // Build chart data with reflections mapped to nearest price point
  const { chartData, reflectionPoints } = useMemo(() => {
    if (!priceData.length) return { chartData: [], reflectionPoints: [] };

    const cutoff = PERIOD_DAYS[period] ? subDays(new Date(), PERIOD_DAYS[period]!) : null;

    // Filter reflections by period
    const filteredRefs = cutoff
      ? reflections.filter((r) => isAfter(new Date(r.created_at), cutoff))
      : reflections;

    // Build ritual lookup
    const ritualMap = new Map<string, RitualCompletion>();
    for (const r of rituals) {
      if (r.reflection_id) ritualMap.set(r.reflection_id, r);
    }

    // Downsample price data for performance
    const maxPoints = 200;
    const step = Math.max(1, Math.floor(priceData.length / maxPoints));
    const sampled: PricePoint[] = [];
    for (let i = 0; i < priceData.length; i += step) {
      sampled.push({
        timestamp: priceData[i][0],
        price: priceData[i][1],
        date: format(new Date(priceData[i][0]), 'MMM d'),
      });
    }
    // Always include last point
    const last = priceData[priceData.length - 1];
    if (sampled[sampled.length - 1]?.timestamp !== last[0]) {
      sampled.push({
        timestamp: last[0],
        price: last[1],
        date: format(new Date(last[0]), 'MMM d'),
      });
    }

    // Inject reflections into the chart data at nearest price points
    const refPoints: PricePoint[] = [];
    for (const ref of filteredRefs) {
      const refTime = new Date(ref.created_at).getTime();
      let nearestIdx = 0;
      let minDiff = Math.abs(refTime - sampled[0].timestamp);
      for (let i = 1; i < sampled.length; i++) {
        const diff = Math.abs(refTime - sampled[i].timestamp);
        if (diff < minDiff) {
          minDiff = diff;
          nearestIdx = i;
        }
      }
      // Tag the sampled point with reflection data
      const point: PricePoint = {
        ...sampled[nearestIdx],
        timestamp: refTime,
        reflection: ref,
        ritual: ritualMap.get(ref.id),
        reflectionPrice: sampled[nearestIdx].price,
      };
      refPoints.push(point);
      // Also mark the sampled data so dots render on the line
      sampled[nearestIdx] = {
        ...sampled[nearestIdx],
        reflection: ref,
        ritual: ritualMap.get(ref.id),
        reflectionPrice: sampled[nearestIdx].price,
      };
    }

    return { chartData: sampled, reflectionPoints: refPoints };
  }, [priceData, reflections, rituals, period]);

  if (loading || priceLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-48 w-full rounded-md" />
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <p className="text-xs text-muted-foreground py-6 text-center">
        Unable to load price data. Try again later.
      </p>
    );
  }

  const priceRange = chartData.map((d) => d.price);
  const minPrice = Math.min(...priceRange);
  const maxPrice = Math.max(...priceRange);

  return (
    <div className="space-y-4">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
          Volatility Timeline
        </p>
        <div className="flex gap-1">
          {(['7d', '30d', '90d', 'all'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-2 py-0.5 text-[10px] font-mono rounded transition-colors ${
                period === p
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground/50 hover:text-muted-foreground'
              }`}
            >
              {p === 'all' ? 'All' : p}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-md border border-border/60 bg-muted/20 p-3">
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              dataKey="price"
              domain={[minPrice * 0.98, maxPrice * 1.02]}
              tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
              width={45}
            />
            <RechartsTooltip
              content={<ChartTooltip />}
              cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '3 3' }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke="hsl(var(--primary))"
              strokeWidth={1.5}
              fill="url(#priceGradient)"
              dot={false}
              activeDot={false}
            />
            <Scatter
              dataKey="reflectionPrice"
              fill="hsl(var(--primary))"
              shape={(props: any) => {
                const point = props.payload as PricePoint;
                if (!point.reflection) return null;
                const color = getMoodColor(point.reflection.mood);
                return (
                  <g>
                    {/* Glow ring */}
                    <circle
                      cx={props.cx}
                      cy={props.cy}
                      r={10}
                      fill={color}
                      fillOpacity={0.15}
                    />
                    {/* Outer ring */}
                    <circle
                      cx={props.cx}
                      cy={props.cy}
                      r={6}
                      fill="hsl(var(--background))"
                      stroke={color}
                      strokeWidth={2}
                    />
                    {/* Inner dot */}
                    <circle
                      cx={props.cx}
                      cy={props.cy}
                      r={3}
                      fill={color}
                    />
                  </g>
                );
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-2 justify-center">
          <LegendItem color="hsl(var(--primary))" label="Calm" />
          <LegendItem color="hsl(var(--destructive))" label="Anxious" />
          <LegendItem color="hsl(var(--muted-foreground))" label="Neutral" />
        </div>
      </div>

      {/* Reflection list below chart */}
      {reflectionPoints.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
            Reflections ({reflectionPoints.length})
          </p>
          <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
            {[...reflectionPoints].reverse().map((rp) => (
              <ReflectionMarkerCard key={rp.reflection!.id} point={rp} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getMoodColor(mood: string | null): string {
  switch (mood) {
    case 'calm': return 'hsl(var(--primary))';
    case 'anxious': return 'hsl(var(--destructive))';
    default: return 'hsl(var(--muted-foreground))';
  }
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[9px] font-mono text-muted-foreground/50">{label}</span>
    </div>
  );
}

function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null;
  const data = payload[0].payload as PricePoint;
  const decisionLabels: Record<string, string> = {
    held: 'Hold', sold: 'Sell', bought: 'Buy', nothing: 'Nothing',
  };

  return (
    <div className="rounded-md border border-border/60 bg-background px-3 py-2 shadow-md max-w-[220px]">
      <p className="text-[10px] font-mono text-muted-foreground">{data.date}</p>
      <p className="text-xs font-mono font-medium">
        ${data.price.toLocaleString('en-US', { maximumFractionDigits: 0 })}
      </p>
      {data.reflection && (
        <div className="mt-1.5 pt-1.5 border-t border-border/40 space-y-1">
          <p className="text-[10px] leading-relaxed line-clamp-2">{data.reflection.message}</p>
          <div className="flex items-center gap-1.5 flex-wrap">
            {data.reflection.mood && (
              <span className="text-[8px] font-mono px-1 py-0.5 rounded bg-muted/40 text-muted-foreground">
                {data.reflection.mood}
              </span>
            )}
            {data.reflection.outcome && (
              <span className="text-[8px] font-mono px-1 py-0.5 rounded bg-muted/40 text-muted-foreground">
                {decisionLabels[data.reflection.outcome] || data.reflection.outcome}
              </span>
            )}
            {data.ritual && (
              <span className="text-[8px] font-mono px-1 py-0.5 rounded bg-primary/10 text-primary/70">
                ritual
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ReflectionMarkerCard({ point }: { point: PricePoint }) {
  const ref = point.reflection!;
  const ritual = point.ritual;

  // Parse BTC change from context
  const changeMatch = ref.context?.match(/(up|down)\s+([\d.]+)%/);
  const changeStr = changeMatch ? `${changeMatch[1] === 'down' ? '↓' : '↑'} ${changeMatch[2]}%` : null;

  const decisionLabels: Record<string, string> = {
    held: 'Hold', sold: 'Sell', bought: 'Buy', nothing: 'Nothing',
  };

  return (
    <div className="rounded-md border border-border/40 bg-muted/20 px-3 py-2.5 space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <div
            className="h-2 w-2 rounded-full shrink-0"
            style={{ backgroundColor: getMoodColor(ref.mood) }}
          />
          <span className="text-[9px] font-mono text-muted-foreground">
            {format(new Date(ref.created_at), 'MMM d, HH:mm')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {changeStr && (
            <span className="text-[9px] font-mono text-muted-foreground/60">{changeStr}</span>
          )}
          <span className="text-[9px] font-mono text-muted-foreground/60">
            ${point.price.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>
      <p className="text-xs leading-relaxed line-clamp-2">{ref.message}</p>
      <div className="flex items-center gap-2 flex-wrap">
        {ref.mood && (
          <span className="text-[9px] font-mono text-muted-foreground/50 bg-muted/30 px-1.5 py-0.5 rounded">
            {ref.mood}
          </span>
        )}
        {ref.outcome && (
          <span className="text-[9px] font-mono text-muted-foreground/50 bg-muted/30 px-1.5 py-0.5 rounded">
            {decisionLabels[ref.outcome] || ref.outcome}
          </span>
        )}
        {ritual && (
          <span className="text-[9px] font-mono text-primary/50 bg-primary/5 px-1.5 py-0.5 rounded">
            Ritual: {ritual.template}
          </span>
        )}
      </div>
    </div>
  );
}

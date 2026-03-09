import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, FunnelChart, Funnel, LabelList, Cell } from 'recharts';
import { RefreshCw, TrendingUp, Users, Target, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface FunnelData {
  period_days: number;
  total_events: Record<string, number>;
  unique_users: Record<string, number>;
  funnel: Record<string, string>;
}

const FUNNEL_STEPS = [
  { key: 'signup', label: 'Signups', icon: Users, color: 'hsl(var(--primary))' },
  { key: 'first_reflection', label: 'First Reflection', icon: Zap, color: 'hsl(220 60% 50%)' },
  { key: 'hit_free_limit', label: 'Hit Free Limit', icon: Target, color: 'hsl(35 80% 50%)' },
  { key: 'upgrade_click', label: 'Upgrade Click', icon: TrendingUp, color: 'hsl(150 60% 40%)' },
  { key: 'subscribed', label: 'Subscribed', icon: TrendingUp, color: 'hsl(120 60% 40%)' },
];

const PERIOD_OPTIONS = [7, 14, 30, 90];

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // Check admin access
  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('lifetime_access')
      .eq('user_id', user.id)
      .single()
      .then(({ data: profile }) => {
        setIsAdmin(profile?.lifetime_access ?? false);
      });
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: result, error: err } = await supabase.functions.invoke('analytics-funnel', {
        body: { days },
      });
      if (err) throw err;
      if (result?.error) throw new Error(result.error);
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [isAdmin, days]);

  if (authLoading || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  if (!user) return <Navigate to="/welcome" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  const funnelChartData = data
    ? FUNNEL_STEPS.map((step) => ({
        name: step.label,
        value: data.unique_users[step.key] ?? 0,
        fill: step.color,
      }))
    : [];

  const barChartData = data
    ? FUNNEL_STEPS.map((step) => ({
        name: step.label,
        events: data.total_events[step.key] ?? 0,
        users: data.unique_users[step.key] ?? 0,
      }))
    : [];

  const blockedFeatures = data?.total_events?.pro_feature_blocked ?? 0;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground font-mono">Analytics</h1>
            <p className="text-sm text-muted-foreground mt-1">Conversion funnel · last {days} days</p>
          </div>
          <div className="flex items-center gap-2">
            {PERIOD_OPTIONS.map((d) => (
              <Button
                key={d}
                variant={days === d ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDays(d)}
                className="text-xs"
              >
                {d}d
              </Button>
            ))}
            <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {error && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
          </Card>
        )}

        {loading && !data ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {FUNNEL_STEPS.map((s) => (
              <Skeleton key={s.key} className="h-24 rounded-lg" />
            ))}
          </div>
        ) : data ? (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {FUNNEL_STEPS.map((step, i) => {
                const Icon = step.icon;
                const count = data.unique_users[step.key] ?? 0;
                const funnelKey = `signup_to_${step.key}`;
                const rate = step.key === 'signup' ? '100%' : (data.funnel[funnelKey] ?? '–');
                return (
                  <motion.div
                    key={step.key}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="relative overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground font-medium">{step.label}</span>
                        </div>
                        <p className="text-2xl font-mono font-semibold text-foreground">{count}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {step.key === 'signup' ? 'total' : `${rate} of signups`}
                        </p>
                      </CardContent>
                      <div
                        className="absolute bottom-0 left-0 right-0 h-0.5"
                        style={{ backgroundColor: step.color }}
                      />
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* Funnel Visualization */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Funnel (Unique Users)
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={funnelChartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={110}
                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {funnelChartData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Events vs Unique Users
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData} margin={{ left: 0, right: 10 }}>
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                        angle={-30}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="events" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Total Events" />
                      <Bar dataKey="users" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} name="Unique Users" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Pro Feature Blocks */}
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Pro Feature Blocked Events</p>
                  <p className="text-xs text-muted-foreground">Times free users hit a Pro gate</p>
                </div>
                <p className="text-3xl font-mono font-semibold text-foreground">{blockedFeatures}</p>
              </CardContent>
            </Card>

            {/* Conversion Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Conversion Rates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(data.funnel).map(([key, value]) => (
                    <div key={key} className="text-center">
                      <p className="text-2xl font-mono font-semibold text-foreground">{value}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {key.replace('signup_to_', '').replace(/_/g, ' ')}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </motion.div>
    </div>
  );
}

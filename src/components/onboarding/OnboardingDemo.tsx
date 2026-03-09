import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface Props {
  stagger: (delay: number) => object;
}

// Simulated price points for a -8% crash chart
const CHART_POINTS = [
  100, 99.5, 100.2, 99.8, 100.5, 100.3, 99.2, 98.5, 97.0, 95.5,
  94.8, 93.2, 92.0, 93.1, 92.5, 92.0,
];

export function OnboardingDemo({ stagger }: Props) {
  const { t } = useTranslation();
  const prefersReduced = useReducedMotion();
  const [chartProgress, setChartProgress] = useState(prefersReduced ? 1 : 0);
  const [showReflection, setShowReflection] = useState(prefersReduced ? true : false);

  useEffect(() => {
    if (prefersReduced) return;
    // Animate chart drawing
    const start = performance.now();
    const duration = 2000;
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      setChartProgress(progress);
      if (progress < 1) requestAnimationFrame(animate);
      else setTimeout(() => setShowReflection(true), 400);
    };
    requestAnimationFrame(animate);
  }, [prefersReduced]);

  const visibleCount = Math.max(2, Math.floor(chartProgress * CHART_POINTS.length));
  const visiblePoints = CHART_POINTS.slice(0, visibleCount);

  const min = Math.min(...CHART_POINTS);
  const max = Math.max(...CHART_POINTS);
  const chartH = 80;
  const chartW = 280;

  const pathD = visiblePoints
    .map((v, i) => {
      const x = (i / (CHART_POINTS.length - 1)) * chartW;
      const y = chartH - ((v - min) / (max - min)) * chartH;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div className="space-y-6">
      <motion.div className="space-y-2" {...stagger(0.1)}>
        <p className="text-xs font-mono tracking-[0.25em] uppercase text-muted-foreground">
          {t('onboarding.demoTitle')}
        </p>
        <div className="h-px w-8 bg-foreground/20" />
      </motion.div>

      <motion.p
        className="text-sm text-muted-foreground leading-relaxed"
        {...stagger(0.15)}
      >
        {t('onboarding.demoIntro')}
      </motion.p>

      {/* Mini crash chart */}
      <motion.div {...stagger(0.25)}>
        <div className="rounded-sm border border-border/40 bg-muted/20 p-4 space-y-3">
          <div className="flex items-baseline justify-between">
            <p className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider">BTC/USD</p>
            <p className="text-xs font-mono text-destructive">
              {chartProgress >= 1 ? '−8.0%' : `−${(chartProgress * 8).toFixed(1)}%`}
            </p>
          </div>

          <svg
            viewBox={`0 0 ${chartW} ${chartH}`}
            className="w-full"
            style={{ height: 80 }}
            preserveAspectRatio="none"
          >
            <path
              d={pathD}
              fill="none"
              stroke="hsl(var(--destructive))"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          <p className="text-[10px] font-mono text-muted-foreground/40">
            {t('onboardingSample.context')}
          </p>
        </div>
      </motion.div>

      {/* Sample reflection */}
      {showReflection && (
        <motion.div
          initial={prefersReduced ? {} : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-sm border border-border/40 bg-muted/20 p-4 space-y-3"
        >
          <p className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider">
            {t('onboarding.demoReflectionLabel')}
          </p>
          <p className="text-sm leading-relaxed text-foreground/80">
            {t('onboardingSample.message')}
          </p>
        </motion.div>
      )}

      <motion.p
        className="text-[10px] text-muted-foreground/40"
        {...stagger(0.4)}
      >
        {t('onboarding.demoHint')}
      </motion.p>
    </div>
  );
}

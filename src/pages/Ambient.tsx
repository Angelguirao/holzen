import { useEffect, useState, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { fetchBtcData, type BtcPriceData } from '@/lib/btc';

/**
 * Ambient Mode — a persistent full-screen breathing screen
 * with slow breathing animation and volatility-driven color gradients.
 *
 * Color logic:
 *  - Calm (|change| < 2%)  → cool teal/blue
 *  - Moderate (2–5%)       → warm amber
 *  - Intense (> 5%)        → deep crimson/rose
 *
 * Breathing circle expands/contracts on a slow 8-second cycle.
 */

type VolatilityLevel = 'calm' | 'moderate' | 'intense';

function getVolatilityLevel(changePercent: number): VolatilityLevel {
  const abs = Math.abs(changePercent);
  if (abs < 2) return 'calm';
  if (abs < 5) return 'moderate';
  return 'intense';
}

const gradients: Record<VolatilityLevel, { from: string; via: string; to: string }> = {
  calm: {
    from: 'hsla(180, 30%, 15%, 1)',
    via: 'hsla(200, 25%, 10%, 1)',
    to: 'hsla(220, 20%, 8%, 1)',
  },
  moderate: {
    from: 'hsla(35, 40%, 12%, 1)',
    via: 'hsla(25, 35%, 10%, 1)',
    to: 'hsla(15, 30%, 8%, 1)',
  },
  intense: {
    from: 'hsla(350, 40%, 14%, 1)',
    via: 'hsla(340, 35%, 10%, 1)',
    to: 'hsla(330, 30%, 8%, 1)',
  },
};

const glowColors: Record<VolatilityLevel, string> = {
  calm: 'hsla(180, 50%, 50%, 0.15)',
  moderate: 'hsla(35, 60%, 55%, 0.15)',
  intense: 'hsla(350, 55%, 50%, 0.15)',
};

const ringColors: Record<VolatilityLevel, string> = {
  calm: 'hsla(180, 40%, 60%, 0.3)',
  moderate: 'hsla(35, 50%, 60%, 0.3)',
  intense: 'hsla(350, 45%, 55%, 0.3)',
};

const textColors: Record<VolatilityLevel, string> = {
  calm: 'hsla(180, 30%, 70%, 0.6)',
  moderate: 'hsla(35, 40%, 70%, 0.6)',
  intense: 'hsla(350, 35%, 70%, 0.6)',
};

const BREATH_DURATION = 8; // seconds per full cycle

export default function Ambient() {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const [btcData, setBtcData] = useState<BtcPriceData | null>(null);
  const [level, setLevel] = useState<VolatilityLevel>('calm');

  // Fetch BTC data on mount and every 60s
  const loadData = useCallback(async () => {
    try {
      const data = await fetchBtcData(); // Ambient uses USD always
      setBtcData(data);
      setLevel(getVolatilityLevel(data.changePercent));
    } catch {
      // silently continue with current level
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60_000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Hide nav in ambient mode
  useEffect(() => {
    document.body.classList.add('ambient-active');
    return () => document.body.classList.remove('ambient-active');
  }, []);

  // Prevent scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const grad = gradients[level];
  const backgroundStyle = {
    background: `radial-gradient(ellipse at 50% 40%, ${grad.from}, ${grad.via} 50%, ${grad.to} 100%)`,
  };

  const breathingVariants = prefersReducedMotion
    ? { animate: { scale: 1, opacity: 0.4 } }
    : {
        animate: {
          scale: [1, 1.15, 1],
          opacity: [0.3, 0.5, 0.3],
          transition: {
            duration: BREATH_DURATION,
            repeat: Infinity,
            ease: 'easeInOut' as const,
          },
        },
      };

  const outerRingVariants = prefersReducedMotion
    ? { animate: { scale: 1, opacity: 0.15 } }
    : {
        animate: {
          scale: [1, 1.25, 1],
          opacity: [0.1, 0.2, 0.1],
          transition: {
            duration: BREATH_DURATION,
            repeat: Infinity,
            ease: 'easeInOut' as const,
            delay: 0.3,
          },
        },
      };

  const labelMap: Record<VolatilityLevel, string> = {
    calm: t('ambient.calm'),
    moderate: t('ambient.moderate'),
    intense: t('ambient.intense'),
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center select-none"
      style={backgroundStyle}
    >
      {/* Close button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-6 right-6 p-2 rounded-full transition-opacity hover:opacity-80"
        style={{ color: textColors[level] }}
        aria-label="Exit ambient mode"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Breathing circles */}
      <div className="relative flex items-center justify-center">
        {/* Outer glow ring */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 220,
            height: 220,
            background: `radial-gradient(circle, ${glowColors[level]}, transparent 70%)`,
          }}
          variants={outerRingVariants}
          animate="animate"
        />

        {/* Main breathing circle */}
        <motion.div
          className="relative rounded-full"
          style={{
            width: 140,
            height: 140,
            border: `1px solid ${ringColors[level]}`,
            background: `radial-gradient(circle at 50% 40%, ${glowColors[level]}, transparent 80%)`,
            boxShadow: `0 0 60px 20px ${glowColors[level]}`,
          }}
          variants={breathingVariants}
          animate="animate"
        />
      </div>

      {/* Label */}
      <div className="mt-16 text-center space-y-3">
        <p
          className="text-[10px] font-mono tracking-[0.3em] uppercase"
          style={{ color: textColors[level] }}
        >
          {labelMap[level]}
        </p>
        {btcData && (
          <p
            className="text-[10px] font-mono tabular-nums"
            style={{ color: textColors[level], opacity: 0.5 }}
          >
            {Math.abs(btcData.changePercent).toFixed(1)}% · 24h
          </p>
        )}
      </div>

      {/* Breathing instruction */}
      <p
        className="absolute bottom-12 text-[9px] font-mono tracking-[0.2em] uppercase"
        style={{ color: textColors[level], opacity: 0.3 }}
      >
        {t('ambient.breathe')}
      </p>
    </div>
  );
}

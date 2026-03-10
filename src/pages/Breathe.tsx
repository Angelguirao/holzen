import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { hapticFeedback } from '@/lib/haptics';
import { fetchBtcData, type BtcPriceData } from '@/lib/btc';

type VolatilityLevel = 'calm' | 'moderate' | 'intense';
type Mode = 'ambient' | 'void';

function getVolatilityLevel(changePercent: number): VolatilityLevel {
  const abs = Math.abs(changePercent);
  if (abs < 2) return 'calm';
  if (abs < 5) return 'moderate';
  return 'intense';
}

const gradients: Record<VolatilityLevel, { from: string; via: string; to: string }> = {
  calm: { from: 'hsla(180, 30%, 15%, 1)', via: 'hsla(200, 25%, 10%, 1)', to: 'hsla(220, 20%, 8%, 1)' },
  moderate: { from: 'hsla(35, 40%, 12%, 1)', via: 'hsla(25, 35%, 10%, 1)', to: 'hsla(15, 30%, 8%, 1)' },
  intense: { from: 'hsla(350, 40%, 14%, 1)', via: 'hsla(340, 35%, 10%, 1)', to: 'hsla(330, 30%, 8%, 1)' },
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

const BREATH_DURATION = 8; // 4s in, 4s out — synced to feel like block time
const VOID_SECONDS = 120; // ~2 min, roughly 1/5 of a block

interface BlockData {
  height: number;
  mempoolSize: number;
  mempoolPending: number;
}

/** Fetch latest block height and mempool info */
async function fetchBlockData(): Promise<BlockData | null> {
  try {
    const [heightRes, mempoolRes] = await Promise.all([
      fetch('https://mempool.space/api/blocks/tip/height'),
      fetch('https://mempool.space/api/mempool'),
    ]);
    const height = await heightRes.json();
    const mempool = await mempoolRes.json();
    return {
      height: typeof height === 'number' ? height : parseInt(height),
      mempoolSize: mempool?.vsize ?? 0,
      mempoolPending: mempool?.count ?? 0,
    };
  } catch {
    return null;
  }
}

/** Convert seconds to approximate sats (1 sat ≈ 1 second at ~6.25 BTC/10min block reward) */
function secondsToSats(seconds: number): number {
  // Block reward: 3.125 BTC = 312,500,000 sats per ~600 seconds
  // ≈ 520,833 sats/second
  // But for display, we use a simpler human-scale: 1 second = 1 sat
  return seconds;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}

/** Mempool visualization — pending transactions settling */
function MempoolViz({ level, pending }: { level: VolatilityLevel; pending: number }) {
  const prefersReduced = useReducedMotion();
  const dots = useMemo(() => {
    const count = Math.min(Math.max(Math.floor(pending / 5000), 4), 20);
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: 30 + Math.random() * 40,
      y: 20 + Math.random() * 60,
      size: 1 + Math.random() * 2,
      delay: Math.random() * 4,
      duration: 3 + Math.random() * 4,
    }));
  }, [pending]);

  if (prefersReduced) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {dots.map((dot) => (
        <motion.div
          key={dot.id}
          className="absolute rounded-full"
          style={{
            left: `${dot.x}%`,
            top: `${dot.y}%`,
            width: dot.size,
            height: dot.size,
            background: glowColors[level],
          }}
          animate={{
            opacity: [0, 0.6, 0],
            y: [0, -20, -40],
            scale: [1, 0.5, 0],
          }}
          transition={{
            duration: dot.duration,
            repeat: Infinity,
            delay: dot.delay,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}

export default function Breathe() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  const [mode, setMode] = useState<Mode>('ambient');
  const [btcData, setBtcData] = useState<BtcPriceData | null>(null);
  const [blockData, setBlockData] = useState<BlockData | null>(null);
  const [blockAtStart, setBlockAtStart] = useState<number | null>(null);
  const [level, setLevel] = useState<VolatilityLevel>('calm');
  const [curtainLifted, setCurtainLifted] = useState(false);

  // Void state
  const [voidSeconds, setVoidSeconds] = useState(VOID_SECONDS);
  const [elapsed, setElapsed] = useState(0);
  const [voidStarted, setVoidStarted] = useState(false);
  const [voidCompleted, setVoidCompleted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setCurtainLifted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch BTC + block data
  const loadData = useCallback(async () => {
    const [btc, block] = await Promise.all([
      fetchBtcData().catch(() => null),
      fetchBlockData(),
    ]);
    if (btc) {
      setBtcData(btc);
      setLevel(getVolatilityLevel(btc.changePercent));
    }
    if (block) setBlockData(block);
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30_000); // refresh every 30s for mempool changes
    return () => clearInterval(interval);
  }, [loadData]);

  // Hide nav + prevent scroll
  useEffect(() => {
    document.body.classList.add('ambient-active');
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.classList.remove('ambient-active');
      document.body.style.overflow = '';
    };
  }, []);

  // Void timer with elapsed tracking
  useEffect(() => {
    if (mode !== 'void' || !voidStarted || voidCompleted) return;
    intervalRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
      setVoidSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setVoidCompleted(true);
          hapticFeedback('success');
          // Re-fetch block data to see if a new block was mined
          fetchBlockData().then((d) => { if (d) setBlockData(d); });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [mode, voidStarted, voidCompleted]);

  const handleClose = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const startVoid = useCallback(() => {
    setVoidSeconds(VOID_SECONDS);
    setElapsed(0);
    setVoidStarted(false);
    setVoidCompleted(false);
    setBlockAtStart(blockData?.height ?? null);
    setMode('void');
  }, [blockData]);

  const backToAmbient = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setMode('ambient');
  }, []);

  const grad = gradients[level];
  const backgroundStyle = {
    background: `radial-gradient(ellipse at 50% 40%, ${grad.from}, ${grad.via} 50%, ${grad.to} 100%)`,
  };

  const voidProgress = (VOID_SECONDS - voidSeconds) / VOID_SECONDS;
  const satsElapsed = secondsToSats(elapsed);
  const newBlockMined = blockAtStart && blockData && blockData.height > blockAtStart;

  const labelMap: Record<VolatilityLevel, string> = {
    calm: t('ambient.calm'),
    moderate: t('ambient.moderate'),
    intense: t('ambient.intense'),
  };

  return (
    <>
      {/* Dark curtain entrance */}
      <AnimatePresence>
        {!curtainLifted && (
          <motion.div
            className="fixed inset-0 z-[200] bg-background"
            exit={{ opacity: 0 }}
            transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
          />
        )}
      </AnimatePresence>

      <div
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center select-none"
        style={backgroundStyle}
      >
        {/* Mempool particles */}
        {blockData && <MempoolViz level={level} pending={blockData.mempoolPending} />}

        {/* Close */}
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 p-2 rounded-full transition-opacity hover:opacity-80 z-10"
          style={{ color: textColors[level] }}
          aria-label="Exit"
        >
          <X className="h-5 w-5" />
        </button>

        <AnimatePresence mode="wait">
          {mode === 'ambient' && (
            <motion.div
              key="ambient"
              className="flex flex-col items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
            >
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
                  animate={prefersReducedMotion ? { scale: 1, opacity: 0.15 } : {
                    scale: [1, 1.25, 1],
                    opacity: [0.1, 0.2, 0.1],
                  }}
                  transition={{
                    duration: BREATH_DURATION,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 0.3,
                  }}
                />

                {/* Main breathing circle */}
                <motion.div
                  className="relative rounded-full flex items-center justify-center"
                  style={{
                    width: 140,
                    height: 140,
                    border: `1px solid ${ringColors[level]}`,
                    background: `radial-gradient(circle at 50% 40%, ${glowColors[level]}, transparent 80%)`,
                    boxShadow: `0 0 60px 20px ${glowColors[level]}`,
                  }}
                  animate={prefersReducedMotion ? { scale: 1, opacity: 0.4 } : {
                    scale: [1, 1.15, 1],
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{
                    duration: BREATH_DURATION,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  {/* Block height inside the circle */}
                  {blockData && (
                    <span
                      className="font-mono text-[11px] tabular-nums tracking-wider"
                      style={{ color: textColors[level], opacity: 0.5 }}
                    >
                      {blockData.height.toLocaleString()}
                    </span>
                  )}
                </motion.div>
              </div>

              {/* Labels */}
              <div className="mt-14 text-center space-y-4">
                <p
                  className="text-[10px] font-mono tracking-[0.3em] uppercase"
                  style={{ color: textColors[level] }}
                >
                  {labelMap[level]}
                </p>

                {/* Block grounding prompt */}
                {blockData && (
                  <motion.p
                    className="text-[10px] font-mono leading-relaxed max-w-[240px]"
                    style={{ color: textColors[level], opacity: 0.35 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.35 }}
                    transition={{ delay: 2, duration: 1.5 }}
                  >
                    {t('breathe.blockGrounding', 'Block {{height}}. Immutable. Like this moment.', { height: blockData.height.toLocaleString() })}
                  </motion.p>
                )}

                {/* Mempool context */}
                {blockData && blockData.mempoolPending > 0 && (
                  <motion.p
                    className="text-[9px] font-mono tabular-nums"
                    style={{ color: textColors[level], opacity: 0.2 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.2 }}
                    transition={{ delay: 3.5, duration: 1.5 }}
                  >
                    {formatNumber(blockData.mempoolPending)} {t('breathe.pendingTx', 'transactions waiting to confirm')}
                  </motion.p>
                )}
              </div>

              {/* Mode toggle */}
              <div className="mt-12 flex flex-col items-center gap-4">
                <button
                  onClick={startVoid}
                  className="text-[10px] font-mono tracking-[0.2em] uppercase transition-opacity hover:opacity-80"
                  style={{ color: textColors[level], opacity: 0.4 }}
                >
                  {t('breathe.startTimer')}
                </button>
              </div>

              {/* Breathing instruction */}
              <p
                className="absolute bottom-12 text-[9px] font-mono tracking-[0.2em] uppercase"
                style={{ color: textColors[level], opacity: 0.3 }}
              >
                {t('ambient.breathe')}
              </p>
            </motion.div>
          )}

          {mode === 'void' && (
            <motion.div
              key="void"
              className="flex flex-col items-center gap-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Ambient glow */}
              <motion.div
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: 300,
                  height: 300,
                  background: `radial-gradient(circle, ${glowColors[level]}, transparent 70%)`,
                  filter: 'blur(60px)',
                }}
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.4, 0.6, 0.4],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />

              {!voidStarted && !voidCompleted ? (
                <motion.button
                  onClick={() => {
                    setVoidStarted(true);
                    hapticFeedback('light');
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="relative z-10 font-mono text-xs tracking-[0.3em] uppercase transition-colors duration-700"
                  style={{ color: textColors[level], opacity: 0.6 }}
                >
                  {t('void.begin')}
                </motion.button>
              ) : voidCompleted ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1.5 }}
                  className="relative z-10 flex flex-col items-center gap-6"
                >
                  {/* Sats-as-seconds summary */}
                  <p
                    className="font-mono text-2xl tracking-[0.1em] tabular-nums"
                    style={{ color: textColors[level], opacity: 0.5 }}
                  >
                    {satsElapsed.toLocaleString()} <span className="text-xs">sats</span>
                  </p>
                  <p
                    className="font-mono text-[10px] tracking-[0.2em] uppercase"
                    style={{ color: textColors[level], opacity: 0.35 }}
                  >
                    {t('breathe.timeInStillness', 'of stillness')}
                  </p>

                  {/* Block mined during session? */}
                  {newBlockMined && (
                    <motion.p
                      className="font-mono text-[10px] leading-relaxed text-center max-w-[220px]"
                      style={{ color: textColors[level], opacity: 0.4 }}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 0.4, y: 0 }}
                      transition={{ delay: 0.5, duration: 1 }}
                    >
                      {t('breathe.blockMined', 'While you were still, block {{height}} was mined.', { height: blockData?.height.toLocaleString() })}
                    </motion.p>
                  )}

                  {/* Network kept working */}
                  <motion.p
                    className="font-mono text-[9px] max-w-[200px] text-center leading-relaxed"
                    style={{ color: textColors[level], opacity: 0.25 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.25 }}
                    transition={{ delay: 1, duration: 1.5 }}
                  >
                    {t('breathe.networkKept', "The network kept working. You didn't have to.")}
                  </motion.p>

                  <button
                    onClick={backToAmbient}
                    className="font-mono text-[10px] tracking-[0.2em] uppercase transition-colors duration-700 mt-4"
                    style={{ color: textColors[level], opacity: 0.3 }}
                  >
                    {t('void.return')}
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1 }}
                  className="relative z-10 flex flex-col items-center gap-8"
                >
                  {/* Sats counter instead of time */}
                  <p
                    className="font-mono text-2xl tracking-[0.1em] tabular-nums"
                    style={{ color: textColors[level], opacity: 0.15 + voidProgress * 0.35 }}
                  >
                    {satsElapsed.toLocaleString()} <span className="text-xs opacity-50">sats</span>
                  </p>

                  {/* Progress ring */}
                  <svg width="120" height="120" className="absolute -z-10 opacity-20">
                    <circle cx="60" cy="60" r="56" fill="none" stroke={`${ringColors[level]}`} strokeWidth="1" style={{ opacity: 0.3 }} />
                    <circle
                      cx="60" cy="60" r="56" fill="none" stroke={ringColors[level]} strokeWidth="1"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 56}`}
                      strokeDashoffset={`${2 * Math.PI * 56 * (1 - voidProgress)}`}
                      transform="rotate(-90 60 60)"
                      style={{ transition: 'stroke-dashoffset 1s linear' }}
                    />
                  </svg>

                  {/* Block height grounding */}
                  {blockData && (
                    <motion.p
                      className="font-mono text-[9px] tabular-nums"
                      style={{ color: textColors[level], opacity: 0.15 }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.15 }}
                      transition={{ delay: 5, duration: 2 }}
                    >
                      {t('breathe.currentBlock', 'block {{height}}', { height: blockData.height.toLocaleString() })}
                    </motion.p>
                  )}

                  <button
                    onClick={backToAmbient}
                    className="font-mono text-[10px] tracking-[0.2em] uppercase transition-colors duration-700 mt-4"
                    style={{ color: textColors[level], opacity: 0.25 }}
                  >
                    {t('common.back')}
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

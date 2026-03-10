import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { hapticFeedback } from '@/lib/haptics';
import { fetchBtcData, type BtcPriceData } from '@/lib/btc';
import { playBlockDiscoveryTone, startAmbientDrone } from '@/lib/notification-tone';

type VolatilityLevel = 'calm' | 'moderate' | 'intense';

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

const BREATH_DURATION = 8;

interface BlockData {
  height: number;
  mempoolSize: number;
  mempoolPending: number;
  lastBlockTime?: number;
  fastestFee?: number;
  difficultyEpochProgress?: number;
}

async function fetchBlockData(): Promise<BlockData | null> {
  try {
    const [heightRes, mempoolRes, blocksRes, feesRes] = await Promise.all([
      fetch('https://mempool.space/api/blocks/tip/height'),
      fetch('https://mempool.space/api/mempool'),
      fetch('https://mempool.space/api/blocks'),
      fetch('https://mempool.space/api/v1/fees/recommended'),
    ]);
    const height = await heightRes.json();
    const mempool = await mempoolRes.json();
    const fees = await feesRes.json().catch(() => null);
    let lastBlockTime: number | undefined;
    try {
      const blocks = await blocksRes.json();
      if (Array.isArray(blocks) && blocks.length > 0) {
        lastBlockTime = blocks[0].timestamp;
      }
    } catch {}

    const h = typeof height === 'number' ? height : parseInt(height);
    const epochProgress = (h % 2016) / 2016;

    return {
      height: h,
      mempoolSize: mempool?.vsize ?? 0,
      mempoolPending: mempool?.count ?? 0,
      lastBlockTime,
      fastestFee: fees?.fastestFee,
      difficultyEpochProgress: epochProgress,
    };
  } catch {
    return null;
  }
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}

/** Mempool visualization — pending transactions settling */
function MempoolViz({ level, pending, depth }: { level: VolatilityLevel; pending: number; depth: number }) {
  const prefersReduced = useReducedMotion();

  const dots = useMemo(() => {
    const count = Math.min(Math.max(Math.floor(pending / 3000), 6), 30);
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: 10 + Math.random() * 80,
      y: 10 + Math.random() * 80,
      size: 1.5 + Math.random() * 2.5,
      delay: Math.random() * 6,
      duration: 4 + Math.random() * 5,
    }));
  }, [pending]);

  if (prefersReduced) return null;

  // Reduce particle opacity as we go deeper
  const particleOpacity = Math.max(0.8 - depth * 0.5, 0.15);

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
            opacity: [0, particleOpacity, 0],
            y: [0, -30, -60],
            scale: [0.8, 1, 0.3],
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

/** Difficulty epoch progress arc */
function EpochArc({ progress, color }: { progress: number; color: string }) {
  const r = 70;
  const circumference = 2 * Math.PI * r;
  return (
    <motion.svg
      width="160" height="160"
      className="absolute pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.18 }}
      transition={{ delay: 4, duration: 3 }}
    >
      <circle cx="80" cy="80" r={r} fill="none" stroke={color} strokeWidth="0.5" opacity={0.3} />
      <circle
        cx="80" cy="80" r={r} fill="none" stroke={color} strokeWidth="0.8"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - progress)}
        transform="rotate(-90 80 80)"
      />
    </motion.svg>
  );
}

/** Contemplative phrases adapted to volatility level */
const VOID_CONTEMPLATIONS: Record<VolatilityLevel, string[]> = {
  calm: [
    'No seconds. Only blocks.',
    'The network keeps time. You don\'t have to.',
    'Each block — a heartbeat of collective energy.',
    'Immutable. Like this moment.',
    'Nothing to react to. Nothing to fix.',
    'Stillness is its own proof of work.',
    'The chain grows. Quietly. Like patience.',
  ],
  moderate: [
    'The market moves. You don\'t have to.',
    'Volatility is noise. Blocks are signal.',
    'Time is a chain of causes. Sit between them.',
    'The mempool stirs. Transactions wait. You can wait too.',
    'Price is a feeling. The chain is a fact.',
    'Between stimulus and response — this space.',
    'Let the candles flicker. The chain doesn\'t flinch.',
  ],
  intense: [
    'The crowd is loud. The chain is silent.',
    'This too will be a block in the past.',
    'Fear and greed are weather. You are the mountain.',
    'Proof of work. Proof of patience.',
    'Every panic sold. Every mania bought. The chain remained.',
    'Breathe. The network is still hashing.',
    'When everything moves — be the thing that doesn\'t.',
  ],
};

function WordByWordText({ text, delay = 0, color }: { text: string; delay?: number; color: string }) {
  const words = text.split(' ');
  return (
    <p className="font-mono text-[10px] leading-relaxed text-center max-w-[260px]" style={{ color }}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block mr-[0.35em]"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 0.5, y: 0 }}
          transition={{ delay: delay + i * 0.35, duration: 0.6, ease: 'easeOut' }}
        >
          {word}
        </motion.span>
      ))}
    </p>
  );
}

function formatTimeSince(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return `${mins}m ${secs > 0 ? `${secs}s` : ''}`.trim();
  const hrs = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return `${hrs}h ${remainMins}m`;
}

/**
 * Progressive deepening experience.
 * depth 0 = ambient surface (breathing, block data, labels)
 * depth 1 = deep stillness (void — stripped UI, contemplations, blockchain clock)
 * Tap the center area to descend/ascend.
 */
export default function Breathe() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  const [btcData, setBtcData] = useState<BtcPriceData | null>(null);
  const [blockData, setBlockData] = useState<BlockData | null>(null);
  const [level, setLevel] = useState<VolatilityLevel>('calm');
  const [curtainLifted, setCurtainLifted] = useState(false);

  // Depth: 0 = surface ambient, 1 = deep void
  const [depth, setDepth] = useState(0);
  const [deepReady, setDeepReady] = useState(false); // animation settled into deep mode

  // Deep state
  const [contemplationIndex, setContemplationIndex] = useState(0);
  const [timeSinceBlock, setTimeSinceBlock] = useState<number | null>(null);
  const [blockAtEntry, setBlockAtEntry] = useState<number | null>(null);
  const [newBlockMined, setNewBlockMined] = useState(false);
  const [newBlockHeight, setNewBlockHeight] = useState<number | null>(null);
  const [deepElapsed, setDeepElapsed] = useState(0);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const contemplationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopDroneRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setCurtainLifted(true), 100);
    return () => clearTimeout(timer);
  }, []);

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
    return block;
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30_000);
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

  // Deep: tick time-since-last-block every second
  useEffect(() => {
    if (depth !== 1 || !deepReady) return;
    const tick = () => {
      if (blockData?.lastBlockTime) {
        setTimeSinceBlock(Math.floor(Date.now() / 1000) - blockData.lastBlockTime);
      }
      setDeepElapsed((prev) => prev + 1);
    };
    tick();
    tickRef.current = setInterval(tick, 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [depth, deepReady, blockData?.lastBlockTime]);

  // Deep: poll for new blocks every 15s
  useEffect(() => {
    if (depth !== 1 || !deepReady) return;
    pollRef.current = setInterval(async () => {
      const fresh = await fetchBlockData();
      if (fresh) {
        if (blockAtEntry && fresh.height > blockAtEntry && !newBlockMined) {
          setNewBlockMined(true);
          setNewBlockHeight(fresh.height);
          hapticFeedback('success');
          playBlockDiscoveryTone();
        }
        setBlockData(fresh);
      }
    }, 15_000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [depth, deepReady, blockAtEntry, newBlockMined]);

  // Deep: cycle contemplations every 20s
  useEffect(() => {
    if (depth !== 1 || !deepReady) return;
    contemplationTimerRef.current = setInterval(() => {
      setContemplationIndex((prev) => (prev + 1) % VOID_CONTEMPLATIONS[level].length);
    }, 20_000);
    return () => { if (contemplationTimerRef.current) clearInterval(contemplationTimerRef.current); };
  }, [depth, deepReady, level]);

  // Deep: ambient drone
  useEffect(() => {
    if (depth !== 1 || !deepReady) return;
    stopDroneRef.current = startAmbientDrone();
    return () => {
      stopDroneRef.current?.();
      stopDroneRef.current = null;
    };
  }, [depth, deepReady]);

  const handleClose = useCallback(() => {
    [pollRef, contemplationTimerRef, tickRef].forEach((ref) => {
      if (ref.current) clearInterval(ref.current);
    });
    stopDroneRef.current?.();
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const toggleDepth = useCallback(() => {
    if (depth === 0) {
      // Descend into stillness
      hapticFeedback('light');
      setDeepReady(false);
      setContemplationIndex(0);
      setNewBlockMined(false);
      setNewBlockHeight(null);
      setDeepElapsed(0);
      setBlockAtEntry(blockData?.height ?? null);
      setDepth(1);
    } else {
      // Surface back
      hapticFeedback('light');
      [pollRef, contemplationTimerRef, tickRef].forEach((ref) => {
        if (ref.current) clearInterval(ref.current);
      });
      stopDroneRef.current?.();
      setDepth(0);
      setDeepReady(false);
    }
  }, [depth, blockData]);

  const grad = gradients[level];
  const backgroundStyle = {
    background: `radial-gradient(ellipse at 50% 40%, ${grad.from}, ${grad.via} 50%, ${grad.to} 100%)`,
  };

  const labelMap: Record<VolatilityLevel, string> = {
    calm: t('ambient.calm'),
    moderate: t('ambient.moderate'),
    intense: t('ambient.intense'),
  };

  // Progressive dimming when deep (over 5 min, max 40%)
  const dimFactor = depth === 1 ? Math.min(deepElapsed / 300, 1) * 0.4 : 0;
  // Fee warmth
  const feeHeat = blockData?.fastestFee ? Math.min(blockData.fastestFee / 50, 1) : 0;
  const warmGlow = feeHeat > 0.1
    ? `hsla(${35 - feeHeat * 20}, ${50 + feeHeat * 20}%, 50%, ${0.15 + feeHeat * 0.05})`
    : glowColors[level];

  // Breathing circle scale — shrinks as we go deeper
  const breatheScale = depth === 0 ? 1 : 0.6;
  // Surface elements opacity — fade as we descend
  const surfaceOpacity = depth === 0 ? 1 : 0;
  // Deep elements opacity
  const deepOpacity = depth === 1 ? 1 : 0;

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
        {/* Mempool particles — fade with depth */}
        {blockData && <MempoolViz level={level} pending={blockData.mempoolPending} depth={depth} />}

        {/* Progressive dimming overlay */}
        <motion.div
          className="fixed inset-0 pointer-events-none z-[101]"
          style={{ background: 'black' }}
          animate={{ opacity: dimFactor }}
          transition={{ duration: 2, ease: 'easeInOut' }}
        />

        {/* Close */}
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 p-2 rounded-full transition-opacity hover:opacity-80 z-[110]"
          style={{ color: textColors[level] }}
          aria-label="Exit"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Tap target — the entire center area */}
        <button
          onClick={toggleDepth}
          className="relative z-[105] flex flex-col items-center justify-center focus:outline-none"
          style={{ width: '100%', maxWidth: 400, minHeight: 400 }}
          aria-label={depth === 0 ? t('void.enter', 'Enter the void') : t('void.return', 'Return')}
        >
          {/* ====== BREATHING CIRCLES — always present, shrink when deep ====== */}
          <motion.div
            className="relative flex items-center justify-center"
            animate={{ scale: breatheScale }}
            transition={{ duration: 3, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Outer glow ring */}
            <motion.div
              className="absolute rounded-full"
              style={{
                width: 220,
                height: 220,
                background: `radial-gradient(circle, ${depth === 1 ? warmGlow : glowColors[level]}, transparent 70%)`,
                filter: depth === 1 ? 'blur(80px)' : 'none',
              }}
              animate={prefersReducedMotion ? { scale: 1, opacity: 0.15 } : {
                scale: [1, 1.25, 1],
                opacity: [0.1, 0.2, 0.1],
              }}
              transition={{
                duration: depth === 1 && btcData?.onChain?.hashrate ? 8 : BREATH_DURATION,
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
              {blockData && (
                <span
                  className="font-mono text-[11px] tabular-nums tracking-wider"
                  style={{ color: textColors[level], opacity: 0.5 }}
                >
                  {blockData.height.toLocaleString()}
                </span>
              )}
            </motion.div>

            {/* Epoch arc — visible at all depths */}
            {blockData?.difficultyEpochProgress != null && (
              <EpochArc progress={blockData.difficultyEpochProgress} color={textColors[level]} />
            )}
          </motion.div>

          {/* ====== SURFACE LAYER — fades out when descending ====== */}
          <motion.div
            className="flex flex-col items-center mt-14 text-center space-y-4"
            animate={{ opacity: surfaceOpacity, y: surfaceOpacity === 0 ? 20 : 0 }}
            transition={{ duration: 2, ease: 'easeInOut' }}
            style={{ pointerEvents: depth === 0 ? 'auto' : 'none' }}
          >
            <p
              className="text-[10px] font-mono tracking-[0.3em] uppercase"
              style={{ color: textColors[level] }}
            >
              {labelMap[level]}
            </p>

            {blockData && (
              <motion.p
                className="text-[10px] font-mono leading-relaxed max-w-[240px]"
                style={{ color: textColors[level], opacity: 0.35 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: surfaceOpacity * 0.35 }}
                transition={{ delay: 2, duration: 1.5 }}
              >
                {t('breathe.blockGrounding', 'Block {{height}}. Immutable. Like this moment.', { height: blockData.height.toLocaleString() })}
              </motion.p>
            )}

            {blockData && blockData.mempoolPending > 0 && (
              <motion.p
                className="text-[9px] font-mono tabular-nums"
                style={{ color: textColors[level], opacity: 0.2 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: surfaceOpacity * 0.2 }}
                transition={{ delay: 3.5, duration: 1.5 }}
              >
                {formatNumber(blockData.mempoolPending)} {t('breathe.pendingTx', 'transactions waiting to confirm')}
              </motion.p>
            )}

            {/* Hint to go deeper */}
            <motion.p
              className="text-[9px] font-mono tracking-[0.2em] uppercase mt-8"
              style={{ color: textColors[level], opacity: 0.25 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.25 }}
              transition={{ delay: 5, duration: 2 }}
            >
              {t('void.tapToDescend', 'tap to go deeper')}
            </motion.p>
          </motion.div>

          {/* ====== DEEP LAYER — fades in when descending ====== */}
          <motion.div
            className="absolute flex flex-col items-center gap-6"
            style={{ top: '60%', pointerEvents: depth === 1 ? 'auto' : 'none' }}
            animate={{ opacity: deepOpacity }}
            transition={{ duration: 2.5, ease: 'easeInOut', delay: depth === 1 ? 1.5 : 0 }}
            onAnimationComplete={() => {
              if (depth === 1 && !deepReady) setDeepReady(true);
            }}
          >
            {/* Time since last block */}
            {timeSinceBlock !== null && (
              <motion.div
                className="flex flex-col items-center gap-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 1.5 }}
              >
                <p
                  className="font-mono text-sm tabular-nums tracking-wider"
                  style={{ color: textColors[level], opacity: 0.25 }}
                >
                  {formatTimeSince(timeSinceBlock)}
                </p>
                <p
                  className="font-mono text-[8px] tracking-[0.2em] uppercase"
                  style={{ color: textColors[level], opacity: 0.15 }}
                >
                  {t('void.sinceLastBlock', 'since last block')}
                </p>
                <motion.p
                  className="font-mono text-[7px] tracking-[0.15em] italic"
                  style={{ color: textColors[level], opacity: 0.12 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.12 }}
                  transition={{ delay: 3, duration: 1.5 }}
                >
                  {timeSinceBlock > 1200
                    ? t('void.longWait', 'patience — the network is searching')
                    : timeSinceBlock > 900
                      ? t('void.searching', 'the network is searching')
                      : t('void.typical', 'typical: ~10 min')}
                </motion.p>
              </motion.div>
            )}

            {/* Fee pressure */}
            {feeHeat > 0.2 && (
              <motion.p
                className="font-mono text-[7px] tracking-[0.15em]"
                style={{ color: textColors[level], opacity: 0.1 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.1 }}
                transition={{ delay: 8, duration: 2 }}
              >
                {t('void.feePressure', 'fee pressure: {{fee}} sat/vB', { fee: blockData?.fastestFee })}
              </motion.p>
            )}

            {/* New block mined */}
            <AnimatePresence>
              {newBlockMined && newBlockHeight && (
                <motion.div
                  className="flex flex-col items-center gap-3"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 2, ease: 'easeOut' }}
                >
                  <motion.div
                    className="w-2 h-2 rounded-full"
                    style={{ background: textColors[level] }}
                    animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0.3, 0.6] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <p
                    className="font-mono text-[10px] tracking-[0.2em] text-center max-w-[220px] leading-relaxed"
                    style={{ color: textColors[level], opacity: 0.45 }}
                  >
                    {t('void.blockMined', 'A new block was found. {{height}}. Time moved forward.', { height: newBlockHeight.toLocaleString() })}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Contemplative text */}
            {deepReady && (
              <motion.div
                key={contemplationIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
              >
                <WordByWordText
                  text={VOID_CONTEMPLATIONS[level][contemplationIndex % VOID_CONTEMPLATIONS[level].length]}
                  delay={0.5}
                  color={textColors[level]}
                />
              </motion.div>
            )}

            {/* Epoch progress label */}
            {blockData?.difficultyEpochProgress != null && (
              <motion.p
                className="font-mono text-[7px] tracking-[0.15em]"
                style={{ color: textColors[level], opacity: 0.15 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.15 }}
                transition={{ delay: 10, duration: 3 }}
              >
                {t('void.epoch', 'epoch {{pct}}%', { pct: Math.round(blockData.difficultyEpochProgress * 100) })}
              </motion.p>
            )}

            {/* Hint to surface */}
            <motion.p
              className="font-mono text-[8px] tracking-[0.2em] uppercase"
              style={{ color: textColors[level], opacity: 0.1 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.1 }}
              transition={{ delay: 6, duration: 2 }}
            >
              {t('void.tapToSurface', 'tap to surface')}
            </motion.p>
          </motion.div>
        </button>

        {/* Breathing instruction — surface only */}
        <motion.p
          className="absolute bottom-12 text-[9px] font-mono tracking-[0.2em] uppercase z-[105]"
          style={{ color: textColors[level], opacity: 0.3 }}
          animate={{ opacity: surfaceOpacity * 0.3 }}
          transition={{ duration: 2 }}
        >
          {t('ambient.breathe')}
        </motion.p>
      </div>
    </>
  );
}

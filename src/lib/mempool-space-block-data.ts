/**
 * Public mempool.space HTTP reads for the Breathe / ambient “network pulse” UI.
 * Not authenticated — rate limits apply; callers handle null on failure.
 */

export interface MempoolSpaceBlockData {
  height: number;
  mempoolSize: number;
  mempoolPending: number;
  lastBlockTime?: number;
  fastestFee?: number;
  difficultyEpochProgress?: number;
}

export async function fetchMempoolSpaceBlockData(): Promise<MempoolSpaceBlockData | null> {
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
    } catch {
      /* ignore mempool blocks parse failures — tip height / fees still render */
    }

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

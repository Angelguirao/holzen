const QUEUE_KEY = 'holzen_offline_queue';

interface QueuedAction {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  timestamp: number;
}

function getQueue(): QueuedAction[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: QueuedAction[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

/**
 * Add an action to the offline queue.
 */
export function enqueueAction(type: string, payload: Record<string, unknown>) {
  const queue = getQueue();
  queue.push({
    id: crypto.randomUUID(),
    type,
    payload,
    timestamp: Date.now(),
  });
  saveQueue(queue);
}

/**
 * Process all queued actions when back online.
 * The handler should return true if successful (to dequeue).
 */
export async function processQueue(
  handler: (action: QueuedAction) => Promise<boolean>
): Promise<number> {
  const queue = getQueue();
  if (queue.length === 0) return 0;

  const remaining: QueuedAction[] = [];
  let processed = 0;

  for (const action of queue) {
    try {
      const success = await handler(action);
      if (success) {
        processed++;
      } else {
        remaining.push(action);
      }
    } catch {
      remaining.push(action);
    }
  }

  saveQueue(remaining);
  return processed;
}

/**
 * Get the number of pending queued actions.
 */
export function getQueueSize(): number {
  return getQueue().length;
}

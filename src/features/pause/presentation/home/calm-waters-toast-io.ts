const STORAGE_PREFIX = 'holzen_calm_waters_toast_v1';

export function calmWatersToastStorageKey(userId: string, pauseInstanceId: string): string {
  return `${STORAGE_PREFIX}:${userId}:${pauseInstanceId}`;
}

export function hasShownCalmWatersToast(userId: string, pauseInstanceId: string): boolean {
  try {
    return localStorage.getItem(calmWatersToastStorageKey(userId, pauseInstanceId)) === '1';
  } catch {
    return false;
  }
}

export function markCalmWatersToastShown(userId: string, pauseInstanceId: string): void {
  try {
    localStorage.setItem(calmWatersToastStorageKey(userId, pauseInstanceId), '1');
  } catch {
    /* storage unavailable */
  }
}

export function calmWatersToastId(pauseInstanceId: string): string {
  return `home:calm-waters:${pauseInstanceId}`;
}

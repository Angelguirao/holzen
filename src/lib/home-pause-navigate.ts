/** Whether Home can navigate to `/pause` with the current open-pause snapshot. */
export function canNavigateToPauseSession(
  message: string | null | undefined,
  pauseInstanceId: string | null | undefined,
): boolean {
  return Boolean(pauseInstanceId) || Boolean(message?.trim());
}

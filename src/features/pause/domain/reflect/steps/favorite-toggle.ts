export function computeFavoriteToggleNext(isFavorite: boolean): boolean {
  return !isFavorite;
}

/** `favorite_toggled` step payload for Reflect heart toggle. */
export function buildReflectFavoriteToggledPayload(
  isFavorite: boolean,
): { is_favorite: boolean } {
  return { is_favorite: isFavorite };
}

export function shouldShowFavoriteProHint(newValue: boolean, subscribed: boolean): boolean {
  return newValue && !subscribed;
}

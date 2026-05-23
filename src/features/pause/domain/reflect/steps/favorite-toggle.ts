export function computeFavoriteToggleNext(isFavorite: boolean): boolean {
  return !isFavorite;
}

export function shouldShowFavoriteProHint(newValue: boolean, subscribed: boolean): boolean {
  return newValue && !subscribed;
}

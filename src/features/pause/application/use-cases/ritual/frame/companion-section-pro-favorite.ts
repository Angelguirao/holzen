/** Pro-only favorite toggle props spread onto companion cards (empty object when not Pro). */
export type CompanionSectionProFavoriteProps = {
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
};

export function companionSectionProFavoriteProps(
  isPro: boolean,
  favorites: Record<string, boolean | undefined>,
  favoriteKey: string,
  onToggleFavorite: (key: string) => void,
): CompanionSectionProFavoriteProps {
  return isPro
    ? { isFavorite: favorites[favoriteKey], onToggleFavorite: () => onToggleFavorite(favoriteKey) }
    : {};
}

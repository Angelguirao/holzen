import { describe, expect, it, vi } from 'vitest';
import { companionSectionProFavoriteProps } from '@/screens/pause/lib/companion-section-pro-favorite';

describe('companionSectionProFavoriteProps', () => {
  it('returns empty when not Pro', () => {
    expect(companionSectionProFavoriteProps(false, { haiku: true }, 'haiku', vi.fn())).toEqual({});
  });

  it('wires favorite state and toggle when Pro', () => {
    const toggle = vi.fn();
    const props = companionSectionProFavoriteProps(true, { haiku: true }, 'haiku', toggle);
    expect(props.isFavorite).toBe(true);
    props.onToggleFavorite?.();
    expect(toggle).toHaveBeenCalledWith('haiku');
  });
});

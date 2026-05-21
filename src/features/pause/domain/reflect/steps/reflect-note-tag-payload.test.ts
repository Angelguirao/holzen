import { describe, expect, it } from 'vitest';
import {
  buildReflectFavoriteToggledPayload,
  buildReflectNoteUpdatedPayload,
  buildReflectTagUpdatedPayload,
} from './reflect-note-tag-payload';

describe('reflect-note-tag-payload', () => {
  it('builds note_updated payload', () => {
    expect(buildReflectNoteUpdatedPayload('hello')).toEqual({ text: 'hello' });
  });

  it('builds tag_updated payload', () => {
    expect(buildReflectTagUpdatedPayload(['fomo', 'calm'])).toEqual({
      tags: ['fomo', 'calm'],
    });
  });

  it('builds favorite_toggled payload', () => {
    expect(buildReflectFavoriteToggledPayload(true)).toEqual({ is_favorite: true });
  });
});

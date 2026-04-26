import { describe, expect, it } from 'vitest';
import {
  ZOOM_OUT_DEFAULT_BODY_PLACEHOLDER,
  ZOOM_OUT_DEFAULT_LABEL,
  toZoomOutDisplayData,
  zoomOutBodyPreviewFromJsonString,
  zoomOutLibraryAutosaveFromDisplayData,
  zoomOutSaveThisMomentSeed,
  zoomOutTotalCharsForReadTime,
} from '@/lib/zoom-out-payload';

describe('zoom-out-payload', () => {
  it('toZoomOutDisplayData defaults missing arrays and nulls', () => {
    expect(toZoomOutDisplayData(null)).toEqual({
      onThisDay: [],
      currentPrice: null,
      echo: null,
      deepTime: null,
    });
  });

  it('zoomOutBodyPreviewFromJsonString returns null on invalid JSON', () => {
    expect(zoomOutBodyPreviewFromJsonString('not json')).toBeNull();
  });

  it('zoomOutBodyPreviewFromJsonString prefers deepTime body then first echo user word', () => {
    const raw = JSON.stringify({
      deepTime: { title: 'T', body: 'B' },
      echo: {
        created_at: '2020-01-01',
        mood: null,
        outcome: null,
        userWords: [{ kind: 'note', body: 'E', created_at: '2020-01-01' }],
      },
    });
    expect(zoomOutBodyPreviewFromJsonString(raw)).toBe('B');
  });

  it('zoomOutLibraryAutosaveFromDisplayData uses fallbacks', () => {
    const d = toZoomOutDisplayData({});
    expect(zoomOutLibraryAutosaveFromDisplayData(d)).toEqual({
      title: ZOOM_OUT_DEFAULT_LABEL,
      body: ZOOM_OUT_DEFAULT_BODY_PLACEHOLDER,
    });
  });

  it('zoomOutBodyPreviewFromJsonString returns default label when payload is empty', () => {
    expect(zoomOutBodyPreviewFromJsonString('{}')).toBe(ZOOM_OUT_DEFAULT_LABEL);
  });

  it('zoomOutTotalCharsForReadTime sums title, body, and echo user word bodies', () => {
    const d = toZoomOutDisplayData({
      deepTime: { title: 'ab', body: 'cdef' },
      echo: {
        created_at: '',
        mood: null,
        outcome: null,
        userWords: [
          { kind: 'note', body: 'gh', created_at: '2020-01-01' },
          { kind: 'replay', body: 'ij', created_at: '2020-01-02' },
        ],
      },
    });
    expect(zoomOutTotalCharsForReadTime(d)).toBe(2 + 4 + 2 + 2);
  });

  it('zoomOutSaveThisMomentSeed uses deepTime body when present', () => {
    const d = toZoomOutDisplayData({
      deepTime: { title: 'T', body: 'B' },
      echo: {
        created_at: '',
        mood: null,
        outcome: null,
        userWords: [{ kind: 'note', body: 'E', created_at: '2020-01-01' }],
      },
    });
    expect(zoomOutSaveThisMomentSeed(d)).toEqual({
      deepTimeTitle: 'T',
      context: 'B',
    });
  });

  it('zoomOutSaveThisMomentSeed falls back to first echo user word when no deepTime body', () => {
    const d = toZoomOutDisplayData({
      echo: {
        created_at: '',
        mood: null,
        outcome: null,
        userWords: [{ kind: 'note', body: 'only echo', created_at: '2020-01-01' }],
      },
    });
    expect(zoomOutSaveThisMomentSeed(d)).toEqual({
      deepTimeTitle: undefined,
      context: 'only echo',
    });
  });
});

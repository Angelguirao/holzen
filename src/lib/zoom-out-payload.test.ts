import { describe, expect, it } from 'vitest';
import {
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

  it('zoomOutBodyPreviewFromJsonString prefers deepTime body then echo message', () => {
    const raw = JSON.stringify({
      deepTime: { title: 'T', body: 'B' },
      echo: { message: 'E', created_at: '' },
    });
    expect(zoomOutBodyPreviewFromJsonString(raw)).toBe('B');
  });

  it('zoomOutLibraryAutosaveFromDisplayData uses fallbacks', () => {
    const d = toZoomOutDisplayData({});
    expect(zoomOutLibraryAutosaveFromDisplayData(d)).toEqual({
      title: 'Zoom Out',
      body: 'Zoom Out perspective',
    });
  });

  it('zoomOutTotalCharsForReadTime sums title, body, echo.message', () => {
    const d = toZoomOutDisplayData({
      deepTime: { title: 'ab', body: 'cdef' },
      echo: { message: 'gh', created_at: '' },
    });
    expect(zoomOutTotalCharsForReadTime(d)).toBe(2 + 4 + 2);
  });

  it('zoomOutSaveThisMomentSeed uses body then echo message', () => {
    const d = toZoomOutDisplayData({
      deepTime: { title: 'T', body: 'B' },
      echo: { message: 'E', created_at: '' },
    });
    expect(zoomOutSaveThisMomentSeed(d)).toEqual({
      deepTimeTitle: 'T',
      context: 'B',
    });
  });

  it('zoomOutSaveThisMomentSeed falls back echo when no deepTime body', () => {
    const d = toZoomOutDisplayData({
      echo: { message: 'only echo', created_at: '' },
    });
    expect(zoomOutSaveThisMomentSeed(d)).toEqual({
      deepTimeTitle: undefined,
      context: 'only echo',
    });
  });
});

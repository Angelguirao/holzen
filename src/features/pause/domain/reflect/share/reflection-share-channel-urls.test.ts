import { describe, expect, it } from 'vitest';
import {
  buildReflectionShareTelegramUrl,
  buildReflectionShareTweetUrl,
  buildReflectionShareWhatsAppUrl,
} from './reflection-share-channel-urls';

describe('reflection share channel urls', () => {
  it('builds tweet intent url', () => {
    expect(buildReflectionShareTweetUrl('Stay calm.')).toBe(
      'https://x.com/intent/tweet?text=Stay%20calm.',
    );
  });

  it('builds whatsapp url', () => {
    expect(buildReflectionShareWhatsAppUrl('Stay calm.')).toBe(
      'https://wa.me/?text=Stay%20calm.',
    );
  });

  it('builds telegram url with site origin', () => {
    expect(buildReflectionShareTelegramUrl('Stay calm.', 'https://holzen.app')).toBe(
      'https://t.me/share/url?url=https%3A%2F%2Fholzen.app&text=Stay%20calm.',
    );
  });
});

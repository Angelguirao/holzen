import { SITE_HOST } from '@/config/site';

/** Plain-text payload for clipboard and social share intents. */
export function buildReflectionShareText(message: string): string {
  return `${message}\n\n— Holzen\n${SITE_HOST}`;
}

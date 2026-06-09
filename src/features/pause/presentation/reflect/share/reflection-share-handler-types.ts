import type { TFunction } from 'i18next';

/** Params for Reflect-step copy / image / social share handlers. */
export type UseReflectionShareHandlersParams = {
  message: string;
  context?: string | null;
  haiku?: string | null;
  wallpaperMood?: string | null;
  t: TFunction;
};

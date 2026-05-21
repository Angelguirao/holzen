import {
  supabaseCompanionOrchestrator,
  supabasePauseRepository,
} from '@/features/pause/public-rpc';

/** Default companion-orchestrate edge port for presentation hooks. */
export const companionOrchestrator = supabaseCompanionOrchestrator;

/** Default pause RPC port for companion presentation (favorites, UI completion). */
export const companionPauseRepository = supabasePauseRepository;

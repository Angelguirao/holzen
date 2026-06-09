import { PauseDoneCompletionHero } from '@/screens/pause/components/pause-done-completion-hero';

export type PauseDoneDefaultStreakHeroProps = {
  decision: string | null;
};

/** Deep Done: completion hero (Figma post-decide summary). */
export function PauseDoneDefaultStreakHero(_props: PauseDoneDefaultStreakHeroProps) {
  "use memo";
  return <PauseDoneCompletionHero />;
}

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/public';
import { getToolsHubDataQueryOptions } from '@/lib/tools-hub-data-query';

export type { LastCheckInRow, ToolsHubData } from '@/lib/tools-hub-data-query';
export { toolsHubDataQueryKey } from '@/lib/tools-hub-data-query';

export function useToolsHubData() {
  const { user } = useAuth();
  const userId = user?.id;

  const { data, isPending } = useQuery(getToolsHubDataQueryOptions(userId));

  return {
    lastCheckIn: data?.lastCheckIn ?? null,
    suggestions: data?.suggestions ?? [],
    loading: Boolean(userId) && isPending,
  };
}

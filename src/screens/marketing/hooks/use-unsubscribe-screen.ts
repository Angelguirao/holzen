import { useActionState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  emailUnsubscribeLinkQueryKey,
  getEmailUnsubscribeLinkQueryOptions,
} from '@/features/auth/public-queries';
import { emailUnsubscribeAction } from '@/screens/marketing/unsubscribe-action';

export { emailUnsubscribeLinkQueryKey };

/**
 * Public email unsubscribe route conductor.
 */
export function useUnsubscribeScreen() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const queryClient = useQueryClient();
  const [state, formAction, isPending] = useActionState(emailUnsubscribeAction, {});

  const linkQuery = useQuery(getEmailUnsubscribeLinkQueryOptions(token));

  useEffect(() => {
    if (!token) return;
    if (state.success || state.already) {
      void queryClient.invalidateQueries({ queryKey: emailUnsubscribeLinkQueryKey(token) });
    }
  }, [state.success, state.already, token, queryClient]);

  const showInvalid = !token || linkQuery.isError || linkQuery.data === 'invalid';
  const showLoading =
    Boolean(token) &&
    linkQuery.isPending &&
    !state.success &&
    !state.already &&
    !state.error &&
    !isPending;
  const linkAlready =
    linkQuery.data === 'already' && !state.success && !state.already && !state.error;

  return {
    token,
    state,
    formAction,
    isPending,
    linkQuery,
    showInvalid,
    showLoading,
    linkAlready,
  };
}

-- `pause_evaluate_transitions` is SECURITY DEFINER and mutates pause_instances
-- by id. Keep it callable by server/internal RPC chains, but do not expose it
-- as a direct authenticated RPC where a caller could pass another user's id.

REVOKE ALL ON FUNCTION public.pause_evaluate_transitions(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.pause_evaluate_transitions(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.pause_evaluate_transitions(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.pause_evaluate_transitions(uuid) TO service_role;

COMMENT ON FUNCTION public.pause_evaluate_transitions(uuid) IS
  'Internal transition evaluator for pause_instances. SECURITY DEFINER; direct browser RPC access is revoked so ownership is enforced by caller RPCs such as pause_log_step.';

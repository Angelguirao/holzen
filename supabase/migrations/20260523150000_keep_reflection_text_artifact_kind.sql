-- Revert opening_message rename if an earlier cutover revision already applied it.
-- Shipped contract: pause_ai_artifacts.kind = 'reflection_text', v_pause_full.reflection_text.

UPDATE public.pause_ai_artifacts
   SET kind = 'reflection_text'
 WHERE kind = 'opening_message';

-- v_pause_full is recreated by 20260521200000_holzen_mvp_launch_cutover.sql (section G)
-- when that migration has not run yet; if views still expose opening_message, re-apply section G
-- from the current cutover file or run: npm run gen:types after db reset.

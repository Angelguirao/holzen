
-- Function to update vote_count on roadmap_items
CREATE OR REPLACE FUNCTION public.update_roadmap_vote_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.roadmap_items SET vote_count = vote_count + 1 WHERE id = NEW.item_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.roadmap_items SET vote_count = vote_count - 1 WHERE id = OLD.item_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_roadmap_vote_change
  AFTER INSERT OR DELETE ON public.roadmap_votes
  FOR EACH ROW EXECUTE FUNCTION public.update_roadmap_vote_count();

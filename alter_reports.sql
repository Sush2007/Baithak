ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT false;

-- Allow post_id to be null if we are reporting a comment
ALTER TABLE public.reports ALTER COLUMN post_id DROP NOT NULL;

-- Add comment_id
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE;

-- Update Trigger logic
CREATE OR REPLACE FUNCTION public.handle_post_reported()
RETURNS trigger AS $$
BEGIN
  IF NEW.post_id IS NOT NULL THEN
    UPDATE public.posts SET is_flagged = true WHERE id = NEW.post_id;
  END IF;
  IF NEW.comment_id IS NOT NULL THEN
    UPDATE public.comments SET is_flagged = true WHERE id = NEW.comment_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_report_deleted()
RETURNS trigger AS $$
BEGIN
  IF OLD.post_id IS NOT NULL THEN
    UPDATE public.posts SET is_flagged = false WHERE id = OLD.post_id;
  END IF;
  IF OLD.comment_id IS NOT NULL THEN
    UPDATE public.comments SET is_flagged = false WHERE id = OLD.comment_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

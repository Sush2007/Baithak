-- Trigger for New Like Notification
CREATE OR REPLACE FUNCTION public.handle_new_like_notification()
RETURNS trigger AS $$
BEGIN
  IF NEW.user_id != (SELECT author_id FROM public.posts WHERE id = NEW.post_id) THEN
    INSERT INTO public.notifications (user_id, actor_id, type, post_id)
    VALUES (
      (SELECT author_id FROM public.posts WHERE id = NEW.post_id),
      NEW.user_id,
      'like',
      NEW.post_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_post_liked ON public.likes;
CREATE TRIGGER on_post_liked
  AFTER INSERT ON public.likes
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_like_notification();

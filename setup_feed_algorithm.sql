-- 1. Create user_interests table
CREATE TABLE IF NOT EXISTS public.user_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  interaction_score INT DEFAULT 1,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, tag)
);

ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own interests"
ON public.user_interests FOR SELECT
TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "System can insert/update interests"
ON public.user_interests FOR ALL
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. Function to update tags score
CREATE OR REPLACE FUNCTION public.update_user_interests()
RETURNS trigger AS $$
DECLARE
  post_tags TEXT[];
  t TEXT;
BEGIN
  -- Get tags of the interacted post
  SELECT tags INTO post_tags FROM public.posts WHERE id = NEW.post_id;
  
  -- If there are tags, increment their score
  IF post_tags IS NOT NULL THEN
    FOREACH t IN ARRAY post_tags
    LOOP
      INSERT INTO public.user_interests (user_id, tag, interaction_score)
      VALUES (NEW.user_id, t, 1) -- or NEW.author_id for comments? Wait, NEW.user_id for likes/bookmarks. But comments use NEW.author_id.
      ON CONFLICT (user_id, tag)
      DO UPDATE SET 
        interaction_score = public.user_interests.interaction_score + 1,
        updated_at = now();
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger for Likes
DROP TRIGGER IF EXISTS on_post_liked_interest ON public.likes;
CREATE TRIGGER on_post_liked_interest
  AFTER INSERT ON public.likes
  FOR EACH ROW EXECUTE PROCEDURE public.update_user_interests();

-- 4. Trigger for Bookmarks
DROP TRIGGER IF EXISTS on_post_bookmarked_interest ON public.bookmarks;
CREATE TRIGGER on_post_bookmarked_interest
  AFTER INSERT ON public.bookmarks
  FOR EACH ROW EXECUTE PROCEDURE public.update_user_interests();

-- 5. Function for Comments (since comments use author_id instead of user_id)
CREATE OR REPLACE FUNCTION public.update_user_interests_comment()
RETURNS trigger AS $$
DECLARE
  post_tags TEXT[];
  t TEXT;
BEGIN
  SELECT tags INTO post_tags FROM public.posts WHERE id = NEW.post_id;
  
  IF post_tags IS NOT NULL THEN
    FOREACH t IN ARRAY post_tags
    LOOP
      INSERT INTO public.user_interests (user_id, tag, interaction_score)
      VALUES (NEW.author_id, t, 1)
      ON CONFLICT (user_id, tag)
      DO UPDATE SET 
        interaction_score = public.user_interests.interaction_score + 1,
        updated_at = now();
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger for Comments
DROP TRIGGER IF EXISTS on_post_commented_interest ON public.comments;
CREATE TRIGGER on_post_commented_interest
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE PROCEDURE public.update_user_interests_comment();

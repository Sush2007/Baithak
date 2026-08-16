-- 1. Add views_count to posts if it doesn't exist
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- 2. Create post_views tracking table
CREATE TABLE IF NOT EXISTS public.post_views (
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (post_id, user_id)
);

ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can record their own views" 
ON public.post_views FOR INSERT 
TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Views are readable by everyone" 
ON public.post_views FOR SELECT 
TO public USING (true);

-- 3. Create optimized RPC for incrementing views safely
CREATE OR REPLACE FUNCTION increment_view(p_id UUID, u_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Try to insert a unique view
  INSERT INTO public.post_views (post_id, user_id)
  VALUES (p_id, u_id)
  ON CONFLICT (post_id, user_id) DO NOTHING;
  
  -- If the row was actually inserted, increment the post count
  IF FOUND THEN
    UPDATE public.posts
    SET views_count = views_count + 1
    WHERE id = p_id;
  END IF;
END;
$$;

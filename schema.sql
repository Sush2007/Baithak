-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  setup_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Turn on Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read all profiles (needed for webhooks and username uniqueness)
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
TO public USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Function to handle new user signups and automatically create a profile placeholder
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, setup_completed)
  VALUES (new.id, false);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function every time a user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Index to optimize username lookups (e.g. for checking uniqueness during signup)
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles USING btree (username);

-- ==============================================
-- POSTS TABLE
-- ==============================================
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  media_url TEXT,
  media_type TEXT,
  is_hot BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Posts are viewable by everyone" 
ON public.posts FOR SELECT 
TO public USING (true);

CREATE POLICY "Authenticated users can create posts" 
ON public.posts FOR INSERT 
TO authenticated WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own posts" 
ON public.posts FOR UPDATE 
TO authenticated USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own posts" 
ON public.posts FOR DELETE 
TO authenticated USING (auth.uid() = author_id);

-- ==============================================
-- COMMENTS TABLE
-- ==============================================
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_best_answer BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone" 
ON public.comments FOR SELECT 
TO public USING (true);

CREATE POLICY "Authenticated users can create comments" 
ON public.comments FOR INSERT 
TO authenticated WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own comments" 
ON public.comments FOR UPDATE 
TO authenticated USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own comments" 
ON public.comments FOR DELETE 
TO authenticated USING (auth.uid() = author_id);

-- ==============================================
-- LIKES TABLE
-- ==============================================
CREATE TABLE public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes are viewable by everyone" 
ON public.likes FOR SELECT 
TO public USING (true);

CREATE POLICY "Authenticated users can like posts" 
ON public.likes FOR INSERT 
TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own likes" 
ON public.likes FOR DELETE 
TO authenticated USING (auth.uid() = user_id);

-- ==============================================
-- BOOKMARKS TABLE
-- ==============================================
CREATE TABLE public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bookmarks" 
ON public.bookmarks FOR SELECT 
TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookmarks" 
ON public.bookmarks FOR INSERT 
TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks" 
ON public.bookmarks FOR DELETE 
TO authenticated USING (auth.uid() = user_id);

-- ==============================================
-- NOTIFICATIONS TABLE
-- ==============================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- e.g. 'like', 'comment'
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
TO authenticated WITH CHECK (true);

-- Trigger for New Comment Notification
CREATE OR REPLACE FUNCTION public.handle_new_comment_notification()
RETURNS trigger AS $$
BEGIN
  IF NEW.author_id != (SELECT author_id FROM public.posts WHERE id = NEW.post_id) THEN
    INSERT INTO public.notifications (user_id, actor_id, type, post_id)
    VALUES (
      (SELECT author_id FROM public.posts WHERE id = NEW.post_id),
      NEW.author_id,
      'comment',
      NEW.post_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_comment
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_comment_notification();

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

CREATE TRIGGER on_new_like
  AFTER INSERT ON public.likes
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_like_notification();

-- ==============================================
-- ADD SOCIAL URLS TO PROFILES
-- ==============================================
-- This needs to be an ALTER TABLE since the table already exists.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cover_url TEXT;

ALTER TABLE public.connections ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- ==============================================
-- STORAGE BUCKET: MEDIA
-- ==============================================
-- Run these as superuser or just use the dashboard to create the bucket 'media'.
-- INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true);
-- 
-- CREATE POLICY "Media is publicly accessible" 
-- ON storage.objects FOR SELECT 
-- USING (bucket_id = 'media');
-- 
-- CREATE POLICY "Authenticated users can upload media" 
-- ON storage.objects FOR INSERT 
-- TO authenticated WITH CHECK (bucket_id = 'media' AND auth.uid() = owner);

-- ==============================================
-- PUSH NOTIFICATIONS
-- ==============================================

-- 1. Create push_subscriptions table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own push subscriptions"
ON public.push_subscriptions FOR ALL
TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Webhook can select push subscriptions"
ON public.push_subscriptions FOR SELECT
TO anon USING (true);

-- 2. Enable pg_net extension
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 3. Create a Webhook to call our Next.js API when a new notification is inserted
-- We use a trigger that fires AFTER INSERT on the notifications table
CREATE OR REPLACE FUNCTION public.handle_push_notification()
RETURNS trigger AS $$
DECLARE
  api_url TEXT := 'http://localhost:3000/api/webhooks/push'; -- Change to production URL later
BEGIN
  -- We don't want to block the database, so we use net.http_post asynchronously
  PERFORM net.http_post(
    url := api_url,
    body := jsonb_build_object(
      'notification_id', NEW.id,
      'user_id', NEW.user_id,
      'actor_id', NEW.actor_id,
      'type', NEW.type,
      'post_id', NEW.post_id
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to prevent duplicates
DROP TRIGGER IF EXISTS on_notification_created ON public.notifications;

CREATE TRIGGER on_notification_created
  AFTER INSERT ON public.notifications
  FOR EACH ROW EXECUTE PROCEDURE public.handle_push_notification();

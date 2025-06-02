-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.articles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  excerpt text,
  featured_image_url text,
  category text,
  tags ARRAY,
  is_published boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT articles_pkey PRIMARY KEY (id),
  CONSTRAINT articles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  video_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT comments_pkey PRIMARY KEY (id),
  CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.follows (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT follows_pkey PRIMARY KEY (id),
  CONSTRAINT follows_following_id_fkey FOREIGN KEY (following_id) REFERENCES public.profiles(id),
  CONSTRAINT follows_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.linked_accounts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  provider text NOT NULL,
  provider_user_id text NOT NULL,
  provider_account_data jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT linked_accounts_pkey PRIMARY KEY (id),
  CONSTRAINT linked_accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.post_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  post_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT post_comments_pkey PRIMARY KEY (id),
  CONSTRAINT post_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT post_comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id)
);
CREATE TABLE public.post_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  post_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT post_likes_pkey PRIMARY KEY (id),
  CONSTRAINT post_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT post_likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id)
);
CREATE TABLE public.posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content text,
  media_url ARRAY,
  media_type ARRAY,
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  is_published boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT posts_pkey PRIMARY KEY (id),
  CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  username text UNIQUE,
  full_name text,
  avatar_url text,
  bio text,
  specialty text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.saved_articles (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  article_url text NOT NULL,
  title text NOT NULL,
  thumbnail_url text,
  created_at timestamp with time zone DEFAULT now(),
  article_type text DEFAULT 'article'::text,
  description text,
  CONSTRAINT saved_articles_pkey PRIMARY KEY (id),
  CONSTRAINT saved_articles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  notification_preferences jsonb DEFAULT '{"push": true, "email": true}'::jsonb,
  privacy_settings jsonb DEFAULT '{"profile_visibility": "public"}'::jsonb,
  theme_preference text DEFAULT 'light'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  mobile_number text,
  dark_mode boolean DEFAULT false,
  language text DEFAULT 'english'::text,
  notification_email boolean DEFAULT true,
  notification_push boolean DEFAULT true,
  notification_marketing boolean DEFAULT false,
  storage_usage_bytes bigint DEFAULT 0,
  theme text DEFAULT 'system'::text,
  color_scheme text DEFAULT 'teal'::text,
  reduce_motion boolean DEFAULT false,
  high_contrast boolean DEFAULT false,
  CONSTRAINT user_settings_pkey PRIMARY KEY (id),
  CONSTRAINT user_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.video_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  video_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT video_likes_pkey PRIMARY KEY (id),
  CONSTRAINT video_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.video_views (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  video_id uuid,
  viewer_id text NOT NULL,
  viewed_at timestamp with time zone DEFAULT now(),
  CONSTRAINT video_views_pkey PRIMARY KEY (id),
  CONSTRAINT video_views_video_id_fkey FOREIGN KEY (video_id) REFERENCES public.videos(id)
);
CREATE TABLE public.videos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  title text NOT NULL,
  description text,
  video_url text,
  thumbnail_url text,
  duration integer,
  category text,
  tags ARRAY,
  visibility text DEFAULT 'public'::text,
  views_count integer DEFAULT 0,
  likes_count integer DEFAULT 0,
  is_published boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  mutual_followers_only boolean DEFAULT false,
  CONSTRAINT videos_pkey PRIMARY KEY (id),
  CONSTRAINT videos_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
-- Create saved_articles table
CREATE TABLE IF NOT EXISTS public.saved_articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  article_url TEXT NOT NULL,
  title TEXT NOT NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  article_type TEXT DEFAULT 'article',
  description TEXT,
  UNIQUE(user_id, article_url)
);

-- Create linked_accounts table
CREATE TABLE IF NOT EXISTS public.linked_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_user_id TEXT NOT NULL,
  provider_account_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Create or modify user_settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  mobile_number TEXT,
  dark_mode BOOLEAN DEFAULT false,
  language TEXT DEFAULT 'english',
  notification_email BOOLEAN DEFAULT true,
  notification_push BOOLEAN DEFAULT true,
  notification_marketing BOOLEAN DEFAULT false,
  notification_interactions BOOLEAN DEFAULT true,
  notification_messages BOOLEAN DEFAULT true,
  notification_videos BOOLEAN DEFAULT true,
  storage_usage_bytes BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  theme TEXT DEFAULT 'system',
  color_scheme TEXT DEFAULT 'teal',
  reduce_motion BOOLEAN DEFAULT false,
  high_contrast BOOLEAN DEFAULT false,
  notification_preferences JSONB,
  privacy_settings JSONB,
  theme_preference TEXT,
  UNIQUE(user_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.saved_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linked_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can only see their own saved articles"
  ON public.saved_articles FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only see their own linked accounts"
  ON public.linked_accounts FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only see their own settings"
  ON public.user_settings FOR ALL
  USING (auth.uid() = user_id);

-- Create function to initialize user settings on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

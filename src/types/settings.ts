export interface SavedArticle {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  article_url: string;
  article_type: 'article' | 'tutorial' | 'news';
  thumbnail_url?: string;
  created_at: string;
  updated_at: string;
}

export interface LinkedAccount {
  id: string;
  user_id: string;
  provider: 'google' | 'twitter' | 'facebook' | 'github';
  provider_user_id: string;
  provider_account_data: {
    name?: string;
    email?: string;
    avatar_url?: string;
  };
  created_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  mobile_number?: string;
  dark_mode: boolean;
  language: string;  notification_email: boolean;
  notification_push: boolean;
  notification_marketing: boolean;
  notification_messages: boolean;
  notification_videos: boolean;
  notification_interactions: boolean;
  storage_usage_bytes: number;
  created_at: string | null;
  updated_at: string | null;
  theme: 'system' | 'light' | 'dark';
  color_scheme: 'teal' | 'blue' | 'purple' | 'red' | 'orange';
  reduce_motion: boolean;
  high_contrast: boolean;
  notification_preferences: unknown | null;
  privacy_settings: unknown | null;
  theme_preference: string | null;
}

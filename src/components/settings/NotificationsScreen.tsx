import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { UserSettings } from '@/types/settings';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, Mail, Globe, MessageSquare, Video, Heart } from 'lucide-react';
import { toast } from 'sonner';

interface NotificationCategory {
  id: string;
  title: string;
  description: string;
  icon: typeof Bell;
}

const NOTIFICATION_CATEGORIES: NotificationCategory[] = [
  {
    id: 'email',
    title: 'Email Notifications',
    description: 'Get updates and alerts via email',
    icon: Mail
  },
  {
    id: 'push',
    title: 'Push Notifications',
    description: 'Receive alerts on your device',
    icon: Bell
  },
  {
    id: 'interactions',
    title: 'Interactions',
    description: 'Likes, comments, and mentions',
    icon: Heart
  },
  {
    id: 'messages',
    title: 'Direct Messages',
    description: 'Private messages from other users',
    icon: MessageSquare
  },
  {
    id: 'videos',
    title: 'New Videos',
    description: 'When creators you follow post new content',
    icon: Video
  },
  {
    id: 'marketing',
    title: 'Marketing & Updates',
    description: 'News about features and improvements',
    icon: Globe
  }
];

export function NotificationsScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: settings } = useQuery({
    queryKey: ['user-settings', user?.id] as const,
    queryFn: async (): Promise<UserSettings> => {
      const { data: dbSettings, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      const defaultSettings: UserSettings = {
        id: '',
        user_id: user?.id ?? '',
        mobile_number: '',
        dark_mode: false,
        language: 'en',
        theme: 'system',
        color_scheme: 'teal',
        reduce_motion: false,
        high_contrast: false,
        notification_email: true,
        notification_push: true,
        notification_interactions: true,
        notification_marketing: false,
        notification_messages: true,
        notification_videos: true,
        storage_usage_bytes: 0,
        created_at: null,
        updated_at: null,
        notification_preferences: null,
        privacy_settings: null,
        theme_preference: null
      };

      if (error) {
        if (error.code === 'PGRST116') {
          return defaultSettings;
        }
        throw error;
      }

      return {
        ...defaultSettings,
        ...dbSettings as unknown as UserSettings
      } satisfies UserSettings;
    },
    enabled: !!user?.id
  });

  const updateNotificationSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: boolean }) => {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user?.id,
          [`notification_${key}`]: value,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings', user?.id] });
    },
    onError: () => {
      toast.error('Failed to update notification settings');
    }
  });

  const handleToggle = (categoryId: string, checked: boolean) => {
    updateNotificationSetting.mutate({ key: categoryId, value: checked });
  };

  if (!settings) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="space-y-6">
        {NOTIFICATION_CATEGORIES.map((category) => {
          const Icon = category.icon;          const key = `notification_${category.id}` as keyof UserSettings;
          const isEnabled = settings?.[key] as boolean ?? false;
          
          return (
            <div
              key={category.id}
              className="flex items-start justify-between space-x-4 p-4 bg-white rounded-lg border border-gray-200"
            >
              <div className="flex space-x-4">
                <div className="mt-1">
                  <Icon className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <Label htmlFor={category.id} className="text-base font-medium">
                    {category.title}
                  </Label>
                  <p className="text-sm text-gray-500">{category.description}</p>
                </div>
              </div>
              <Switch
                id={category.id}
                checked={isEnabled}
                onCheckedChange={(checked) => handleToggle(category.id, checked)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

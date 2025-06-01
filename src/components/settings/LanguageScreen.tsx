import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { UserSettings } from '@/types/settings';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Globe } from 'lucide-react';
import { toast } from 'sonner';

const LANGUAGES = [
  {
    id: 'en',
    name: 'English',
    native: 'English',
    flag: '🇺🇸'
  },
  {
    id: 'es',
    name: 'Spanish',
    native: 'Español',
    flag: '🇪🇸'
  },
  {
    id: 'fr',
    name: 'French',
    native: 'Français',
    flag: '🇫🇷'
  },
  {
    id: 'de',
    name: 'German',
    native: 'Deutsch',
    flag: '🇩🇪'
  },
  {
    id: 'zh',
    name: 'Chinese',
    native: '中文',
    flag: '🇨🇳'
  }
];

export function LanguageScreen() {
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
        language: 'en',
        dark_mode: false,
        theme: 'system',
        color_scheme: 'teal',
        reduce_motion: false,
        high_contrast: false,
        notification_email: false,
        notification_push: false,
        notification_marketing: false,
        notification_messages: false,
        notification_videos: false,
        notification_interactions: false,
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

  const updateLanguage = useMutation({
    mutationFn: async (language: string) => {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user?.id,
          language,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings', user?.id] });
      toast.success('Language updated successfully');
    },
    onError: () => {
      toast.error('Failed to update language');
    }
  });

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Globe className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-medium">Select Language</h2>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <RadioGroup
            value={settings?.language}
            onValueChange={(value) => updateLanguage.mutate(value)}
            className="space-y-4"
          >
            {LANGUAGES.map((lang) => (
              <div
                key={lang.id}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RadioGroupItem value={lang.id} id={lang.id} />
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{lang.flag}</span>
                  <Label htmlFor={lang.id} className="font-medium cursor-pointer">
                    {lang.name}
                    <span className="text-sm text-gray-500 ml-2">({lang.native})</span>
                  </Label>
                </div>
              </div>
            ))}
          </RadioGroup>
        </div>
      </div>
    </div>
  );
}

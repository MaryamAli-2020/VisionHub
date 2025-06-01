import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { UserSettings } from '@/types/settings';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Moon, Sun, Monitor } from 'lucide-react';
import { toast } from 'sonner';

const THEME_OPTIONS = [
  {
    id: 'system',
    title: 'System',
    description: 'Follow your system theme',
    icon: Monitor
  },
  {
    id: 'light',
    title: 'Light',
    description: 'Classic light theme',
    icon: Sun
  },
  {
    id: 'dark',
    title: 'Dark',
    description: 'Easier on the eyes',
    icon: Moon
  }
] as const;

const COLOR_SCHEMES = [
  { id: 'teal', color: 'bg-teal-500' },
  { id: 'blue', color: 'bg-blue-500' },
  { id: 'purple', color: 'bg-purple-500' },
  { id: 'red', color: 'bg-red-500' },
  { id: 'orange', color: 'bg-orange-500' }
] as const;

export function AppearanceScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: settings } = useQuery<UserSettings>({
    queryKey: ['user-settings', user?.id],
    queryFn: async () => {
      const { data: dbSettings, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Create initial settings
          const { error: insertError } = await supabase
            .from('user_settings')
            .insert({
              user_id: user?.id ?? '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              notification_preferences: null,
              privacy_settings: null,
              theme_preference: 'system'
            });

          if (insertError) throw insertError;

          return {
            id: '',
            user_id: user?.id ?? '',
            mobile_number: '',
            dark_mode: false,
            language: 'english',
            notification_email: true,
            notification_push: true,
            notification_marketing: false,
            notification_messages: true,
            notification_videos: true,
            notification_interactions: true,
            storage_usage_bytes: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            theme: 'system' as const,
            color_scheme: 'teal' as const,
            reduce_motion: false,
            high_contrast: false,
            notification_preferences: null,
            privacy_settings: null,
            theme_preference: 'system'
          };
        }
        throw error;
      }

      return {
        id: dbSettings.id,
        user_id: dbSettings.user_id,
        mobile_number: 'mobile_number' in dbSettings ? (dbSettings as any).mobile_number ?? '' : '',
        dark_mode: 'dark_mode' in dbSettings ? (dbSettings as any).dark_mode ?? false : false,
        language: 'language' in dbSettings ? (dbSettings as any).language ?? 'english' : 'english',
        notification_email: 'notification_email' in dbSettings ? (dbSettings as any).notification_email ?? true : true,
        notification_push: 'notification_push' in dbSettings ? (dbSettings as any).notification_push ?? true : true,
        notification_marketing: 'notification_marketing' in dbSettings ? (dbSettings as any).notification_marketing ?? false : false,
        notification_messages: 'notification_messages' in dbSettings ? (dbSettings as any).notification_messages ?? true : true,
        notification_videos: 'notification_videos' in dbSettings ? (dbSettings as any).notification_videos ?? true : true,
        notification_interactions: 'notification_interactions' in dbSettings ? (dbSettings as any).notification_interactions ?? true : true,
        storage_usage_bytes: 'storage_usage_bytes' in dbSettings ? (dbSettings as any).storage_usage_bytes ?? 0 : 0,
        created_at: dbSettings.created_at,
        updated_at: dbSettings.updated_at,
        theme: (dbSettings as any).theme ?? 'system',
        color_scheme: (dbSettings as any).color_scheme ?? 'teal',
        reduce_motion: 'reduce_motion' in dbSettings ? (dbSettings as any).reduce_motion ?? false : false,
        high_contrast: 'high_contrast' in dbSettings ? (dbSettings as any).high_contrast ?? false : false,
        notification_preferences: dbSettings.notification_preferences,
        privacy_settings: dbSettings.privacy_settings,
        theme_preference: dbSettings.theme_preference
      };
    },
    enabled: !!user?.id
  });
  const updateSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      if (!user?.id) throw new Error('No user ID found');
      
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          [key]: value,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings', user?.id] });
      toast.success('Settings updated successfully');
    },
    onError: (error) => {
      console.error('Error updating settings:', error);
      toast.error('Failed to update appearance settings');
    }
  });

  const handleThemeChange = (theme: string) => {
    updateSetting.mutate({ key: 'theme', value: theme });
    // In a real app, this would also update the document theme
    document.documentElement.className = theme === 'dark' ? 'dark' : '';
  };

  const handleColorSchemeChange = (scheme: string) => {
    updateSetting.mutate({ key: 'color_scheme', value: scheme });
  };

  const handleToggle = (key: string, value: boolean) => {
    updateSetting.mutate({ key, value });
  };

  if (!settings) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      {/* Theme Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Theme</h3>
        <RadioGroup
          value={settings.theme || 'system'}
          onValueChange={handleThemeChange}
          className="grid grid-cols-3 gap-4"
        >
          {THEME_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <label
                key={option.id}
                className={`
                  relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer
                  ${settings.theme === option.id ? 'border-primary bg-primary/5' : 'border-muted'}
                `}
              >
                <RadioGroupItem value={option.id} id={option.id} className="sr-only" />
                <Icon className="w-6 h-6" />
                <div className="text-center">
                  <div className="font-medium">{option.title}</div>
                  <div className="text-xs text-muted-foreground">{option.description}</div>
                </div>
              </label>
            );
          })}
        </RadioGroup>
      </div>

      {/* Color Scheme */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Accent Color</h3>
        <RadioGroup
          value={settings.color_scheme || 'teal'}
          onValueChange={handleColorSchemeChange}
          className="flex flex-wrap gap-4"
        >
          {COLOR_SCHEMES.map((scheme) => (
            <label key={scheme.id} className="cursor-pointer">
              <RadioGroupItem value={scheme.id} id={scheme.id} className="sr-only" />
              <div
                className={`
                  w-8 h-8 rounded-full ${scheme.color}
                  ${settings.color_scheme === scheme.id ? 'ring-2 ring-offset-2 ring-primary' : ''}
                `}
              />
            </label>
          ))}
        </RadioGroup>
      </div>

      {/* Accessibility Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Accessibility</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="reduce-motion">Reduce Motion</Label>
              <p className="text-sm text-muted-foreground">
                Minimize animations and transitions
              </p>
            </div>
            <Switch
              id="reduce-motion"
              checked={settings.reduce_motion}
              onCheckedChange={(checked) => handleToggle('reduce_motion', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="high-contrast">High Contrast</Label>
              <p className="text-sm text-muted-foreground">
                Increase contrast for better visibility
              </p>
            </div>
            <Switch
              id="high-contrast"
              checked={settings.high_contrast}
              onCheckedChange={(checked) => handleToggle('high_contrast', checked)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

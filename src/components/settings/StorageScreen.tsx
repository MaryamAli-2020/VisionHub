import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { UserSettings } from '@/types/settings';
import { Button } from '@/components/ui/button';
import { HardDrive, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

const STORAGE_LIMIT = 5 * 1024 * 1024 * 1024; // 5GB in bytes

export function StorageScreen() {
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
        dark_mode: false,
        language: 'en',
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

  const clearStorage = useMutation({
    mutationFn: async () => {
      // In a real app, this would delete user's stored files
      const { error } = await supabase
        .from('user_settings')
        .update({
          storage_usage_bytes: 0,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings', user?.id] });
      toast.success('Storage cleared successfully');
    },
    onError: () => {
      toast.error('Failed to clear storage');
    }
  });

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const storageUsage = settings?.storage_usage_bytes ?? 0;
  const storagePercentage = (storageUsage / STORAGE_LIMIT) * 100;
  const isStorageCritical = storagePercentage > 90;

  if (!settings) {
    return (
      <div className="p-6">
        <div className="h-48 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <HardDrive className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-medium">Storage Usage</h2>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          {/* Storage Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Used Storage</span>
              <span className={`font-medium ${isStorageCritical ? 'text-red-600' : 'text-gray-900'}`}>
                {formatBytes(storageUsage)} / {formatBytes(STORAGE_LIMIT)}
              </span>
            </div>
            <Progress value={storagePercentage} className="h-2" />
          </div>

          {/* Storage Warning */}
          {isStorageCritical && (
            <div className="flex items-start space-x-3 p-4 bg-red-50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800">Storage almost full</h4>
                <p className="text-sm text-red-600">
                  You're running out of storage space. Consider removing unused files or upgrading your storage plan.
                </p>
              </div>
            </div>
          )}

          {/* Storage Actions */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Storage Management</h3>
            <Button
              variant="outline"
              onClick={() => clearStorage.mutate()}
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              disabled={storageUsage === 0}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Storage
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

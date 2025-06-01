import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { UserSettings } from '@/types/settings';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Shield, Key, Eye, Bell, Globe, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type PrivacySettings = {
  showProfile: boolean;
  showEmail: boolean;
  showActivity: boolean;
  mutualFollowersOnly: boolean;
  allowTagging: boolean;
};

export function PrivacySecurityScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { data: settings } = useQuery({
    queryKey: ['user-settings', user?.id] as const,
    queryFn: async (): Promise<UserSettings> => {
      const { data: dbSettings, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      const defaultPrivacySettings: PrivacySettings = {
        showProfile: true,
        showEmail: false,
        showActivity: true,
        mutualFollowersOnly: false,
        allowTagging: true
      };

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
        privacy_settings: defaultPrivacySettings,
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
        ...dbSettings as unknown as UserSettings,
        privacy_settings: {
          ...defaultPrivacySettings,
          ...(dbSettings.privacy_settings as PrivacySettings)
        }
      } satisfies UserSettings;
    },
    enabled: !!user?.id
  });

  const updatePrivacySettings = useMutation({
    mutationFn: async (newSettings: Partial<PrivacySettings>) => {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user?.id,
          privacy_settings: {
            ...(settings?.privacy_settings as PrivacySettings),
            ...newSettings
          },
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings', user?.id] });
      toast.success('Privacy settings updated');
    },
    onError: () => {
      toast.error('Failed to update privacy settings');
    }
  });

  const updatePassword = useMutation({
    mutationFn: async () => {
      if (newPassword !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
    },
    onSuccess: () => {
      setShowPasswordDialog(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update password: ${error.message}`);
    }
  });

  const privacySettings = settings?.privacy_settings as PrivacySettings;

  const PRIVACY_OPTIONS = [
    {
      id: 'showProfile',
      title: 'Profile Visibility',
      description: 'Allow others to see your profile',
      icon: Eye,
      value: privacySettings?.showProfile
    },
    {
      id: 'showEmail',
      title: 'Email Visibility',
      description: 'Show your email to other users',
      icon: Globe,
      value: privacySettings?.showEmail
    },
    {
      id: 'showActivity',
      title: 'Activity Status',
      description: 'Show when you\'re active',
      icon: Bell,
      value: privacySettings?.showActivity
    },
    {
      id: 'mutualFollowersOnly',
      title: 'Mutual Followers Only',
      description: 'Only mutual followers can see your content',
      icon: UserX,
      value: privacySettings?.mutualFollowersOnly
    },
    {
      id: 'allowTagging',
      title: 'Allow Tagging',
      description: 'Let others tag you in their content',
      icon: Key,
      value: privacySettings?.allowTagging
    }
  ];

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="space-y-8">
        {/* Privacy Section */}
        <div>
          <div className="flex items-center space-x-2 mb-6">
            <Shield className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-medium">Privacy Settings</h2>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="divide-y divide-gray-100">
              {PRIVACY_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <div
                    key={option.id}
                    className="flex items-start justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex space-x-4">
                      <div className="mt-1">
                        <Icon className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <Label className="font-medium">{option.title}</Label>
                        <p className="text-sm text-gray-500">{option.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={option.value}
                      onCheckedChange={(checked) =>
                        updatePrivacySettings.mutate({ [option.id]: checked })
                      }
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div>
          <div className="flex items-center space-x-2 mb-6">
            <Key className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-medium">Security</h2>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-2">Password</h3>
                <Button
                  variant="outline"
                  onClick={() => setShowPasswordDialog(true)}
                >
                  Change Password
                </Button>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Two-Factor Authentication</h3>
                <Button variant="outline">Enable 2FA</Button>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Dialog */}
        <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 p-4">
              <div>
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPasswordDialog(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => updatePassword.mutate()}
                  disabled={
                    !currentPassword ||
                    !newPassword ||
                    !confirmPassword ||
                    newPassword !== confirmPassword
                  }
                >
                  Update Password
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

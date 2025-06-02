import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { UserSettings } from '@/types/settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Phone, Check } from 'lucide-react';
import { toast } from 'sonner';

export function MobileNumberScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [mobileNumber, setMobileNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
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
        notification_email: false,
        notification_push: false,
        notification_marketing: false,
        storage_usage_bytes: 0,
        created_at: null,
        updated_at: null,
        notification_preferences: null,
        privacy_settings: null,
        theme_preference: null,
        notification_messages: false,
        notification_videos: false,
        notification_interactions: false
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

  useEffect(() => {
    if (settings?.mobile_number) {
      setMobileNumber(settings.mobile_number);
    }
  }, [settings]);

  const updateMobileNumber = useMutation({
    mutationFn: async (number: string) => {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user?.id,
          mobile_number: number,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings', user?.id] });
      toast.success('Mobile number updated successfully');
      setIsVerifying(false);
    },
    onError: () => {
      toast.error('Failed to update mobile number');
    }
  });

  const handleVerify = () => {
    // In a real app, this would integrate with a phone verification service
    // For now, we'll just simulate verification
    setIsVerifying(true);
  };

  const handleSubmitVerification = () => {
    if (verificationCode === '123456') { // Demo verification code
      updateMobileNumber.mutate(mobileNumber);
    } else {
      toast.error('Invalid verification code');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="bg-white rounded-lg p-6 shadow-sm">
        {!isVerifying ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="mobile" className="text-sm font-medium text-gray-700">
                Mobile Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="mobile"
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="pl-10"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <p className="text-sm text-gray-500">
                We'll send a verification code to this number
              </p>
            </div>
            
            <Button
              onClick={handleVerify}
              disabled={!mobileNumber || mobileNumber === settings?.mobile_number}
              className="w-full"
            >
              {settings?.mobile_number ? 'Update Number' : 'Verify Number'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="code" className="text-sm font-medium text-gray-700">
                Verification Code
              </label>
              <Input
                id="code"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength={6}
              />
              <p className="text-sm text-gray-500">
                Enter the code we sent to {mobileNumber}
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setIsVerifying(false)}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleSubmitVerification}
                disabled={verificationCode.length !== 6}
                className="flex-1"
              >
                <Check className="w-4 h-4 mr-2" />
                Verify
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ChevronRight, 
  ChevronLeft,
  PencilIcon, 
  Bookmark, 
  Link2, 
  Phone, 
  Bell, 
  Palette, 
  Globe2, 
  Lock, 
  HardDrive,
  Moon,
  Sun,
  Languages
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { AppearanceScreen } from '@/components/settings/AppearanceScreen';
import { LanguageScreen } from '@/components/settings/LanguageScreen';
import { NotificationsScreen } from '@/components/settings/NotificationsScreen';
import { PrivacySecurityScreen } from '@/components/settings/PrivacySecurityScreen';
import { LinkedAccountsScreen } from '@/components/settings/LinkedAccountsScreen';
import { MobileNumberScreen } from '@/components/settings/MobileNumberScreen';
import { SavedArticlesScreen } from '@/components/settings/SavedArticlesScreen';
import { StorageScreen } from '@/components/settings/StorageScreen';
const SettingsScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const settingsItems = [
    { 
      title: 'Saved Articles', 
      path: '/saved-articles',
      icon: Bookmark,
      description: 'Access your bookmarked articles'
    },
    { 
      title: 'Linked Accounts', 
      path: '/linked-accounts',
      icon: Link2,
      description: 'Manage your connected social accounts'
    },
    { 
      title: 'Mobile Number', 
      path: '/mobile-number',
      icon: Phone,
      value: 'xxxx xxxx xxxx 9876',
      description: 'Update your contact information'
    },
    { 
      title: 'Notifications', 
      path: '/notifications',
      icon: Bell,
      description: 'Customize your notification preferences'
    },
    { 
      title: 'Appearance', 
      path: '/appearance',
      icon: Palette,
      description: 'Customize your app theme'
    },
    { 
      title: 'Language', 
      path: '/language',
      icon: Languages,
      value: 'English',
      description: 'Change your language settings'
    },
    { 
      title: 'Privacy & Security', 
      path: '/privacy-security',
      icon: Lock,
      description: 'Manage your account security'
    },
    { 
      title: 'Storage', 
      path: '/storage',
      icon: HardDrive,
      description: 'Manage your app storage'
    },
  ];

  function renderMainSettings() {
    return (
      <>
        {/* Profile Header */}
        <div className="bg-white px-6 py-8">
          <div className="flex items-center">
            <div className="relative">
              <img
                src={profile?.avatar_url || '/placeholder.svg?height=80&width=80'}
                alt={profile?.full_name || 'Profile'}
                className="w-20 h-20 rounded-full object-cover"
              />
              <button
                className="absolute bottom-0 right-0 p-1.5 bg-teal-400 rounded-full text-white"
                onClick={() => navigate('/edit-profile')}
                aria-label="Edit profile"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="ml-4 flex-1">
              <h1 className="text-2xl font-semibold">
                {profile?.full_name || 'User'}
              </h1>
              <p className="text-gray-600">
                @{profile?.username || user?.email?.split('@')[0]}
              </p>
            </div>
          </div>
        </div>

        {/* Settings List */}
        <div className="px-6 py-4">
          <div className="bg-white rounded-2xl shadow-sm">
            {settingsItems.map((item, index) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center p-4 hover:bg-gray-50 ${
                  index !== settingsItems.length - 1 ? 'border-b border-gray-100' : ''
                }`}
                aria-label={`Go to ${item.title} settings`}
              >
                <item.icon className="w-5 h-5 text-gray-600 mr-3" />
                <div className="flex-1 text-left">
                  <div className="text-gray-900">{item.title}</div>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
                <div className="flex items-center text-gray-400">
                  {item.value && (
                    <span className="mr-2 text-sm">{item.value}</span>
                  )}
                  <ChevronRight className="w-5 h-5" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </>
    );
  }

  const renderSettingContent = () => {
    const currentPath = location.pathname;
    
    if (currentPath === '/profile-settings') {
      return renderMainSettings();
    }
    
    const setting = settingsItems.find(item => item.path === currentPath);
    if (!setting) return null;

    return (
      <div className="px-6 py-8">
        <button 
          onClick={() => navigate('/profile-settings')}
          className="flex items-center text-gray-600 mb-6"
          aria-label="Back to settings"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back to Settings
        </button>
        <h1 className="text-2xl font-semibold mb-6 flex items-center">
          <setting.icon className="w-6 h-6 mr-2" />
          {setting.title}
        </h1>
        <p className="text-gray-600 mb-8">{setting.description}</p>
        
        {renderSettingPageContent(currentPath)}
      </div>
    );
  };

  const renderSettingPageContent = (path: string) => {
    switch (path) {
      case '/appearance':
        return <AppearanceScreen />;
      case '/language':
        return <LanguageScreen />;
      case '/notifications':
        return <NotificationsScreen />;
      case '/privacy-security':
        return <PrivacySecurityScreen />;
      case '/linked-accounts':
        return <LinkedAccountsScreen />;
      case '/mobile-number':
        return <MobileNumberScreen />;
      case '/saved-articles':
        return <SavedArticlesScreen />;
      case '/storage':
        return <StorageScreen />;
      default:
        return (
          <div className="text-gray-500">
            Content for {path.substring(1)} will be implemented soon.
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {renderSettingContent()}
    </div>
  );
};

export default SettingsScreen;

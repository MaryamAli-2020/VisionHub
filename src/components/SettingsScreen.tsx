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
  Languages,
  LogOut,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation } from '@tanstack/react-query';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';

const SettingsScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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

  const deleteAccount = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      // First delete user data from profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Then delete the user account
      const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
      
      if (authError) throw authError;

      await signOut();
      navigate('/');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete account: ${error.message}`);
    }
  });

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount.mutateAsync();
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };

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

        {/* Account Actions */}
        <div className="px-6 py-4">
          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full py-6 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              onClick={handleSignOut}
            >
              <LogOut className="w-5 h-5 mr-2" />
              Sign Out
            </Button>
            
            <Button
              variant="destructive"
              className="w-full py-6"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="w-5 h-5 mr-2" />
              Delete Account
            </Button>
          </div>
        </div>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your account
                and remove all your data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              >
                {deleteAccount.isPending ? "Deleting..." : "Delete Account"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
      <div>
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
    <div className="max-w-2xl mx-auto">
      <div>
        {renderSettingContent()}
      </div>
    </div>
  );
  
};

export default SettingsScreen;

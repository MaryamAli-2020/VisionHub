
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LogOut, Edit } from 'lucide-react';

const ProfileScreen = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const { data: profile, isLoading } = useQuery({
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

  const handleSignOut = async () => {
    await signOut();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-purple-900 relative">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full">
          <img
            src="https://images.unsplash.com/photo-1485833077593-4278bba3f11f?w=800&h=600&fit=crop&opacity=30"
            alt="Background"
            className="w-full h-full object-cover opacity-30"
          />
        </div>
      </div>

      <div className="relative z-10 p-6 pt-16">
        {/* Header with Sign Out */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-white">Profile</h1>
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="border-white/30 text-white bg-transparent hover:bg-white/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* Profile Header */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
            <img
              src={profile?.avatar_url || "/placeholder.svg?height=120&width=120"}
              alt={profile?.full_name || "User"}
              className="w-30 h-30 rounded-full border-4 border-white"
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {profile?.full_name || user?.email || 'User'}
          </h1>
          <p className="text-white/80 text-lg">
            {profile?.specialty || 'VisionHub Member'}
          </p>
          {profile?.bio && (
            <p className="text-white/70 mt-2 max-w-md mx-auto">{profile.bio}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4 mb-8">
          <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl">
            <Edit className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
          <Button 
            onClick={() => navigate('/create')}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl"
          >
            Create Content
          </Button>
          <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl">
            My Videos
          </Button>
        </div>

        {/* User Stats */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6">
          <h2 className="text-white font-semibold mb-4">Account Details</h2>
          <div className="space-y-2 text-white/80">
            <p><span className="font-medium">Email:</span> {user?.email}</p>
            <p><span className="font-medium">Member since:</span> {new Date(user?.created_at || '').toLocaleDateString()}</p>
            <p><span className="font-medium">Username:</span> {profile?.username || 'Not set'}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="border-white/30 text-white bg-transparent hover:bg-white/10"
              onClick={() => navigate('/library')}
            >
              My Library
            </Button>
            <Button 
              variant="outline" 
              className="border-white/30 text-white bg-transparent hover:bg-white/10"
            >
              Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;

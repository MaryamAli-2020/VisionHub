import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const HomeScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: videos, isLoading } = useQuery({
    queryKey: ['videos', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('videos')
        .select(`
          *,
          profiles!videos_user_id_fkey(full_name, avatar_url)
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const { data: profiles } = useQuery({
    queryKey: ['featured-creators'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(4);
      
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="px-6 pt-12 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('home')}
              className={`text-lg font-semibold ${
                activeTab === 'home' ? 'text-black border-b-2 border-black' : 'text-gray-400'
              }`}
            >
              Home page
            </button>
            <button
              onClick={() => setActiveTab('subscription')}
              className={`text-lg font-semibold ${
                activeTab === 'subscription' ? 'text-black border-b-2 border-black' : 'text-gray-400'
              }`}
            >
              Following
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 py-4 rounded-xl border-gray-200"
          />
        </div>

        {/* Filters */}
        <div className="flex space-x-4 mb-8">
          <Button variant="outline" className="rounded-xl">
            Sort ↓
          </Button>
          <Button variant="outline" className="rounded-xl">
            Filter
          </Button>
          <Button variant="outline" className="rounded-xl">
            Categories ↓
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6">
        {activeTab === 'home' && (
          <>
            {/* Featured Creators */}
            {profiles && profiles.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4">Featured Creators</h2>
                <div className="flex space-x-4 overflow-x-auto pb-4">
                  {profiles.map((profile) => (
                    <div key={profile.id} className="flex-shrink-0 text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-purple-500 rounded-xl mb-2 flex items-center justify-center relative">
                        <img
                          src={profile.avatar_url || "/placeholder.svg?height=48&width=48"}
                          alt={profile.full_name || 'Creator'}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                      </div>
                      <p className="font-semibold text-sm">{profile.full_name || 'Creator'}</p>
                      <p className="text-xs text-gray-500">{profile.specialty || 'Creator'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Videos */}
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">Latest Videos</h2>
              {isLoading ? (
                <div className="grid grid-cols-1 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-300 rounded-xl h-48 mb-3"></div>
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-300 rounded"></div>
                          <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : videos && videos.length > 0 ? (
                <div className="grid grid-cols-1 gap-6">
                  {videos.map((video) => (
                    <div
                      key={video.id}
                      onClick={() => navigate(`/video/${video.id}`)}
                      className="cursor-pointer"
                    >
                      <div className="relative rounded-xl overflow-hidden mb-3">
                        <img
                          src={video.thumbnail_url || "https://images.unsplash.com/photo-1549989476-69a92fa57c36?w=800&h=450&fit=crop"}
                          alt={video.title}
                          className="w-full h-48 object-cover"
                        />
                        {video.duration && (
                          <div className="absolute top-3 right-3 bg-black/70 text-white text-sm px-2 py-1 rounded">
                            {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                            <div className="w-0 h-0 border-l-[8px] border-l-gray-800 border-y-[6px] border-y-transparent ml-1"></div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <img
                          src={video.profiles?.avatar_url || "/placeholder.svg?height=40&width=40"}
                          alt={video.profiles?.full_name || 'Creator'}
                          className="w-10 h-10 rounded-full"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{video.title}</h3>
                          <p className="text-gray-600 text-sm">{video.profiles?.full_name || 'Anonymous'}</p>
                          <p className="text-gray-500 text-sm">{video.views_count || 0} views • {new Date(video.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No videos available yet.</p>
                  <Button 
                    onClick={() => navigate('/create')}
                    className="mt-4 bg-red-500 hover:bg-red-600 text-white"
                  >
                    Create the first video!
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HomeScreen;

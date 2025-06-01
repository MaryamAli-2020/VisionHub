
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, ChevronDown, Filter, SortDesc } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Video = Database['public']['Tables']['videos']['Row'] & {
  profiles: Profile | null;
};

type SortOption = 'latest' | 'oldest' | 'popular';
type CategoryOption = 'all' | 'gaming' | 'music' | 'education' | 'entertainment' | 'sports' | 'technology' | 'comedy' | 'news';

const HomeScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [category, setCategory] = useState<CategoryOption>('all');

  const { data: videos, isLoading } = useQuery<Video[]>({
    queryKey: ['videos', searchQuery, sortBy, category],
    queryFn: async () => {
      let query = supabase
        .from('videos')
        .select(`
          *,
          profiles!videos_user_id_fkey (
            id,
            full_name,
            avatar_url,
            specialty,
            bio,
            created_at,
            updated_at,
            username
          )
        `)
        .eq('is_published', true);

      // Apply search
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      // Apply category filter
      if (category !== 'all') {
        query = query.eq('category', category);
      }

      // Apply sorting
      switch (sortBy) {
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'popular':
          query = query.order('views_count', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return (data ?? []).map((video) => {
        if (
          !video.profiles ||
          typeof video.profiles !== 'object' ||
          ('error' in (video.profiles ?? {}))
        ) {
          return { ...video, profiles: null };
        }
        return video as Video;
      });
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="rounded-xl">
                <SortDesc className="w-4 h-4 mr-2" />
                {sortBy === 'latest' ? 'Latest' : 
                 sortBy === 'oldest' ? 'Oldest' : 'Most Popular'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSortBy('latest')}>
                Latest
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('oldest')}>
                Oldest
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('popular')}>
                Most Popular
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="rounded-xl">
                <Filter className="w-4 h-4 mr-2" />
                {category === 'all' ? 'All Categories' : 
                 category.charAt(0).toUpperCase() + category.slice(1)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setCategory('all')}>
                All Categories
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCategory('gaming')}>
                Gaming
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCategory('music')}>
                Music
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCategory('education')}>
                Education
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCategory('entertainment')}>
                Entertainment
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCategory('sports')}>
                Sports
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCategory('technology')}>
                Technology
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCategory('comedy')}>
                Comedy
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCategory('news')}>
                News
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
                    <div key={video.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                      {/* Video Thumbnail/Player */}
                      <div className="relative">
                        {video.thumbnail_url ? (
                          <img
                            src={video.thumbnail_url}
                            alt={video.title}
                            className="w-full h-48 object-cover"
                          />
                        ) : (
                          <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-500">No thumbnail</span>
                          </div>
                        )}
                        {video.duration && (
                          <span className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                            {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                          </span>
                        )}
                      </div>
                      
                      {/* Video Info */}
                      <div className="p-4">
                        <div className="flex items-start space-x-3">
                          <img
                            src={video.profiles?.avatar_url || "/placeholder.svg"}
                            alt={video.profiles?.full_name || 'Creator'}
                            className="w-10 h-10 rounded-full object-cover border border-gray-200"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">
                              {video.title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-1">
                              {video.profiles?.full_name || 'Unknown Creator'}
                            </p>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <span>{video.views_count || 0} views</span>
                              <span>•</span>
                              <span>{new Date(video.created_at).toLocaleDateString()}</span>
                              {video.category && (
                                <>
                                  <span>•</span>
                                  <span className="capitalize">{video.category}</span>
                                </>
                              )}
                            </div>
                            {video.description && (
                              <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                {video.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No videos available.</p>
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

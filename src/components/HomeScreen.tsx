import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, ChevronDown, Filter, SortDesc } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useDebounce } from '../hooks/useDebounce';
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
type CategoryOption = 'all' | 'Entertainment & Pop Culture' | 'Education & Learning' | 'Business & Finance' | 'Lifestyle & Wellness' | 'Culture & Society' | 'DIY & Skills' | 'STEM' | 'Hobbies & Interests';

const HomeScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [category, setCategory] = useState<CategoryOption>('all');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Add profiles query
  const { data: searchedProfiles, isLoading: isLoadingProfiles } = useQuery<Profile[]>({
    queryKey: ['searched-profiles', debouncedSearchQuery],
    queryFn: async () => {
      if (!debouncedSearchQuery.startsWith('@')) return [];

      const username = debouncedSearchQuery.slice(1); // Remove @ symbol
      console.log('Searching profiles with username:', username);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', `%${username}%`)
        .limit(10);

      if (error) {
        console.error('Profile search error:', error);
        throw error;
      }

      return data || [];
    },
    enabled: debouncedSearchQuery.startsWith('@')
  });

  const { data: videos, isLoading } = useQuery<Video[]>({
    queryKey: ['videos', debouncedSearchQuery, sortBy, category],
    queryFn: async () => {
      console.log('Fetching videos with query params:', { searchQuery: debouncedSearchQuery, sortBy, category });
      
      // First check if we're searching by username
      let videoQuery = supabase
        .from('videos')
        .select(`
          *,
          profiles (
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

      // Apply search based on type
      if (debouncedSearchQuery) {
        if (!debouncedSearchQuery.startsWith('@')) {
          // Regular search by title or description
          videoQuery = videoQuery.or(`title.ilike.%${debouncedSearchQuery}%,description.ilike.%${debouncedSearchQuery}%`);
        } else {
          // Username search
          const username = debouncedSearchQuery.slice(1);
          videoQuery = videoQuery.eq('profiles.username', username);
            // Check follow status if user is logged in
          if (user?.id) {
            // First, get the profile ID of the searched user
            const { data: searchedProfile } = await supabase
              .from('profiles')
              .select('id')
              .eq('username', username)
              .single();

            if (searchedProfile) {
              // Check if they follow each other
              const { data: mutualFollow } = await supabase
                .from('follows')
                .select('*')
                .or(`and(follower_id.eq.${user.id},following_id.eq.${searchedProfile.id}),and(follower_id.eq.${searchedProfile.id},following_id.eq.${user.id})`)
                .limit(2);

              // Only show all posts if they follow each other (mutual follow)
              if (mutualFollow && mutualFollow.length === 2) {
                videoQuery = videoQuery.neq('visibility', 'unlisted');
              } else {
                // If not mutual followers, only show public posts
                videoQuery = videoQuery.eq('visibility', 'public');
              }
            } else {
              // If profile not found, default to public posts
              videoQuery = videoQuery.eq('visibility', 'public');
            }
          } else {
            // If not logged in, only show public posts
            videoQuery = videoQuery.eq('visibility', 'public');
          }
        }
      }

      // Apply category filter
      if (category !== 'all') {
        videoQuery = videoQuery.eq('category', category);
      }

      // Apply sorting
      switch (sortBy) {
        case 'oldest':
          videoQuery = videoQuery.order('created_at', { ascending: true });
          break;
        case 'popular':
          videoQuery = videoQuery.order('views_count', { ascending: false });
          break;
        default:
          videoQuery = videoQuery.order('created_at', { ascending: false });
      }

      const { data, error } = await videoQuery;
      
      if (error) {
        console.error('Video query error:', error);
        throw error;
      }

      console.log('Videos fetched:', data?.length || 0);
      
      return (data ?? []).map((video) => {
        if (!video.profiles || typeof video.profiles !== 'object' || Array.isArray(video.profiles)) {
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
        .limit(10);
      
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="min-h-screen bg-white">      {/* Header */}
      <div className="px-6 pt-8 pb-6">
        {/* Enhanced Tabs Container */}        <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 p-2 mb-8 max-w-[400px] mx-auto">
          {/* Background slider */}
          <div 
            className={`absolute top-3 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-xl shadow-lg transition-all duration-300 ease-out z-0 ${
              activeTab === 'home' ? 'left-2 w-[calc(50%-0.25rem)]' : 'left-[calc(50%+0.25rem)] w-[calc(50%-0.25rem)]'
            }`}
          />
          
          {/* Tab Buttons */}
          <div className="relative flex z-10">
            <button
              onClick={() => {
                setActiveTab('home');
                navigate('/');
              }}
              className={`flex-1 h-11 px-6 rounded-xl font-semibold text-sm transition-all duration-300 ease-out flex items-center justify-center gap-2 ${
                activeTab === 'home' 
                  ? 'text-white shadow-lg' 
                  : 'text-slate-600 hover:text-slate-800 hover:bg-transparent'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Home
            </button>
            
            <button
              onClick={() => {
                setActiveTab('network');
                navigate('/network');
              }}
              className={`flex-1 h-11 px-6 rounded-xl font-semibold text-sm transition-all duration-300 ease-out flex items-center justify-center gap-2 ${
                activeTab === 'network' 
                  ? 'text-white shadow-lg' 
                  : 'text-slate-600 hover:text-slate-800 hover:bg-transparent'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Following
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search videos or @username to find users..."
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
              </DropdownMenuItem>              <DropdownMenuItem onClick={() => setCategory('Entertainment & Pop Culture')}>
                Entertainment & Pop Culture
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCategory('Education & Learning')}>
                Education & Learning
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCategory('Business & Finance')}>
                Business & Finance
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCategory('Lifestyle & Wellness')}>
                Lifestyle & Wellness
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCategory('Culture & Society')}>
                Culture & Society
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCategory('DIY & Skills')}>
                DIY & Skills
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCategory('STEM')}>
                STEM
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCategory('Hobbies & Interests')}>
                Hobbies & Interests
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <div className="px-6">
        {activeTab === 'home' && (
          <>            {/* Featured Creators */}
            {profiles && profiles.length > 0 && (
             <div className="mb-8 -mx-6">              <div className="px-6">
                <h2 className="text-xl font-bold mb-4">Featured Creators</h2>
              </div>
              <div className="relative w-full px-6 ">
                <div className="flex space-x-4 overflow-x-auto px-6 pb-4">
                  {profiles.map((profile) => (
                    <div key={profile.id} className="flex-shrink-0 text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-red-500 rounded-xl mb-2 flex items-center justify-center relative mx-auto">
                        <img
                          src={profile.avatar_url || "/placeholder.svg?height=48&width=48"}
                          alt={profile.full_name || 'Creator'}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                      </div>
                      <p className="font-semibold text-sm text-center">{profile.full_name || 'Creator'}</p>
                      <p className="text-xs text-gray-500 text-center">{profile.specialty || 'Creator'}</p>
                    </div>
                  ))}
                </div>
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
                      className="bg-white rounded-xl border border-gray-100 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => navigate(`/video/${video.id}`)}
                    >
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
                        <div className="absolute top-2 left-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            video.visibility === 'public' ? 'bg-green-100 text-green-800' :
                            video.visibility === 'private' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {video.visibility}
                          </span>
                        </div>
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
                  <p className="text-sm text-gray-400 mt-2">Be the first to share something!</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Searched Profiles Section */}
        {searchQuery.startsWith('@') && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Users</h2>
            {isLoadingProfiles ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-300 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-300 rounded w-1/4" />
                      <div className="h-3 bg-gray-300 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : searchedProfiles && searchedProfiles.length > 0 ? (
              <div className="space-y-4">
                {searchedProfiles.map((profile) => (
                  <div 
                    key={profile.id}
                    onClick={() => navigate(`/profile/${profile.username}`)}
                    className="flex items-center space-x-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 cursor-pointer"
                  >
                    <img
                      src={profile.avatar_url || "/placeholder.svg"}
                      alt={profile.full_name || "User"}
                      className="w-12 h-12 rounded-full object-cover border border-gray-200"
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900">{profile.full_name}</h3>
                      <p className="text-sm text-gray-500">@{profile.username}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No users found matching "{searchQuery}"</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeScreen;

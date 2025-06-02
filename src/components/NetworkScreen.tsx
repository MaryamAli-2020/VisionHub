import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SortDesc } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
type Video = Database['public']['Tables']['videos']['Row'];
type Post = Database['public']['Tables']['posts']['Row'];

type VideoWithProfile = Video & {
  profiles: Profile | null;
  content_type: 'video';
};

type PostWithProfile = Post & {
  profiles: Profile | null;
  content_type: 'post';
  title?: string;
};

type ContentItem = VideoWithProfile | PostWithProfile;

type FollowWithProfile = Database['public']['Tables']['follows']['Row'] & {
  following_profile: Profile;
};

type SortOption = 'latest' | 'oldest' | 'popular';

const NetworkScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [activeTab, setActiveTab] = useState<'home' | 'network'>('home');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Fetch following connections
  const { data: following } = useQuery<FollowWithProfile[]>({
    queryKey: ['following', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data: followsData, error: followsError } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', user.id);

      if (followsError) throw followsError;
      if (!followsData || followsData.length === 0) return [];

      const followingIds = followsData.map(f => f.following_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', followingIds);

      if (profilesError) throw profilesError;

      return followsData
        .map(follow => ({
          ...follow,
          following_profile: profilesData?.find((p: Profile) => p.id === follow.following_id)
        }))
        .filter(f => f.following_profile) as FollowWithProfile[];
    },
    enabled: !!user?.id
  });

  // Fetch recent content from following
  const { data: recentContent, isLoading } = useQuery<ContentItem[]>({
    queryKey: ['following-content', user?.id, debouncedSearchQuery, sortBy],
    queryFn: async () => {
      if (!user?.id || !following?.length) return [];

      const followingIds = following.map(f => f.following_id);
      
      // Fetch videos from following
      const { data: videos, error: videosError } = await supabase
        .from('videos')
        .select('*')
        .in('user_id', followingIds)
        .eq('is_published', true)
        .eq('visibility', 'public');

      if (videosError) throw videosError;

      // Fetch posts from following
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .in('user_id', followingIds)
        .eq('is_published', true);

      if (postsError) throw postsError;

      // Fetch profiles for all content creators
      const allUserIds = [
        ...(videos || []).map(v => v.user_id).filter(Boolean),
        ...(posts || []).map(p => p.user_id).filter(Boolean)
      ];
      const uniqueUserIds = [...new Set(allUserIds)];

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', uniqueUserIds);

      if (profilesError) throw profilesError;

      // Create profile lookup map
      const profilesMap = new Map<string, Profile>();
      profilesData?.forEach(profile => {
        profilesMap.set(profile.id, profile);
      });

      // Combine and type the content properly with profiles
      const videoItems: VideoWithProfile[] = (videos || [])
        .map(v => ({
          ...v,
          content_type: 'video' as const,
          profiles: v.user_id ? profilesMap.get(v.user_id) || null : null
        }))
        .filter(v => v.profiles !== null);

      const postItems: PostWithProfile[] = (posts || [])
        .map(p => ({
          ...p,
          content_type: 'post' as const,
          title: p.content ? p.content.slice(0, 50) + '...' : 'Post',
          profiles: p.user_id ? profilesMap.get(p.user_id) || null : null
        }))
        .filter(p => p.profiles !== null);

      const allContent: ContentItem[] = [...videoItems, ...postItems];

      // Apply search filter
      let filteredContent = allContent;
      if (debouncedSearchQuery) {
        filteredContent = allContent.filter(item => {
          const title = item.content_type === 'video' ? item.title : item.title || item.content;
          const content = item.content_type === 'video' ? item.description : item.content;
          
          return title?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
                 content?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
                 item.profiles?.full_name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
        });
      }

      // Apply sorting
      switch (sortBy) {
        case 'oldest':
          filteredContent.sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());
          break;
        case 'popular':
          filteredContent.sort((a, b) => {
            const aCount = a.content_type === 'video' ? (a.views_count || 0) : (a.likes_count || 0);
            const bCount = b.content_type === 'video' ? (b.views_count || 0) : (b.likes_count || 0);
            return bCount - aCount;
          });
          break;
        default:
          filteredContent.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
      }

      return filteredContent;
    },
    enabled: !!user?.id && !!following?.length
  });

  // Mock online status (in real app, this would come from presence/realtime)
  const getOnlineStatus = (userId: string) => {
    // Random online status for demo - in real app use Supabase realtime presence
    return Math.random() > 0.5;
  };

  const handleUserClick = (username: string) => {
    navigate(`/profile/${username}`);
  };

  const handleContentClick = (item: ContentItem) => {
    if (item.content_type === 'video') {
      navigate(`/video/${item.id}`);
    } else {
      // For posts, you might want to navigate to a post detail page or user profile
      navigate(`/profile/${item.profiles?.username}`);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Please log in to see your network</p>
          <Button onClick={() => navigate('/auth')}>
            Log In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">      {/* Header */}
      <div className="px-6 pt-8 pb-6">
        <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 p-2 mb-8 max-w-[400px] mx-auto">
          {/* Background slider */}          <div
            className={`absolute top-3 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-xl transition-all duration-200 ease-in-out`}
            style={{
              left: '50%',
              width: '48%',
              transform: 'translateX(0%)'
            }}
          />
          
          {/* Tab Buttons */}
          <div className="relative flex z-10">
            <button
              onClick={() => {
                setActiveTab('home');
                navigate('/');
              }}              className={`flex items-center justify-center gap-2 h-11 flex-1 rounded-xl text-sm font-medium transition-all duration-200`}
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
              className={`flex items-center justify-center gap-2 h-11 flex-1 rounded-xl text-sm font-medium transition-all duration-200 text-white`}
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
            placeholder="Search your network..."
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
        </div>
      </div>

      {/* Content */}
      <div className="px-6">
        {/* Your favourite channels */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Your favourite channels</h2>
          {following && following.length > 0 ? (
            <div className="flex overflow-x-auto pb-4 space-x-4">
              {following.map((follow) => {
                const isOnline = getOnlineStatus(follow.following_id);
                return (
                  <div 
                    key={follow.id} 
                    className="flex-shrink-0 text-center cursor-pointer"
                    onClick={() => handleUserClick(follow.following_profile.username || '')}
                  >
                    <div className="relative w-16 h-16 mx-auto mb-2">
                      <img
                        src={follow.following_profile.avatar_url || "/placeholder.svg?height=64&width=64"}
                        alt={follow.following_profile.full_name || 'User'}
                        className={`w-16 h-16 rounded-xl object-cover border-2 ${
                          isOnline ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                        isOnline ? 'bg-green-500' : 'bg-gray-400'
                      }`}></div>
                    </div>
                    <p className="font-semibold text-sm text-center max-w-[80px] truncate">
                      {follow.following_profile.full_name || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 text-center">
                      {isOnline ? 'Online' : 'Offline'}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>You're not following anyone yet</p>
              <Button 
                onClick={() => navigate('/')}
                className="mt-3"
                size="sm"
              >
                Discover Creators
              </Button>
            </div>
          )}
        </div>

        {/* New Content */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">New Content</h2>
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
          ) : recentContent && recentContent.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {recentContent.map((item) => (
                <div 
                  key={`${item.content_type}-${item.id}`}
                  className="bg-white rounded-xl border border-gray-100 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleContentClick(item)}
                >
                  {/* Content Thumbnail */}
                  <div className="relative">
                    {item.content_type === 'video' && item.thumbnail_url ? (
                      <img
                        src={item.thumbnail_url}
                        alt={item.title}
                        className="w-full h-32 object-cover"
                      />
                    ) : item.content_type === 'post' && item.media_url && item.media_url.length > 0 ? (
                      <img
                        src={item.media_url[0]}
                        alt="Post media"
                        className="w-full h-32 object-cover"
                      />
                    ) : (
                      <div className="w-full h-32 bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 text-sm">
                          {item.content_type === 'video' ? 'Video' : 'Post'}
                        </span>
                      </div>
                    )}
                    
                    {/* Duration for videos */}
                    {item.content_type === 'video' && item.duration && (
                      <span className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                        {Math.floor(item.duration / 60)}:{(item.duration % 60).toString().padStart(2, '0')}
                      </span>
                    )}
                    
                    {/* View count overlay */}
                    <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                      {item.content_type === 'video' ? (item.views_count || 0) : (item.likes_count || 0)} {item.content_type === 'video' ? 'views' : 'likes'}
                    </div>
                  </div>
                  
                  {/* Content Info */}
                  <div className="p-3">
                    <div className="flex items-start space-x-2">
                      <img
                        src={item.profiles?.avatar_url || "/placeholder.svg"}
                        alt={item.profiles?.full_name || 'Creator'}
                        className="w-8 h-8 rounded-full object-cover border border-gray-200 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm text-gray-900 line-clamp-2 mb-1">
                          {item.content_type === 'video' ? item.title : (item.title || 'Post')}
                        </h3>
                        <p className="text-xs text-gray-600 truncate">
                          {item.profiles?.full_name || 'Unknown Creator'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No recent content from your network</p>
              <p className="text-sm text-gray-400 mt-2">Follow some creators to see their content here!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NetworkScreen;

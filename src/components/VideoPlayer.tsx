import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Eye, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// Define the Video type based on your Supabase 'videos' table and included profile
interface Video {
  id: string;
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  user_id: string;
  likes_count?: number;
  views_count?: number;
  profiles?: {
    id: string;
    avatar_url?: string;
    username?: string;
    full_name?: string;
    specialty?: string;
  };
}

// Define the Comment type to match the structure returned by the comments query
interface Comment {
  id: string;
  video_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at?: string;
  profiles?: {
    id: string;
    avatar_url?: string | null;
    username?: string | null;
    full_name?: string | null;
    specialty?: string | null;
    bio?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
  } | null;
}

const VideoPlayer = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [hasViewedThisSession, setHasViewedThisSession] = useState(false);

  // Get current user's profile
  const { data: userProfile } = useQuery({
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

  // Fetch video data with creator profile
  const { data: video } = useQuery<Video | null>({
    queryKey: ['video', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('videos')
        .select(`
          *,
          profiles (
            id,
            avatar_url,
            username,
            full_name,
            specialty
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  // Get or create viewer ID for view tracking
  const getViewerId = () => {
    if (user?.id) return user.id;
    
    let anonymousId = localStorage.getItem('anonymous_viewer_id');
    if (!anonymousId) {
      anonymousId = uuidv4();
      localStorage.setItem('anonymous_viewer_id', anonymousId);
    }
    return anonymousId;
  };
  // Record unique view
  const recordView = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error('Video ID is required');
      if (hasAlreadyViewed || hasViewedThisSession) {
        console.log('View already recorded for this user/session');
        return;
      }
      
      const viewerId = user?.id || getViewerId();
      console.log('Recording view for video:', id, 'viewer:', viewerId);
      
      // First, try to insert the view record
      const { error: viewError } = await supabase
        .from('video_views')
        .insert({
          video_id: id,
          viewer_id: viewerId
        });

      if (viewError) {
        console.error('Error inserting view:', viewError);
        throw viewError;
      }      // First get the current view count
      const { data: currentVideo, error: getError } = await supabase
        .from('videos')
        .select('views_count')
        .eq('id', id)
        .single();
      
      if (getError) {
        console.error('Error getting current view count:', getError);
        throw getError;
      }

      // Then update with incremented count
      const { error: updateError } = await supabase
        .from('videos')
        .update({ 
          views_count: (currentVideo?.views_count || 0) + 1
        })
        .eq('id', id);
      
      if (updateError) {
        console.error('Error updating view count:', updateError);
        throw updateError;
      }
      
      setHasViewedThisSession(true);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video', id] });
      queryClient.invalidateQueries({ queryKey: ['video-view', id] });
    },
    onError: (error: Error) => {
      console.error('View recording error:', error);
      toast.error('Failed to record view');
    }
  });

  // Check if current user has already viewed this video
  const { data: hasAlreadyViewed } = useQuery({
    queryKey: ['video-view', id, getViewerId()],
    queryFn: async () => {
      if (!id) return false;
      
      const viewerId = getViewerId();
      
      const { data, error } = await supabase
        .from('video_views')
        .select('id')
        .eq('video_id', id)
        .eq('viewer_id', viewerId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    },
    enabled: !!id
  });

  // Fetch comments with user profiles
  const { data: comments = [] } = useQuery<Comment[]>({
    queryKey: ['video-comments', id],
    queryFn: async () => {
      // First fetch comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .eq('video_id', id)
        .order('created_at', { ascending: false });

      if (commentsError) throw commentsError;
      if (!commentsData) return [];

      // Then fetch profiles for all commenters
      const userIds = [...new Set(commentsData.map(c => c.user_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Combine comments with their profiles
      return commentsData.map(comment => ({
        ...comment,
        profiles: profilesData?.find(p => p.id === comment.user_id) || null
      }));
    },
    enabled: !!id
  });

  // Check if current user has liked the video
  const { data: likeStatus } = useQuery({
    queryKey: ['video-like', id, user?.id],
    queryFn: async () => {
      if (!user?.id || !id) return { liked: false, likes_count: video?.likes_count || 0 };

      const { data, error } = await supabase
        .from('video_likes')
        .select('*')
        .eq('video_id', id)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return { 
        liked: !!data,
        likes_count: video?.likes_count || 0
      };
    },
    enabled: !!user?.id && !!id
  });

  // Check if current user is subscribed to the video creator
  const { data: userSubscription } = useQuery({
    queryKey: ['user-subscription', video?.user_id, user?.id],
    queryFn: async () => {
      if (!video?.user_id || !user?.id) return null;
      
      const { data, error } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', user.id)
        .eq('following_id', video.user_id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!video?.user_id && !!user?.id
  });
  // (Duplicate recordView definition removed)

  // Like/unlike video
  const toggleLike = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Must be logged in to like videos');
      if (!id) throw new Error('Video ID is required');

      const { data, error } = await supabase.rpc('toggle_video_like', {
        video_id: id,
        user_id: user.id
      });

      if (error) throw error;
      return data as { liked: boolean; likes_count: number };
    },
    onSuccess: (data) => {
      // Update local state immediately
      setIsLiked(data.liked);
      // Update video data in cache
      queryClient.setQueryData(['video', id], (old: any) => ({
        ...old,
        likes_count: data.likes_count
      }));
      // Then invalidate queries to sync with server
      queryClient.invalidateQueries({ queryKey: ['video-like', id, user?.id] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  // Subscribe/unsubscribe to creator
  const toggleSubscribe = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Must be logged in to subscribe');
      if (!video?.user_id) throw new Error('Video creator not found');

      if (userSubscription) {
        // Unsubscribe
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', video.user_id);

        if (error) throw error;
      } else {
        // Subscribe
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: video.user_id
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['user-subscription', video?.user_id, user?.id] 
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  // Add comment
  const addComment = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error('Must be logged in to comment');
      if (!id) throw new Error('Video ID is required');

      const { error } = await supabase
        .from('comments')
        .insert({
          video_id: id,
          user_id: user.id,
          content
        });

      if (error) throw error;
    },
    onSuccess: () => {
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['video-comments', id] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  // Handle video play - record unique view
  const handleVideoPlay = async () => {
    if (!hasAlreadyViewed && !hasViewedThisSession) {
      recordView.mutate();
    }
  };

  // Update initial like status
  useEffect(() => {
    if (likeStatus) {
      setIsLiked(likeStatus.liked);
    }
  }, [likeStatus]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 pt-12">
        <button
          onClick={() => navigate(-1)}
          className="p-2"
          aria-label="Go back"
          title="Go back"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-semibold">{video?.title}</h1>
        <div className="w-10"></div>
      </div>

      {/* Video Player */}
      <div className="relative mx-6 rounded-xl overflow-hidden mb-6">
        {video?.video_url ? (
          <video
            src={video.video_url}
            controls
            className="w-full h-64 object-cover"
            poster={video.thumbnail_url || undefined}
            onPlay={handleVideoPlay}
          />
        ) : (
          <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
            <span>No video available</span>
          </div>
        )}
      </div>

      {/* Video Info */}
      <div className="px-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {video?.title}
            </h2>
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex items-center space-x-3">
                <img
                  src={video?.profiles?.avatar_url || '/placeholder.svg?height=40&width=40'}
                  alt={video?.profiles?.username || 'Creator'}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="font-semibold">{video?.profiles?.username || video?.profiles?.full_name}</p>
                  <p className="text-sm text-gray-500">
                    {video?.profiles?.specialty && (
                      <span className="text-gray-600">{video.profiles.specialty}</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant={isLiked ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleLike.mutate()}
                  disabled={!user?.id || toggleLike.isPending}
                  className={isLiked ? "bg-red-500 hover:bg-red-600 text-white" : ""}
                >
                  <Heart className={`w-4 h-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
                  {video?.likes_count || 0}
                </Button>
                <div className="flex items-center text-gray-600 text-sm">
                  <Eye className="w-4 h-4 mr-1" />
                  {video?.views_count || 0} views
                </div>
              </div>
              {video?.user_id !== user?.id && (
                <Button
                  onClick={() => toggleSubscribe.mutate()}
                  disabled={!user}
                  className={`${userSubscription 
                    ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' 
                    : 'bg-red-500 hover:bg-red-600 text-white'} px-8 py-2 rounded-xl`}
                >
                  {userSubscription ? 'Subscribed' : 'Subscribe'}
                </Button>
              )}
            </div>

            {video?.description && (
              <p className="mt-4 text-gray-700">{video.description}</p>
            )}
          </div>
        </div>

        {/* Comments */}
        <div className="px-6">
          <div className="space-y-4 mb-6">
            {(comments || []).map((comment) => (
              <div key={comment.id} className="flex space-x-3">
                <img
                  src={comment.profiles?.avatar_url || '/placeholder.svg?height=40&width=40'}
                  alt={comment.profiles?.username || 'User'}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="font-semibold text-sm">{comment.profiles?.username || 'Anonymous'}</p>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Comment Input */}
          {user ? (
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-10 h-10 rounded-full overflow-hidden">
                <img 
                  src={userProfile?.avatar_url || '/placeholder.svg?height=40&width=40'} 
                  alt="Your avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
              <Input
                placeholder="Write your comment"
                className="flex-1 rounded-xl"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && commentText.trim()) {
                    addComment.mutate(commentText.trim());
                  }
                }}
              />
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              Please login to comment
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
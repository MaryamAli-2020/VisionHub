import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Eye, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Profile {
  id: string;
  avatar_url: string | null;
  username: string | null;
  full_name: string | null;
  specialty: string | null;
}

interface Video {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  views_count: number | null;
  likes_count: number | null;
  user_id: string | null;
  created_at: string | null;
  profiles: Profile | null;
}

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  video_id: string;
  profiles: Profile | null;
}

const VideoPlayer = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');
  const queryClient = useQueryClient();

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
  const { data: userLike } = useQuery({
    queryKey: ['video-like', id, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('video_likes')
        .select('*')
        .eq('video_id', id)
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!id && !!user?.id
  });

  // Check if current user is subscribed to the creator
  const { data: userSubscription } = useQuery({
    queryKey: ['user-subscription', video?.user_id, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', user?.id)
        .eq('following_id', video?.user_id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!video?.user_id && !!user?.id
  });

  // Update views count
  const updateViews = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('videos')
        .update({
          views_count: (video?.views_count || 0) + 1
        })
        .eq('id', id);

      if (error) throw error;
    }
  });

  // Like/unlike video
  const toggleLike = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Must be logged in to like videos');

      if (userLike) {
        // Unlike
        const { error } = await supabase
          .from('video_likes')
          .delete()
          .eq('video_id', id)
          .eq('user_id', user.id);

        if (error) throw error;

        // Update likes count
        await supabase
          .from('videos')
          .update({
            likes_count: (video?.likes_count || 1) - 1
          })
          .eq('id', id);
      } else {
        // Like
        const { error } = await supabase
          .from('video_likes')
          .insert({
            video_id: id,
            user_id: user.id
          });

        if (error) throw error;

        // Update likes count
        await supabase
          .from('videos')
          .update({
            likes_count: (video?.likes_count || 0) + 1
          })
          .eq('id', id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video', id] });
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

  // Update views when video loads
  useEffect(() => {
    if (video) {
      updateViews.mutate();
    }
  }, [video?.id]);

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
              <div className="flex items-center space-x-6 text-gray-500 text-sm">
                <div className="flex items-center space-x-1">
                  <Eye className="w-4 h-4" />
                  <span>{video?.views_count || 0} views</span>
                </div>
                <button
                  onClick={() => toggleLike.mutate()}
                  disabled={!user}
                  className={`flex items-center space-x-1 ${userLike ? 'text-red-500' : ''}`}
                >
                  <Heart className={`w-4 h-4 ${userLike ? 'fill-current' : ''}`} />
                  <span>{video?.likes_count || 0} likes</span>
                </button>
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
              <Button 
                className="bg-teal-400 hover:bg-teal-500 w-12 h-12 rounded-xl p-0"
                onClick={() => {
                  if (commentText.trim()) {
                    addComment.mutate(commentText.trim());
                  }
                }}
                disabled={!commentText.trim() || addComment.isPending}
              >
                <span className="text-white">→</span>
              </Button>
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

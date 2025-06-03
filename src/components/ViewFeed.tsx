import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PostgrestError } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';
import { 
  ArrowLeft, Heart, MessageCircle, UserPlus,
  FileText, Bell, BellOff, MoreVertical,
  Video as VideoIcon
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Tables = Database['public']['Tables'];
type TableRow<T extends keyof Tables> = Tables[T]['Row'];

type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  specialty?: string | null;
};

type VideoPreview = {
  id: string;
  title: string;
  thumbnail_url: string | null;
};

type PostPreview = {
  id: string;
  content: string | null;
  media_url: string[] | null;
};

interface FollowWithProfile extends TableRow<'follows'> {
  profiles: Profile;
}

interface PostLikeWithProfile extends TableRow<'post_likes'> {
  profiles: Profile;
  posts: PostPreview;
}

interface VideoLikeWithProfile extends TableRow<'video_likes'> {
  profiles: Profile;
  videos: VideoPreview;
}

interface PostCommentWithProfile extends TableRow<'post_comments'> {
  profiles: Profile;
  posts: PostPreview;
}

interface VideoCommentWithProfile extends TableRow<'comments'> {
  profiles: Profile;
  videos: VideoPreview;
}

type NotificationItem = {
  id: string;
  type: 'follow' | 'like_post' | 'like_video' | 'comment_post' | 'comment_video';
  created_at: string;
  read: boolean;
  actor_profile: Profile;
  target_post?: PostPreview;
  target_video?: VideoPreview;
  comment_content?: string;
};

const ViewFeed = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'follows' | 'likes' | 'comments'>('all');

  // Fetch people who followed YOU (not who you follow)
  const { data: recentFollowers } = useQuery<FollowWithProfile[], PostgrestError>({
    queryKey: ['recent-followers', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('follows')
        .select(`
          *,
          profiles!follows_follower_id_fkey (*)
        `)
        .eq('following_id', user.id) // Changed: get people who follow you
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data?.map(item => ({
        ...item,
        profiles: item.profiles as Profile
      })) || [];
    },
    enabled: !!user?.id
  });

  // Fetch recent likes on YOUR posts
  const { data: postLikes } = useQuery<PostLikeWithProfile[], PostgrestError>({
    queryKey: ['post-likes', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: userPosts } = await supabase
        .from('posts')
        .select('id')
        .eq('user_id', user.id);

      if (!userPosts?.length) return [];

      const { data, error } = await supabase
        .from('post_likes')
        .select(`
          *,
          profiles:profiles!user_id (*),
          posts:posts!post_id (*)
        `)
        .in('post_id', userPosts.map(p => p.id))
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data?.map(item => ({
        ...item,
        profiles: (item.profiles as unknown) as Profile,
        posts: (item.posts as unknown) as PostPreview
      })) || [];
    },
    enabled: !!user?.id
  });

  // Fetch recent likes on YOUR videos
  const { data: videoLikes } = useQuery<VideoLikeWithProfile[], PostgrestError>({
    queryKey: ['video-likes', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: userVideos } = await supabase
        .from('videos')
        .select('id')
        .eq('user_id', user.id);

      if (!userVideos?.length) return [];

      // First get the video likes
      const { data: likesData, error: likesError } = await supabase
        .from('video_likes')
        .select('*, videos!video_likes_video_id_fkey (id, title, thumbnail_url)')
        .in('video_id', userVideos.map(v => v.id))
        .order('created_at', { ascending: false })
        .limit(20);

      if (likesError) throw likesError;
      if (!likesData) return [];

      // Then fetch profiles for all users who liked
      const userIds = [...new Set(likesData.map(like => like.user_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Combine likes with their user profiles
      return likesData.map(like => ({
        ...like,
        profiles: profilesData?.find(p => p.id === like.user_id) as Profile,
        videos: like.videos as VideoPreview
      })) || [];
    },
    enabled: !!user?.id
  });

  // Fetch recent comments on YOUR posts
  const { data: postComments } = useQuery<PostCommentWithProfile[], PostgrestError>({
    queryKey: ['post-comments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: userPosts } = await supabase
        .from('posts')
        .select('id')
        .eq('user_id', user.id);

      if (!userPosts?.length) return [];

      const { data, error } = await supabase
        .from('post_comments')
        .select(`
          *,
          profiles:profiles!user_id (*),
          posts:posts!post_id (*)
        `)
        .in('post_id', userPosts.map(p => p.id))
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data?.map(item => ({
        ...item,
        profiles: (item.profiles as unknown) as Profile,
        posts: (item.posts as unknown) as PostPreview
      })) || [];
    },
    enabled: !!user?.id
  });

  // Fetch recent comments on YOUR videos
  const { data: videoComments } = useQuery<VideoCommentWithProfile[], PostgrestError>({
    queryKey: ['video-comments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: userVideos } = await supabase
        .from('videos')
        .select('id')
        .eq('user_id', user.id);

      if (!userVideos?.length) return [];

      // First get the comments with video details
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('*, videos!comments_video_id_fkey (id, title, thumbnail_url)')
        .in('video_id', userVideos.map(v => v.id))
        .order('created_at', { ascending: false })
        .limit(20);

      if (commentsError) throw commentsError;
      if (!commentsData) return [];

      // Then fetch profiles for all commenters
      const userIds = [...new Set(commentsData.map(comment => comment.user_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Combine comments with their user profiles
      return commentsData.map(comment => ({
        ...comment,
        profiles: profilesData?.find(p => p.id === comment.user_id) as Profile,
        videos: comment.videos as VideoPreview
      })) || [];
    },
    enabled: !!user?.id
  });

  // Combine and sort all notifications by created_at (most recent first)
  const allNotifications: NotificationItem[] = [
    // People who followed YOU
    ...(recentFollowers?.map(follow => ({
      id: `follow-${follow.id}`,
      type: 'follow' as const,
      created_at: follow.created_at || new Date().toISOString(),
      read: false,
      actor_profile: {
        id: follow.profiles.id,
        username: follow.profiles.username,
        full_name: follow.profiles.full_name,
        avatar_url: follow.profiles.avatar_url,
        specialty: follow.profiles.specialty
      }
    })) || []),
    
    // Likes on YOUR posts
    ...(postLikes?.map(like => ({
      id: `post-like-${like.id}`,
      type: 'like_post' as const,
      created_at: like.created_at || new Date().toISOString(),
      read: false,
      actor_profile: {
        id: like.profiles.id,
        username: like.profiles.username,
        full_name: like.profiles.full_name,
        avatar_url: like.profiles.avatar_url,
        specialty: like.profiles.specialty
      },
      target_post: {
        id: like.posts.id,
        content: like.posts.content,
        media_url: like.posts.media_url
      }
    })) || []),
    
    // Likes on YOUR videos
    ...(videoLikes?.map(like => ({
      id: `video-like-${like.id}`,
      type: 'like_video' as const,
      created_at: like.created_at || new Date().toISOString(),
      read: false,
      actor_profile: {
        id: like.profiles.id,
        username: like.profiles.username,
        full_name: like.profiles.full_name,
        avatar_url: like.profiles.avatar_url,
        specialty: like.profiles.specialty
      },
      target_video: {
        id: like.videos.id,
        title: like.videos.title,
        thumbnail_url: like.videos.thumbnail_url
      }
    })) || []),
    
    // Comments on YOUR posts
    ...(postComments?.map(comment => ({
      id: `post-comment-${comment.id}`,
      type: 'comment_post' as const,
      created_at: comment.created_at || new Date().toISOString(),
      read: false,
      actor_profile: {
        id: comment.profiles.id,
        username: comment.profiles.username,
        full_name: comment.profiles.full_name,
        avatar_url: comment.profiles.avatar_url,
        specialty: comment.profiles.specialty
      },
      target_post: {
        id: comment.posts.id,
        content: comment.posts.content,
        media_url: comment.posts.media_url
      },
      comment_content: comment.content
    })) || []),
    
    // Comments on YOUR videos
    ...(videoComments?.map(comment => ({
      id: `video-comment-${comment.id}`,
      type: 'comment_video' as const,
      created_at: comment.created_at || new Date().toISOString(),
      read: false,
      actor_profile: {
        id: comment.profiles.id,
        username: comment.profiles.username,
        full_name: comment.profiles.full_name,
        avatar_url: comment.profiles.avatar_url,
        specialty: comment.profiles.specialty
      },
      target_video: {
        id: comment.videos.id,
        title: comment.videos.title,
        thumbnail_url: comment.videos.thumbnail_url
      },
      comment_content: comment.content
    })) || [])
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Filter notifications based on selected filter
  const filteredNotifications = allNotifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'follows') return notification.type === 'follow';
    if (filter === 'likes') return notification.type.includes('like');
    if (filter === 'comments') return notification.type.includes('comment');
    return true;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'follow':
        return <UserPlus className="w-4 h-4 text-blue-500" />;
      case 'like_post':
      case 'like_video':
        return <Heart className="w-4 h-4 text-red-500" />;
      case 'comment_post':
      case 'comment_video':
        return <MessageCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getNotificationText = (notification: NotificationItem) => {
    const actorName = notification.actor_profile.full_name || notification.actor_profile.username || 'Someone';
    
    switch (notification.type) {
      case 'follow':
        return `${actorName} started following you`;
      case 'like_post':
        return `${actorName} liked your post`;
      case 'like_video':
        return `${actorName} liked your video "${notification.target_video?.title}"`;
      case 'comment_post':
        return `${actorName} commented on your post`;
      case 'comment_video':
        return `${actorName} commented on your video "${notification.target_video?.title}"`;
      default:
        return 'Unknown notification';
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    if (notification.type === 'follow') {
      navigate(`/profile/${notification.actor_profile.username}`);
      return;
    }
    
    if (notification.type === 'like_post' || notification.type === 'comment_post') {
      navigate(`/profile/${user?.id}?post=${notification.target_post?.id}`);
      return;
    }
    
    if (notification.type === 'like_video' || notification.type === 'comment_video') {
      navigate(`/video/${notification.target_video?.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="p-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-semibold">Notifications</h1>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  Mark all as read
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Notification settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="max-w-4xl mx-auto px-6 py-4">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-white text-slate-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All
            {allNotifications.length > 0 && (
              <span className="ml-2 bg-gray-300 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                {allNotifications.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setFilter('follows')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'follows'
                ? 'bg-white text-slate-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Follows
            {(recentFollowers?.length || 0) > 0 && (
              <span className="ml-2 bg-gray-300 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                {recentFollowers?.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setFilter('likes')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'likes'
                ? 'bg-white text-slate-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Likes
            {((postLikes?.length || 0) + (videoLikes?.length || 0)) > 0 && (
              <span className="ml-2 bg-gray-300 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                {(postLikes?.length || 0) + (videoLikes?.length || 0)}
              </span>
            )}
          </button>

          <button
            onClick={() => setFilter('comments')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'comments'
                ? 'bg-white text-slate-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Comments
            {((postComments?.length || 0) + (videoComments?.length || 0)) > 0 && (
              <span className="ml-2 bg-gray-300 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                {(postComments?.length || 0) + (videoComments?.length || 0)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-w-4xl mx-auto px-6 pb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No notifications yet</p>
              <p className="text-sm text-gray-400">When people interact with your content, you'll see notifications here.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-6 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.read ? 'bg-blue-50/30' : ''
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <img
                      src={notification.actor_profile.avatar_url || "/placeholder.svg"}
                      alt={notification.actor_profile.full_name || "User"}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getNotificationIcon(notification.type)}
                          <p className="text-sm text-gray-900">
                            {getNotificationText(notification)}
                          </p>
                        </div>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {getTimeAgo(notification.created_at)}
                        </span>
                      </div>

                      {notification.comment_content && (
                        <p className="mt-2 text-sm text-gray-600">
                          {notification.comment_content}
                        </p>
                      )}

                      {notification.target_post && notification.target_post.media_url && notification.target_post.media_url.length > 0 && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg flex items-start space-x-3">
                          <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-700 truncate">
                              {notification.target_post.content || "Post"}
                            </p>
                          </div>
                        </div>
                      )}

                      {notification.target_video && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg flex items-start space-x-3">
                          <VideoIcon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-700 truncate">
                              {notification.target_video.title}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewFeed;

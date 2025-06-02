import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, Edit, Upload, Send, Image, Video, File, 
  Users, MessageCircle, Plus, Play, MoreVertical,
  PencilLine, Trash, Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Post = Database['public']['Tables']['posts']['Row'];
type VideoType = Database['public']['Tables']['videos']['Row'];
type FollowWithProfile = Database['public']['Tables']['follows']['Row'] & {
  following_profile: Profile;
};

type EditingPost = {
  id: string;
  content: string;
  media_url?: string[];
  media_type?: string[];
};

const ProfileScreen = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
    // State
  const [isEditing, setIsEditing] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [showMediaDialog, setShowMediaDialog] = useState(false);
  const [selectedMediaType, setSelectedMediaType] = useState<'photo' | 'video' | 'file' | null>(null);
  const [editingPost, setEditingPost] = useState<EditingPost | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showEditProfileDialog, setShowEditProfileDialog] = useState(false);
  const [showEditVideoDialog, setShowEditVideoDialog] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoType | null>(null);
  const [editProfileData, setEditProfileData] = useState<{
    username: string;
    full_name: string;
    bio: string;
    specialty: string;
  }>({
    username: '',
    full_name: '',
    bio: '',
    specialty: ''
  });

  // Profile Query
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

  // Update Friends Query
  const { data: follows } = useQuery<FollowWithProfile[]>({
    queryKey: ['follows', user?.id],
    queryFn: async () => {
      // First, fetch follows
      const { data: followsData, error: followsError } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', user?.id);

      if (followsError) throw followsError;
      if (!followsData || followsData.length === 0) return [];

      // Then, fetch all profiles for the following_ids
      const followingIds = followsData.map(f => f.following_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', followingIds);

      if (profilesError) throw profilesError;

      // Merge follows with their corresponding profile
      return followsData
        .map(follow => ({
          ...follow,
          following_profile: profilesData?.find((p: Profile) => p.id === follow.following_id)
        }))
        .filter(f => f.following_profile); // Filter out if profile not found
    },
    enabled: !!user?.id
  });

  // Update Posts Query
  const { data: posts } = useQuery<Post[]>({
    queryKey: ['posts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Add videos query
  const { data: userVideos } = useQuery<VideoType[]>({
    queryKey: ['user-videos', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Profile Image Upload Mutation
  const uploadProfileImage = useMutation({
    mutationFn: async (file: File) => {
      if (!user?.id) throw new Error('User not authenticated');

      try {
        // 1. Validate file
        const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
        if (!['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt)) {
          throw new Error('Invalid file type. Please upload an image file.');
        }

        // 2. Create file path using user ID as folder
        const filePath = `${user.id}/avatar.${fileExt}`;

        // 3. Upload to storage with upsert
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file, {
            cacheControl: '0',
            upsert: true
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error(uploadError.message);
        }

        // 4. Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        // 5. Update profile with new avatar URL
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            id: user.id,
            avatar_url: publicUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (updateError) throw updateError;

        return publicUrl;
      } catch (error) {
        console.error('Upload error:', error);
        throw error instanceof Error 
          ? error 
          : new Error('Failed to upload image');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      toast.success('Profile image updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Upload failed: ${error.message}`);
    }
  });

  // Update Post Creation Mutation
  const createPost = useMutation({
    mutationFn: async (data: {
      content: string;
      media_url?: string[];
      media_type?: string[];
    }) => {
      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: user?.id as string,
          content: data.content,
          media_url: data.media_url || [],
          media_type: data.media_type || []
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', user?.id] });
      setPostContent('');
      toast.success('Post created successfully!');
    },
    onError: () => {
      toast.error('Failed to create post');
    }
  });

  const uploadMedia = useMutation({
    mutationFn: async (file: File) => {
      if (!user?.id) throw new Error('User not authenticated');

      try {
        const filePath = `${user.id}/posts/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('posts')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('posts')
          .getPublicUrl(filePath);

        return {
          url: publicUrl,
          type: file.type.startsWith('image/') ? 'image' : 
                file.type.startsWith('video/') ? 'video' : 'file'
        };
      } catch (error) {
        console.error('Upload error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      createPost.mutate({
        content: postContent,
        media_url: [data.url],
        media_type: [data.type]
      });
      setShowMediaDialog(false);
      setSelectedMediaType(null);
    },
    onError: (error: Error) => {
      toast.error(`Failed to upload media: ${error.message}`);
    }
  });

  // Add after existing mutations
  const deletePost = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', user?.id] });
      toast.success('Post deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete post');
    }
  });

  // Add deleteVideo mutation
  const deleteVideo = useMutation({
    mutationFn: async (videoId: string) => {
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', videoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-videos', user?.id] });
      toast.success('Video deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete video');
    }
  });

  const updatePost = useMutation({
    mutationFn: async (post: EditingPost) => {
      const { error } = await supabase
        .from('posts')
        .update({
          content: post.content,
          updated_at: new Date().toISOString()
        })
        .eq('id', post.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', user?.id] });
      setShowEditDialog(false);
      setEditingPost(null);
      toast.success('Post updated successfully');
    },
    onError: () => {
      toast.error('Failed to update post');
    }
  });

  // Add updateProfile mutation
  const updateProfile = useMutation({
    mutationFn: async (data: {
      username: string;
      full_name: string;
      bio: string;
      specialty: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      // First check username uniqueness if it changed
      if (data.username !== profile?.username) {
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', data.username)
          .single();

        if (existingUser) {
          throw new Error('Username already taken');
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          username: data.username,
          full_name: data.full_name,
          bio: data.bio,
          specialty: data.specialty,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      setShowEditProfileDialog(false);
      toast.success('Profile updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update profile: ${error.message}`);
    }
  });

  // Add updateVideo mutation
  const updateVideo = useMutation({
    mutationFn: async (data: { id: string; title: string; description: string }) => {
      const { error } = await supabase
        .from('videos')
        .update({
          title: data.title,
          description: data.description,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-videos', user?.id] });
      setShowEditVideoDialog(false);
      setEditingVideo(null);
      toast.success('Video updated successfully!');
    },
    onError: () => {
      toast.error('Failed to update video');
    }
  });

  // Set initial edit data when profile loads
  const { data: profileForEdit } = useQuery({
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
    }
  });

  // Update editProfileData when profileForEdit changes
  useEffect(() => {
    if (profileForEdit) {
      setEditProfileData({
        username: profileForEdit.username || '',
        full_name: profileForEdit.full_name || '',
        bio: profileForEdit.bio || '',
        specialty: profileForEdit.specialty || ''
      });
    }
  }, [profileForEdit]);

  // Fix file input accessibility
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadProfileImage.mutateAsync(file);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingMedia(true);
      try {
        await uploadMedia.mutateAsync(file);
      } finally {
        setIsUploadingMedia(false);
      }
    }
  };

  const handleMediaClick = (type: 'photo' | 'video' | 'file') => {
    setSelectedMediaType(type);
    setShowMediaDialog(true);
  };

  // Add handleEditProfile function
  const handleEditProfile = () => {
    setShowEditProfileDialog(true);
  };

  // Add handleUpdateProfile function
  const handleUpdateProfile = async () => {
    await updateProfile.mutateAsync(editProfileData);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          {/* Cover Section */}
          <div className="h-48 bg-gradient-to-r from-cyan-200 to-red-700 relative">
            <div className="absolute inset-0 bg-black/10"></div>
          </div>
          
          {/* Profile Info Section */}
          <div className="px-8 pb-8 -mt-16 relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-end space-y-4 sm:space-y-0 sm:space-x-6">
              {/* Profile Image */}
              <div className="relative">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                  aria-label="Upload profile picture"
                  title="Choose a profile picture"
                />
                <div className="relative">
                  <img
                    src={profile?.avatar_url || "/placeholder.svg?height=128&width=128"}
                    alt={profile?.full_name || "User"}
                    className="w-32 h-32 rounded-full border-4 border-white cursor-pointer hover:opacity-90 transition-opacity object-cover shadow-lg"
                    onClick={handleImageClick}
                  />
                  <button
                    onClick={handleImageClick}
                    className="absolute bottom-2 right-2 bg-slate-800 hover:bg-slate-700 text-white rounded-full p-2 shadow-lg transition-colors"
                    title="Upload profile picture"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Profile Details */}
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {profile?.full_name || user?.email || 'User'}
                </h1>
                <p className="text-lg text-gray-600 mb-3">
                  {profile?.specialty || 'VisionHub Member'}
                </p>
                {profile?.bio && (
                  <p className="text-gray-700 max-w-2xl leading-relaxed">{profile.bio}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Button 
            onClick={handleEditProfile} 
            className="bg-slate-800 hover:bg-slate-700 text-white py-3 h-12 rounded-xl font-medium transition-colors shadow-sm"
          >
            <Edit className="w-5 h-5 mr-2" />
            Edit Profile
          </Button>
          <Button 
            onClick={() => navigate('/viewfeed')}
            variant="outline"
            className="border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 py-3 h-12 rounded-xl font-medium transition-colors"
          >
            <Bell className="w-5 h-5 mr-2" />
            Notifications
          </Button>
          <Button 
            onClick={() => navigate('/messages')}
            variant="outline"
            className="border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 py-3 h-12 rounded-xl font-medium transition-colors"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Messages
          </Button>
        </div>

        {/* Three Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Connections Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Users className="w-5 h-5 mr-2 text-gray-600" />
                Connections
              </h2>
              <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm font-medium">
                {follows?.length ?? 0}
              </span>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {follows?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No connections yet</p>
                </div>
              ) : (
                follows?.map((follow) => (
                  <div key={follow.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <img
                      src={follow.following_profile.avatar_url || "/placeholder.svg"}
                      alt={follow.following_profile.full_name || "Connection"}
                      className="w-12 h-12 rounded-full object-cover border border-gray-200"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {follow.following_profile.full_name}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {follow.following_profile.specialty || 'Member'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Create Post Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Create Post</h2>
            <div className="space-y-4">
              <Textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="Share your thoughts with the community..."
                className="min-h-[120px] border-gray-300 focus:border-slate-500 focus:ring-slate-500 rounded-xl resize-none"
              />
              <div className="flex justify-between items-center pt-2">
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleMediaClick('photo')}
                    className="border-gray-300 text-gray-600 hover:bg-gray-50 rounded-lg"
                  >
                    <Image className="w-4 h-4 mr-2" />
                    Photo
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleMediaClick('video')}
                    className="border-gray-300 text-gray-600 hover:bg-gray-50 rounded-lg"
                  >
                    <Video className="w-4 h-4 mr-2" />
                    Video
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleMediaClick('file')}
                    className="border-gray-300 text-gray-600 hover:bg-gray-50 rounded-lg"
                  >
                    <File className="w-4 h-4 mr-2" />
                    File
                  </Button>
                </div>
                <Button
                  onClick={() => createPost.mutate({ content: postContent })}
                  disabled={!postContent.trim() || createPost.isPending}
                  className="bg-white-800 hover:bg-white-700 text-slate rounded-lg px-6 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createPost.isPending ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>


        </div>

        {/* Recent Posts & Videos */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Posts & Videos</h2>
          <div className="space-y-6">
            {posts?.length === 0 && userVideos?.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">No content yet</p>
                <p>Share your first post or video to get started!</p>
              </div>
            ) : (
              [...(posts || []), ...(userVideos || [])].sort((a, b) => 
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              ).map((item) => {
                const isVideo = 'video_url' in item;
                return (
                  <div key={item.id} className="border border-gray-100 rounded-xl p-6 hover:border-gray-200 transition-colors">
                    <div className="flex items-start space-x-4">
                      <img
                        src={profile?.avatar_url || "/placeholder.svg"}
                        alt={profile?.full_name}
                        className="w-12 h-12 rounded-full object-cover border border-gray-200"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <p className="font-semibold text-gray-900">{profile?.full_name}</p>
                            <span className="text-gray-400">•</span>
                            <p className="text-sm text-gray-500">
                              {new Date(item.created_at || '').toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  if (isVideo) {
                                    setEditingVideo(item as VideoType);
                                    setShowEditVideoDialog(true);
                                  } else {
                                    setEditingPost(item as Post);
                                    setShowEditDialog(true);
                                  }
                                }}
                              >
                                <PencilLine className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => {
                                  if (isVideo) {
                                    deleteVideo.mutate(item.id);
                                  } else {
                                    deletePost.mutate(item.id);
                                  }
                                }}
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {isVideo ? (
                          <div onClick={() => navigate(`/video/${item.id}`)} className="cursor-pointer">
                            <h3 className="font-medium text-gray-900 mb-2">{(item as VideoType).title}</h3>
                            {(item as VideoType).thumbnail_url && (
                              <div className="relative mb-3">
                                <img
                                  src={(item as VideoType).thumbnail_url!}
                                  alt={(item as VideoType).title}
                                  className="w-full h-48 object-cover rounded-lg"
                                />
                                <div className="absolute top-2 left-2">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    (item as VideoType).visibility === 'public' ? 'bg-green-100 text-green-800' :
                                    (item as VideoType).visibility === 'private' ? 'bg-blue-100 text-blue-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {(item as VideoType).visibility}
                                  </span>
                                </div>
                              </div>
                            )}
                            <p className="text-gray-600 text-sm mb-2">{(item as VideoType).description}</p>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <span>{(item as VideoType).views_count || 0} views</span>
                              {(item as VideoType).category && (
                                <>
                                  <span>•</span>
                                  <span className="capitalize">{(item as VideoType).category}</span>
                                </>
                              )}
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-gray-800 leading-relaxed mb-4">{(item as Post).content}</p>
                            {(item as Post).media_url?.map((url, index) => {
                              const type = (item as Post).media_type?.[index];
                              if (type === 'image') {
                                return (
                                  <img
                                    key={url}
                                    src={url}
                                    alt="Post attachment"
                                    className="rounded-lg max-h-96 w-full object-cover mb-4"
                                  />
                                );
                              }
                              if (type === 'video') {
                                return (
                                  <video
                                    key={url}
                                    src={url}
                                    controls
                                    className="rounded-lg max-h-96 w-full mb-4"
                                  />
                                );
                              }
                              return (
                                <a
                                  key={url}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center space-x-2 text-blue-600 hover:underline"
                                >
                                  <File className="h-4 w-4" />
                                  <span>Attached File</span>
                                </a>
                              );
                            })}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Media Upload Dialog */}
        <Dialog open={showMediaDialog} onOpenChange={setShowMediaDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload {selectedMediaType}</DialogTitle>
            </DialogHeader>
            <div className="p-6">
              <input
                type="file"
                ref={mediaInputRef}
                onChange={handleMediaUpload}
                accept={
                  selectedMediaType === 'photo' ? 'image/*' :
                  selectedMediaType === 'video' ? 'video/*' :
                  '*'
                }
                className="hidden"
                title={`Upload ${selectedMediaType ?? 'media'}`}
                placeholder={`Choose a ${selectedMediaType ?? 'file'} to upload`}
              />
              <Button
                onClick={() => mediaInputRef.current?.click()}
                disabled={isUploadingMedia}
                className="w-full"
              >
                {isUploadingMedia ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Choose {selectedMediaType}
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Post Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Post</DialogTitle>
            </DialogHeader>
            <div className="p-4">
              <Textarea
                value={editingPost?.content || ''}
                onChange={(e) => setEditingPost(prev => 
                  prev ? { ...prev, content: e.target.value } : null
                )}
                placeholder="Update your post..."
                className="min-h-[120px] mb-4"
              />
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditDialog(false);
                    setEditingPost(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => editingPost && updatePost.mutate(editingPost)}
                  disabled={!editingPost?.content.trim() || updatePost.isPending}
                >
                  {updatePost.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Profile Dialog */}
        <Dialog open={showEditProfileDialog} onOpenChange={setShowEditProfileDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={editProfileData.username}
                  onChange={(e) => setEditProfileData(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Enter username"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={editProfileData.full_name}
                  onChange={(e) => setEditProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Enter full name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="specialty">Specialty</Label>
                <Input
                  id="specialty"
                  value={editProfileData.specialty}
                  onChange={(e) => setEditProfileData(prev => ({ ...prev, specialty: e.target.value }))}
                  placeholder="Enter your specialty"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={editProfileData.bio}
                  onChange={(e) => setEditProfileData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about yourself"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowEditProfileDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateProfile}
                disabled={updateProfile.isPending}
              >
                {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Video Dialog */}
        <Dialog open={showEditVideoDialog} onOpenChange={setShowEditVideoDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Video</DialogTitle>
            </DialogHeader>
            <div className="p-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="videoTitle">Title</Label>
                  <Input
                    id="videoTitle"
                    value={editingVideo?.title || ''}
                    onChange={(e) => setEditingVideo(prev => 
                      prev ? { ...prev, title: e.target.value } : null
                    )}
                    placeholder="Enter video title"
                  />
                </div>
                <div>
                  <Label htmlFor="videoDescription">Description</Label>
                  <Textarea
                    id="videoDescription"
                    value={editingVideo?.description || ''}
                    onChange={(e) => setEditingVideo(prev => 
                      prev ? { ...prev, description: e.target.value } : null
                    )}
                    placeholder="Enter video description"
                    className="min-h-[120px]"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditVideoDialog(false);
                    setEditingVideo(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => editingVideo && updateVideo.mutate({
                    id: editingVideo.id,
                    title: editingVideo.title,
                    description: editingVideo.description || ''
                  })}
                  disabled={!editingVideo?.title || updateVideo.isPending}
                >
                  {updateVideo.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ProfileScreen;

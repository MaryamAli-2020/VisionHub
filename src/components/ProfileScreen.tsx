import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LogOut, Edit, Upload, Send, Image, Video, File, Users, MessageCircle, Plus } from 'lucide-react';
import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MoreVertical, Trash, PencilLine } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Profile = Database['public']['Tables']['profiles']['Row'];
type Post = Database['public']['Tables']['posts']['Row'];

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [showMediaDialog, setShowMediaDialog] = useState(false);
  const [selectedMediaType, setSelectedMediaType] = useState<'photo' | 'video' | 'file' | null>(null);
  const [editingPost, setEditingPost] = useState<EditingPost | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const queryClient = useQueryClient();

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="">
          <div className="animate-pulse flex space-x-4">
            <div className="rounded-full bg-gray-200 h-12 w-12"></div>
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Professional Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>
          </div>
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          {/* Cover Section */}
          <div className="h-48 bg-gradient-to-r from-slate-200 to-slate-700 relative">
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
            onClick={() => setIsEditing(!isEditing)} 
            className="bg-slate-800 hover:bg-slate-700 text-white py-3 h-12 rounded-xl font-medium transition-colors shadow-sm"
          >
            <Edit className="w-5 h-5 mr-2" />
            Edit Profile
          </Button>
          <Button 
            onClick={() => navigate('/feed')}
            variant="outline"
            className="border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 py-3 h-12 rounded-xl font-medium transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            View Feed
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

        {/* Two Column Layout */}
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
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Create Post</h2>
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

        {/* Recent Posts */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Posts</h2>
          <div className="space-y-6">
            {posts?.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">No posts yet</p>
                <p>Share your first post to get started!</p>
              </div>
            ) : (
              posts?.map((post) => (
                <div key={post.id} className="border border-gray-100 rounded-xl p-6 hover:border-gray-200 transition-colors">
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
                            {new Date(post.created_at || '').toLocaleDateString('en-US', {
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
                                setEditingPost(post);
                                setShowEditDialog(true);
                              }}
                            >
                              <PencilLine className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => deletePost.mutate(post.id)}
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <p className="text-gray-800 leading-relaxed mb-4">{post.content}</p>
                      
                      {/* Media Preview */}
                      {post.media_url?.map((url, index) => {
                        const type = post.media_type?.[index];
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
                    </div>
                  </div>
                </div>
              ))
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
      </div>
    </div>
  );
};

export default ProfileScreen;
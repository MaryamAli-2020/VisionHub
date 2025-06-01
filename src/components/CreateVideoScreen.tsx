
import { useState, useRef } from 'react';
import { ChevronLeft, Upload, X, ChevronDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';
import { verifyVideoUpload } from '@/utils/videoUtils';

const CreateVideoScreen = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [category, setCategory] = useState('');
  const [visibility, setVisibility] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [showTagsDropdown, setShowTagsDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showVisibilityDropdown, setShowVisibilityDropdown] = useState(false);
  const [dragOver, setDragOver] = useState({ video: false, thumbnail: false });
  const [uploadProgress, setUploadProgress] = useState(0);

  const videoInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);

  const availableTags = ['Gaming', 'Music', 'Education', 'Entertainment', 'Sports', 'Technology', 'Comedy', 'News'];
  const categories = ['Gaming', 'Music', 'Education', 'Entertainment', 'Sports', 'Technology', 'Comedy', 'News', 'Vlogs'];
  const visibilityOptions = ['Public', 'Private', 'Unlisted'];

  const handleVideoUpload = (file) => {
    if (file && file.size <= 120 * 1024 * 1024) { // 120MB limit
      setVideoFile(file);
    } else {
      alert('File size exceeds 120MB limit');
    }
  };

  const handleThumbnailUpload = (file) => {
    if (file && file.size <= 25 * 1024 * 1024) { // 25MB limit
      setThumbnailFile(file);
    } else {
      alert('File size exceeds 25MB limit');
    }
  };

  const handleDragOver = (e, type) => {
    e.preventDefault();
    setDragOver(prev => ({ ...prev, [type]: true }));
  };

  const handleDragLeave = (e, type) => {
    e.preventDefault();
    setDragOver(prev => ({ ...prev, [type]: false }));
  };

  const handleDrop = (e, type) => {
    e.preventDefault();
    setDragOver(prev => ({ ...prev, [type]: false }));
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (type === 'video') {
        handleVideoUpload(file);
      } else {
        handleThumbnailUpload(file);
      }
    }
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const removeTag = (tag) => {
    setSelectedTags(prev => prev.filter(t => t !== tag));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Fixed uploadVideo mutation with proper data saving
  const uploadVideo = useMutation({
    mutationFn: async () => {
      if (!user?.id || !videoFile || !title.trim()) {
        throw new Error('Missing required fields');
      }

      console.log('Starting video upload process...');
      setUploadProgress(10);

      const visibilityValue = visibility.toLowerCase() || 'public';
      const mutualFollowersOnly = visibilityValue === 'private';
      
      try {
        // 1. Create video record first
        console.log('Creating video record...');
        const { data: videoData, error: createError } = await supabase
          .from('videos')
          .insert({
            user_id: user.id,
            title: title.trim(),
            description: description.trim() || null,
            category: category || null,
            tags: selectedTags.length > 0 ? selectedTags : null,
            visibility: visibilityValue,
            mutual_followers_only: mutualFollowersOnly,
            is_published: false // Start as unpublished until upload completes
          })
          .select()
          .single();

        if (createError || !videoData) {
          console.error('Failed to create video record:', createError);
          throw new Error('Failed to create video record');
        }

        const videoId = videoData.id;
        console.log('Video record created with ID:', videoId);
        setUploadProgress(20);

        // 2. Upload video file to storage
        console.log('Uploading video file...');
        const videoFileName = `${user.id}/${videoId}/${Date.now()}-${videoFile.name}`;
        
        const { error: videoUploadError } = await supabase.storage
          .from('videos')
          .upload(videoFileName, videoFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (videoUploadError) {
          console.error('Video upload error:', videoUploadError);
          // Clean up the video record
          await supabase.from('videos').delete().eq('id', videoId);
          throw new Error('Video upload failed');
        }

        setUploadProgress(60);

        // 3. Get video URL
        const { data: { publicUrl: videoUrl } } = supabase.storage
          .from('videos')
          .getPublicUrl(videoFileName);

        console.log('Video uploaded successfully, URL:', videoUrl);

        // 4. Upload thumbnail if exists
        let thumbnailUrl = null;
        if (thumbnailFile) {
          console.log('Uploading thumbnail...');
          const thumbnailFileName = `${user.id}/${videoId}/${Date.now()}-${thumbnailFile.name}`;
          const { error: thumbnailError } = await supabase.storage
            .from('thumbnails')
            .upload(thumbnailFileName, thumbnailFile, {
              cacheControl: '3600',
              upsert: false
            });

          if (thumbnailError) {
            console.error('Thumbnail upload error:', thumbnailError);
            // Don't fail the whole upload for thumbnail issues
          } else {
            const { data: { publicUrl: thumbUrl } } = supabase.storage
              .from('thumbnails')
              .getPublicUrl(thumbnailFileName);
            thumbnailUrl = thumbUrl;
            console.log('Thumbnail uploaded successfully:', thumbnailUrl);
          }
        }

        setUploadProgress(80);

        // 5. Update video record with file URLs and publish
        console.log('Updating video record with URLs...');
        const { error: updateError } = await supabase
          .from('videos')
          .update({
            video_url: videoUrl,
            thumbnail_url: thumbnailUrl,
            is_published: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', videoId);

        if (updateError) {
          console.error('Failed to update video record:', updateError);
          throw new Error('Failed to update video with file URLs');
        }

        setUploadProgress(90);

        // 6. Verify the upload
        console.log('Verifying upload...');
        let retries = 3;
        let isVerified = false;
        
        for (let i = 0; i < retries && !isVerified; i++) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
          isVerified = await verifyVideoUpload(videoId);
          
          if (isVerified) {
            console.log('Video verified successfully');
            break;
          }
        }

        if (!isVerified) {
          console.warn('Video verification failed, but upload completed');
        }

        setUploadProgress(100);
        
        console.log('Upload process completed successfully');
        return { 
          videoId, 
          videoUrl, 
          thumbnailUrl, 
          visibility: visibilityValue,
          title,
          description,
          category,
          tags: selectedTags
        };

      } catch (error) {
        console.error('Upload process failed:', error);
        setUploadProgress(0);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Upload successful:', data);
      toast.success(`Video "${data.title}" uploaded successfully! Visibility: ${data.visibility}`);
      
      // Navigate based on visibility
      if (data.visibility === 'public') {
        navigate('/', { replace: true });
      } else {
        navigate('/profile', { replace: true });
      }
      
      // Reset form
      setTitle('');
      setDescription('');
      setSelectedTags([]);
      setCategory('');
      setVisibility('');
      setVideoFile(null);
      setThumbnailFile(null);
    },
    onError: (error: Error) => {
      console.error('Upload failed:', error);
      toast.error(`Upload failed: ${error.message}`);
      setUploadProgress(0);
    }
  });

  const handleUpload = async () => {
    if (!videoFile) {
      toast.error('Please select a video file');
      return;
    }
    if (!title.trim()) {
      toast.error('Please enter a video title');
      return;
    }
    if (!visibility) {
      toast.error('Please select video visibility');
      return;
    }
    
    try {
      await uploadVideo.mutateAsync();
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 pt-12 border-b border-gray-100">
        <button 
          onClick={() => window.history.back()} 
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors" 
          title="Go back"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-semibold">Create Video</h1>
        <div className="w-10"></div>
      </div>

      <div className="p-6 space-y-8">
        {/* Video Upload */}
        <div 
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            dragOver.video 
              ? 'border-red-400 bg-red-50' 
              : videoFile 
                ? 'border-green-400 bg-green-50' 
                : 'border-gray-300 hover:border-red-400'
          }`}
          onClick={() => videoInputRef.current?.click()}
          onDragOver={(e) => handleDragOver(e, 'video')}
          onDragLeave={(e) => handleDragLeave(e, 'video')}
          onDrop={(e) => handleDrop(e, 'video')}
        >
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            onChange={(e) => e.target.files[0] && handleVideoUpload(e.target.files[0])}
            className="hidden"
            title="Upload video file"
            placeholder="Select a video file"
          />
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8 text-red-500" />
          </div>
          {videoFile ? (
            <div>
              <p className="text-green-600 font-semibold mb-2">✓ Video Selected</p>
              <p className="text-gray-600 text-sm">{videoFile.name}</p>
              <p className="text-gray-400 text-xs">{formatFileSize(videoFile.size)}</p>
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-2">
                <span className="text-red-500 font-semibold">Click to Upload</span> or drag and drop
              </p>
              <p className="text-gray-400 text-sm">(Max. File size: 120 MB)</p>
            </div>
          )}
        </div>

        {/* Video Details */}
        <div className="space-y-6">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Video title *</label>
            <input
              type="text"
              placeholder="Enter video title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Description</label>
            <textarea
              placeholder="Describe your video..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl min-h-[120px] resize-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          {/* Tags, Category, Visibility */}
          <div className="flex flex-wrap gap-4">
            {/* Tags Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowTagsDropdown(!showTagsDropdown)}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors relative"
              >
                Tags
                {selectedTags.length > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {selectedTags.length}
                  </span>
                )}
                <ChevronDown className="w-4 h-4 ml-2" />
              </button>
              
              {showTagsDropdown && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-10 p-4">
                  <div className="space-y-2">
                    {availableTags.map(tag => (
                      <label key={tag} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedTags.includes(tag)}
                          onChange={() => toggleTag(tag)}
                          className="w-4 h-4 text-red-500 rounded focus:ring-red-500"
                        />
                        <span className="text-sm">{tag}</span>
                      </label>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowTagsDropdown(false)}
                    className="w-full mt-3 px-3 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>

            {/* Category Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                {category || 'Category'}
                <ChevronDown className="w-4 h-4 ml-2" />
              </button>
              
              {showCategoryDropdown && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-10 py-2">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => {
                        setCategory(cat);
                        setShowCategoryDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors text-sm"
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Visibility Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowVisibilityDropdown(!showVisibilityDropdown)}
                className={`flex items-center px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors ${
                  !visibility ? 'text-red-500 border-red-300' : ''
                }`}
              >
                {visibility || 'Visibility *'}
                <ChevronDown className="w-4 h-4 ml-2" />
              </button>
              
              {showVisibilityDropdown && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-10 py-2">
                  {visibilityOptions.map(option => (
                    <button
                      key={option}
                      onClick={() => {
                        setVisibility(option);
                        setShowVisibilityDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors text-sm"
                    >
                      <div>
                        <div className="font-medium">{option}</div>
                        <div className="text-xs text-gray-500">
                          {option === 'Public' && 'Everyone can see this video'}
                          {option === 'Private' && 'Only mutual followers can see this'}
                          {option === 'Unlisted' && 'Only you can see this video'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Selected Tags Display */}
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedTags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-2 w-4 h-4 text-red-500 hover:text-red-700"
                    title={`Remove tag ${tag}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Thumbnail Upload */}
        <div>
          <label className="block text-gray-700 font-semibold mb-4">Thumbnail (Optional)</label>
          <div 
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              dragOver.thumbnail 
                ? 'border-red-400 bg-red-50' 
                : thumbnailFile 
                  ? 'border-green-400 bg-green-50' 
                  : 'border-gray-300 hover:border-red-400'
            }`}
            onClick={() => thumbnailInputRef.current?.click()}
            onDragOver={(e) => handleDragOver(e, 'thumbnail')}
            onDragLeave={(e) => handleDragLeave(e, 'thumbnail')}
            onDrop={(e) => handleDrop(e, 'thumbnail')}
          >
            <input
              ref={thumbnailInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files[0] && handleThumbnailUpload(e.target.files[0])}
              className="hidden"
              title="Upload thumbnail image"
              placeholder="Select a thumbnail image"
            />
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-red-500" />
            </div>
            {thumbnailFile ? (
              <div>
                <p className="text-green-600 font-semibold mb-2">✓ Thumbnail Selected</p>
                <p className="text-gray-600 text-sm">{thumbnailFile.name}</p>
                <p className="text-gray-400 text-xs">{formatFileSize(thumbnailFile.size)}</p>
              </div>
            ) : (
              <div>
                <p className="text-gray-600 mb-2">
                  <span className="text-red-500 font-semibold">Click to Upload</span> or drag and drop
                </p>
                <p className="text-gray-400 text-sm">(Max. File size: 25 MB)</p>
              </div>
            )}
          </div>
        </div>

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={!videoFile || !title.trim() || !visibility || uploadVideo.isPending}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-4 rounded-xl transition-colors"
        >
          {uploadVideo.isPending ? (
            <div className="flex flex-col items-center">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>
                  {uploadProgress < 100 
                    ? `Uploading... ${uploadProgress.toFixed(0)}%`
                    : 'Finalizing...'}
                </span>
              </div>
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="w-full h-2 bg-blue-800 rounded-full mt-2">
                  <div 
                    className="h-full bg-white rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </div>
          ) : (
            'Upload Video'
          )}
        </button>
      </div>

      {/* Click outside to close dropdowns */}
      {(showTagsDropdown || showCategoryDropdown || showVisibilityDropdown) && (
        <div 
          className="fixed inset-0 z-5"
          onClick={() => {
            setShowTagsDropdown(false);
            setShowCategoryDropdown(false);
            setShowVisibilityDropdown(false);
          }}
        />
      )}
    </div>
  );
};

export default CreateVideoScreen;

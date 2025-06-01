import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Video = Database['public']['Tables']['videos']['Row'];

export async function verifyVideoUpload(videoId: string): Promise<boolean> {
  try {
    // 1. Check video record
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select('*')
      .eq('id', videoId)
      .single();

    if (videoError || !video) {
      console.error('Video record verification failed:', videoError);
      return false;
    }

    // 2. Check video file in storage
    if (!video.video_url) {
      console.error('Video URL is missing');
      return false;
    }

    const videoPath = video.video_url.split('/').pop();
    if (!videoPath) {
      console.error('Invalid video URL');
      return false;
    }

    // 3. Try to get file metadata from storage
    const { data: fileData, error: fileError } = await supabase
      .storage
      .from('videos')
      .list(video.user_id + '/' + videoId);

    if (fileError || !fileData?.length) {
      console.error('Video file not found in storage');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Verification error:', error);
    return false;
  }
}
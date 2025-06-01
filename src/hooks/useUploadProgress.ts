import { useState, useCallback } from 'react';

export function useUploadProgress() {
  const [progress, setProgress] = useState(0);

  const trackProgress = useCallback((loaded: number, total: number) => {
    const percentage = (loaded / total) * 100;
    setProgress(Math.min(percentage, 100));
  }, []);

  const resetProgress = useCallback(() => {
    setProgress(0);
  }, []);

  return { progress, trackProgress, resetProgress };
}
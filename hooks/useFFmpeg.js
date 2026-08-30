import { useState, useRef, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export function useFFmpeg() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const ffmpegRef = useRef(new FFmpeg());

  const load = async () => {
    if (isLoaded) return;
    setIsLoading(true);
    const ffmpeg = ffmpegRef.current;
    
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    
    try {
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      setIsLoaded(true);
    } catch (e) {
      console.error('Error loading ffmpeg-core', e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const compressVideo = useCallback(async (file, onProgressCallback) => {
    if (!isLoaded) {
      await load();
    }
    
    const ffmpeg = ffmpegRef.current;
    
    ffmpeg.on('progress', ({ progress, time }) => {
      const pct = Math.max(0, Math.min(100, Math.round(progress * 100)));
      setProgress(pct);
      if (onProgressCallback) onProgressCallback(pct);
    });

    const inputName = 'input_video' + (file.name ? file.name.substring(file.name.lastIndexOf('.')) : '.mp4');
    const outputName = 'output_video.mp4';

    try {
      await ffmpeg.writeFile(inputName, await fetchFile(file));

      await ffmpeg.exec([
        '-i', inputName,
        '-vcodec', 'libx264',
        '-crf', '28',
        '-preset', 'veryfast',
        '-vf', "scale='min(1280,iw)':-2",
        '-acodec', 'aac',
        '-b:a', '128k',
        '-t', '120',
        outputName
      ]);

      const fileData = await ffmpeg.readFile(outputName);
      const data = new Uint8Array(fileData);
      
      return new File([data], 'compressed_video.mp4', {
        type: 'video/mp4'
      });
    } catch (err) {
      console.error("FFmpeg compression failed:", err);
      throw err;
    } finally {
      try {
        await ffmpeg.deleteFile(inputName);
        await ffmpeg.deleteFile(outputName);
      } catch (e) {}
      
      ffmpeg.off('progress');
      setProgress(0);
    }
  }, [isLoaded]);

  return {
    isLoaded,
    isLoading,
    progress,
    compressVideo,
    load
  };
}

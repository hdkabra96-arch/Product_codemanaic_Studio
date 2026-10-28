import { GIFEncoder, quantize, applyPalette } from 'gifenc';
import * as lamejs from '@breezystack/lamejs';

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  aspectRatio: number;
  formattedDuration: string;
  fileSize: number;
  formattedSize: string;
  mimeType: string;
  name: string;
}

export interface VideoFilterSettings {
  brightness?: number; // default 100 (%)
  contrast?: number; // default 100 (%)
  saturation?: number; // default 100 (%)
  blur?: number; // px, default 0
  grayscale?: number; // 0-100 (%)
  sepia?: number; // 0-100 (%)
}

export interface WatermarkSettings {
  type: 'text' | 'image';
  text?: string;
  imageUrl?: string;
  imageElement?: HTMLImageElement;
  position: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'center' | 'custom';
  customX?: number; // percentage (0-100)
  customY?: number; // percentage (0-100)
  opacity: number; // 0.1 - 1.0
  fontSize?: number; // px
  fontColor?: string; // hex
  bgColor?: string; // hex or 'transparent'
  scale?: number; // 0.1 - 2.0
}

export interface SubtitleCue {
  id: string;
  startTime: number; // seconds
  endTime: number; // seconds
  text: string;
}

export interface SubtitleSettings {
  cues: SubtitleCue[];
  fontSize?: number;
  textColor?: string;
  bgColor?: string;
  position?: 'bottom' | 'top';
}

export interface TextOverlaySettings {
  text: string;
  fontSize: number;
  color: string;
  position: 'top' | 'center' | 'bottom';
  yOffset?: number;
}

export interface VideoCropSettings {
  x: number; // pixel in original video
  y: number;
  width: number;
  height: number;
}

export interface RenderVideoOptions {
  file: File | Blob;
  startTime?: number; // seconds
  endTime?: number; // seconds
  targetWidth?: number;
  targetHeight?: number;
  fitMode?: 'contain' | 'cover' | 'fill' | 'stretch';
  backgroundColor?: string;
  crop?: VideoCropSettings;
  filters?: VideoFilterSettings;
  watermark?: WatermarkSettings;
  subtitles?: SubtitleSettings;
  textOverlay?: TextOverlaySettings;
  bitrate?: number; // bps e.g. 1500000
  fps?: number; // default 30
  volume?: number; // 0 to 1, or > 1
  outputMimeType?: string;
  onProgress?: (progress: { percent: number; currentTime: number; duration: number }) => void;
  signal?: AbortSignal;
}

export interface RenderedVideoResult {
  blob: Blob;
  url: string;
  duration: number;
  width: number;
  height: number;
  mimeType: string;
  extension: string;
  sizeBytes: number;
  formattedSize: string;
}

export interface ExtractedFrame {
  timestamp: number;
  formattedTime: string;
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  index: number;
}

/**
 * Format seconds to MM:SS or HH:MM:SS
 */
export function formatTime(seconds: number, includeMs: boolean = false): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);

  const pad = (n: number) => n.toString().padStart(2, '0');

  let result = '';
  if (hrs > 0) {
    result = `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  } else {
    result = `${pad(mins)}:${pad(secs)}`;
  }

  if (includeMs) {
    result += `.${pad(ms)}`;
  }
  return result;
}

/**
 * Parse time string HH:MM:SS or MM:SS to seconds
 */
export function parseTimeToSeconds(timeStr: string): number {
  const parts = timeStr.trim().split(':').map(Number);
  if (parts.some(isNaN)) return 0;
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    return parts[0];
  }
  return 0;
}

/**
 * Format bytes to readable string (e.g. 1.5 MB)
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Load HTMLVideoElement from File or URL with metadata loaded
 */
export function loadVideoElement(source: File | Blob | string): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.playsInline = true;
    video.muted = true; // muted to allow auto play / seeking in background
    video.crossOrigin = 'anonymous';

    let url: string;
    let createdUrl = false;
    if (typeof source === 'string') {
      url = source;
    } else {
      url = URL.createObjectURL(source);
      createdUrl = true;
    }

    const cleanup = () => {
      video.onloadedmetadata = null;
      video.onerror = null;
    };

    video.onloadedmetadata = () => {
      cleanup();
      // If duration is Infinity (common in some webm blobs), wait for durationchange or seek to end
      if (video.duration === Infinity) {
        video.currentTime = 1e101;
        video.ontimeupdate = () => {
          video.ontimeupdate = null;
          video.currentTime = 0;
          resolve(video);
        };
      } else {
        resolve(video);
      }
    };

    video.onerror = (e) => {
      cleanup();
      if (createdUrl) URL.revokeObjectURL(url);
      reject(new Error('Failed to load video: ' + (video.error?.message || 'Unsupported format')));
    };

    video.src = url;
  });
}

/**
 * Extract metadata from a video file
 */
export async function getVideoMetadata(source: File | Blob | string, fileName?: string): Promise<VideoMetadata> {
  const video = await loadVideoElement(source);
  const duration = video.duration || 0;
  const width = video.videoWidth || 1280;
  const height = video.videoHeight || 720;
  const aspectRatio = width / (height || 1);

  let fileSize = 0;
  let name = fileName || 'video';
  let mimeType = 'video/mp4';

  if (typeof source !== 'string') {
    fileSize = source.size;
    mimeType = source.type || 'video/mp4';
    if ('name' in source) {
      name = (source as File).name;
    }
  }

  return {
    duration,
    width,
    height,
    aspectRatio,
    formattedDuration: formatTime(duration),
    fileSize,
    formattedSize: formatBytes(fileSize),
    mimeType,
    name,
  };
}

/**
 * Seek video to a specific timestamp and wait for seeked event
 */
export function seekVideo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve) => {
    if (Math.abs(video.currentTime - time) < 0.03) {
      resolve();
      return;
    }

    const onSeeked = () => {
      video.removeEventListener('seeked', onSeeked);
      resolve();
    };

    video.addEventListener('seeked', onSeeked);
    video.currentTime = Math.max(0, Math.min(time, video.duration || time));
  });
}

/**
 * Capture frame from video element to canvas
 */
export function captureFrameToCanvas(
  video: HTMLVideoElement,
  targetWidth?: number,
  targetHeight?: number,
  crop?: VideoCropSettings
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const w = targetWidth || (crop ? crop.width : video.videoWidth) || 1280;
  const h = targetHeight || (crop ? crop.height : video.videoHeight) || 720;
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  if (crop) {
    ctx.drawImage(video, crop.x, crop.y, crop.width, crop.height, 0, 0, w, h);
  } else {
    ctx.drawImage(video, 0, 0, w, h);
  }

  return canvas;
}

/**
 * Extract multiple frames across duration or at specific timestamps
 */
export async function extractVideoFrames(
  file: File | Blob,
  options: {
    timestamps?: number[];
    intervalSec?: number;
    maxFrames?: number;
    format?: 'image/png' | 'image/jpeg';
    quality?: number;
    onProgress?: (percent: number, current: number, total: number) => void;
  }
): Promise<ExtractedFrame[]> {
  const video = await loadVideoElement(file);
  const duration = video.duration;
  const format = options.format || 'image/jpeg';
  const quality = options.quality ?? 0.92;

  let times: number[] = [];
  if (options.timestamps && options.timestamps.length > 0) {
    times = options.timestamps;
  } else {
    const interval = options.intervalSec || 1;
    const max = options.maxFrames || 60;
    const count = Math.min(Math.floor(duration / interval) + 1, max);
    for (let i = 0; i < count; i++) {
      const t = i * interval;
      if (t <= duration) times.push(t);
    }
  }

  const frames: ExtractedFrame[] = [];
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth || 1280;
  canvas.height = video.videoHeight || 720;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');

  for (let i = 0; i < times.length; i++) {
    const time = times[i];
    await seekVideo(video, time);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b || new Blob()), format, quality);
    });
    const dataUrl = canvas.toDataURL(format, quality);

    frames.push({
      timestamp: time,
      formattedTime: formatTime(time, true),
      blob,
      dataUrl,
      width: canvas.width,
      height: canvas.height,
      index: i + 1,
    });

    if (options.onProgress) {
      options.onProgress(Math.round(((i + 1) / times.length) * 100), i + 1, times.length);
    }
  }

  return frames;
}

/**
 * Detect supported video MIME types for MediaRecorder
 */
export function getSupportedVideoMimeTypes(): { mimeType: string; label: string; extension: string }[] {
  const candidates = [
    { mimeType: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', label: 'MP4 (H.264 / AAC)', extension: 'mp4' },
    { mimeType: 'video/mp4', label: 'MP4 Video (.mp4)', extension: 'mp4' },
    { mimeType: 'video/webm;codecs=vp9,opus', label: 'WebM (VP9 / Opus)', extension: 'webm' },
    { mimeType: 'video/webm;codecs=vp8,opus', label: 'WebM (VP8 / Opus)', extension: 'webm' },
    { mimeType: 'video/webm', label: 'WebM Video (.webm)', extension: 'webm' },
  ];

  if (typeof MediaRecorder === 'undefined') {
    return [{ mimeType: 'video/webm', label: 'WebM Video', extension: 'webm' }];
  }

  const supported = candidates.filter((c) => {
    try {
      return MediaRecorder.isTypeSupported(c.mimeType);
    } catch {
      return false;
    }
  });

  if (supported.length === 0) {
    return [{ mimeType: 'video/webm', label: 'WebM Default', extension: 'webm' }];
  }

  return supported;
}

/**
 * Pick best supported MIME type
 */
export function getBestSupportedMimeType(preferExtension?: 'mp4' | 'webm'): { mimeType: string; extension: string } {
  const supported = getSupportedVideoMimeTypes();
  if (preferExtension) {
    const match = supported.find((s) => s.extension === preferExtension);
    if (match) return { mimeType: match.mimeType, extension: match.extension };
  }
  return { mimeType: supported[0].mimeType, extension: supported[0].extension };
}

/**
 * Render video with effects, trimming, watermarks, resizing, audio mixing
 */
export async function renderProcessedVideo(options: RenderVideoOptions): Promise<RenderedVideoResult> {
  const video = await loadVideoElement(options.file);
  const originalDuration = video.duration || 1;
  const startTime = Math.max(0, options.startTime ?? 0);
  const endTime = Math.min(originalDuration, options.endTime ?? originalDuration);
  const processDuration = Math.max(0.1, endTime - startTime);

  const origW = video.videoWidth || 1280;
  const origH = video.videoHeight || 720;

  // Determine canvas output dimensions
  let outW = options.targetWidth || (options.crop ? options.crop.width : origW);
  let outH = options.targetHeight || (options.crop ? options.crop.height : origH);
  // Ensure dimensions are even numbers for video encoder compatibility
  outW = Math.round(outW / 2) * 2;
  outH = Math.round(outH / 2) * 2;

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');

  const fps = options.fps || 30;
  const canvasStream = canvas.captureStream(fps);

  // Setup Web Audio for real audio capture & volume control
  let audioContext: AudioContext | null = null;
  let audioSource: MediaElementAudioSourceNode | null = null;
  let gainNode: GainNode | null = null;
  let audioDestination: MediaStreamAudioDestinationNode | null = null;
  const combinedStream = new MediaStream([...canvasStream.getVideoTracks()]);

  const volume = options.volume ?? 1;
  if (volume > 0) {
    try {
      audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      audioSource = audioContext.createMediaElementSource(video);
      gainNode = audioContext.createGain();
      gainNode.gain.value = volume;
      audioDestination = audioContext.createMediaStreamDestination();

      audioSource.connect(gainNode);
      gainNode.connect(audioDestination);

      const audioTracks = audioDestination.stream.getAudioTracks();
      if (audioTracks.length > 0) {
        combinedStream.addTrack(audioTracks[0]);
      }
    } catch (e) {
      console.warn('Audio graph connection note (proceeding with video stream):', e);
    }
  }

  // Pre-load watermark image if provided
  let watermarkImg: HTMLImageElement | null = null;
  if (options.watermark && options.watermark.type === 'image' && options.watermark.imageUrl) {
    try {
      watermarkImg = new Image();
      watermarkImg.crossOrigin = 'anonymous';
      await new Promise((res, rej) => {
        if (!watermarkImg) return res(null);
        watermarkImg.onload = () => res(watermarkImg);
        watermarkImg.onerror = rej;
        watermarkImg.src = options.watermark?.imageUrl || '';
      });
    } catch {
      watermarkImg = null;
    }
  }

  // Select output MIME type
  const targetFormat = getBestSupportedMimeType(
    options.outputMimeType?.includes('mp4') ? 'mp4' : 'webm'
  );
  const mimeType = options.outputMimeType && MediaRecorder.isTypeSupported(options.outputMimeType)
    ? options.outputMimeType
    : targetFormat.mimeType;
  const extension = targetFormat.extension;

  const recorderOptions: MediaRecorderOptions = {
    mimeType,
  };
  if (options.bitrate) {
    recorderOptions.videoBitsPerSecond = options.bitrate;
  }

  const mediaRecorder = new MediaRecorder(combinedStream, recorderOptions);
  const recordedChunks: Blob[] = [];

  mediaRecorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      recordedChunks.push(e.data);
    }
  };

  // Build filter string for canvas
  const buildFilterString = (f?: VideoFilterSettings): string => {
    if (!f) return 'none';
    const parts: string[] = [];
    if (f.brightness !== undefined) parts.push(`brightness(${f.brightness}%)`);
    if (f.contrast !== undefined) parts.push(`contrast(${f.contrast}%)`);
    if (f.saturation !== undefined) parts.push(`saturate(${f.saturation}%)`);
    if (f.blur !== undefined && f.blur > 0) parts.push(`blur(${f.blur}px)`);
    if (f.grayscale !== undefined && f.grayscale > 0) parts.push(`grayscale(${f.grayscale}%)`);
    if (f.sepia !== undefined && f.sepia > 0) parts.push(`sepia(${f.sepia}%)`);
    return parts.length > 0 ? parts.join(' ') : 'none';
  };

  // Render a single frame
  const drawFrame = (currentTime: number) => {
    ctx.save();

    // 1. Clear background
    ctx.fillStyle = options.backgroundColor || '#000000';
    ctx.fillRect(0, 0, outW, outH);

    // 2. Set visual filter
    ctx.filter = buildFilterString(options.filters);

    // 3. Draw video frame with fit mode or crop
    if (options.crop) {
      const c = options.crop;
      ctx.drawImage(video, c.x, c.y, c.width, c.height, 0, 0, outW, outH);
    } else {
      const fit = options.fitMode || 'contain';
      if (fit === 'fill' || fit === 'stretch') {
        ctx.drawImage(video, 0, 0, outW, outH);
      } else if (fit === 'cover') {
        const scale = Math.max(outW / origW, outH / origH);
        const nw = origW * scale;
        const nh = origH * scale;
        const nx = (outW - nw) / 2;
        const ny = (outH - nh) / 2;
        ctx.drawImage(video, nx, ny, nw, nh);
      } else {
        // contain / letterbox
        const scale = Math.min(outW / origW, outH / origH);
        const nw = origW * scale;
        const nh = origH * scale;
        const nx = (outW - nw) / 2;
        const ny = (outH - nh) / 2;
        ctx.drawImage(video, nx, ny, nw, nh);
      }
    }

    // Reset filter for overlays
    ctx.filter = 'none';

    // 4. Draw Watermark if present
    if (options.watermark) {
      const wm = options.watermark;
      ctx.save();
      ctx.globalAlpha = Math.max(0.1, Math.min(1.0, wm.opacity));

      if (wm.type === 'image' && watermarkImg) {
        const scale = wm.scale || 1.0;
        const w = (watermarkImg.width || 120) * scale;
        const h = (watermarkImg.height || 60) * scale;
        let x = 20;
        let y = 20;

        if (wm.position === 'topRight') {
          x = outW - w - 20;
        } else if (wm.position === 'bottomLeft') {
          y = outH - h - 20;
        } else if (wm.position === 'bottomRight') {
          x = outW - w - 20;
          y = outH - h - 20;
        } else if (wm.position === 'center') {
          x = (outW - w) / 2;
          y = (outH - h) / 2;
        } else if (wm.position === 'custom') {
          x = ((wm.customX || 50) / 100) * (outW - w);
          y = ((wm.customY || 50) / 100) * (outH - h);
        }

        ctx.drawImage(watermarkImg, x, y, w, h);
      } else if (wm.type === 'text' && wm.text) {
        const fontSize = wm.fontSize || Math.max(16, Math.floor(outW * 0.035));
        ctx.font = `bold ${fontSize}px sans-serif`;
        const textMetrics = ctx.measureText(wm.text);
        const textW = textMetrics.width;
        const textH = fontSize;

        let x = 24;
        let y = 24 + textH;

        if (wm.position === 'topRight') {
          x = outW - textW - 24;
        } else if (wm.position === 'bottomLeft') {
          y = outH - 24;
        } else if (wm.position === 'bottomRight') {
          x = outW - textW - 24;
          y = outH - 24;
        } else if (wm.position === 'center') {
          x = (outW - textW) / 2;
          y = (outH + textH) / 2;
        } else if (wm.position === 'custom') {
          x = ((wm.customX || 50) / 100) * (outW - textW);
          y = ((wm.customY || 50) / 100) * (outH - textH) + textH;
        }

        if (wm.bgColor && wm.bgColor !== 'transparent') {
          ctx.fillStyle = wm.bgColor;
          ctx.fillRect(x - 8, y - textH - 4, textW + 16, textH + 12);
        }

        ctx.fillStyle = wm.fontColor || '#FFFFFF';
        ctx.shadowColor = 'rgba(0,0,0,0.7)';
        ctx.shadowBlur = 4;
        ctx.fillText(wm.text, x, y);
      }
      ctx.restore();
    }

    // 5. Draw Subtitles if present
    if (options.subtitles && options.subtitles.cues.length > 0) {
      const activeCue = options.subtitles.cues.find(
        (c) => currentTime >= c.startTime && currentTime <= c.endTime
      );
      if (activeCue && activeCue.text.trim()) {
        ctx.save();
        const fontSize = options.subtitles.fontSize || Math.max(18, Math.floor(outW * 0.032));
        ctx.font = `600 ${fontSize}px sans-serif`;
        ctx.textAlign = 'center';

        const lines = activeCue.text.split('\n');
        const lineHeight = fontSize * 1.3;
        const totalHeight = lines.length * lineHeight;
        const isTop = options.subtitles.position === 'top';
        const startY = isTop ? 40 + fontSize : outH - 40 - totalHeight + fontSize;

        lines.forEach((line, idx) => {
          const ly = startY + idx * lineHeight;
          const metrics = ctx.measureText(line);
          const lw = metrics.width;

          // Background pill
          ctx.fillStyle = options.subtitles?.bgColor || 'rgba(0, 0, 0, 0.75)';
          const padX = 14;
          const padY = 6;
          ctx.beginPath();
          ctx.roundRect(
            outW / 2 - lw / 2 - padX,
            ly - fontSize + padY / 2,
            lw + padX * 2,
            fontSize + padY,
            6
          );
          ctx.fill();

          // Subtitle text
          ctx.fillStyle = options.subtitles?.textColor || '#FFFFFF';
          ctx.fillText(line, outW / 2, ly);
        });

        ctx.restore();
      }
    }

    // 6. Draw Text Overlay / Title Card if present
    if (options.textOverlay && options.textOverlay.text.trim()) {
      ctx.save();
      const overlay = options.textOverlay;
      ctx.font = `bold ${overlay.fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = overlay.color;
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 6;

      let yPos = outH / 2;
      if (overlay.position === 'top') yPos = overlay.fontSize * 1.8;
      if (overlay.position === 'bottom') yPos = outH - overlay.fontSize * 1.2;
      if (overlay.yOffset) yPos += overlay.yOffset;

      ctx.fillText(overlay.text, outW / 2, yPos);
      ctx.restore();
    }

    ctx.restore();
  };

  // Perform render execution
  return new Promise<RenderedVideoResult>(async (resolve, reject) => {
    let animationFrameId: number | null = null;
    let isFinished = false;

    const cleanup = () => {
      isFinished = true;
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
      video.pause();
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close().catch(() => {});
      }
    };

    if (options.signal) {
      options.signal.addEventListener('abort', () => {
        cleanup();
        if (mediaRecorder.state !== 'inactive') mediaRecorder.stop();
        reject(new Error('Rendering cancelled by user'));
      });
    }

    mediaRecorder.onstop = () => {
      cleanup();
      const finalBlob = new Blob(recordedChunks, { type: mimeType });
      const url = URL.createObjectURL(finalBlob);
      resolve({
        blob: finalBlob,
        url,
        duration: processDuration,
        width: outW,
        height: outH,
        mimeType,
        extension,
        sizeBytes: finalBlob.size,
        formattedSize: formatBytes(finalBlob.size),
      });
    };

    mediaRecorder.onerror = (e) => {
      cleanup();
      reject(new Error('MediaRecorder error: ' + String(e)));
    };

    try {
      // Seek to start position
      await seekVideo(video, startTime);
      drawFrame(startTime);

      mediaRecorder.start(100);

      video.muted = volume === 0 || !audioContext;
      await video.play();

      const loop = () => {
        if (isFinished) return;

        const curTime = video.currentTime;
        drawFrame(curTime);

        const currentElapsed = Math.max(0, curTime - startTime);
        const progressPct = Math.min(100, Math.round((currentElapsed / processDuration) * 100));

        if (options.onProgress) {
          options.onProgress({
            percent: progressPct,
            currentTime: curTime,
            duration: processDuration,
          });
        }

        if (curTime >= endTime || video.ended) {
          isFinished = true;
          video.pause();
          setTimeout(() => {
            if (mediaRecorder.state !== 'inactive') {
              mediaRecorder.stop();
            }
          }, 200);
          return;
        }

        animationFrameId = requestAnimationFrame(loop);
      };

      animationFrameId = requestAnimationFrame(loop);
    } catch (err) {
      cleanup();
      reject(err);
    }
  });
}

/**
 * Merge multiple videos into a single sequential video
 */
export async function renderMergedVideos(options: {
  files: File[];
  targetWidth?: number;
  targetHeight?: number;
  fps?: number;
  bitrate?: number;
  onProgress?: (progress: {
    percent: number;
    currentClipIndex: number;
    totalClips: number;
    clipName: string;
  }) => void;
  signal?: AbortSignal;
}): Promise<RenderedVideoResult> {
  if (options.files.length === 0) {
    throw new Error('Please select at least one video to merge.');
  }

  // Preload all videos to get total duration and determine master resolution
  const loadedVideos: HTMLVideoElement[] = [];
  let totalDuration = 0;
  let masterWidth = options.targetWidth || 1280;
  let masterHeight = options.targetHeight || 720;

  for (let i = 0; i < options.files.length; i++) {
    const file = options.files[i];
    const vid = await loadVideoElement(file);
    loadedVideos.push(vid);
    totalDuration += vid.duration || 1;
    if (i === 0 && !options.targetWidth) {
      masterWidth = vid.videoWidth || 1280;
      masterHeight = vid.videoHeight || 720;
    }
  }

  masterWidth = Math.round(masterWidth / 2) * 2;
  masterHeight = Math.round(masterHeight / 2) * 2;

  const canvas = document.createElement('canvas');
  canvas.width = masterWidth;
  canvas.height = masterHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Cannot get canvas context');

  const fps = options.fps || 30;
  const canvasStream = canvas.captureStream(fps);
  const targetFormat = getBestSupportedMimeType();
  const mediaRecorder = new MediaRecorder(canvasStream, {
    mimeType: targetFormat.mimeType,
    videoBitsPerSecond: options.bitrate || 2500000,
  });

  const chunks: Blob[] = [];
  mediaRecorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  return new Promise<RenderedVideoResult>(async (resolve, reject) => {
    let animId: number | null = null;
    let aborted = false;

    if (options.signal) {
      options.signal.addEventListener('abort', () => {
        aborted = true;
        if (animId) cancelAnimationFrame(animId);
        if (mediaRecorder.state !== 'inactive') mediaRecorder.stop();
        reject(new Error('Merge aborted by user'));
      });
    }

    mediaRecorder.onstop = () => {
      const finalBlob = new Blob(chunks, { type: targetFormat.mimeType });
      const url = URL.createObjectURL(finalBlob);
      resolve({
        blob: finalBlob,
        url,
        duration: totalDuration,
        width: masterWidth,
        height: masterHeight,
        mimeType: targetFormat.mimeType,
        extension: targetFormat.extension,
        sizeBytes: finalBlob.size,
        formattedSize: formatBytes(finalBlob.size),
      });
    };

    mediaRecorder.onerror = (e) => reject(new Error('MediaRecorder error: ' + String(e)));

    mediaRecorder.start(100);

    let cumulativeTime = 0;

    for (let i = 0; i < loadedVideos.length; i++) {
      if (aborted) break;
      const currentVideo = loadedVideos[i];
      const clipFile = options.files[i];
      const clipDuration = currentVideo.duration || 1;

      await seekVideo(currentVideo, 0);
      currentVideo.muted = true;
      await currentVideo.play();

      await new Promise<void>((clipDone) => {
        const renderLoop = () => {
          if (aborted) return clipDone();

          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, masterWidth, masterHeight);

          // Center contain video frame
          const scale = Math.min(masterWidth / (currentVideo.videoWidth || 1), masterHeight / (currentVideo.videoHeight || 1));
          const w = (currentVideo.videoWidth || 1) * scale;
          const h = (currentVideo.videoHeight || 1) * scale;
          const x = (masterWidth - w) / 2;
          const y = (masterHeight - h) / 2;

          ctx.drawImage(currentVideo, x, y, w, h);

          const curClipTime = currentVideo.currentTime;
          const totalElapsed = cumulativeTime + curClipTime;
          const pct = Math.min(100, Math.round((totalElapsed / totalDuration) * 100));

          if (options.onProgress) {
            options.onProgress({
              percent: pct,
              currentClipIndex: i + 1,
              totalClips: loadedVideos.length,
              clipName: clipFile.name,
            });
          }

          if (curClipTime >= clipDuration - 0.05 || currentVideo.ended) {
            currentVideo.pause();
            cumulativeTime += clipDuration;
            clipDone();
            return;
          }

          animId = requestAnimationFrame(renderLoop);
        };

        animId = requestAnimationFrame(renderLoop);
      });
    }

    setTimeout(() => {
      if (mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
    }, 200);
  });
}

/**
 * Convert video to animated GIF using gifenc
 */
export async function encodeVideoToGif(
  file: File | Blob,
  options: {
    startTime?: number;
    endTime?: number;
    fps?: number; // default 12
    width?: number; // default 480
    loop?: boolean; // default true
    onProgress?: (percent: number, currentFrame: number, totalFrames: number) => void;
  }
): Promise<Blob> {
  const video = await loadVideoElement(file);
  const duration = video.duration || 1;
  const startTime = Math.max(0, options.startTime ?? 0);
  const endTime = Math.min(duration, options.endTime ?? duration);
  const rangeDuration = Math.max(0.1, endTime - startTime);

  const fps = Math.min(24, Math.max(5, options.fps || 12));
  const frameCount = Math.floor(rangeDuration * fps);
  const frameDelay = Math.round(1000 / fps);

  const origW = video.videoWidth || 640;
  const origH = video.videoHeight || 360;
  const targetW = options.width || 480;
  const targetH = Math.round((origH / origW) * targetW);

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not get 2D context for GIF rendering');

  const gif = GIFEncoder();

  for (let i = 0; i < frameCount; i++) {
    const timestamp = startTime + (i / fps);
    await seekVideo(video, timestamp);

    ctx.drawImage(video, 0, 0, targetW, targetH);
    const imageData = ctx.getImageData(0, 0, targetW, targetH);
    const { data } = imageData;

    // Fast color quantization and palette generation
    const palette = quantize(data, 256);
    const index = applyPalette(data, palette);

    gif.writeFrame(index, targetW, targetH, {
      palette,
      delay: frameDelay,
      repeat: options.loop !== false ? 0 : -1,
    });

    if (options.onProgress) {
      const pct = Math.round(((i + 1) / frameCount) * 100);
      options.onProgress(pct, i + 1, frameCount);
    }
  }

  gif.finish();
  const bytes = gif.bytes();
  return new Blob([bytes as unknown as BlobPart], { type: 'image/gif' });
}

/**
 * Extract audio from video file and encode to MP3 or WAV
 */
export async function extractAudioFromVideo(
  file: File | Blob,
  options: {
    format?: 'mp3' | 'wav';
    bitrate?: 320 | 192 | 128 | 96; // kbps for MP3
    startTime?: number;
    endTime?: number;
    volume?: number;
    onProgress?: (percent: number) => void;
  }
): Promise<{ blob: Blob; duration: number; format: 'mp3' | 'wav'; url: string }> {
  const format = options.format || 'mp3';
  const bitrate = options.bitrate || 192;
  const volume = options.volume ?? 1.0;

  if (options.onProgress) options.onProgress(15);

  const arrayBuffer = await file.arrayBuffer();
  if (options.onProgress) options.onProgress(35);

  const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  if (options.onProgress) options.onProgress(60);

  const sampleRate = audioBuffer.sampleRate;
  const numChannels = audioBuffer.numberOfChannels;
  const totalDuration = audioBuffer.duration;

  const startSec = Math.max(0, options.startTime ?? 0);
  const endSec = Math.min(totalDuration, options.endTime ?? totalDuration);
  const outDuration = Math.max(0.1, endSec - startSec);

  const startSample = Math.floor(startSec * sampleRate);
  const endSample = Math.floor(endSec * sampleRate);
  const numSamples = endSample - startSample;

  const leftChannel = audioBuffer.getChannelData(0).subarray(startSample, endSample);
  const rightChannel = numChannels > 1 ? audioBuffer.getChannelData(1).subarray(startSample, endSample) : leftChannel;

  let outputBlob: Blob;

  if (format === 'mp3') {
    // Pure JS MP3 encoding using @breezystack/lamejs
    const Mp3Encoder = lamejs.Mp3Encoder || (lamejs as unknown as { default?: { Mp3Encoder: typeof lamejs.Mp3Encoder } }).default?.Mp3Encoder;
    if (!Mp3Encoder) {
      throw new Error('MP3 Encoder library not available.');
    }

    const encoder = new Mp3Encoder(numChannels > 1 ? 2 : 1, sampleRate, bitrate);
    const mp3Data: Uint8Array[] = [];

    // Convert Float32 (-1.0 to 1.0) to Int16 (-32768 to 32767)
    const leftInt16 = new Int16Array(numSamples);
    const rightInt16 = numChannels > 1 ? new Int16Array(numSamples) : leftInt16;

    for (let i = 0; i < numSamples; i++) {
      const leftVal = Math.max(-1, Math.min(1, leftChannel[i] * volume));
      leftInt16[i] = leftVal < 0 ? leftVal * 32768 : leftVal * 32767;

      if (numChannels > 1) {
        const rightVal = Math.max(-1, Math.min(1, rightChannel[i] * volume));
        rightInt16[i] = rightVal < 0 ? rightVal * 32768 : rightVal * 32767;
      }
    }

    // Chunk size 1152 samples
    const sampleBlockSize = 1152;
    for (let i = 0; i < numSamples; i += sampleBlockSize) {
      const leftChunk = leftInt16.subarray(i, i + sampleBlockSize);
      let mp3buf: Int8Array | Uint8Array;
      if (numChannels > 1) {
        const rightChunk = rightInt16.subarray(i, i + sampleBlockSize);
        mp3buf = encoder.encodeBuffer(leftChunk, rightChunk);
      } else {
        mp3buf = encoder.encodeBuffer(leftChunk);
      }
      if (mp3buf.length > 0) {
        mp3Data.push(new Uint8Array(mp3buf));
      }
    }

    const endBuf = encoder.flush();
    if (endBuf.length > 0) {
      mp3Data.push(new Uint8Array(endBuf));
    }

    outputBlob = new Blob(mp3Data as unknown as BlobPart[], { type: 'audio/mpeg' });
  } else {
    // Standard 16-bit PCM WAV File Header & Buffer
    const wavBuffer = new ArrayBuffer(44 + numSamples * numChannels * 2);
    const view = new DataView(wavBuffer);

    // RIFF identifier
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + numSamples * numChannels * 2, true);
    writeString(view, 8, 'WAVE');
    // fmt sub-chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // SubChunk1Size (16 for PCM)
    view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true); // ByteRate
    view.setUint16(32, numChannels * 2, true); // BlockAlign
    view.setUint16(34, 16, true); // BitsPerSample
    // data sub-chunk
    writeString(view, 36, 'data');
    view.setUint32(40, numSamples * numChannels * 2, true);

    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
      const leftVal = Math.max(-1, Math.min(1, leftChannel[i] * volume));
      view.setInt16(offset, leftVal < 0 ? leftVal * 32768 : leftVal * 32767, true);
      offset += 2;
      if (numChannels > 1) {
        const rightVal = Math.max(-1, Math.min(1, rightChannel[i] * volume));
        view.setInt16(offset, rightVal < 0 ? rightVal * 32768 : rightVal * 32767, true);
        offset += 2;
      }
    }

    outputBlob = new Blob([wavBuffer], { type: 'audio/wav' });
  }

  if (options.onProgress) options.onProgress(100);
  await audioContext.close();

  const url = URL.createObjectURL(outputBlob);
  return {
    blob: outputBlob,
    duration: outDuration,
    format,
    url,
  };
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Subtitle parser (.srt / .vtt)
 */
export function parseSubtitleText(text: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  // Normalize line breaks
  const cleaned = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = cleaned.split(/\n\n+/);

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i].trim();
    if (!block) continue;
    if (block.startsWith('WEBVTT')) continue;

    const lines = block.split('\n');
    let timeLine = '';
    let textStartIndex = 0;

    if (lines[0].includes('-->')) {
      timeLine = lines[0];
      textStartIndex = 1;
    } else if (lines.length > 1 && lines[1].includes('-->')) {
      timeLine = lines[1];
      textStartIndex = 2;
    }

    if (!timeLine) continue;

    const [startStr, endStr] = timeLine.split('-->').map((s) => s.trim());
    const startTime = parseSubTimeToSeconds(startStr);
    const endTime = parseSubTimeToSeconds(endStr);
    const cueText = lines.slice(textStartIndex).join('\n').trim();

    if (cueText) {
      cues.push({
        id: `cue-${i + 1}`,
        startTime,
        endTime,
        text: cueText,
      });
    }
  }

  return cues;
}

function parseSubTimeToSeconds(timeStr: string): number {
  // HH:MM:SS,mmm or HH:MM:SS.mmm or MM:SS.mmm
  const parts = timeStr.replace(',', '.').split(':');
  if (parts.length === 3) {
    return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
  } else if (parts.length === 2) {
    return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
  }
  return parseFloat(timeStr) || 0;
}

/**
 * Generate standard SRT file string from cues
 */
export function generateSrtContent(cues: SubtitleCue[]): string {
  const formatSrtTime = (sec: number): string => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 1000);
    const pad = (n: number, z = 2) => n.toString().padStart(z, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)},${pad(ms, 3)}`;
  };

  return cues
    .map((c, i) => `${i + 1}\n${formatSrtTime(c.startTime)} --> ${formatSrtTime(c.endTime)}\n${c.text}\n`)
    .join('\n');
}

/**
 * Generate standard WebVTT file string from cues
 */
export function generateVttContent(cues: SubtitleCue[]): string {
  const formatVttTime = (sec: number): string => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 1000);
    const pad = (n: number, z = 2) => n.toString().padStart(z, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}.${pad(ms, 3)}`;
  };

  return (
    'WEBVTT\n\n' +
    cues
      .map((c, i) => `${i + 1}\n${formatVttTime(c.startTime)} --> ${formatVttTime(c.endTime)}\n${c.text}\n`)
      .join('\n')
  );
}

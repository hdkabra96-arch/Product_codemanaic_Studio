import React, { useState, useRef } from 'react';
import {
  Upload,
  Play,
  Pause,
  Minimize2,
  Scaling,
  Download,
  Check,
  AlertCircle,
  RefreshCw,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  getVideoMetadata,
  renderProcessedVideo,
  formatTime,
  formatBytes,
  VideoMetadata,
  RenderedVideoResult,
} from '../../services/video/videoProcessingService';

export const VideoCompressResizeTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);

  // Resolution & Aspect Ratio preset
  const [targetPreset, setTargetPreset] = useState<'720p' | '1080p' | '480p' | 'shorts' | 'square'>('720p');
  const [compressionLevel, setCompressionLevel] = useState<'balanced' | 'high' | 'max'>('balanced');

  // Processing state
  const [processing, setProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [result, setResult] = useState<RenderedVideoResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      try {
        setError(null);
        setResult(null);
        const meta = await getVideoMetadata(selected);
        setFile(selected);
        setMetadata(meta);
        setVideoSrc(URL.createObjectURL(selected));
      } catch {
        setError('Could not open video. Please upload a valid MP4, WebM, MOV, or AVI video.');
      }
    }
  };

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  // Preset dimension calculator
  const getOutputDimensions = (): { width: number; height: number; fitMode: 'contain' | 'cover' | 'fill' } => {
    if (!metadata) return { width: 1280, height: 720, fitMode: 'contain' };
    const origW = metadata.width;
    const origH = metadata.height;
    const isPortrait = origH > origW;

    if (targetPreset === 'shorts') {
      return { width: 720, height: 1280, fitMode: isPortrait ? 'contain' : 'cover' };
    }
    if (targetPreset === 'square') {
      return { width: 720, height: 720, fitMode: 'cover' };
    }
    if (targetPreset === '480p') {
      const scale = 480 / Math.min(origW, origH);
      return { width: Math.round((origW * scale) / 2) * 2, height: Math.round((origH * scale) / 2) * 2, fitMode: 'contain' };
    }
    if (targetPreset === '1080p') {
      const scale = 1080 / Math.max(origW, origH);
      return { width: Math.round((origW * scale) / 2) * 2, height: Math.round((origH * scale) / 2) * 2, fitMode: 'contain' };
    }
    // 720p default
    const scale = 720 / Math.min(origW, origH);
    return { width: Math.round((origW * scale) / 2) * 2, height: Math.round((origH * scale) / 2) * 2, fitMode: 'contain' };
  };

  const getBitrate = (): number => {
    if (compressionLevel === 'max') return 800_000; // 800kbps (tiny)
    if (compressionLevel === 'high') return 2_400_000; // 2.4Mbps (crisp)
    return 1_400_000; // 1.4Mbps (balanced)
  };

  const handleProcess = async () => {
    if (!file || !metadata) return;

    setProcessing(true);
    setProgress(0);
    setError(null);
    setResult(null);

    const dims = getOutputDimensions();

    try {
      const res = await renderProcessedVideo({
        file,
        targetWidth: dims.width,
        targetHeight: dims.height,
        fitMode: dims.fitMode,
        bitrate: getBitrate(),
        onProgress: (p) => setProgress(p.percent),
      });

      setResult(res);
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Compress and resize failed. Please try again.';
      setError(errMsg);
    } finally {
      setProcessing(false);
    }
  };

  const dims = getOutputDimensions();

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-semibold">
          <Minimize2 className="w-3.5 h-3.5" />
          <span>Compress & Resize Video</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#102A43]">
          Reduce File Size & Resolution in One Step
        </h2>
        <p className="text-sm sm:text-base text-[#61758A] max-w-xl mx-auto">
          Scale video dimensions for social feeds and reduce MB weight simultaneously with optimized client-side encoding.
        </p>
      </div>

      {!file ? (
        /* Upload Area */
        <div className="bg-white rounded-3xl p-8 sm:p-14 border-2 border-dashed border-[#E9DCC8] hover:border-red-400 transition-all text-center">
          <input
            type="file"
            id="video-cr-upload"
            accept="video/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <label
            htmlFor="video-cr-upload"
            className="cursor-pointer flex flex-col items-center justify-center space-y-4"
          >
            <div className="w-20 h-20 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center shadow-inner hover:scale-105 transition-transform">
              <Scaling className="w-10 h-10" />
            </div>
            <div>
              <p className="text-lg font-bold text-[#102A43]">Click to select video</p>
              <p className="text-xs sm:text-sm text-[#61758A] mt-1">
                Supports MP4, WebM, MOV, and AVI up to 1GB
              </p>
            </div>
            <span className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm shadow-md transition-all">
              Choose Video to Compress & Resize
            </span>
          </label>
        </div>
      ) : (
        /* Studio Area */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Preview */}
          <div className="lg:col-span-2 bg-[#102A43] rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-xl min-h-[420px]">
            <div className="relative w-full max-h-[480px] flex items-center justify-center overflow-hidden rounded-xl">
              <video
                ref={videoRef}
                src={videoSrc}
                onTimeUpdate={() => videoRef.current && setCurrentTime(videoRef.current.currentTime)}
                onEnded={() => setIsPlaying(false)}
                className="max-h-[380px] max-w-full rounded-lg"
              />
            </div>

            {/* Play/Pause controls */}
            <div className="w-full flex items-center justify-between mt-4 px-2 text-white/80 text-xs">
              <button
                onClick={handlePlayPause}
                className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer flex items-center gap-1.5 font-semibold text-sm"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-white/10 text-white font-mono text-[11px]">
                  Target: {dims.width} × {dims.height}
                </span>
                <span>{formatTime(currentTime)} / {metadata?.formattedDuration}</span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-3xl p-6 border border-[#E9DCC8] shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-[#102A43]">Target Resolution & Format</h3>
                <p className="text-xs text-[#61758A] mt-0.5">Scale to fit platform standards</p>

                <div className="grid grid-cols-2 gap-2 mt-3">
                  <button
                    onClick={() => setTargetPreset('720p')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      targetPreset === '720p'
                        ? 'bg-red-500 text-white border-red-500 shadow-md'
                        : 'bg-[#FAF5EC] border-[#E9DCC8] hover:border-red-400 text-[#102A43]'
                    }`}
                  >
                    <div className="text-xs font-bold">720p HD</div>
                    <div className={`text-[10px] ${targetPreset === '720p' ? 'text-white/80' : 'text-[#61758A]'}`}>
                      Standard Web & Mobile
                    </div>
                  </button>

                  <button
                    onClick={() => setTargetPreset('shorts')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      targetPreset === 'shorts'
                        ? 'bg-red-500 text-white border-red-500 shadow-md'
                        : 'bg-[#FAF5EC] border-[#E9DCC8] hover:border-red-400 text-[#102A43]'
                    }`}
                  >
                    <div className="text-xs font-bold">9:16 Vertical</div>
                    <div className={`text-[10px] ${targetPreset === 'shorts' ? 'text-white/80' : 'text-[#61758A]'}`}>
                      Reels, TikTok, Shorts
                    </div>
                  </button>

                  <button
                    onClick={() => setTargetPreset('square')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      targetPreset === 'square'
                        ? 'bg-red-500 text-white border-red-500 shadow-md'
                        : 'bg-[#FAF5EC] border-[#E9DCC8] hover:border-red-400 text-[#102A43]'
                    }`}
                  >
                    <div className="text-xs font-bold">1:1 Square</div>
                    <div className={`text-[10px] ${targetPreset === 'square' ? 'text-white/80' : 'text-[#61758A]'}`}>
                      Instagram Feed Posts
                    </div>
                  </button>

                  <button
                    onClick={() => setTargetPreset('480p')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      targetPreset === '480p'
                        ? 'bg-red-500 text-white border-red-500 shadow-md'
                        : 'bg-[#FAF5EC] border-[#E9DCC8] hover:border-red-400 text-[#102A43]'
                    }`}
                  >
                    <div className="text-xs font-bold">480p Compact</div>
                    <div className={`text-[10px] ${targetPreset === '480p' ? 'text-white/80' : 'text-[#61758A]'}`}>
                      Email & WhatsApp
                    </div>
                  </button>
                </div>
              </div>

              {/* Compression Level */}
              <div>
                <h3 className="text-base font-bold text-[#102A43]">Compression Strength</h3>
                <p className="text-xs text-[#61758A] mt-0.5">Control bitrate and visual fidelity</p>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {(['balanced', 'high', 'max'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setCompressionLevel(lvl)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold capitalize transition-all ${
                        compressionLevel === lvl
                          ? 'bg-red-500 text-white shadow'
                          : 'bg-[#FAF5EC] border border-[#E9DCC8] hover:border-red-400 text-[#102A43]'
                      }`}
                    >
                      {lvl === 'balanced' ? 'Balanced' : lvl === 'high' ? 'High Quality' : 'Maximum'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Comparison stats */}
              {metadata && (
                <div className="p-3.5 rounded-2xl bg-[#FAF5EC] border border-[#E9DCC8] text-xs space-y-1.5 text-[#102A43]">
                  <div className="flex justify-between">
                    <span className="text-[#61758A]">Original Dimensions:</span>
                    <span className="font-semibold">{metadata.width} × {metadata.height}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#61758A]">Target Resolution:</span>
                    <span className="font-bold text-red-600">{dims.width} × {dims.height} px</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#61758A]">Original Size:</span>
                    <span className="font-semibold">{metadata.formattedSize}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4 border-t border-[#E9DCC8]">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {processing ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-[#102A43]">
                    <span className="flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-red-500" />
                      Resizing & compressing...
                    </span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 transition-all duration-200"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleProcess}
                  className="w-full py-3.5 px-6 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm shadow-lg shadow-red-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Minimize2 className="w-4 h-4" />
                  <span>Compress & Resize Now</span>
                </button>
              )}

              {result && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Processing complete! ({result.formattedSize})</span>
                  </div>
                  <a
                    href={result.url}
                    download={`resized-${dims.width}x${dims.height}-${file.name.replace(/\.[^/.]+$/, '')}.${result.extension}`}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow transition-all block text-center"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Scaled Video</span>
                  </a>
                </div>
              )}

              <button
                onClick={() => {
                  setFile(null);
                  setMetadata(null);
                  setResult(null);
                }}
                className="w-full text-xs text-[#61758A] hover:text-[#102A43] font-semibold py-1"
              >
                Upload a different video
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

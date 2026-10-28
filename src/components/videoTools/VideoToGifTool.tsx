import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Play,
  Pause,
  ImagePlay,
  Download,
  RotateCcw,
  Check,
  AlertCircle,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  getVideoMetadata,
  encodeVideoToGif,
  formatTime,
  formatBytes,
  VideoMetadata,
} from '../../services/video/videoProcessingService';

export const VideoToGifTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);

  // GIF parameters
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(5);
  const [fps, setFps] = useState<number>(12);
  const [targetWidth, setTargetWidth] = useState<number>(420);
  const [infiniteLoop, setInfiniteLoop] = useState<boolean>(true);

  // Processing state
  const [processing, setProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [gifBlob, setGifBlob] = useState<Blob | null>(null);
  const [gifUrl, setGifUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      try {
        setError(null);
        setGifBlob(null);
        setGifUrl('');
        const meta = await getVideoMetadata(selected);
        setFile(selected);
        setMetadata(meta);
        setStartTime(0);
        setEndTime(Math.min(6, meta.duration));
        setVideoSrc(URL.createObjectURL(selected));
      } catch (err) {
        setError('Unsupported video format. Please upload MP4, WebM, MOV, or AVI.');
      }
    }
  };

  const handleGenerateGif = async () => {
    if (!file || !metadata) return;

    if (endTime <= startTime) {
      setError('End time must be greater than start time.');
      return;
    }

    try {
      setProcessing(true);
      setProgress(0);
      setError(null);
      setGifBlob(null);
      setGifUrl('');

      const blob = await encodeVideoToGif(file, {
        startTime,
        endTime,
        fps,
        width: targetWidth,
        loop: infiniteLoop,
        onProgress: (p) => setProgress(p),
      });

      const url = URL.createObjectURL(blob);
      setGifBlob(blob);
      setGifUrl(url);
      setProcessing(false);
      try {
        confetti({ particleCount: 50, spread: 60 });
      } catch {
        // ignore
      }
    } catch (err: unknown) {
      setProcessing(false);
      setError(err instanceof Error ? err.message : 'Error converting video to GIF.');
    }
  };

  const handleDownload = () => {
    if (!gifUrl || !file) return;
    const a = document.createElement('a');
    a.href = gifUrl;
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    a.download = `${baseName}_animation.gif`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  useEffect(() => {
    return () => {
      if (videoSrc) URL.revokeObjectURL(videoSrc);
      if (gifUrl) URL.revokeObjectURL(gifUrl);
    };
  }, [videoSrc, gifUrl]);

  return (
    <div className="space-y-6">
      {!file ? (
        <label className="border-2 border-dashed border-[#E9DCC8] hover:border-[#D98218] bg-[#FAF5EC]/60 hover:bg-[#FFF3DF]/40 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all">
          <input
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-[#E9DCC8] flex items-center justify-center text-[#D98218] mb-3">
            <ImagePlay className="w-7 h-7" />
          </div>
          <span className="text-base font-bold text-[#102A43]">
            Select video to convert to animated GIF
          </span>
          <span className="text-xs text-[#61758A] mt-1">
            Turn video clips into lightweight, loopable GIFs with custom framerate and dimensions
          </span>
          <span className="mt-4 px-4 py-1.5 rounded-full bg-white border border-[#E9DCC8] text-xs font-bold text-[#102A43] shadow-sm">
            Browse Videos
          </span>
        </label>
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="p-4 bg-white rounded-2xl border border-[#E9DCC8] shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-[#102A43]">{metadata?.name}</h4>
              <p className="text-xs text-[#61758A]">
                {metadata?.width}x{metadata?.height} · {metadata?.formattedDuration} · {metadata?.formattedSize}
              </p>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setMetadata(null);
                setGifBlob(null);
                if (videoSrc) URL.revokeObjectURL(videoSrc);
                setVideoSrc('');
              }}
              className="text-xs font-semibold text-[#61758A] hover:text-red-600 cursor-pointer"
            >
              Change Video
            </button>
          </div>

          {/* Video Preview */}
          <div className="relative bg-black rounded-2xl overflow-hidden border border-[#E9DCC8] aspect-video flex items-center justify-center max-h-[320px]">
            <video
              ref={videoRef}
              src={videoSrc}
              className="w-full h-full object-contain"
              onTimeUpdate={() => {
                if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
              }}
              onEnded={() => setIsPlaying(false)}
            />
          </div>

          {/* Time & Segment Selection */}
          <div className="p-4 bg-white rounded-2xl border border-[#E9DCC8] space-y-4">
            <h5 className="text-xs font-bold text-[#102A43] uppercase tracking-wide">
              GIF Clip Segment (Keep under 10 seconds for optimal GIF size)
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-[#FAF5EC] rounded-xl border border-[#E9DCC8] space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-[#102A43]">
                  <span>START TIME</span>
                  <button
                    onClick={() => setStartTime(currentTime)}
                    className="text-[11px] text-[#D98218] hover:underline cursor-pointer"
                  >
                    Set to current ({formatTime(currentTime)})
                  </button>
                </div>
                <input
                  type="number"
                  min={0}
                  max={endTime - 0.1}
                  step={0.1}
                  value={startTime}
                  onChange={(e) => setStartTime(Math.max(0, Number(e.target.value)))}
                  className="w-full p-2 bg-white rounded-lg border border-[#E9DCC8] text-sm font-mono text-[#102A43]"
                />
              </div>

              <div className="p-3 bg-[#FAF5EC] rounded-xl border border-[#E9DCC8] space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-[#102A43]">
                  <span>END TIME</span>
                  <button
                    onClick={() => setEndTime(currentTime)}
                    className="text-[11px] text-[#D98218] hover:underline cursor-pointer"
                  >
                    Set to current ({formatTime(currentTime)})
                  </button>
                </div>
                <input
                  type="number"
                  min={startTime + 0.1}
                  max={metadata?.duration || 100}
                  step={0.1}
                  value={endTime}
                  onChange={(e) => setEndTime(Math.min(metadata?.duration || 100, Number(e.target.value)))}
                  className="w-full p-2 bg-white rounded-lg border border-[#E9DCC8] text-sm font-mono text-[#102A43]"
                />
              </div>
            </div>

            {/* Quality & Framerate Options */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#E9DCC8]">
              <div>
                <label className="text-xs font-bold text-[#102A43] block mb-1">Dimensions</label>
                <select
                  value={targetWidth}
                  onChange={(e) => setTargetWidth(Number(e.target.value))}
                  className="w-full p-2 bg-[#FAF5EC] border border-[#E9DCC8] rounded-xl text-xs font-bold text-[#102A43]"
                >
                  <option value={540}>540px Width (Sharp)</option>
                  <option value={420}>420px Width (Balanced)</option>
                  <option value={320}>320px Width (Compact)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#102A43] block mb-1">Frame Rate (FPS)</label>
                <select
                  value={fps}
                  onChange={(e) => setFps(Number(e.target.value))}
                  className="w-full p-2 bg-[#FAF5EC] border border-[#E9DCC8] rounded-xl text-xs font-bold text-[#102A43]"
                >
                  <option value={10}>10 FPS (Smallest File)</option>
                  <option value={12}>12 FPS (Standard Web)</option>
                  <option value={16}>16 FPS (Smooth)</option>
                </select>
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={infiniteLoop}
                    onChange={(e) => setInfiniteLoop(e.target.checked)}
                    className="accent-[#D98218] w-4 h-4 rounded"
                  />
                  <span className="text-xs font-bold text-[#102A43]">Infinite Loop</span>
                </label>
              </div>
            </div>
          </div>

          {/* Action Box */}
          <div className="p-4 bg-[#FAF5EC] rounded-2xl border border-[#E9DCC8] space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {processing && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-[#102A43]">
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#D98218]" />
                    Quantizing color palettes & writing GIF frames...
                  </span>
                  <span className="font-mono text-[#D98218]">{progress}%</span>
                </div>
                <div className="w-full bg-[#E9DCC8] h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#D98218] h-full transition-all duration-150 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {gifUrl && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>GIF Generated Successfully! ({formatBytes(gifBlob?.size || 0)})</span>
                  </div>
                  <button
                    onClick={handleDownload}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download GIF</span>
                  </button>
                </div>

                {/* Animated GIF Preview */}
                <div className="flex justify-center bg-white p-3 rounded-xl border border-emerald-200">
                  <img
                    src={gifUrl}
                    alt="Generated Animated GIF"
                    className="max-h-[240px] rounded-lg object-contain shadow-xs"
                  />
                </div>
              </div>
            )}

            {!gifUrl && (
              <button
                onClick={handleGenerateGif}
                disabled={processing}
                className="w-full py-3 bg-[#D98218] hover:bg-[#C66A08] disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                {processing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Encoding GIF ({progress}%)...</span>
                  </>
                ) : (
                  <>
                    <ImagePlay className="w-4 h-4" />
                    <span>Convert to Animated GIF Now</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

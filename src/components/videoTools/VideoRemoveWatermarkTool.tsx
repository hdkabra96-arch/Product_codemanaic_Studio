import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Play,
  Pause,
  Layers,
  Eraser,
  Download,
  Check,
  AlertCircle,
  RefreshCw,
  EyeOff,
  Move,
  Trash2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  getVideoMetadata,
  renderProcessedVideo,
  formatTime,
  formatBytes,
  VideoMetadata,
  RenderedVideoResult,
  VideoBlurRegion,
} from '../../services/video/videoProcessingService';

export const VideoRemoveWatermarkTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);

  // Watermark removal box (percentages 0-100 for responsive alignment)
  const [box, setBox] = useState<{ x: number; y: number; w: number; h: number }>({
    x: 75,
    y: 80,
    w: 20,
    h: 12,
  });
  const [blurType, setBlurType] = useState<'blur' | 'pixelate' | 'blackout'>('blur');

  // Dragging interaction
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Processing state
  const [processing, setProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [result, setResult] = useState<RenderedVideoResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Preset box positions
  const setPresetPosition = (pos: 'topRight' | 'bottomRight' | 'topLeft' | 'bottomLeft' | 'topCenter') => {
    if (pos === 'topRight') setBox({ x: 74, y: 5, w: 22, h: 12 });
    if (pos === 'bottomRight') setBox({ x: 74, y: 82, w: 22, h: 12 });
    if (pos === 'topLeft') setBox({ x: 4, y: 5, w: 22, h: 12 });
    if (pos === 'bottomLeft') setBox({ x: 4, y: 82, w: 22, h: 12 });
    if (pos === 'topCenter') setBox({ x: 38, y: 4, w: 24, h: 10 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const deltaX = ((e.clientX - dragStart.x) / rect.width) * 100;
    const deltaY = ((e.clientY - dragStart.y) / rect.height) * 100;

    setBox((prev) => ({
      ...prev,
      x: Math.max(0, Math.min(100 - prev.w, prev.x + deltaX)),
      y: Math.max(0, Math.min(100 - prev.h, prev.y + deltaY)),
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleProcess = async () => {
    if (!file || !metadata) return;

    setProcessing(true);
    setProgress(0);
    setError(null);
    setResult(null);

    // Convert percentage box to pixel coordinates for video resolution
    const pixelRegion: VideoBlurRegion = {
      x: Math.round((box.x / 100) * metadata.width),
      y: Math.round((box.y / 100) * metadata.height),
      width: Math.round((box.w / 100) * metadata.width),
      height: Math.round((box.h / 100) * metadata.height),
      type: blurType,
    };

    try {
      const res = await renderProcessedVideo({
        file,
        blurRegions: [pixelRegion],
        onProgress: (p) => setProgress(p.percent),
      });

      setResult(res);
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Watermark removal failed. Please try again.';
      setError(errMsg);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-semibold">
          <Eraser className="w-3.5 h-3.5" />
          <span>Remove Watermark</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#102A43]">
          Blur or Crop Out Video Watermarks
        </h2>
        <p className="text-sm sm:text-base text-[#61758A] max-w-xl mx-auto">
          Drag and place the blur mask over TikTok logos, dates, timestamps, or unwanted overlay tags directly in your browser.
        </p>
      </div>

      {!file ? (
        /* Upload Area */
        <div className="bg-white rounded-3xl p-8 sm:p-14 border-2 border-dashed border-[#E9DCC8] hover:border-red-400 transition-all text-center">
          <input
            type="file"
            id="video-remove-wm-upload"
            accept="video/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <label
            htmlFor="video-remove-wm-upload"
            className="cursor-pointer flex flex-col items-center justify-center space-y-4"
          >
            <div className="w-20 h-20 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center shadow-inner hover:scale-105 transition-transform">
              <Eraser className="w-10 h-10" />
            </div>
            <div>
              <p className="text-lg font-bold text-[#102A43]">Click to select video</p>
              <p className="text-xs sm:text-sm text-[#61758A] mt-1">
                Supports MP4, WebM, MOV, and AVI up to 1GB
              </p>
            </div>
            <span className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm shadow-md transition-all">
              Choose Video File
            </span>
          </label>
        </div>
      ) : (
        /* Studio Area */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Interactive Video Box Selector */}
          <div className="lg:col-span-2 bg-[#102A43] rounded-3xl p-6 flex flex-col items-center justify-center relative shadow-xl min-h-[420px]">
            <div
              ref={containerRef}
              onMouseMove={handleMouseMove}
              className="relative max-h-[440px] max-w-full overflow-hidden rounded-xl border border-white/10 select-none"
            >
              <video
                ref={videoRef}
                src={videoSrc}
                onTimeUpdate={() => videoRef.current && setCurrentTime(videoRef.current.currentTime)}
                onEnded={() => setIsPlaying(false)}
                className="max-h-[400px] max-w-full block"
              />

              {/* Draggable Watermark Blur Box Overlay */}
              <div
                onMouseDown={handleMouseDown}
                style={{
                  left: `${box.x}%`,
                  top: `${box.y}%`,
                  width: `${box.w}%`,
                  height: `${box.h}%`,
                }}
                className={`absolute rounded cursor-move border-2 border-red-500 shadow-lg flex items-center justify-center transition-opacity ${
                  blurType === 'blackout'
                    ? 'bg-black'
                    : blurType === 'pixelate'
                    ? 'bg-red-500/30 backdrop-invert'
                    : 'bg-white/20 backdrop-blur-md'
                }`}
              >
                <div className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow flex items-center gap-1 select-none pointer-events-none">
                  <Move className="w-3 h-3" />
                  <span>Drag Box</span>
                </div>
              </div>
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
              <span className="text-white/70">
                Position box over the watermark you want to erase
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-3xl p-6 border border-[#E9DCC8] shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-[#102A43]">Watermark Removal Style</h3>
                <p className="text-xs text-[#61758A] mt-0.5">Choose how to conceal the watermark</p>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {(['blur', 'pixelate', 'blackout'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setBlurType(t)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold capitalize transition-all ${
                        blurType === t
                          ? 'bg-red-500 text-white shadow'
                          : 'bg-[#FAF5EC] border border-[#E9DCC8] hover:border-red-400 text-[#102A43]'
                      }`}
                    >
                      {t === 'blur' ? 'Gaussian' : t === 'pixelate' ? 'Mosaic' : 'Blackout'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Preset Positions */}
              <div>
                <h3 className="text-base font-bold text-[#102A43]">Quick Watermark Presets</h3>
                <p className="text-xs text-[#61758A] mt-0.5">Jump box to common corner spots</p>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <button
                    onClick={() => setPresetPosition('topRight')}
                    className="p-2.5 rounded-xl border border-[#E9DCC8] hover:border-red-400 text-xs font-semibold text-[#102A43] text-left"
                  >
                    Top-Right (TikTok)
                  </button>
                  <button
                    onClick={() => setPresetPosition('bottomRight')}
                    className="p-2.5 rounded-xl border border-[#E9DCC8] hover:border-red-400 text-xs font-semibold text-[#102A43] text-left"
                  >
                    Bottom-Right (Logo)
                  </button>
                  <button
                    onClick={() => setPresetPosition('topLeft')}
                    className="p-2.5 rounded-xl border border-[#E9DCC8] hover:border-red-400 text-xs font-semibold text-[#102A43] text-left"
                  >
                    Top-Left
                  </button>
                  <button
                    onClick={() => setPresetPosition('bottomLeft')}
                    className="p-2.5 rounded-xl border border-[#E9DCC8] hover:border-red-400 text-xs font-semibold text-[#102A43] text-left"
                  >
                    Bottom-Left
                  </button>
                </div>
              </div>

              {/* Box Size Adjustments */}
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-semibold text-[#102A43]">
                  <span>Box Width</span>
                  <span>{box.w}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={box.w}
                  onChange={(e) => setBox({ ...box, w: parseInt(e.target.value) })}
                  className="w-full accent-red-500"
                />

                <div className="flex justify-between text-xs font-semibold text-[#102A43]">
                  <span>Box Height</span>
                  <span>{box.h}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="40"
                  value={box.h}
                  onChange={(e) => setBox({ ...box, h: parseInt(e.target.value) })}
                  className="w-full accent-red-500"
                />
              </div>
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
                      Erasing watermark in frames...
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
                  <Eraser className="w-4 h-4" />
                  <span>Erase Watermark & Export</span>
                </button>
              )}

              {result && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Watermark erased! ({result.formattedSize})</span>
                  </div>
                  <a
                    href={result.url}
                    download={`watermark-removed-${file.name.replace(/\.[^/.]+$/, '')}.${result.extension}`}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow transition-all block text-center"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Clean Video</span>
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

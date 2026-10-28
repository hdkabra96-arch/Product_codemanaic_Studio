import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Type,
  Volume2,
  VolumeX,
  Download,
  Scissors,
  Check,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  getVideoMetadata,
  renderProcessedVideo,
  formatTime,
  formatBytes,
  VideoMetadata,
  VideoFilterSettings,
  TextOverlaySettings,
  RenderedVideoResult,
} from '../../services/video/videoProcessingService';

export const VideoEditorTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);

  // Edit parameters
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);
  const [filters, setFilters] = useState<VideoFilterSettings>({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0,
    grayscale: 0,
    sepia: 0,
  });
  const [textOverlay, setTextOverlay] = useState<TextOverlaySettings>({
    text: '',
    fontSize: 28,
    color: '#FFFFFF',
    position: 'bottom',
    yOffset: 0,
  });
  const [showTextOverlay, setShowTextOverlay] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [targetResolution, setTargetResolution] = useState<'1080p' | '720p' | '480p'>('720p');
  const [targetFps, setTargetFps] = useState<number>(30);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'adjust' | 'trim' | 'text' | 'audio'>('adjust');

  // Processing state
  const [processing, setProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [renderedResult, setRenderedResult] = useState<RenderedVideoResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      try {
        setError(null);
        setRenderedResult(null);
        const meta = await getVideoMetadata(selectedFile);
        setFile(selectedFile);
        setMetadata(meta);
        setStartTime(0);
        setEndTime(meta.duration);
        const url = URL.createObjectURL(selectedFile);
        setVideoSrc(url);
      } catch (err) {
        setError('Could not read video file. Please ensure it is a valid video format.');
      }
    }
  };

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      if (videoRef.current.currentTime >= endTime) {
        videoRef.current.currentTime = startTime;
      }
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    setCurrentTime(cur);
    if (cur >= endTime && isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (newTime: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const resetFilters = () => {
    setFilters({
      brightness: 100,
      contrast: 100,
      saturation: 100,
      blur: 0,
      grayscale: 0,
      sepia: 0,
    });
  };

  const handleExport = async () => {
    if (!file || !metadata) return;

    try {
      setProcessing(true);
      setProgress(0);
      setError(null);
      setRenderedResult(null);

      abortControllerRef.current = new AbortController();

      let targetW = 1280;
      let targetH = 720;
      if (targetResolution === '1080p') {
        targetW = 1920;
        targetH = 1080;
      } else if (targetResolution === '480p') {
        targetW = 854;
        targetH = 480;
      }

      // Preserve aspect ratio of original video if non-16:9
      if (metadata.aspectRatio) {
        if (metadata.aspectRatio >= 1) {
          targetH = Math.round(targetW / metadata.aspectRatio);
        } else {
          // Portrait
          targetW = Math.round(targetH * metadata.aspectRatio);
        }
      }

      const result = await renderProcessedVideo({
        file,
        startTime,
        endTime,
        targetWidth: targetW,
        targetHeight: targetH,
        filters,
        textOverlay: showTextOverlay && textOverlay.text.trim() ? textOverlay : undefined,
        volume: isMuted ? 0 : volume,
        fps: targetFps,
        bitrate: targetResolution === '1080p' ? 3500000 : targetResolution === '720p' ? 2000000 : 1000000,
        onProgress: (p) => setProgress(p.percent),
        signal: abortControllerRef.current.signal,
      });

      setRenderedResult(result);
      setProcessing(false);
      try {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      } catch {
        // ignore
      }
    } catch (err: unknown) {
      setProcessing(false);
      if (err instanceof Error && err.message.includes('cancelled')) {
        return;
      }
      setError(err instanceof Error ? err.message : 'Error rendering edited video.');
    }
  };

  const handleDownload = () => {
    if (!renderedResult || !file) return;
    const a = document.createElement('a');
    a.href = renderedResult.url;
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    a.download = `${baseName}_edited.${renderedResult.extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Build CSS filter string for live video preview
  const previewFilter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%) blur(${filters.blur}px) grayscale(${filters.grayscale}%) sepia(${filters.sepia}%)`;

  useEffect(() => {
    return () => {
      if (videoSrc) URL.revokeObjectURL(videoSrc);
    };
  }, [videoSrc]);

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
            <Upload className="w-7 h-7" />
          </div>
          <span className="text-base font-bold text-[#102A43]">
            Choose a video file or drag & drop here
          </span>
          <span className="text-xs text-[#61758A] mt-1">
            Supports MP4, WebM, MOV, AVI up to 500MB · Processed securely in browser
          </span>
          <span className="mt-4 px-4 py-1.5 rounded-full bg-white border border-[#E9DCC8] text-xs font-bold text-[#102A43] shadow-sm">
            Browse Videos
          </span>
        </label>
      ) : (
        <div className="space-y-6">
          {/* Header Bar */}
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
                setRenderedResult(null);
                if (videoSrc) URL.revokeObjectURL(videoSrc);
                setVideoSrc('');
              }}
              className="px-3 py-1.5 rounded-xl border border-[#E9DCC8] text-xs font-bold text-[#61758A] hover:text-red-600 hover:border-red-200 cursor-pointer"
            >
              Change Video
            </button>
          </div>

          {/* Video Preview & Canvas Composite View */}
          <div className="relative bg-black rounded-2xl overflow-hidden border border-[#E9DCC8] aspect-video flex items-center justify-center max-h-[380px]">
            <video
              ref={videoRef}
              src={videoSrc}
              style={{ filter: previewFilter }}
              className="w-full h-full object-contain"
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
              muted={isMuted}
            />

            {/* Live Text Overlay Preview */}
            {showTextOverlay && textOverlay.text.trim() && (
              <div
                className={`absolute left-0 right-0 px-6 text-center pointer-events-none ${
                  textOverlay.position === 'top'
                    ? 'top-6'
                    : textOverlay.position === 'center'
                    ? 'top-1/2 -translate-y-1/2'
                    : 'bottom-6'
                }`}
              >
                <span
                  style={{
                    fontSize: `${Math.max(14, textOverlay.fontSize * 0.7)}px`,
                    color: textOverlay.color,
                    textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                  }}
                  className="font-bold inline-block px-3 py-1 rounded bg-black/40 backdrop-blur-xs"
                >
                  {textOverlay.text}
                </span>
              </div>
            )}
          </div>

          {/* Player Controls & Scrubber */}
          <div className="p-4 bg-[#FAF5EC] rounded-2xl border border-[#E9DCC8] space-y-3">
            <div className="flex items-center gap-3">
              <button
                onClick={handlePlayPause}
                className="w-10 h-10 rounded-full bg-[#D98218] hover:bg-[#C66A08] text-white flex items-center justify-center shadow-md cursor-pointer transition-colors shrink-0"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>

              <button
                onClick={() => handleSeek(startTime)}
                title="Restart from Start Time"
                className="p-2 rounded-xl bg-white border border-[#E9DCC8] text-[#102A43] hover:text-[#D98218] cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <div className="flex-1">
                <input
                  type="range"
                  min={0}
                  max={metadata?.duration || 100}
                  step={0.1}
                  value={currentTime}
                  onChange={(e) => handleSeek(Number(e.target.value))}
                  className="w-full accent-[#D98218] cursor-pointer"
                />
              </div>

              <span className="font-mono text-xs font-bold text-[#102A43] shrink-0">
                {formatTime(currentTime)} / {formatTime(metadata?.duration || 0)}
              </span>
            </div>

            {/* Trim indicator bar */}
            <div className="flex items-center justify-between text-xs text-[#61758A] pt-1 border-t border-[#E9DCC8]/60">
              <span>Trim Window: <strong>{formatTime(startTime)}</strong> to <strong>{formatTime(endTime)}</strong></span>
              <span>Selected Length: <strong>{formatTime(Math.max(0, endTime - startTime))}</strong></span>
            </div>
          </div>

          {/* Editor Tabs Navigation */}
          <div className="flex border-b border-[#E9DCC8] gap-1">
            {[
              { id: 'adjust', label: 'Color & Effects', icon: Sliders },
              { id: 'trim', label: 'Trimming', icon: Scissors },
              { id: 'text', label: 'Text Overlay', icon: Type },
              { id: 'audio', label: 'Audio & Volume', icon: Volume2 },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'border-[#D98218] text-[#D98218] bg-[#FFF3DF]/40 rounded-t-xl'
                      : 'border-transparent text-[#61758A] hover:text-[#102A43]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="p-4 bg-white rounded-2xl border border-[#E9DCC8] space-y-4">
            {/* 1. Color Adjustments */}
            {activeTab === 'adjust' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-[#102A43] uppercase tracking-wide">
                    Visual Adjustments
                  </h5>
                  <button
                    onClick={resetFilters}
                    className="text-xs font-semibold text-[#D98218] hover:underline cursor-pointer"
                  >
                    Reset All
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-[#102A43] mb-1">
                      <span>Brightness</span>
                      <span className="font-mono text-[#D98218]">{filters.brightness}%</span>
                    </div>
                    <input
                      type="range"
                      min={50}
                      max={150}
                      value={filters.brightness}
                      onChange={(e) => setFilters({ ...filters, brightness: Number(e.target.value) })}
                      className="w-full accent-[#D98218]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold text-[#102A43] mb-1">
                      <span>Contrast</span>
                      <span className="font-mono text-[#D98218]">{filters.contrast}%</span>
                    </div>
                    <input
                      type="range"
                      min={50}
                      max={150}
                      value={filters.contrast}
                      onChange={(e) => setFilters({ ...filters, contrast: Number(e.target.value) })}
                      className="w-full accent-[#D98218]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold text-[#102A43] mb-1">
                      <span>Saturation</span>
                      <span className="font-mono text-[#D98218]">{filters.saturation}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={200}
                      value={filters.saturation}
                      onChange={(e) => setFilters({ ...filters, saturation: Number(e.target.value) })}
                      className="w-full accent-[#D98218]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold text-[#102A43] mb-1">
                      <span>Grayscale Effect</span>
                      <span className="font-mono text-[#D98218]">{filters.grayscale}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={filters.grayscale}
                      onChange={(e) => setFilters({ ...filters, grayscale: Number(e.target.value) })}
                      className="w-full accent-[#D98218]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 2. Trimming Tab */}
            {activeTab === 'trim' && (
              <div className="space-y-4">
                <h5 className="text-xs font-bold text-[#102A43] uppercase tracking-wide">
                  Set Start and End Boundaries
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-[#FAF5EC] rounded-xl border border-[#E9DCC8] space-y-2">
                    <label className="text-xs font-bold text-[#102A43] block">Start Time (sec)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={endTime - 0.1}
                        step={0.1}
                        value={startTime}
                        onChange={(e) => setStartTime(Math.max(0, Number(e.target.value)))}
                        className="w-full p-2 bg-white rounded-lg border border-[#E9DCC8] text-sm font-mono text-[#102A43]"
                      />
                      <button
                        onClick={() => setStartTime(currentTime)}
                        className="px-3 py-2 bg-white hover:bg-[#FFF3DF] text-[#D98218] border border-[#E9DCC8] rounded-lg text-xs font-bold shrink-0 cursor-pointer"
                      >
                        Set to Current
                      </button>
                    </div>
                    <span className="text-[11px] text-[#61758A] block font-mono">
                      Timestamp: {formatTime(startTime)}
                    </span>
                  </div>

                  <div className="p-3 bg-[#FAF5EC] rounded-xl border border-[#E9DCC8] space-y-2">
                    <label className="text-xs font-bold text-[#102A43] block">End Time (sec)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={startTime + 0.1}
                        max={metadata?.duration || 100}
                        step={0.1}
                        value={endTime}
                        onChange={(e) => setEndTime(Math.min(metadata?.duration || 100, Number(e.target.value)))}
                        className="w-full p-2 bg-white rounded-lg border border-[#E9DCC8] text-sm font-mono text-[#102A43]"
                      />
                      <button
                        onClick={() => setEndTime(currentTime)}
                        className="px-3 py-2 bg-white hover:bg-[#FFF3DF] text-[#D98218] border border-[#E9DCC8] rounded-lg text-xs font-bold shrink-0 cursor-pointer"
                      >
                        Set to Current
                      </button>
                    </div>
                    <span className="text-[11px] text-[#61758A] block font-mono">
                      Timestamp: {formatTime(endTime)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Text Overlay Tab */}
            {activeTab === 'text' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-[#102A43] uppercase tracking-wide">
                    Title Card & Captions
                  </h5>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showTextOverlay}
                      onChange={(e) => setShowTextOverlay(e.target.checked)}
                      className="accent-[#D98218] w-4 h-4 rounded"
                    />
                    <span className="text-xs font-bold text-[#102A43]">Enable Text Overlay</span>
                  </label>
                </div>

                {showTextOverlay && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-[#102A43] block mb-1">Text Content</label>
                      <input
                        type="text"
                        value={textOverlay.text}
                        onChange={(e) => setTextOverlay({ ...textOverlay, text: e.target.value })}
                        placeholder="Enter title or overlay text..."
                        className="w-full p-2.5 bg-white border border-[#E9DCC8] rounded-xl text-sm text-[#102A43] focus:border-[#D98218] focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-[#102A43] block mb-1">Position</label>
                        <select
                          value={textOverlay.position}
                          onChange={(e) => setTextOverlay({ ...textOverlay, position: e.target.value as 'top' | 'center' | 'bottom' })}
                          className="w-full p-2 bg-white border border-[#E9DCC8] rounded-xl text-xs font-bold text-[#102A43]"
                        >
                          <option value="top">Top Header</option>
                          <option value="center">Center Stage</option>
                          <option value="bottom">Bottom Caption</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-[#102A43] block mb-1">Font Size ({textOverlay.fontSize}px)</label>
                        <input
                          type="range"
                          min={16}
                          max={64}
                          value={textOverlay.fontSize}
                          onChange={(e) => setTextOverlay({ ...textOverlay, fontSize: Number(e.target.value) })}
                          className="w-full accent-[#D98218]"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-[#102A43] block mb-1">Color</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={textOverlay.color}
                            onChange={(e) => setTextOverlay({ ...textOverlay, color: e.target.value })}
                            className="w-9 h-9 rounded-lg border border-[#E9DCC8] cursor-pointer"
                          />
                          <span className="font-mono text-xs font-bold text-[#102A43]">{textOverlay.color}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. Audio Tab */}
            {activeTab === 'audio' && (
              <div className="space-y-4">
                <h5 className="text-xs font-bold text-[#102A43] uppercase tracking-wide">
                  Sound & Volume Controls
                </h5>

                <div className="flex items-center gap-4 p-4 bg-[#FAF5EC] rounded-xl border border-[#E9DCC8]">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-3 rounded-xl border transition-colors cursor-pointer ${
                      isMuted ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-[#E9DCC8] text-[#D98218]'
                    }`}
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>

                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-[#102A43]">
                      <span>Volume Level</span>
                      <span className="font-mono text-[#D98218]">{isMuted ? 'Muted (0%)' : `${Math.round(volume * 100)}%`}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1.5}
                      step={0.05}
                      disabled={isMuted}
                      value={volume}
                      onChange={(e) => setVolume(Number(e.target.value))}
                      className="w-full accent-[#D98218] cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Export Settings & Action */}
          <div className="p-4 bg-[#FAF5EC] rounded-2xl border border-[#E9DCC8] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-[#102A43]">Export Quality:</span>
                <div className="flex gap-1.5">
                  {(['1080p', '720p', '480p'] as const).map((res) => (
                    <button
                      key={res}
                      onClick={() => setTargetResolution(res)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        targetResolution === res
                          ? 'bg-[#D98218] text-white shadow-sm'
                          : 'bg-white text-[#102A43] border border-[#E9DCC8]'
                      }`}
                    >
                      {res}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#102A43]">Framerate:</span>
                <select
                  value={targetFps}
                  onChange={(e) => setTargetFps(Number(e.target.value))}
                  className="px-2.5 py-1.5 bg-white border border-[#E9DCC8] rounded-lg text-xs font-bold text-[#102A43]"
                >
                  <option value={24}>24 FPS (Cinematic)</option>
                  <option value={30}>30 FPS (Standard)</option>
                  <option value={60}>60 FPS (Smooth)</option>
                </select>
              </div>
            </div>

            {/* Error banner */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Progress Bar */}
            {processing && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-[#102A43]">
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#D98218]" />
                    Rendering edited video frames into MediaRecorder stream...
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

            {/* Success Download Card */}
            {renderedResult && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-emerald-900">Video Rendered Successfully!</h5>
                    <p className="text-[11px] text-emerald-700">
                      {renderedResult.width}x{renderedResult.height} · {formatTime(renderedResult.duration)} · {renderedResult.formattedSize}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Video</span>
                </button>
              </div>
            )}

            {/* Render Button */}
            {!renderedResult && (
              <button
                onClick={handleExport}
                disabled={processing}
                className="w-full py-3 bg-[#D98218] hover:bg-[#C66A08] disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                {processing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Rendering Video ({progress}%)...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Render & Export Edited Video</span>
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

import React, { useState, useRef } from 'react';
import {
  Upload,
  Play,
  Pause,
  Sliders,
  Palette,
  Download,
  Check,
  AlertCircle,
  RefreshCw,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  getVideoMetadata,
  renderProcessedVideo,
  formatTime,
  formatBytes,
  VideoMetadata,
  VideoFilterSettings,
  RenderedVideoResult,
} from '../../services/video/videoProcessingService';

export const VideoFiltersTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);

  // Active filter state
  const [activePreset, setActivePreset] = useState<string>('cinematic');
  const [filters, setFilters] = useState<VideoFilterSettings>({
    brightness: 100,
    contrast: 130,
    saturation: 125,
    blur: 0,
    grayscale: 0,
    sepia: 0,
  });

  // Processing state
  const [processing, setProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [result, setResult] = useState<RenderedVideoResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  const FILTER_PRESETS: {
    id: string;
    name: string;
    desc: string;
    settings: VideoFilterSettings;
  }[] = [
    {
      id: 'cinematic',
      name: 'Cinematic',
      desc: 'Rich contrast & punchy tone',
      settings: { brightness: 98, contrast: 130, saturation: 125, blur: 0, grayscale: 0, sepia: 0 },
    },
    {
      id: 'vintage',
      name: 'Vintage 90s',
      desc: 'Warm sepia nostalgia',
      settings: { brightness: 102, contrast: 92, saturation: 85, blur: 0, grayscale: 0, sepia: 40 },
    },
    {
      id: 'noir',
      name: 'Noir Film',
      desc: 'High-contrast monochrome',
      settings: { brightness: 100, contrast: 140, saturation: 0, blur: 0, grayscale: 100, sepia: 0 },
    },
    {
      id: 'sunset',
      name: 'Golden Hour',
      desc: 'Warm sunset radiance',
      settings: { brightness: 105, contrast: 110, saturation: 145, blur: 0, grayscale: 0, sepia: 25 },
    },
    {
      id: 'cyberpunk',
      name: 'Cyberpunk',
      desc: 'Neon vibrancy & glow',
      settings: { brightness: 102, contrast: 145, saturation: 180, blur: 0, grayscale: 0, sepia: 0 },
    },
    {
      id: 'cool',
      name: 'Arctic Cool',
      desc: 'Subtle desaturated blue',
      settings: { brightness: 96, contrast: 115, saturation: 85, blur: 0, grayscale: 10, sepia: 0 },
    },
    {
      id: 'none',
      name: 'Natural (Reset)',
      desc: 'Original camera colors',
      settings: { brightness: 100, contrast: 100, saturation: 100, blur: 0, grayscale: 0, sepia: 0 },
    },
  ];

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

  const applyPreset = (presetId: string) => {
    const p = FILTER_PRESETS.find((x) => x.id === presetId);
    if (p) {
      setActivePreset(presetId);
      setFilters({ ...p.settings });
    }
  };

  // Build CSS filter string for live preview
  const getFilterCss = () => {
    const parts: string[] = [];
    if (filters.brightness !== undefined) parts.push(`brightness(${filters.brightness}%)`);
    if (filters.contrast !== undefined) parts.push(`contrast(${filters.contrast}%)`);
    if (filters.saturation !== undefined) parts.push(`saturate(${filters.saturation}%)`);
    if (filters.sepia && filters.sepia > 0) parts.push(`sepia(${filters.sepia}%)`);
    if (filters.grayscale && filters.grayscale > 0) parts.push(`grayscale(${filters.grayscale}%)`);
    if (filters.blur && filters.blur > 0) parts.push(`blur(${filters.blur}px)`);
    return parts.length > 0 ? parts.join(' ') : 'none';
  };

  const handleProcess = async () => {
    if (!file || !metadata) return;

    setProcessing(true);
    setProgress(0);
    setError(null);
    setResult(null);

    try {
      const res = await renderProcessedVideo({
        file,
        filters,
        onProgress: (p) => setProgress(p.percent),
      });

      setResult(res);
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Color filter rendering failed. Please try again.';
      setError(errMsg);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-semibold">
          <Palette className="w-3.5 h-3.5" />
          <span>Aesthetic Video Filters</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#102A43]">
          Add Aesthetic Filters & Color Grading
        </h2>
        <p className="text-sm sm:text-base text-[#61758A] max-w-xl mx-auto">
          Elevate your video clips with film presets like Cinematic, 90s Vintage, Golden Hour, and Cyberpunk in real-time.
        </p>
      </div>

      {!file ? (
        /* Upload Area */
        <div className="bg-white rounded-3xl p-8 sm:p-14 border-2 border-dashed border-[#E9DCC8] hover:border-red-400 transition-all text-center">
          <input
            type="file"
            id="video-filters-upload"
            accept="video/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <label
            htmlFor="video-filters-upload"
            className="cursor-pointer flex flex-col items-center justify-center space-y-4"
          >
            <div className="w-20 h-20 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center shadow-inner hover:scale-105 transition-transform">
              <Sparkles className="w-10 h-10" />
            </div>
            <div>
              <p className="text-lg font-bold text-[#102A43]">Click to select video</p>
              <p className="text-xs sm:text-sm text-[#61758A] mt-1">
                Supports MP4, WebM, MOV, and AVI up to 1GB
              </p>
            </div>
            <span className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm shadow-md transition-all">
              Choose Video to Grade
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
                className="max-h-[380px] max-w-full rounded-lg transition-all duration-200"
                style={{ filter: getFilterCss() }}
              />
            </div>

            {/* Play/Pause controls */}
            <div className="w-full flex items-center justify-between mt-4 px-2 text-white/80 text-xs">
              <button
                onClick={handlePlayPause}
                className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer flex items-center gap-1.5 font-semibold text-sm"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                <span>{isPlaying ? 'Pause' : 'Play Preview'}</span>
              </button>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-white/10 text-white font-medium text-[11px] capitalize">
                  Filter: {activePreset}
                </span>
                <span>{formatTime(currentTime)} / {metadata?.formattedDuration}</span>
              </div>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="bg-white rounded-3xl p-6 border border-[#E9DCC8] shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-[#102A43]">Color Grade Presets</h3>
                <p className="text-xs text-[#61758A] mt-0.5">Click any style to preview instantly</p>

                <div className="grid grid-cols-2 gap-2 mt-3">
                  {FILTER_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => applyPreset(p.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        activePreset === p.id
                          ? 'bg-red-500 text-white border-red-500 shadow-md'
                          : 'bg-[#FAF5EC] border-[#E9DCC8] hover:border-red-400 text-[#102A43]'
                      }`}
                    >
                      <div className="text-xs font-bold leading-tight">{p.name}</div>
                      <div className={`text-[10px] truncate ${activePreset === p.id ? 'text-white/80' : 'text-[#61758A]'}`}>
                        {p.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sliders */}
              <div className="space-y-3 pt-2 border-t border-[#E9DCC8]">
                <h4 className="text-xs font-bold text-[#102A43] flex items-center justify-between">
                  <span>Fine-Tune Adjustment</span>
                  <button
                    onClick={() => applyPreset('none')}
                    className="text-[11px] text-red-500 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset
                  </button>
                </h4>

                <div>
                  <div className="flex justify-between text-xs text-[#102A43] mb-1">
                    <span>Contrast</span>
                    <span className="font-mono">{filters.contrast}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="200"
                    value={filters.contrast}
                    onChange={(e) => {
                      setFilters({ ...filters, contrast: parseInt(e.target.value) });
                      setActivePreset('custom');
                    }}
                    className="w-full accent-red-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-[#102A43] mb-1">
                    <span>Saturation</span>
                    <span className="font-mono">{filters.saturation}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="250"
                    value={filters.saturation}
                    onChange={(e) => {
                      setFilters({ ...filters, saturation: parseInt(e.target.value) });
                      setActivePreset('custom');
                    }}
                    className="w-full accent-red-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-[#102A43] mb-1">
                    <span>Brightness</span>
                    <span className="font-mono">{filters.brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="160"
                    value={filters.brightness}
                    onChange={(e) => {
                      setFilters({ ...filters, brightness: parseInt(e.target.value) });
                      setActivePreset('custom');
                    }}
                    className="w-full accent-red-500"
                  />
                </div>
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
                      Color grading video frames...
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
                  <Palette className="w-4 h-4" />
                  <span>Export Graded Video</span>
                </button>
              )}

              {result && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Grading complete! ({result.formattedSize})</span>
                  </div>
                  <a
                    href={result.url}
                    download={`filtered-${file.name.replace(/\.[^/.]+$/, '')}.${result.extension}`}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow transition-all block text-center"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Graded Video</span>
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

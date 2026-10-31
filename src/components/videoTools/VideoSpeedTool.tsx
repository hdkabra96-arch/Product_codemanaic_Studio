import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Play,
  Pause,
  Gauge,
  FastForward,
  Download,
  Check,
  AlertCircle,
  RefreshCw,
  Volume2,
  VolumeX,
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

export const VideoSpeedTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);

  // Speed state
  const [speed, setSpeed] = useState<number>(1.5);
  const [muteAudio, setMuteAudio] = useState<boolean>(false);

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

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  }, [speed]);

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.playbackRate = speed;
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const SPEED_PRESETS = [
    { label: '0.25x', value: 0.25, name: 'Super Slow-mo' },
    { label: '0.5x', value: 0.5, name: 'Slow-mo' },
    { label: '0.75x', value: 0.75, name: 'Relaxed' },
    { label: '1x', value: 1.0, name: 'Normal' },
    { label: '1.25x', value: 1.25, name: 'Brisk' },
    { label: '1.5x', value: 1.5, name: 'Viral Pace' },
    { label: '2x', value: 2.0, name: 'Double Speed' },
    { label: '4x', value: 4.0, name: 'Timelapse' },
  ];

  const handleProcess = async () => {
    if (!file || !metadata) return;

    setProcessing(true);
    setProgress(0);
    setError(null);
    setResult(null);

    try {
      const res = await renderProcessedVideo({
        file,
        playbackRate: speed,
        muteAudio: muteAudio || speed > 2.5 || speed < 0.4,
        onProgress: (p) => setProgress(p.percent),
      });

      setResult(res);
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Speed change rendering failed. Please try again.';
      setError(errMsg);
    } finally {
      setProcessing(false);
    }
  };

  const estimatedNewDuration = metadata ? metadata.duration / speed : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-semibold">
          <Gauge className="w-3.5 h-3.5" />
          <span>Change Video Speed</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#102A43]">
          Slow-mo & Speed Up for Viral Content
        </h2>
        <p className="text-sm sm:text-base text-[#61758A] max-w-xl mx-auto">
          Create hyper-lapse timelapses or dramatic slow-motion clips directly in your browser with no upload delays.
        </p>
      </div>

      {!file ? (
        /* Upload Box */
        <div className="bg-white rounded-3xl p-8 sm:p-14 border-2 border-dashed border-[#E9DCC8] hover:border-red-400 transition-all text-center">
          <input
            type="file"
            id="video-speed-upload"
            accept="video/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <label
            htmlFor="video-speed-upload"
            className="cursor-pointer flex flex-col items-center justify-center space-y-4"
          >
            <div className="w-20 h-20 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center shadow-inner hover:scale-105 transition-transform">
              <FastForward className="w-10 h-10" />
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
        /* Studio */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Preview */}
          <div className="lg:col-span-2 bg-[#102A43] rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-xl min-h-[420px]">
            <div className="relative w-full max-h-[480px] flex items-center justify-center overflow-hidden rounded-xl">
              <video
                ref={videoRef}
                src={videoSrc}
                muted={muteAudio}
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
                <span>{isPlaying ? 'Pause' : 'Play Preview'}</span>
              </button>
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-md bg-white/10 font-mono font-bold text-red-400">
                  {speed}x speed
                </span>
                <span>{formatTime(currentTime)} / {metadata?.formattedDuration}</span>
              </div>
            </div>
          </div>

          {/* Speed Controls */}
          <div className="bg-white rounded-3xl p-6 border border-[#E9DCC8] shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#102A43]">Speed Presets</h3>
                  <span className="text-sm font-extrabold text-red-500 font-mono">{speed}x</span>
                </div>
                <p className="text-xs text-[#61758A] mt-0.5">Select a multiplier</p>

                <div className="grid grid-cols-4 gap-2 mt-3">
                  {SPEED_PRESETS.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setSpeed(p.value)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold transition-all text-center ${
                        speed === p.value
                          ? 'bg-red-500 text-white shadow-md'
                          : 'bg-[#FAF5EC] border border-[#E9DCC8] hover:border-red-400 text-[#102A43]'
                      }`}
                    >
                      <div>{p.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-[#102A43]">
                  <span>Custom Speed Slider</span>
                  <span className="font-mono text-red-600">{speed.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.25"
                  max="4.0"
                  step="0.05"
                  value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  className="w-full accent-red-500"
                />
                <div className="flex justify-between text-[10px] text-[#61758A]">
                  <span>0.25x (Slow)</span>
                  <span>1.0x (Normal)</span>
                  <span>4.0x (Fast)</span>
                </div>
              </div>

              {/* Audio Option */}
              <div className="p-3.5 rounded-2xl bg-[#FAF5EC] border border-[#E9DCC8] space-y-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#102A43]">
                    {muteAudio ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4 text-emerald-600" />}
                    <span>Mute Audio Track</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={muteAudio}
                    onChange={(e) => setMuteAudio(e.target.checked)}
                    className="w-4 h-4 accent-red-500 rounded"
                  />
                </label>
                <p className="text-[11px] text-[#61758A]">
                  Recommended for extreme slow-mo or high-speed timelapses to avoid audio distortion.
                </p>
              </div>

              {/* Duration Comparison */}
              {metadata && (
                <div className="p-3.5 rounded-2xl bg-white border border-[#E9DCC8] text-xs space-y-1.5 text-[#102A43]">
                  <div className="flex justify-between">
                    <span className="text-[#61758A]">Original Duration:</span>
                    <span className="font-bold">{formatTime(metadata.duration)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#61758A]">New Estimated Duration:</span>
                    <span className="font-extrabold text-red-600">{formatTime(estimatedNewDuration)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#61758A]">Resolution:</span>
                    <span className="font-semibold">{metadata.width} × {metadata.height}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Button */}
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
                      Rendering with speed {speed}x...
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
                  <Gauge className="w-4 h-4" />
                  <span>Export Speed Adjusted Video</span>
                </button>
              )}

              {result && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Speed change complete! ({result.formattedSize})</span>
                  </div>
                  <a
                    href={result.url}
                    download={`speed-${speed}x-${file.name.replace(/\.[^/.]+$/, '')}.${result.extension}`}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow transition-all block text-center"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Speed Video</span>
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

import React, { useState, useRef } from 'react';
import {
  Upload,
  Play,
  Pause,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Download,
  Check,
  AlertCircle,
  RefreshCw,
  Film,
  Sparkles,
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

export const VideoRotateTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);

  // Rotation & Flip state
  const [rotation, setRotation] = useState<0 | 90 | 180 | 270>(90);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);

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

  const handleRotateCW = () => {
    setRotation((prev) => (((prev + 90) % 360) as 0 | 90 | 180 | 270));
  };

  const handleRotateCCW = () => {
    setRotation((prev) => (((prev + 270) % 360) as 0 | 90 | 180 | 270));
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

  const handleProcess = async () => {
    if (!file || !metadata) return;

    setProcessing(true);
    setProgress(0);
    setError(null);
    setResult(null);

    try {
      const res = await renderProcessedVideo({
        file,
        rotation,
        flipHorizontal: flipH,
        flipVertical: flipV,
        onProgress: (p) => setProgress(p.percent),
      });

      setResult(res);
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Video rotation failed. Please try again.';
      setError(errMsg);
    } finally {
      setProcessing(false);
    }
  };

  // Preview CSS transform
  const getTransformStyle = () => {
    const scaleX = flipH ? -1 : 1;
    const scaleY = flipV ? -1 : 1;
    return `rotate(${rotation}deg) scale(${scaleX}, ${scaleY})`;
  };

  const isRotatedQuarter = rotation === 90 || rotation === 270;
  const targetW = metadata ? (isRotatedQuarter ? metadata.height : metadata.width) : 0;
  const targetH = metadata ? (isRotatedQuarter ? metadata.width : metadata.height) : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-semibold">
          <RotateCw className="w-3.5 h-3.5" />
          <span>Rotate & Flip Video</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#102A43]">
          Fix Orientation for Vertical Content
        </h2>
        <p className="text-sm sm:text-base text-[#61758A] max-w-xl mx-auto">
          Rotate landscape videos to vertical 90° for Reels & TikTok, flip mirror angles, and export instantly in your browser.
        </p>
      </div>

      {!file ? (
        /* Upload Zone */
        <div className="bg-white rounded-3xl p-8 sm:p-14 border-2 border-dashed border-[#E9DCC8] hover:border-red-400 transition-all text-center">
          <input
            type="file"
            id="video-rotate-upload"
            accept="video/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <label
            htmlFor="video-rotate-upload"
            className="cursor-pointer flex flex-col items-center justify-center space-y-4"
          >
            <div className="w-20 h-20 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center shadow-inner hover:scale-105 transition-transform">
              <Upload className="w-10 h-10" />
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
          {/* Video Preview */}
          <div className="lg:col-span-2 bg-[#102A43] rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-xl min-h-[420px]">
            <div className="relative w-full max-h-[480px] flex items-center justify-center overflow-hidden rounded-xl">
              <video
                ref={videoRef}
                src={videoSrc}
                onTimeUpdate={() => videoRef.current && setCurrentTime(videoRef.current.currentTime)}
                onEnded={() => setIsPlaying(false)}
                className="max-h-[380px] max-w-full rounded-lg transition-transform duration-300"
                style={{ transform: getTransformStyle() }}
              />
            </div>

            {/* Play/Pause overlay */}
            <div className="w-full flex items-center justify-between mt-4 px-2 text-white/80 text-xs">
              <button
                onClick={handlePlayPause}
                className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer flex items-center gap-1.5 font-semibold text-sm"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>
              <span>{formatTime(currentTime)} / {metadata?.formattedDuration}</span>
            </div>
          </div>

          {/* Orientation Controls */}
          <div className="bg-white rounded-3xl p-6 border border-[#E9DCC8] shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-[#102A43]">Rotation Angles</h3>
                <p className="text-xs text-[#61758A] mt-0.5">Quickly adjust video orientation</p>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <button
                    onClick={handleRotateCW}
                    className="p-3 rounded-xl border border-[#E9DCC8] hover:border-red-400 hover:bg-red-50 text-xs font-bold text-[#102A43] flex items-center justify-center gap-1.5 transition-all"
                  >
                    <RotateCw className="w-4 h-4 text-red-500" />
                    <span>Rotate +90°</span>
                  </button>
                  <button
                    onClick={handleRotateCCW}
                    className="p-3 rounded-xl border border-[#E9DCC8] hover:border-red-400 hover:bg-red-50 text-xs font-bold text-[#102A43] flex items-center justify-center gap-1.5 transition-all"
                  >
                    <RotateCcw className="w-4 h-4 text-red-500" />
                    <span>Rotate -90°</span>
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-[#102A43]">Mirror & Flip</h3>
                <p className="text-xs text-[#61758A] mt-0.5">Flip camera perspective</p>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <button
                    onClick={() => setFlipH(!flipH)}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      flipH ? 'bg-red-500 text-white border-red-500 shadow-sm' : 'border-[#E9DCC8] hover:bg-red-50 text-[#102A43]'
                    }`}
                  >
                    <FlipHorizontal className="w-4 h-4" />
                    <span>Flip Horiz.</span>
                  </button>
                  <button
                    onClick={() => setFlipV(!flipV)}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      flipV ? 'bg-red-500 text-white border-red-500 shadow-sm' : 'border-[#E9DCC8] hover:bg-red-50 text-[#102A43]'
                    }`}
                  >
                    <FlipVertical className="w-4 h-4" />
                    <span>Flip Vert.</span>
                  </button>
                </div>
              </div>

              {/* Angle Selector Pills */}
              <div>
                <label className="text-xs font-semibold text-[#61758A] block mb-2">Preset Angles</label>
                <div className="grid grid-cols-4 gap-2">
                  {([0, 90, 180, 270] as const).map((ang) => (
                    <button
                      key={ang}
                      onClick={() => setRotation(ang)}
                      className={`py-2 rounded-lg text-xs font-bold transition-all ${
                        rotation === ang ? 'bg-[#102A43] text-white shadow' : 'bg-gray-100 text-[#102A43] hover:bg-gray-200'
                      }`}
                    >
                      {ang}°
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Specs */}
              {metadata && (
                <div className="p-3.5 rounded-2xl bg-[#FAF5EC] border border-[#E9DCC8] text-xs space-y-1.5 text-[#102A43]">
                  <div className="flex justify-between">
                    <span className="text-[#61758A]">Output Dimensions:</span>
                    <span className="font-bold">{targetW} × {targetH} px</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#61758A]">Orientation:</span>
                    <span className="font-bold">{targetH > targetW ? 'Vertical (9:16)' : 'Horizontal (16:9)'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#61758A]">Audio Track:</span>
                    <span className="font-semibold text-emerald-600">Preserved in sync</span>
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
                      Rendering oriented video...
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
                  <RotateCw className="w-4 h-4" />
                  <span>Rotate Video Now</span>
                </button>
              )}

              {result && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Rotation complete! ({result.formattedSize})</span>
                  </div>
                  <a
                    href={result.url}
                    download={`rotated-${file.name.replace(/\.[^/.]+$/, '')}.${result.extension}`}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow transition-all block text-center"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Rotated Video</span>
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

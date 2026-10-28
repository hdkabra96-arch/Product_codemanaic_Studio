import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Crop,
  Download,
  Check,
  AlertCircle,
  RefreshCw,
  FileVideo,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  getVideoMetadata,
  renderProcessedVideo,
  formatTime,
  formatBytes,
  VideoMetadata,
  RenderedVideoResult,
  VideoCropSettings,
} from '../../services/video/videoProcessingService';

export const VideoCropperTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Crop coordinates in original video pixels
  const [crop, setCrop] = useState<VideoCropSettings>({
    x: 0,
    y: 0,
    width: 640,
    height: 640,
  });
  const [cropPreset, setCropPreset] = useState<'1:1' | '16:9' | '9:16' | '4:3' | 'custom'>('1:1');

  // Processing state
  const [processing, setProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [croppedResult, setCroppedResult] = useState<RenderedVideoResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      try {
        setError(null);
        setCroppedResult(null);
        const meta = await getVideoMetadata(selected);
        setFile(selected);
        setMetadata(meta);

        // Initial 1:1 center crop
        const minDim = Math.min(meta.width, meta.height);
        const initialCrop: VideoCropSettings = {
          x: Math.round((meta.width - minDim) / 2),
          y: Math.round((meta.height - minDim) / 2),
          width: minDim,
          height: minDim,
        };
        setCrop(initialCrop);
        setVideoSrc(URL.createObjectURL(selected));
      } catch (err) {
        setError('Unsupported video format.');
      }
    }
  };

  const applyCropPreset = (preset: typeof cropPreset) => {
    if (!metadata) return;
    setCropPreset(preset);

    const W = metadata.width;
    const H = metadata.height;

    let targetW = W;
    let targetH = H;

    if (preset === '1:1') {
      const size = Math.min(W, H);
      targetW = size;
      targetH = size;
    } else if (preset === '16:9') {
      targetW = W;
      targetH = Math.round((W * 9) / 16);
      if (targetH > H) {
        targetH = H;
        targetW = Math.round((H * 16) / 9);
      }
    } else if (preset === '9:16') {
      targetH = H;
      targetW = Math.round((H * 9) / 16);
      if (targetW > W) {
        targetW = W;
        targetH = Math.round((W * 16) / 9);
      }
    } else if (preset === '4:3') {
      targetW = W;
      targetH = Math.round((W * 3) / 4);
      if (targetH > H) {
        targetH = H;
        targetW = Math.round((H * 4) / 3);
      }
    }

    setCrop({
      x: Math.round((W - targetW) / 2),
      y: Math.round((H - targetH) / 2),
      width: targetW,
      height: targetH,
    });
  };

  const handleCrop = async () => {
    if (!file || !metadata) return;

    try {
      setProcessing(true);
      setProgress(0);
      setError(null);
      setCroppedResult(null);

      const result = await renderProcessedVideo({
        file,
        crop,
        targetWidth: crop.width,
        targetHeight: crop.height,
        fps: 30,
        onProgress: (p) => setProgress(p.percent),
      });

      setCroppedResult(result);
      setProcessing(false);
      try {
        confetti({ particleCount: 50, spread: 60 });
      } catch {
        // ignore
      }
    } catch (err: unknown) {
      setProcessing(false);
      setError(err instanceof Error ? err.message : 'Error cropping video.');
    }
  };

  const handleDownload = () => {
    if (!croppedResult || !file) return;
    const a = document.createElement('a');
    a.href = croppedResult.url;
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    a.download = `${baseName}_cropped_${crop.width}x${crop.height}.${croppedResult.extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  useEffect(() => {
    return () => {
      if (videoSrc) URL.revokeObjectURL(videoSrc);
      if (croppedResult?.url) URL.revokeObjectURL(croppedResult.url);
    };
  }, [videoSrc, croppedResult]);

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
            <Crop className="w-7 h-7" />
          </div>
          <span className="text-base font-bold text-[#102A43]">
            Select video to crop
          </span>
          <span className="text-xs text-[#61758A] mt-1">
            Cut out unwanted frame regions and frame subjects with custom aspect ratios
          </span>
          <span className="mt-4 px-4 py-1.5 rounded-full bg-white border border-[#E9DCC8] text-xs font-bold text-[#102A43] shadow-sm">
            Browse Videos
          </span>
        </label>
      ) : (
        <div className="space-y-6">
          {/* File Card */}
          <div className="p-4 bg-white rounded-2xl border border-[#E9DCC8] shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFF3DF] text-[#D98218] flex items-center justify-center">
                <FileVideo className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#102A43] truncate max-w-sm">{metadata?.name}</h4>
                <p className="text-xs text-[#61758A]">
                  Original: {metadata?.width}x{metadata?.height} · {metadata?.formattedDuration}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setMetadata(null);
                setCroppedResult(null);
                if (videoSrc) URL.revokeObjectURL(videoSrc);
                setVideoSrc('');
              }}
              className="text-xs font-semibold text-[#61758A] hover:text-red-600 cursor-pointer"
            >
              Change File
            </button>
          </div>

          {/* Interactive Player with Crop Overlay Visual */}
          <div className="relative bg-black rounded-2xl overflow-hidden border border-[#E9DCC8] aspect-video flex items-center justify-center max-h-[380px]">
            <video
              ref={videoRef}
              src={videoSrc}
              className="w-full h-full object-contain"
              onEnded={() => setIsPlaying(false)}
            />

            {/* Visual Crop Box Indicator */}
            {metadata && (
              <div
                style={{
                  left: `${(crop.x / metadata.width) * 100}%`,
                  top: `${(crop.y / metadata.height) * 100}%`,
                  width: `${(crop.width / metadata.width) * 100}%`,
                  height: `${(crop.height / metadata.height) * 100}%`,
                }}
                className="absolute border-2 border-[#D98218] shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] pointer-events-none transition-all duration-75 flex items-center justify-center"
              >
                <span className="text-[10px] font-bold text-white bg-[#D98218] px-1.5 py-0.5 rounded shadow-sm">
                  {crop.width}x{crop.height}
                </span>
              </div>
            )}
          </div>

          {/* Player controls */}
          <div className="p-3 bg-[#FAF5EC] rounded-xl border border-[#E9DCC8] flex items-center gap-3">
            <button
              onClick={() => {
                if (!videoRef.current) return;
                if (isPlaying) {
                  videoRef.current.pause();
                  setIsPlaying(false);
                } else {
                  videoRef.current.play();
                  setIsPlaying(true);
                }
              }}
              className="p-2 rounded-lg bg-[#D98218] text-white hover:bg-[#C66A08] cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <span className="text-xs text-[#61758A] font-medium">
              Preview frames inside the orange crop area while playing
            </span>
          </div>

          {/* Ratio Presets */}
          <div className="p-5 bg-white rounded-2xl border border-[#E9DCC8] space-y-4">
            <div>
              <label className="text-xs font-bold text-[#102A43] uppercase tracking-wider block mb-2">
                Crop Ratio Presets
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: '1:1', label: '1:1 Square (Instagram)' },
                  { id: '16:9', label: '16:9 Landscape (YouTube)' },
                  { id: '9:16', label: '9:16 Vertical (TikTok/Reels)' },
                  { id: '4:3', label: '4:3 Classic TV' },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => applyCropPreset(p.id as typeof cropPreset)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      cropPreset === p.id
                        ? 'border-[#D98218] bg-[#FAF5EC] text-[#D98218] font-bold shadow-xs'
                        : 'border-[#E9DCC8] bg-white text-[#102A43]'
                    }`}
                  >
                    <span className="text-xs font-bold">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Exact Pixel Coordinates */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#FAF5EC] rounded-xl border border-[#E9DCC8]">
              <div>
                <label className="text-[11px] font-bold text-[#102A43] block mb-1">X Offset (px)</label>
                <input
                  type="number"
                  min={0}
                  max={(metadata?.width || 1280) - crop.width}
                  value={crop.x}
                  onChange={(e) => setCrop({ ...crop, x: Number(e.target.value) })}
                  className="w-full p-2 bg-white rounded-lg border border-[#E9DCC8] text-xs font-mono text-[#102A43]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#102A43] block mb-1">Y Offset (px)</label>
                <input
                  type="number"
                  min={0}
                  max={(metadata?.height || 720) - crop.height}
                  value={crop.y}
                  onChange={(e) => setCrop({ ...crop, y: Number(e.target.value) })}
                  className="w-full p-2 bg-white rounded-lg border border-[#E9DCC8] text-xs font-mono text-[#102A43]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#102A43] block mb-1">Width (px)</label>
                <input
                  type="number"
                  min={60}
                  max={(metadata?.width || 1280) - crop.x}
                  value={crop.width}
                  onChange={(e) => setCrop({ ...crop, width: Number(e.target.value) })}
                  className="w-full p-2 bg-white rounded-lg border border-[#E9DCC8] text-xs font-mono text-[#102A43]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#102A43] block mb-1">Height (px)</label>
                <input
                  type="number"
                  min={60}
                  max={(metadata?.height || 720) - crop.y}
                  value={crop.height}
                  onChange={(e) => setCrop({ ...crop, height: Number(e.target.value) })}
                  className="w-full p-2 bg-white rounded-lg border border-[#E9DCC8] text-xs font-mono text-[#102A43]"
                />
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
                    Rendering cropped canvas frames...
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

            {croppedResult && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-emerald-900">Video Cropped Successfully!</h5>
                    <p className="text-[11px] text-emerald-700">
                      Output Resolution: <strong>{croppedResult.width}x{croppedResult.height}</strong> · Size: {croppedResult.formattedSize}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Cropped Video</span>
                </button>
              </div>
            )}

            {!croppedResult && (
              <button
                onClick={handleCrop}
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
                    <Crop className="w-4 h-4" />
                    <span>Crop Video to {crop.width}x{crop.height}</span>
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

import React, { useState, useEffect } from 'react';
import {
  Upload,
  Maximize2,
  Download,
  Check,
  AlertCircle,
  RefreshCw,
  FileVideo,
  Lock,
  Unlock,
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

export const VideoResizerTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [videoSrc, setVideoSrc] = useState<string>('');

  // Resize settings
  const [preset, setPreset] = useState<'16:9' | '9:16' | '1:1' | '4:5' | '4:3' | 'custom'>('16:9');
  const [width, setWidth] = useState<number>(1280);
  const [height, setHeight] = useState<number>(720);
  const [aspectRatioLocked, setAspectRatioLocked] = useState<boolean>(true);
  const [fitMode, setFitMode] = useState<'contain' | 'cover' | 'stretch'>('contain');
  const [bgColor, setBgColor] = useState<string>('#000000');

  // Processing state
  const [processing, setProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [resizedResult, setResizedResult] = useState<RenderedVideoResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      try {
        setError(null);
        setResizedResult(null);
        const meta = await getVideoMetadata(selected);
        setFile(selected);
        setMetadata(meta);
        setWidth(meta.width);
        setHeight(meta.height);
        setVideoSrc(URL.createObjectURL(selected));
      } catch (err) {
        setError('Unsupported video format.');
      }
    }
  };

  const applyPreset = (presetName: typeof preset) => {
    setPreset(presetName);
    if (presetName === '16:9') {
      setWidth(1280);
      setHeight(720);
    } else if (presetName === '9:16') {
      setWidth(720);
      setHeight(1280);
    } else if (presetName === '1:1') {
      setWidth(1080);
      setHeight(1080);
    } else if (presetName === '4:5') {
      setWidth(1080);
      setHeight(1350);
    } else if (presetName === '4:3') {
      setWidth(960);
      setHeight(720);
    }
  };

  const handleWidthChange = (val: number) => {
    setWidth(val);
    if (aspectRatioLocked && metadata) {
      setHeight(Math.round(val / metadata.aspectRatio));
    }
  };

  const handleHeightChange = (val: number) => {
    setHeight(val);
    if (aspectRatioLocked && metadata) {
      setWidth(Math.round(val * metadata.aspectRatio));
    }
  };

  const handleResize = async () => {
    if (!file || !metadata) return;

    try {
      setProcessing(true);
      setProgress(0);
      setError(null);
      setResizedResult(null);

      const result = await renderProcessedVideo({
        file,
        targetWidth: width,
        targetHeight: height,
        fitMode,
        backgroundColor: bgColor,
        fps: 30,
        onProgress: (p) => setProgress(p.percent),
      });

      setResizedResult(result);
      setProcessing(false);
      try {
        confetti({ particleCount: 50, spread: 60 });
      } catch {
        // ignore
      }
    } catch (err: unknown) {
      setProcessing(false);
      setError(err instanceof Error ? err.message : 'Error resizing video.');
    }
  };

  const handleDownload = () => {
    if (!resizedResult || !file) return;
    const a = document.createElement('a');
    a.href = resizedResult.url;
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    a.download = `${baseName}_resized_${width}x${height}.${resizedResult.extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  useEffect(() => {
    return () => {
      if (videoSrc) URL.revokeObjectURL(videoSrc);
      if (resizedResult?.url) URL.revokeObjectURL(resizedResult.url);
    };
  }, [videoSrc, resizedResult]);

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
            <Maximize2 className="w-7 h-7" />
          </div>
          <span className="text-base font-bold text-[#102A43]">
            Select video to resize
          </span>
          <span className="text-xs text-[#61758A] mt-1">
            Convert to TikTok, YouTube Shorts, Instagram Reels, or custom pixel dimensions
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
                  Original: {metadata?.width}x{metadata?.height} · {metadata?.formattedDuration} · {metadata?.formattedSize}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setMetadata(null);
                setResizedResult(null);
                if (videoSrc) URL.revokeObjectURL(videoSrc);
                setVideoSrc('');
              }}
              className="text-xs font-semibold text-[#61758A] hover:text-red-600 cursor-pointer"
            >
              Change File
            </button>
          </div>

          {/* Presets & Dimensions */}
          <div className="p-5 bg-white rounded-2xl border border-[#E9DCC8] space-y-4">
            <div>
              <label className="text-xs font-bold text-[#102A43] uppercase tracking-wider block mb-2">
                Social Media & Ratio Presets
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: '16:9', title: '16:9 YouTube', sub: '1280x720' },
                  { id: '9:16', title: '9:16 Shorts/TikTok', sub: '720x1280' },
                  { id: '1:1', title: '1:1 Square', sub: '1080x1080' },
                  { id: '4:5', title: '4:5 Portrait', sub: '1080x1350' },
                  { id: '4:3', title: '4:3 Standard', sub: '960x720' },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => applyPreset(p.id as typeof preset)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      preset === p.id
                        ? 'border-[#D98218] bg-[#FAF5EC] text-[#D98218] font-bold shadow-xs'
                        : 'border-[#E9DCC8] bg-white text-[#102A43]'
                    }`}
                  >
                    <div className="text-xs font-bold">{p.title}</div>
                    <div className="text-[10px] text-[#61758A] mt-0.5">{p.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Pixel Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#FAF5EC] rounded-xl border border-[#E9DCC8]">
              <div>
                <label className="text-xs font-bold text-[#102A43] block mb-1">Target Width (px)</label>
                <input
                  type="number"
                  min={160}
                  max={3840}
                  step={2}
                  value={width}
                  onChange={(e) => {
                    setPreset('custom');
                    handleWidthChange(Number(e.target.value));
                  }}
                  className="w-full p-2 bg-white rounded-lg border border-[#E9DCC8] text-sm font-mono text-[#102A43]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-[#102A43]">Target Height (px)</label>
                  <button
                    onClick={() => setAspectRatioLocked(!aspectRatioLocked)}
                    className="flex items-center gap-1 text-[11px] text-[#D98218] font-bold hover:underline cursor-pointer"
                  >
                    {aspectRatioLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    <span>{aspectRatioLocked ? 'Aspect Ratio Locked' : 'Unlocked'}</span>
                  </button>
                </div>
                <input
                  type="number"
                  min={160}
                  max={3840}
                  step={2}
                  value={height}
                  onChange={(e) => {
                    setPreset('custom');
                    handleHeightChange(Number(e.target.value));
                  }}
                  className="w-full p-2 bg-white rounded-lg border border-[#E9DCC8] text-sm font-mono text-[#102A43]"
                />
              </div>
            </div>

            {/* Fit Mode & Letterbox Color */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-bold text-[#102A43] block mb-1">Fit & Crop Mode</label>
                <select
                  value={fitMode}
                  onChange={(e) => setFitMode(e.target.value as typeof fitMode)}
                  className="w-full p-2 bg-white border border-[#E9DCC8] rounded-xl text-xs font-bold text-[#102A43]"
                >
                  <option value="contain">Fit with Letterbox / Black Bars</option>
                  <option value="cover">Fill & Zoom (Crop Edges)</option>
                  <option value="stretch">Stretch to Exact Size</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#102A43] block mb-1">Letterbox Bar Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-9 h-9 rounded-lg border border-[#E9DCC8] cursor-pointer"
                  />
                  <span className="font-mono text-xs font-bold text-[#102A43]">{bgColor}</span>
                </div>
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
                    Rescaling frames to {width}x{height}...
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

            {resizedResult && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-emerald-900">Video Resized Successfully!</h5>
                    <p className="text-[11px] text-emerald-700">
                      New Dimensions: <strong>{resizedResult.width}x{resizedResult.height}</strong> · Size: {resizedResult.formattedSize}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Resized Video</span>
                </button>
              </div>
            )}

            {!resizedResult && (
              <button
                onClick={handleResize}
                disabled={processing}
                className="w-full py-3 bg-[#D98218] hover:bg-[#C66A08] disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                {processing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Rendering Resized Video ({progress}%)...</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-4 h-4" />
                    <span>Resize Video to {width}x{height}</span>
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

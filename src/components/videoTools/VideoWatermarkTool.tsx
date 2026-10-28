import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Stamp,
  Type,
  Image as ImageIcon,
  Download,
  Check,
  AlertCircle,
  RefreshCw,
  FileVideo,
  Play,
  Pause,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  getVideoMetadata,
  renderProcessedVideo,
  formatBytes,
  formatTime,
  VideoMetadata,
  WatermarkSettings,
  RenderedVideoResult,
} from '../../services/video/videoProcessingService';

export const VideoWatermarkTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Watermark parameters
  const [watermarkType, setWatermarkType] = useState<'text' | 'image'>('text');
  const [watermarkText, setWatermarkText] = useState<string>('CODEMANIAC STUDIO');
  const [watermarkImgUrl, setWatermarkImgUrl] = useState<string>('');
  const [position, setPosition] = useState<WatermarkSettings['position']>('bottomRight');
  const [opacity, setOpacity] = useState<number>(0.85);
  const [fontSize, setFontSize] = useState<number>(28);
  const [fontColor, setFontColor] = useState<string>('#FFFFFF');
  const [bgBox, setBgBox] = useState<boolean>(true);
  const [bgColor, setBgColor] = useState<string>('rgba(0, 0, 0, 0.6)');
  const [scale, setScale] = useState<number>(1.0);

  // Processing state
  const [processing, setProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [renderedResult, setRenderedResult] = useState<RenderedVideoResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      try {
        setError(null);
        setRenderedResult(null);
        const meta = await getVideoMetadata(selected);
        setFile(selected);
        setMetadata(meta);
        setVideoSrc(URL.createObjectURL(selected));
      } catch (err) {
        setError('Unsupported video format.');
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const imgFile = e.target.files[0];
      const url = URL.createObjectURL(imgFile);
      setWatermarkImgUrl(url);
    }
  };

  const handleAddWatermark = async () => {
    if (!file || !metadata) return;

    try {
      setProcessing(true);
      setProgress(0);
      setError(null);
      setRenderedResult(null);

      const watermarkSettings: WatermarkSettings = {
        type: watermarkType,
        text: watermarkText,
        imageUrl: watermarkImgUrl,
        position,
        opacity,
        fontSize,
        fontColor,
        bgColor: bgBox ? bgColor : 'transparent',
        scale,
      };

      const result = await renderProcessedVideo({
        file,
        watermark: watermarkSettings,
        targetWidth: metadata.width,
        targetHeight: metadata.height,
        fps: 30,
        onProgress: (p) => setProgress(p.percent),
      });

      setRenderedResult(result);
      setProcessing(false);
      try {
        confetti({ particleCount: 50, spread: 60 });
      } catch {
        // ignore
      }
    } catch (err: unknown) {
      setProcessing(false);
      setError(err instanceof Error ? err.message : 'Error adding watermark to video.');
    }
  };

  const handleDownload = () => {
    if (!renderedResult || !file) return;
    const a = document.createElement('a');
    a.href = renderedResult.url;
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    a.download = `${baseName}_watermarked.${renderedResult.extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  useEffect(() => {
    return () => {
      if (videoSrc) URL.revokeObjectURL(videoSrc);
      if (watermarkImgUrl) URL.revokeObjectURL(watermarkImgUrl);
      if (renderedResult?.url) URL.revokeObjectURL(renderedResult.url);
    };
  }, [videoSrc, watermarkImgUrl, renderedResult]);

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
            <Stamp className="w-7 h-7" />
          </div>
          <span className="text-base font-bold text-[#102A43]">
            Select video to watermark
          </span>
          <span className="text-xs text-[#61758A] mt-1">
            Protect your content with custom text copyright, company logo, or transparent branding stamp
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
                  {metadata?.width}x{metadata?.height} · {metadata?.formattedDuration} · {metadata?.formattedSize}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setMetadata(null);
                setRenderedResult(null);
                if (videoSrc) URL.revokeObjectURL(videoSrc);
                setVideoSrc('');
              }}
              className="text-xs font-semibold text-[#61758A] hover:text-red-600 cursor-pointer"
            >
              Change File
            </button>
          </div>

          {/* Interactive Player with Real-time Watermark Overlay Preview */}
          <div className="relative bg-black rounded-2xl overflow-hidden border border-[#E9DCC8] aspect-video flex items-center justify-center max-h-[380px]">
            <video
              ref={videoRef}
              src={videoSrc}
              className="w-full h-full object-contain"
              onEnded={() => setIsPlaying(false)}
            />

            {/* Live Watermark Overlay Element */}
            <div
              style={{
                opacity,
              }}
              className={`absolute pointer-events-none p-4 ${
                position === 'topLeft'
                  ? 'top-4 left-4'
                  : position === 'topRight'
                  ? 'top-4 right-4'
                  : position === 'bottomLeft'
                  ? 'bottom-4 left-4'
                  : position === 'center'
                  ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
                  : 'bottom-4 right-4'
              }`}
            >
              {watermarkType === 'text' && watermarkText ? (
                <div
                  style={{
                    backgroundColor: bgBox ? bgColor : 'transparent',
                    color: fontColor,
                    fontSize: `${Math.max(12, fontSize * 0.65)}px`,
                  }}
                  className="font-bold px-3 py-1.5 rounded-lg shadow-sm backdrop-blur-xs font-sans tracking-wide"
                >
                  {watermarkText}
                </div>
              ) : watermarkType === 'image' && watermarkImgUrl ? (
                <img
                  src={watermarkImgUrl}
                  alt="Watermark Preview"
                  style={{ transform: `scale(${scale * 0.7})` }}
                  className="max-h-20 max-w-40 object-contain drop-shadow-md origin-bottom-right"
                />
              ) : null}
            </div>
          </div>

          {/* Play control */}
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
              Watermark position & opacity updates live on the video above
            </span>
          </div>

          {/* Watermark Configuration */}
          <div className="p-5 bg-white rounded-2xl border border-[#E9DCC8] space-y-4">
            {/* Watermark Type Selector */}
            <div className="flex gap-2 border-b border-[#E9DCC8] pb-3">
              <button
                onClick={() => setWatermarkType('text')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  watermarkType === 'text'
                    ? 'bg-[#D98218] text-white shadow-xs'
                    : 'bg-[#FAF5EC] text-[#102A43] border border-[#E9DCC8]'
                }`}
              >
                <Type className="w-4 h-4" />
                <span>Text Watermark</span>
              </button>

              <button
                onClick={() => setWatermarkType('image')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  watermarkType === 'image'
                    ? 'bg-[#D98218] text-white shadow-xs'
                    : 'bg-[#FAF5EC] text-[#102A43] border border-[#E9DCC8]'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>Image / Logo Watermark</span>
              </button>
            </div>

            {/* Text options */}
            {watermarkType === 'text' ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-[#102A43] block mb-1">Watermark Text</label>
                  <input
                    type="text"
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    placeholder="Enter text, e.g. © 2026 Your Brand"
                    className="w-full p-2.5 bg-white border border-[#E9DCC8] rounded-xl text-sm text-[#102A43] font-semibold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#102A43] block mb-1">Text Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={fontColor}
                        onChange={(e) => setFontColor(e.target.value)}
                        className="w-9 h-9 rounded-lg border border-[#E9DCC8] cursor-pointer"
                      />
                      <span className="font-mono text-xs font-bold text-[#102A43]">{fontColor}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#102A43] block mb-1">Font Size ({fontSize}px)</label>
                    <input
                      type="range"
                      min={16}
                      max={64}
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      className="w-full accent-[#D98218]"
                    />
                  </div>

                  <div className="flex items-center pt-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bgBox}
                        onChange={(e) => setBgBox(e.target.checked)}
                        className="accent-[#D98218] w-4 h-4 rounded"
                      />
                      <span className="text-xs font-bold text-[#102A43]">Background Box</span>
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              /* Image / Logo Upload */
              <div className="space-y-3">
                <label className="border-2 border-dashed border-[#E9DCC8] hover:border-[#D98218] rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer bg-[#FAF5EC]/40">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <ImageIcon className="w-6 h-6 text-[#D98218] mb-1" />
                  <span className="text-xs font-bold text-[#102A43]">Upload PNG Logo with Transparency</span>
                  <span className="text-[10px] text-[#61758A] mt-0.5">Recommended 200x200 or transparent banner</span>
                </label>

                {watermarkImgUrl && (
                  <div>
                    <label className="text-xs font-bold text-[#102A43] block mb-1">Logo Scale ({scale.toFixed(1)}x)</label>
                    <input
                      type="range"
                      min={0.3}
                      max={2.0}
                      step={0.1}
                      value={scale}
                      onChange={(e) => setScale(Number(e.target.value))}
                      className="w-full accent-[#D98218]"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Position & Opacity (Common) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#E9DCC8]">
              <div>
                <label className="text-xs font-bold text-[#102A43] block mb-1">Position on Video</label>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value as typeof position)}
                  className="w-full p-2 bg-[#FAF5EC] border border-[#E9DCC8] rounded-xl text-xs font-bold text-[#102A43]"
                >
                  <option value="bottomRight">Bottom-Right (Standard)</option>
                  <option value="bottomLeft">Bottom-Left</option>
                  <option value="topRight">Top-Right</option>
                  <option value="topLeft">Top-Left</option>
                  <option value="center">Center</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-[#102A43] mb-1">
                  <span>Opacity</span>
                  <span className="font-mono text-[#D98218]">{Math.round(opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={1.0}
                  step={0.05}
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="w-full accent-[#D98218]"
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
                    Burning watermark onto video frames...
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

            {renderedResult && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-emerald-900">Watermark Applied Successfully!</h5>
                    <p className="text-[11px] text-emerald-700">
                      Output Size: {renderedResult.formattedSize} · Verified Format
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Watermarked Video</span>
                </button>
              </div>
            )}

            {!renderedResult && (
              <button
                onClick={handleAddWatermark}
                disabled={processing || (watermarkType === 'text' && !watermarkText) || (watermarkType === 'image' && !watermarkImgUrl)}
                className="w-full py-3 bg-[#D98218] hover:bg-[#C66A08] disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                {processing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Applying Watermark ({progress}%)...</span>
                  </>
                ) : (
                  <>
                    <Stamp className="w-4 h-4" />
                    <span>Apply Watermark to Video</span>
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

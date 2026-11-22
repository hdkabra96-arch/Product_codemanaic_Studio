import React, { useState } from 'react';
import {
  Upload,
  Download,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Check,
  AlertCircle,
  RefreshCw,
  Image as ImageIcon,
  Eye,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { rotateImage, RotateImageOptions, getImageDimensions } from '../../services/image/imageProcessingService';
import { ImagePreviewModal } from './ImagePreviewModal';

export const ImageRotateTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [origDims, setOrigDims] = useState<{ width: number; height: number } | null>(null);

  const [angle, setAngle] = useState<0 | 90 | 180 | 270>(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [outputFormat, setOutputFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg');
  const [quality, setQuality] = useState(92);
  const [result, setResult] = useState<{
    blob: Blob;
    fileName: string;
    width: number;
    height: number;
    newSize: number;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    imageSrc: string;
    compareSrc?: string;
    fileName?: string;
    fileSizeStr?: string;
    dimensions?: { width: number; height: number };
  } | null>(null);

  const handleFileSelect = async (selected: File) => {
    if (!selected.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPG, PNG, WEBP, GIF).');
      return;
    }
    setFile(selected);
    setErrorMsg(null);
    setResult(null);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
    setAngle(0);
    setFlipH(false);
    setFlipV(false);

    const url = URL.createObjectURL(selected);
    setPreviewUrl(url);

    try {
      const dims = await getImageDimensions(selected);
      setOrigDims(dims);
    } catch {
      // ignore
    }
  };

  const handleRotateRight = () => {
    setAngle((prev) => ((prev + 90) % 360) as 0 | 90 | 180 | 270);
  };

  const handleRotateLeft = () => {
    setAngle((prev) => ((prev + 270) % 360) as 0 | 90 | 180 | 270);
  };

  const handleApplyRotation = async () => {
    if (!file) return;
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const res = await rotateImage(file, {
        angle,
        flipHorizontal: flipH,
        flipVertical: flipV,
        format: outputFormat,
        quality: quality / 100,
      });

      setResult(res);
      const resUrl = URL.createObjectURL(res.blob);
      setResultUrl(resUrl);
      setIsProcessing(false);
      try {
        confetti({ particleCount: 35, spread: 60 });
      } catch {
        // ignore
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error rotating image.');
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const url = resultUrl || URL.createObjectURL(result.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (!resultUrl) setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  const handleReset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null);
    setPreviewUrl(null);
    setResultUrl(null);
    setOrigDims(null);
    setResult(null);
    setErrorMsg(null);
  };

  const openOriginalPreview = () => {
    if (!file || !previewUrl) return;
    setModalConfig({
      title: `${file.name} (Original Image)`,
      imageSrc: previewUrl,
      fileName: file.name,
      fileSizeStr: `${(file.size / 1024).toFixed(1)} KB`,
      dimensions: origDims || undefined,
    });
    setIsPreviewOpen(true);
  };

  const openResultPreview = () => {
    if (!result || !resultUrl) return;
    setModalConfig({
      title: `${result.fileName} (Rotated Result)`,
      imageSrc: resultUrl,
      compareSrc: previewUrl || undefined,
      fileName: result.fileName,
      fileSizeStr: `${(result.newSize / 1024).toFixed(1)} KB`,
      dimensions: { width: result.width, height: result.height },
    });
    setIsPreviewOpen(true);
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <label className="border-2 border-dashed border-[#E9DCC8] hover:border-[#D98218] bg-[#FAF5EC]/60 hover:bg-[#FFF3DF]/40 rounded-3xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelect(e.target.files[0]);
              }
            }}
          />
          <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-[#E9DCC8] flex items-center justify-center text-[#D98218] mb-4">
            <RotateCw className="w-8 h-8" />
          </div>
          <span className="text-lg font-bold text-[#102A43]">
            Select an image to rotate & flip
          </span>
          <span className="text-xs text-[#61758A] mt-1.5">
            Rotate 90°, 180°, 270° or flip horizontally / vertically in real-time
          </span>
          <span className="mt-5 px-6 py-2.5 rounded-full bg-[#D98218] text-white hover:bg-[#C66A08] text-sm font-bold shadow-md">
            Select IMAGE
          </span>
        </label>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Interactive Rotation Live Viewport */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div className="w-full bg-[#FAF5EC] rounded-3xl p-6 border border-[#E9DCC8] shadow-inner flex flex-col items-center justify-center min-h-[380px] overflow-hidden">
              <div
                className="transition-transform duration-300 ease-out flex items-center justify-center"
                style={{
                  transform: `rotate(${angle}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                }}
              >
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-[320px] max-w-full rounded-2xl shadow-md border border-[#E9DCC8] object-contain"
                  />
                )}
              </div>
              <button
                type="button"
                onClick={openOriginalPreview}
                className="mt-4 px-3 py-1.5 bg-white hover:bg-[#FFF8EE] text-[#D98218] border border-[#E9DCC8] hover:border-[#D98218] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Review Original Image</span>
              </button>
            </div>

            <button
              onClick={handleReset}
              className="mt-3 text-xs text-[#D98218] font-bold hover:underline cursor-pointer"
            >
              Choose another image
            </button>
          </div>

          {/* Right Column: Rotation Controls & Format Options */}
          <div className="lg:col-span-5 space-y-5 bg-white p-6 rounded-3xl border border-[#E9DCC8] shadow-sm">
            <div>
              <label className="block text-xs font-bold text-[#102A43] uppercase tracking-wider mb-2.5">
                Rotate Angle
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleRotateLeft}
                  className="p-3.5 rounded-2xl border border-[#E9DCC8] hover:bg-[#FAF5EC] font-bold text-xs flex items-center justify-center gap-2 text-[#102A43] cursor-pointer shadow-xs"
                >
                  <RotateCcw className="w-4 h-4 text-[#D98218]" />
                  <span>Left 90°</span>
                </button>
                <button
                  type="button"
                  onClick={handleRotateRight}
                  className="p-3.5 rounded-2xl border border-[#E9DCC8] hover:bg-[#FAF5EC] font-bold text-xs flex items-center justify-center gap-2 text-[#102A43] cursor-pointer shadow-xs"
                >
                  <RotateCw className="w-4 h-4 text-[#D98218]" />
                  <span>Right 90°</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#102A43] uppercase tracking-wider mb-2.5">
                Flip Axis
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFlipH(!flipH)}
                  className={`p-3.5 rounded-2xl border font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs ${
                    flipH
                      ? 'bg-[#102A43] text-white border-[#102A43]'
                      : 'bg-white hover:bg-[#FAF5EC] border-[#E9DCC8] text-[#102A43]'
                  }`}
                >
                  <FlipHorizontal className="w-4 h-4" />
                  <span>Flip Horizontal</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFlipV(!flipV)}
                  className={`p-3.5 rounded-2xl border font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs ${
                    flipV
                      ? 'bg-[#102A43] text-white border-[#102A43]'
                      : 'bg-white hover:bg-[#FAF5EC] border-[#E9DCC8] text-[#102A43]'
                  }`}
                >
                  <FlipVertical className="w-4 h-4" />
                  <span>Flip Vertical</span>
                </button>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-[#E9DCC8]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#102A43] mb-1">Export Format</label>
                  <select
                    value={outputFormat}
                    onChange={(e) => setOutputFormat(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-[#E9DCC8] bg-white text-xs font-bold text-[#102A43]"
                  >
                    <option value="image/jpeg">JPG Image</option>
                    <option value="image/png">PNG Image</option>
                    <option value="image/webp">WEBP Image</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#102A43] mb-1">Quality ({quality}%)</label>
                  <input
                    type="range"
                    min={50}
                    max={100}
                    value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="w-full accent-[#D98218] cursor-pointer mt-2"
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleApplyRotation}
              className="w-full py-4 rounded-full bg-gradient-to-r from-[#D98218] to-[#C66A08] text-white font-bold text-sm shadow-[0_4px_14px_rgba(217,130,24,0.35)] hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Rotation...</span>
                </>
              ) : (
                <>
                  <RotateCw className="w-4 h-4" />
                  <span>Rotate IMAGE</span>
                </>
              )}
            </button>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {result && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col gap-3 shadow-xs">
                <div>
                  <h4 className="text-xs font-bold text-emerald-900">Image Rotated!</h4>
                  <p className="text-[11px] text-emerald-700">
                    {result.width} × {result.height} px · {(result.newSize / 1024).toFixed(1)} KB
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={openResultPreview}
                    className="px-3.5 py-2 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold rounded-full shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Preview & Compare Result</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="flex-1 px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer min-w-[120px]"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full-Feature Image Preview Modal */}
      {modalConfig && (
        <ImagePreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title={modalConfig.title}
          imageSrc={modalConfig.imageSrc}
          compareSrc={modalConfig.compareSrc}
          fileName={modalConfig.fileName}
          fileSizeStr={modalConfig.fileSizeStr}
          dimensions={modalConfig.dimensions}
        />
      )}
    </div>
  );
};

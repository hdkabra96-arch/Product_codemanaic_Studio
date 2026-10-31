import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { rotateImage, RotateImageOptions } from '../../services/image/imageProcessingService';

export const ImageRotateTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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

  const handleFileSelect = (selected: File) => {
    if (!selected.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPG, PNG, WEBP, GIF).');
      return;
    }
    setFile(selected);
    setErrorMsg(null);
    setResult(null);
    setAngle(0);
    setFlipH(false);
    setFlipV(false);
    const url = URL.createObjectURL(selected);
    setPreviewUrl(url);
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
      setIsProcessing(false);
      try {
        confetti({ particleCount: 40, spread: 60 });
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
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
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
            Select image or drag & drop here
          </span>
          <span className="text-xs text-[#61758A] mt-1.5">
            Rotate JPG, PNG, WEBP or GIF images in seconds
          </span>
          <span className="mt-5 px-6 py-2.5 rounded-full bg-[#D98218] text-white hover:bg-[#C66A08] text-sm font-bold shadow-md">
            Select IMAGE
          </span>
        </label>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Visual Interactive Canvas Preview */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div className="w-full bg-[#FAF5EC] rounded-3xl p-6 border border-[#E9DCC8] shadow-inner flex items-center justify-center min-h-[380px] overflow-hidden relative">
              {previewUrl && (
                <div
                  className="transition-transform duration-300 ease-out"
                  style={{
                    transform: `rotate(${angle}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                  }}
                >
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-[360px] max-w-full rounded-xl shadow-lg border border-[#E9DCC8] object-contain"
                  />
                </div>
              )}

              {/* Angle Pill */}
              <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#102A43]/80 backdrop-blur-sm text-white text-xs font-bold font-mono">
                {angle}° {flipH ? '· Flip H' : ''} {flipV ? '· Flip V' : ''}
              </div>
            </div>

            <div className="flex items-center justify-between w-full mt-4 text-xs text-[#61758A]">
              <span>Original File: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)</span>
              <button
                onClick={() => {
                  setFile(null);
                  setPreviewUrl(null);
                  setResult(null);
                }}
                className="text-[#D98218] font-bold hover:underline cursor-pointer"
              >
                Change Image
              </button>
            </div>
          </div>

          {/* Right Column: Controls & Rotation Actions */}
          <div className="lg:col-span-5 space-y-5 bg-white p-6 rounded-3xl border border-[#E9DCC8] shadow-sm">
            <div>
              <label className="block text-xs font-bold text-[#102A43] uppercase tracking-wider mb-2.5">
                Rotate Controls
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleRotateRight}
                  className="p-3.5 rounded-2xl bg-[#FFF3DF] hover:bg-[#F4A62A]/20 border border-[#F4A62A]/30 text-[#D98218] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
                >
                  <RotateCw className="w-4 h-4" />
                  <span>Right (+90°)</span>
                </button>
                <button
                  type="button"
                  onClick={handleRotateLeft}
                  className="p-3.5 rounded-2xl bg-[#FFF3DF] hover:bg-[#F4A62A]/20 border border-[#F4A62A]/30 text-[#D98218] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Left (-90°)</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#102A43] uppercase tracking-wider mb-2.5">
                Flip Controls
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
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
                <div>
                  <h4 className="text-xs font-bold text-emerald-900">Image Rotated!</h4>
                  <p className="text-[11px] text-emerald-700">
                    {result.width} × {result.height} px · {(result.newSize / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

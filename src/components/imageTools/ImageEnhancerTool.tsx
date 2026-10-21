import React, { useState } from 'react';
import { Upload, Download, RefreshCw, Check, AlertCircle, Sparkles, Sliders } from 'lucide-react';
import confetti from 'canvas-confetti';
import { enhanceImage } from '../../services/image/imageProcessingService';

export const ImageEnhancerTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [enhancedUrl, setEnhancedUrl] = useState<string | null>(null);

  // Enhancer presets & toggles
  const [sharpen, setSharpen] = useState<boolean>(true);
  const [contrastBoost, setContrastBoost] = useState<boolean>(true);
  const [upscale2x, setUpscale2x] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'enhanced' | 'original'>('enhanced');

  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    blob: Blob;
    fileName: string;
    originalWidth: number;
    originalHeight: number;
    newWidth: number;
    newHeight: number;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileSelect = (selected: File) => {
    if (!selected.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file.');
      return;
    }
    setFile(selected);
    setErrorMsg(null);
    setResult(null);
    setEnhancedUrl(null);

    const url = URL.createObjectURL(selected);
    setPreviewUrl(url);
  };

  const handleEnhance = async () => {
    if (!file) return;
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const res = await enhanceImage(file, {
        sharpen,
        contrastBoost,
        upscale2x,
      });

      setResult(res);
      const url = URL.createObjectURL(res.blob);
      setEnhancedUrl(url);
      setIsProcessing(false);
      setViewMode('enhanced');

      try {
        confetti({ particleCount: 45, spread: 60 });
      } catch {
        // ignore
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error enhancing image.');
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

  const handleReset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (enhancedUrl) URL.revokeObjectURL(enhancedUrl);
    setFile(null);
    setPreviewUrl(null);
    setEnhancedUrl(null);
    setResult(null);
    setErrorMsg(null);
  };

  return (
    <div className="space-y-4">
      {!file ? (
        <label className="border-2 border-dashed border-[#E9DCC8] hover:border-[#D98218] bg-[#FAF5EC]/60 hover:bg-[#FFF3DF]/40 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all">
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
          <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-[#E9DCC8] flex items-center justify-center text-[#D98218] mb-3">
            <Sparkles className="w-7 h-7" />
          </div>
          <span className="text-base font-bold text-[#102A43]">
            Select an image to enhance
          </span>
          <span className="text-xs text-[#61758A] mt-1">
            Unsharp masking, clarity restoration, auto-contrast & 2x super-sampling
          </span>
          <span className="mt-4 px-4 py-1.5 rounded-full bg-white border border-[#E9DCC8] text-xs font-bold text-[#102A43] shadow-sm">
            Browse Image
          </span>
        </label>
      ) : (
        <div className="space-y-4">
          {/* Header */}
          <div className="p-4 bg-white rounded-2xl border border-[#E9DCC8] shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-[#102A43] truncate max-w-xs">{file.name}</span>
              <span className="text-xs text-[#61758A]">{(file.size / 1024).toFixed(1)} KB</span>
            </div>
            <button
              onClick={handleReset}
              className="text-xs font-semibold text-[#61758A] hover:text-red-600 cursor-pointer"
            >
              Change File
            </button>
          </div>

          {/* Preview Container with Before / After toggle */}
          <div className="relative w-full max-h-[300px] bg-[#FAF5EC] rounded-2xl border border-[#E9DCC8] overflow-hidden flex items-center justify-center p-4">
            {enhancedUrl && viewMode === 'enhanced' ? (
              <img
                src={enhancedUrl}
                alt="Enhanced"
                className="max-h-[260px] max-w-full object-contain rounded-lg"
              />
            ) : previewUrl ? (
              <img
                src={previewUrl}
                alt="Original"
                className="max-h-[260px] max-w-full object-contain rounded-lg"
              />
            ) : null}

            {enhancedUrl && (
              <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm p-1 rounded-xl shadow-md border border-[#E9DCC8] flex gap-1">
                <button
                  onClick={() => setViewMode('enhanced')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    viewMode === 'enhanced'
                      ? 'bg-[#D98218] text-white'
                      : 'text-[#102A43] hover:bg-white'
                  }`}
                >
                  Enhanced (2x)
                </button>
                <button
                  onClick={() => setViewMode('original')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    viewMode === 'original'
                      ? 'bg-[#102A43] text-white'
                      : 'text-[#102A43] hover:bg-white'
                  }`}
                >
                  Original
                </button>
              </div>
            )}
          </div>

          {/* Enhancement Options */}
          <div className="p-4 bg-[#FAF5EC] rounded-2xl border border-[#E9DCC8] space-y-3">
            <span className="text-xs font-bold text-[#102A43] block">
              ENHANCEMENT MODULES
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label className="p-3 bg-white rounded-xl border border-[#E9DCC8] flex items-center gap-2.5 cursor-pointer hover:border-[#D98218] transition-colors">
                <input
                  type="checkbox"
                  checked={sharpen}
                  onChange={(e) => setSharpen(e.target.checked)}
                  className="w-4 h-4 accent-[#D98218] rounded"
                />
                <div>
                  <span className="text-xs font-bold text-[#102A43] block">Unsharp Mask</span>
                  <span className="text-[10px] text-[#61758A]">Sharpens soft edges</span>
                </div>
              </label>

              <label className="p-3 bg-white rounded-xl border border-[#E9DCC8] flex items-center gap-2.5 cursor-pointer hover:border-[#D98218] transition-colors">
                <input
                  type="checkbox"
                  checked={contrastBoost}
                  onChange={(e) => setContrastBoost(e.target.checked)}
                  className="w-4 h-4 accent-[#D98218] rounded"
                />
                <div>
                  <span className="text-xs font-bold text-[#102A43] block">Color Pop</span>
                  <span className="text-[10px] text-[#61758A]">Boosts tone & dynamic range</span>
                </div>
              </label>

              <label className="p-3 bg-white rounded-xl border border-[#E9DCC8] flex items-center gap-2.5 cursor-pointer hover:border-[#D98218] transition-colors">
                <input
                  type="checkbox"
                  checked={upscale2x}
                  onChange={(e) => setUpscale2x(e.target.checked)}
                  className="w-4 h-4 accent-[#D98218] rounded"
                />
                <div>
                  <span className="text-xs font-bold text-[#102A43] block">Super-Sampling 2x</span>
                  <span className="text-[10px] text-[#61758A]">Doubles pixel resolution</span>
                </div>
              </label>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!result ? (
            <button
              onClick={handleEnhance}
              disabled={isProcessing}
              className="w-full py-3 rounded-full bg-[#D98218] hover:bg-[#C66A08] disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Enhancing Image Detail...</span>
                </>
              ) : (
                <span>Enhance Image Quality</span>
              )}
            </button>
          ) : (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-emerald-950">Enhanced Successfully</h5>
                  <p className="text-[11px] text-emerald-700">
                    {result.originalWidth}×{result.originalHeight} → {result.newWidth}×{result.newHeight} px • {(result.blob.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={handleDownload}
                className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Enhanced</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

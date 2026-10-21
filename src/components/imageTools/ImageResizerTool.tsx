import React, { useState } from 'react';
import { Upload, Download, RefreshCw, Check, AlertCircle, Maximize, Lock, Unlock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { resizeImage, getImageDimensions } from '../../services/image/imageProcessingService';

export const ImageResizerTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [originalDims, setOriginalDims] = useState<{ width: number; height: number } | null>(null);

  // Resizing state
  const [targetWidth, setTargetWidth] = useState<number>(800);
  const [targetHeight, setTargetHeight] = useState<number>(600);
  const [lockRatio, setLockRatio] = useState<boolean>(true);
  const [aspectRatio, setAspectRatio] = useState<number>(4 / 3);
  const [fitMode, setFitMode] = useState<'stretch' | 'contain' | 'cover'>('stretch');
  const [outFormat, setOutFormat] = useState<'image/png' | 'image/jpeg' | 'image/webp'>('image/png');

  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    blob: Blob;
    fileName: string;
    width: number;
    height: number;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileSelect = async (selected: File) => {
    if (!selected.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file.');
      return;
    }
    setFile(selected);
    setErrorMsg(null);
    setResult(null);

    const url = URL.createObjectURL(selected);
    setPreviewUrl(url);

    try {
      const dims = await getImageDimensions(selected);
      setOriginalDims(dims);
      setTargetWidth(dims.width);
      setTargetHeight(dims.height);
      setAspectRatio(dims.width / dims.height);
    } catch {
      // ignore
    }
  };

  const handleWidthChange = (val: number) => {
    setTargetWidth(val);
    if (lockRatio && aspectRatio > 0) {
      setTargetHeight(Math.max(1, Math.round(val / aspectRatio)));
    }
  };

  const handleHeightChange = (val: number) => {
    setTargetHeight(val);
    if (lockRatio && aspectRatio > 0) {
      setTargetWidth(Math.max(1, Math.round(val * aspectRatio)));
    }
  };

  const applyPercentage = (pct: number) => {
    if (!originalDims) return;
    const w = Math.max(1, Math.round(originalDims.width * (pct / 100)));
    const h = Math.max(1, Math.round(originalDims.height * (pct / 100)));
    setTargetWidth(w);
    setTargetHeight(h);
  };

  const handleResize = async () => {
    if (!file) return;
    if (targetWidth <= 0 || targetHeight <= 0) {
      setErrorMsg('Dimensions must be greater than 0.');
      return;
    }
    if (targetWidth > 12000 || targetHeight > 12000) {
      setErrorMsg('Dimensions cannot exceed 12,000 pixels.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const res = await resizeImage(file, {
        targetWidth,
        targetHeight,
        mode: fitMode,
        format: outFormat,
      });

      setResult(res);
      setIsProcessing(false);
      try {
        confetti({ particleCount: 40, spread: 60 });
      } catch {
        // ignore
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error resizing image.');
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
    setFile(null);
    setPreviewUrl(null);
    setOriginalDims(null);
    setResult(null);
    setErrorMsg(null);
  };

  return (
    <div className="space-y-5">
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
            <Maximize className="w-7 h-7" />
          </div>
          <span className="text-base font-bold text-[#102A43]">
            Select an image to resize
          </span>
          <span className="text-xs text-[#61758A] mt-1">
            Pixel precision, aspect ratio lock, and fit controls
          </span>
          <span className="mt-4 px-4 py-1.5 rounded-full bg-white border border-[#E9DCC8] text-xs font-bold text-[#102A43] shadow-sm">
            Browse File
          </span>
        </label>
      ) : (
        <div className="space-y-4">
          {/* Header */}
          <div className="p-4 bg-white rounded-2xl border border-[#E9DCC8] shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#FAF5EC] border border-[#E9DCC8] overflow-hidden flex items-center justify-center shrink-0">
                {previewUrl && (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-[#102A43] truncate max-w-xs">{file.name}</h4>
                <span className="text-xs text-[#61758A]">
                  Original: {originalDims ? `${originalDims.width} × ${originalDims.height} px` : ''} • {(file.size / 1024).toFixed(1)} KB
                </span>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="text-xs font-semibold text-[#61758A] hover:text-red-600 cursor-pointer"
            >
              Change File
            </button>
          </div>

          {/* Controls */}
          <div className="p-4 bg-[#FAF5EC] rounded-2xl border border-[#E9DCC8] space-y-4">
            {/* Quick Percentage Presets */}
            <div>
              <span className="text-xs font-bold text-[#102A43] block mb-2">QUICK SCALE PRESETS</span>
              <div className="flex flex-wrap gap-2">
                {[25, 50, 75, 100, 150, 200].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => applyPercentage(pct)}
                    className="px-3 py-1 rounded-xl bg-white border border-[#E9DCC8] text-xs font-bold text-[#102A43] hover:border-[#D98218] transition-colors cursor-pointer"
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Pixel Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div>
                <label className="text-xs font-bold text-[#102A43] block mb-1">WIDTH (PX)</label>
                <input
                  type="number"
                  min="1"
                  max="12000"
                  value={targetWidth}
                  onChange={(e) => handleWidthChange(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-[#E9DCC8] text-sm font-bold text-[#102A43] bg-white focus:outline-none focus:border-[#D98218]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#102A43] block mb-1">HEIGHT (PX)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="12000"
                    value={targetHeight}
                    onChange={(e) => handleHeightChange(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-[#E9DCC8] text-sm font-bold text-[#102A43] bg-white focus:outline-none focus:border-[#D98218]"
                  />
                  <button
                    onClick={() => setLockRatio(!lockRatio)}
                    title={lockRatio ? 'Unlock Aspect Ratio' : 'Lock Aspect Ratio'}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                      lockRatio
                        ? 'bg-[#D98218] text-white border-[#D98218]'
                        : 'bg-white text-[#61758A] border-[#E9DCC8]'
                    }`}
                  >
                    {lockRatio ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Fit mode and Format */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#E9DCC8]">
              <div>
                <label className="text-xs font-bold text-[#102A43] block mb-1.5">RESIZE BEHAVIOR</label>
                <div className="flex gap-1.5">
                  {[
                    { id: 'stretch', label: 'Stretch' },
                    { id: 'contain', label: 'Fit/Contain' },
                    { id: 'cover', label: 'Fill/Cover' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setFitMode(m.id as any)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                        fitMode === m.id
                          ? 'bg-[#102A43] text-white border-[#102A43]'
                          : 'bg-white text-[#102A43] border-[#E9DCC8]'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#102A43] block mb-1.5">OUTPUT FORMAT</label>
                <div className="flex gap-1.5">
                  {[
                    { id: 'image/png', label: 'PNG' },
                    { id: 'image/jpeg', label: 'JPG' },
                    { id: 'image/webp', label: 'WEBP' },
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      onClick={() => setOutFormat(fmt.id as any)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                        outFormat === fmt.id
                          ? 'bg-[#D98218] text-white border-[#D98218]'
                          : 'bg-white text-[#102A43] border-[#E9DCC8]'
                      }`}
                    >
                      {fmt.label}
                    </button>
                  ))}
                </div>
              </div>
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
              onClick={handleResize}
              disabled={isProcessing}
              className="w-full py-3 rounded-full bg-[#D98218] hover:bg-[#C66A08] disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Resizing Image...</span>
                </>
              ) : (
                <span>Resize to {targetWidth} × {targetHeight} px</span>
              )}
            </button>
          ) : (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-emerald-950">Resizing Complete</h5>
                    <p className="text-[11px] text-emerald-700">
                      Output dimensions: {result.width} × {result.height} px ({(result.blob.size / 1024).toFixed(1)} KB)
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleDownload}
                  className="flex-1 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Resized Image</span>
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2.5 rounded-full bg-white border border-emerald-200 text-emerald-900 text-xs font-bold hover:bg-emerald-100/50 transition-colors cursor-pointer"
                >
                  Resize Another
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

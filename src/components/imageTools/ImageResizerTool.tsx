import React, { useState } from 'react';
import { Upload, Download, RefreshCw, Check, AlertCircle, Maximize, Lock, Unlock, Eye } from 'lucide-react';
import confetti from 'canvas-confetti';
import { resizeImage, getImageDimensions } from '../../services/image/imageProcessingService';
import { ImagePreviewModal } from './ImagePreviewModal';

export const ImageResizerTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
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
      setErrorMsg('Please select a valid image file.');
      return;
    }
    setFile(selected);
    setErrorMsg(null);
    setResult(null);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);

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

  const handleResize = async () => {
    if (!file) return;
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
      const resUrl = URL.createObjectURL(res.blob);
      setResultUrl(resUrl);
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
    setOriginalDims(null);
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
      dimensions: originalDims || undefined,
    });
    setIsPreviewOpen(true);
  };

  const openResultPreview = () => {
    if (!result || !resultUrl) return;
    setModalConfig({
      title: `${result.fileName} (Resized Image)`,
      imageSrc: resultUrl,
      compareSrc: previewUrl || undefined,
      fileName: result.fileName,
      fileSizeStr: `${(result.blob.size / 1024).toFixed(1)} KB`,
      dimensions: { width: result.width, height: result.height },
    });
    setIsPreviewOpen(true);
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
            Change pixel dimensions or scale percentage accurately with custom aspect ratio control
          </span>
          <span className="mt-4 px-4 py-1.5 rounded-full bg-white border border-[#E9DCC8] text-xs font-bold text-[#102A43] shadow-sm">
            Browse File
          </span>
        </label>
      ) : (
        <div className="space-y-4">
          {/* Header Card with Preview Option */}
          <div className="p-4 bg-white rounded-2xl border border-[#E9DCC8] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div 
                onClick={openOriginalPreview}
                className="w-14 h-14 rounded-xl bg-[#FAF5EC] border border-[#E9DCC8] overflow-hidden flex items-center justify-center shrink-0 cursor-pointer relative group"
                title="Click to preview full size"
              >
                {previewUrl && (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                  <Eye className="w-4 h-4" />
                </div>
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-[#102A43] truncate max-w-xs">{file.name}</h4>
                <span className="text-xs text-[#61758A]">
                  Original: {originalDims ? `${originalDims.width} × ${originalDims.height} px • ` : ''}
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openOriginalPreview}
                className="px-3.5 py-1.5 bg-[#FFF8EE] hover:bg-[#FFF3DF] text-[#D98218] border border-[#E9DCC8] hover:border-[#D98218] rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Review Image</span>
              </button>
              <button
                onClick={handleReset}
                className="text-xs font-semibold text-[#61758A] hover:text-red-600 px-2 py-1 cursor-pointer"
              >
                Change File
              </button>
            </div>
          </div>

          {/* Resize Controls */}
          <div className="p-4 bg-[#FAF5EC] rounded-2xl border border-[#E9DCC8] space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[#102A43] block mb-1">WIDTH (PX)</label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={targetWidth}
                  onChange={(e) => handleWidthChange(Number(e.target.value))}
                  className="w-full p-2.5 bg-white border border-[#E9DCC8] rounded-xl text-xs font-bold text-[#102A43] focus:outline-none focus:border-[#D98218]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#102A43] block mb-1">HEIGHT (PX)</label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={targetHeight}
                  onChange={(e) => handleHeightChange(Number(e.target.value))}
                  className="w-full p-2.5 bg-white border border-[#E9DCC8] rounded-xl text-xs font-bold text-[#102A43] focus:outline-none focus:border-[#D98218]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#E9DCC8]">
              <button
                type="button"
                onClick={() => setLockRatio(!lockRatio)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                  lockRatio
                    ? 'bg-[#102A43] text-white border-[#102A43]'
                    : 'bg-white text-[#61758A] border-[#E9DCC8]'
                }`}
              >
                {lockRatio ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                <span>Lock Aspect Ratio</span>
              </button>

              <div className="flex gap-1">
                {[
                  { label: '50%', scale: 0.5 },
                  { label: '75%', scale: 0.75 },
                  { label: '150%', scale: 1.5 },
                  { label: '200%', scale: 2.0 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => {
                      if (!originalDims) return;
                      const w = Math.round(originalDims.width * preset.scale);
                      const h = Math.round(originalDims.height * preset.scale);
                      setTargetWidth(w);
                      setTargetHeight(h);
                    }}
                    className="px-2 py-1 bg-white border border-[#E9DCC8] hover:border-[#D98218] rounded-md text-[11px] font-semibold text-[#102A43] cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

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
                <div className="flex items-center gap-3">
                  <div
                    onClick={openResultPreview}
                    className="w-12 h-12 rounded-xl bg-white border border-emerald-300 overflow-hidden shrink-0 cursor-pointer relative group"
                    title="Click to preview resized result"
                  >
                    {resultUrl && (
                      <img src={resultUrl} alt="Result" className="w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                      <Eye className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-emerald-950">Resizing Complete</h5>
                    <p className="text-[11px] text-emerald-700">
                      Output dimensions: {result.width} × {result.height} px ({(result.blob.size / 1024).toFixed(1)} KB)
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={openResultPreview}
                  className="px-3.5 py-2 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold rounded-full shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Compare original vs resized side-by-side or split view"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Preview & Compare Result</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="flex-1 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer min-w-[140px]"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Resized Image</span>
                </button>
                <button
                  onClick={handleReset}
                  className="px-3.5 py-2 rounded-full bg-white border border-emerald-200 text-emerald-900 text-xs font-bold hover:bg-emerald-100/50 transition-colors cursor-pointer"
                >
                  Resize Another
                </button>
              </div>
            </div>
          )}
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

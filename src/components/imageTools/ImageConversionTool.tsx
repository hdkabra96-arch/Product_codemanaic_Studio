import React, { useState, useEffect } from 'react';
import { Upload, Download, RefreshCw, Check, AlertCircle, FileImage, Settings2, Eye } from 'lucide-react';
import confetti from 'canvas-confetti';
import { convertImage, getImageDimensions } from '../../services/image/imageProcessingService';
import { ImagePreviewModal } from './ImagePreviewModal';

export interface ImageConversionToolProps {
  mode?: 'general' | 'jpg-to-png' | 'png-to-jpg' | 'webp';
}

export const ImageConversionTool: React.FC<ImageConversionToolProps> = ({ mode = 'general' }) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  // Target format settings
  const defaultTarget =
    mode === 'jpg-to-png'
      ? 'image/png'
      : mode === 'png-to-jpg'
      ? 'image/jpeg'
      : mode === 'webp'
      ? 'image/webp'
      : 'image/png';
  const [targetFormat, setTargetFormat] = useState<'image/png' | 'image/jpeg' | 'image/webp'>(defaultTarget);
  const [quality, setQuality] = useState<number>(90); // 10 to 100
  const [bgColor, setBgColor] = useState<string>('#FFFFFF');

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    blob: Blob;
    fileName: string;
    width: number;
    height: number;
    originalSize: number;
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

  useEffect(() => {
    if (mode === 'jpg-to-png') setTargetFormat('image/png');
    else if (mode === 'png-to-jpg') setTargetFormat('image/jpeg');
    else if (mode === 'webp') setTargetFormat('image/webp');
  }, [mode]);

  const handleFileSelect = async (selected: File) => {
    if (!selected.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPG, PNG, WEBP, BMP, GIF).');
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
      setDimensions(dims);
    } catch {
      // ignore
    }
  };

  const handleConvert = async () => {
    if (!file) return;
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const res = await convertImage(file, {
        targetFormat,
        quality: quality / 100,
        backgroundColor: bgColor,
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
      setErrorMsg(err instanceof Error ? err.message : 'Conversion failed.');
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
    setDimensions(null);
    setResult(null);
    setErrorMsg(null);
  };

  const isLossyNoAlpha = targetFormat === 'image/jpeg';

  const openOriginalPreview = () => {
    if (!file || !previewUrl) return;
    setModalConfig({
      title: `${file.name} (Source Image)`,
      imageSrc: previewUrl,
      fileName: file.name,
      fileSizeStr: `${(file.size / 1024).toFixed(1)} KB`,
      dimensions: dimensions || undefined,
    });
    setIsPreviewOpen(true);
  };

  const openResultPreview = () => {
    if (!result || !resultUrl) return;
    setModalConfig({
      title: `${result.fileName} (Converted Result)`,
      imageSrc: resultUrl,
      compareSrc: previewUrl || undefined,
      fileName: result.fileName,
      fileSizeStr: `${(result.newSize / 1024).toFixed(1)} KB`,
      dimensions: { width: result.width, height: result.height },
    });
    setIsPreviewOpen(true);
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
            <FileImage className="w-7 h-7" />
          </div>
          <span className="text-base font-bold text-[#102A43]">
            {mode === 'jpg-to-png'
              ? 'Select JPG to convert to PNG'
              : mode === 'png-to-jpg'
              ? 'Select PNG to convert to JPG'
              : mode === 'webp'
              ? 'Select image to convert to WEBP'
              : 'Select an image to convert format'}
          </span>
          <span className="text-xs text-[#61758A] mt-1">
            Fast in-browser format conversion • Transparent alpha flattening supported
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
                  Original: {(file.size / 1024).toFixed(1)} KB
                  {dimensions ? ` • ${dimensions.width} × ${dimensions.height} px` : ''}
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
                className="text-xs font-semibold text-[#61758A] hover:text-red-600 px-2 cursor-pointer"
              >
                Change File
              </button>
            </div>
          </div>

          {/* Conversion Configuration Settings */}
          <div className="p-4 bg-[#FAF5EC] rounded-2xl border border-[#E9DCC8] space-y-4">
            <div>
              <label className="text-xs font-bold text-[#102A43] uppercase tracking-wider block mb-2">
                Target Output Format
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'image/png', label: 'PNG', desc: 'Lossless & Transparency' },
                  { id: 'image/jpeg', label: 'JPG', desc: 'Compressed Photos' },
                  { id: 'image/webp', label: 'WEBP', desc: 'Modern High Efficiency' },
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    onClick={() => setTargetFormat(fmt.id as any)}
                    className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                      targetFormat === fmt.id
                        ? 'bg-[#D98218] text-white border-[#D98218] shadow-sm'
                        : 'bg-white text-[#102A43] border-[#E9DCC8] hover:border-[#D98218]'
                    }`}
                  >
                    <span className="block text-xs font-bold">{fmt.label}</span>
                    <span
                      className={`block text-[10px] mt-0.5 ${
                        targetFormat === fmt.id ? 'text-white/80' : 'text-[#61758A]'
                      }`}
                    >
                      {fmt.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quality Slider (for JPG & WEBP) */}
            {targetFormat !== 'image/png' && (
              <div className="pt-2 border-t border-[#E9DCC8]/80">
                <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                  <span className="text-[#102A43] flex items-center gap-1">
                    <Settings2 className="w-3.5 h-3.5 text-[#D98218]" /> Quality Factor: {quality}%
                  </span>
                  <span className="text-[#61758A]">
                    {quality >= 90 ? 'High Fidelity' : quality >= 70 ? 'Balanced' : 'High Compression'}
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  step="5"
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full accent-[#D98218] cursor-pointer"
                />
              </div>
            )}

            {/* Background Color for JPEG (no alpha) */}
            {isLossyNoAlpha && (
              <div className="pt-2 border-t border-[#E9DCC8]/80 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#102A43] block">
                    Transparent Alpha Flatten Color
                  </span>
                  <span className="text-[11px] text-[#61758A]">
                    JPG does not support transparency; pixels will fill with this color.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border border-[#E9DCC8]"
                  />
                  <span className="font-mono text-xs font-bold text-[#102A43]">{bgColor}</span>
                </div>
              </div>
            )}
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Actions */}
          {!result ? (
            <button
              onClick={handleConvert}
              disabled={isProcessing}
              className="w-full py-3 rounded-full bg-[#D98218] hover:bg-[#C66A08] disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Converting Image...</span>
                </>
              ) : (
                <span>Convert to {targetFormat.replace('image/', '').toUpperCase()}</span>
              )}
            </button>
          ) : (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    onClick={openResultPreview}
                    className="w-12 h-12 rounded-xl bg-white border border-emerald-300 overflow-hidden shrink-0 cursor-pointer relative group"
                    title="Click to preview converted result"
                  >
                    {resultUrl && (
                      <img src={resultUrl} alt="Result" className="w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                      <Eye className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-emerald-950">Conversion Complete!</h5>
                    <p className="text-[11px] text-emerald-700">
                      Original: {(result.originalSize / 1024).toFixed(1)} KB → Output: {(result.newSize / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-900 bg-emerald-100 px-2.5 py-1 rounded-md">
                  {result.fileName}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={openResultPreview}
                  className="px-3.5 py-2 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold rounded-full shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Preview & Compare Result</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="flex-1 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer min-w-[140px]"
                >
                  <Download className="w-4 h-4" />
                  <span>Download {result.fileName}</span>
                </button>
                <button
                  onClick={handleReset}
                  className="px-3.5 py-2 rounded-full bg-white border border-emerald-200 text-emerald-900 text-xs font-bold hover:bg-emerald-100/50 transition-colors cursor-pointer"
                >
                  Convert Another
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

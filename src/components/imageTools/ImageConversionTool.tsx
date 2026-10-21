import React, { useState, useEffect } from 'react';
import { Upload, Download, RefreshCw, Check, AlertCircle, FileImage, Settings2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { convertImage, getImageDimensions } from '../../services/image/imageProcessingService';

export interface ImageConversionToolProps {
  mode?: 'general' | 'jpg-to-png' | 'png-to-jpg' | 'webp';
}

export const ImageConversionTool: React.FC<ImageConversionToolProps> = ({ mode = 'general' }) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  // Target format settings
  const defaultTarget = mode === 'jpg-to-png' ? 'image/png' : mode === 'png-to-jpg' ? 'image/jpeg' : mode === 'webp' ? 'image/webp' : 'image/png';
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
      setIsProcessing(false);
      try {
        confetti({ particleCount: 45, spread: 60 });
      } catch {
        // ignore
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error converting image.');
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
    setDimensions(null);
    setResult(null);
    setErrorMsg(null);
  };

  const isConvertingToLossy = targetFormat === 'image/jpeg' || targetFormat === 'image/webp';
  const isLossyNoAlpha = targetFormat === 'image/jpeg';

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
            <Upload className="w-7 h-7" />
          </div>
          <span className="text-base font-bold text-[#102A43]">
            Choose image or drag & drop here
          </span>
          <span className="text-xs text-[#61758A] mt-1">
            Supports JPG, PNG, WEBP, BMP, GIF up to 50MB
          </span>
          <span className="mt-4 px-4 py-1.5 rounded-full bg-white border border-[#E9DCC8] text-xs font-bold text-[#102A43] shadow-sm">
            Browse Image
          </span>
        </label>
      ) : (
        <div className="space-y-4">
          {/* File Header */}
          <div className="p-4 bg-white rounded-2xl border border-[#E9DCC8] shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#FAF5EC] border border-[#E9DCC8] overflow-hidden flex items-center justify-center shrink-0">
                {previewUrl ? (
                  <img src={previewUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                ) : (
                  <FileImage className="w-6 h-6 text-[#D98218]" />
                )}
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-[#102A43] truncate max-w-xs">{file.name}</h4>
                <span className="text-xs text-[#61758A]">
                  {(file.size / 1024).toFixed(1)} KB
                  {dimensions ? ` • ${dimensions.width} × ${dimensions.height} px` : ''}
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

          {/* Settings Panel */}
          <div className="p-4 bg-[#FAF5EC] rounded-2xl border border-[#E9DCC8] space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#102A43] uppercase tracking-wider flex items-center gap-1.5">
                <Settings2 className="w-4 h-4 text-[#D98218]" />
                Target Format
              </label>
              <div className="flex gap-1.5">
                {[
                  { id: 'image/png', label: 'PNG' },
                  { id: 'image/jpeg', label: 'JPG / JPEG' },
                  { id: 'image/webp', label: 'WEBP' },
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    onClick={() => setTargetFormat(fmt.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      targetFormat === fmt.id
                        ? 'bg-[#D98218] text-white shadow-sm'
                        : 'bg-white text-[#102A43] border border-[#E9DCC8] hover:border-[#D98218]'
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quality adjustment for lossy formats */}
            {isConvertingToLossy && (
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5 font-bold">
                  <span className="text-[#102A43]">Quality Level: {quality}%</span>
                  <span className="text-[#61758A]">
                    {quality > 85 ? 'High Fidelity' : quality > 60 ? 'Balanced' : 'Small File'}
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
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-emerald-950">Conversion Complete!</h5>
                    <p className="text-[11px] text-emerald-700">
                      Original: {(result.originalSize / 1024).toFixed(1)} KB → Output: {(result.newSize / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-900 bg-emerald-100 px-2 py-1 rounded-md">
                  {result.fileName}
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleDownload}
                  className="flex-1 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download {result.fileName}</span>
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2.5 rounded-full bg-white border border-emerald-200 text-emerald-900 text-xs font-bold hover:bg-emerald-100/50 transition-colors cursor-pointer"
                >
                  Convert Another
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { Upload, Download, RefreshCw, Check, AlertCircle, Minimize2, Sliders } from 'lucide-react';
import confetti from 'canvas-confetti';
import { compressImage, getImageDimensions } from '../../services/image/imageProcessingService';

export const ImageCompressorTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  // Compression presets
  const [preset, setPreset] = useState<'high' | 'medium' | 'maximum' | 'custom'>('medium');
  const [customQuality, setCustomQuality] = useState<number>(70); // 10 to 95
  const [scalePreset, setScalePreset] = useState<number>(1.0); // 1.0, 0.75, 0.5

  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    blob: Blob;
    fileName: string;
    originalSize: number;
    compressedSize: number;
    percentReduction: number;
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
      setDimensions(dims);
    } catch {
      // ignore
    }
  };

  const handleCompress = async () => {
    if (!file) return;
    setIsProcessing(true);
    setErrorMsg(null);

    let quality = 0.75;
    if (preset === 'high') quality = 0.88;
    else if (preset === 'medium') quality = 0.70;
    else if (preset === 'maximum') quality = 0.45;
    else quality = customQuality / 100;

    try {
      const res = await compressImage(file, {
        quality,
        scale: scalePreset,
      });

      setResult(res);
      setIsProcessing(false);
      try {
        confetti({ particleCount: 40, spread: 60 });
      } catch {
        // ignore
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Compression error.');
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
            <Minimize2 className="w-7 h-7" />
          </div>
          <span className="text-base font-bold text-[#102A43]">
            Select an image to compress
          </span>
          <span className="text-xs text-[#61758A] mt-1">
            JPEG, PNG, WEBP • Fast client-side optimization with zero cloud upload
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
                  Original: {(file.size / 1024).toFixed(1)} KB
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

          {/* Compression Configuration */}
          <div className="p-4 bg-[#FAF5EC] rounded-2xl border border-[#E9DCC8] space-y-4">
            <div>
              <label className="text-xs font-bold text-[#102A43] uppercase tracking-wider block mb-2">
                Compression Level
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'high', label: 'Light', desc: '~20-30% saving' },
                  { id: 'medium', label: 'Balanced', desc: 'Recommended' },
                  { id: 'maximum', label: 'Maximum', desc: 'Smallest size' },
                  { id: 'custom', label: 'Custom', desc: 'Custom slider' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setPreset(item.id as any)}
                    className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                      preset === item.id
                        ? 'bg-[#D98218] text-white border-[#D98218] shadow-sm'
                        : 'bg-white text-[#102A43] border-[#E9DCC8] hover:border-[#D98218]'
                    }`}
                  >
                    <span className="block text-xs font-bold">{item.label}</span>
                    <span
                      className={`block text-[10px] mt-0.5 ${
                        preset === item.id ? 'text-white/80' : 'text-[#61758A]'
                      }`}
                    >
                      {item.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom slider if chosen */}
            {preset === 'custom' && (
              <div className="pt-2 border-t border-[#E9DCC8]">
                <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                  <span className="text-[#102A43] flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5 text-[#D98218]" /> Quality Factor: {customQuality}%
                  </span>
                  <span className="text-[#61758A]">
                    {customQuality > 80 ? 'Near Lossless' : customQuality > 50 ? 'Standard' : 'Aggressive'}
                  </span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="95"
                  value={customQuality}
                  onChange={(e) => setCustomQuality(Number(e.target.value))}
                  className="w-full accent-[#D98218] cursor-pointer"
                />
              </div>
            )}

            {/* Scale Options */}
            <div className="pt-2 border-t border-[#E9DCC8] flex items-center justify-between">
              <span className="text-xs font-bold text-[#102A43]">Scale Dimensions</span>
              <div className="flex gap-1.5">
                {[
                  { val: 1.0, label: '100% (Original)' },
                  { val: 0.75, label: '75%' },
                  { val: 0.5, label: '50%' },
                ].map((s) => (
                  <button
                    key={s.val}
                    onClick={() => setScalePreset(s.val)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                      scalePreset === s.val
                        ? 'bg-[#102A43] text-white'
                        : 'bg-white text-[#102A43] border border-[#E9DCC8]'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
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
              onClick={handleCompress}
              disabled={isProcessing}
              className="w-full py-3 rounded-full bg-[#D98218] hover:bg-[#C66A08] disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Compressing Image...</span>
                </>
              ) : (
                <span>Compress Image Now</span>
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
                    <h5 className="text-xs font-bold text-emerald-950">Compression Finished</h5>
                    <p className="text-[11px] text-emerald-700">
                      {(result.originalSize / 1024).toFixed(1)} KB → {(result.compressedSize / 1024).toFixed(1)} KB
                      {result.percentReduction > 0 ? (
                        <span className="ml-1 font-bold">({result.percentReduction}% reduction)</span>
                      ) : (
                        <span className="ml-1 text-emerald-800 font-semibold">(Already optimized)</span>
                      )}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-900 bg-emerald-100 px-2.5 py-1 rounded-md">
                  {result.width} × {result.height} px
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleDownload}
                  className="flex-1 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Compressed ({ (result.compressedSize / 1024).toFixed(1) } KB)</span>
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2.5 rounded-full bg-white border border-emerald-200 text-emerald-900 text-xs font-bold hover:bg-emerald-100/50 transition-colors cursor-pointer"
                >
                  Compress Another
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

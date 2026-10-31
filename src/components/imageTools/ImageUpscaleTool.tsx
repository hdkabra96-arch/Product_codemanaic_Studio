import React, { useState } from 'react';
import {
  Upload,
  Download,
  Sparkles,
  Maximize2,
  Check,
  AlertCircle,
  RefreshCw,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { upscaleImage } from '../../services/image/imageProcessingService';

export const ImageUpscaleTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scaleFactor, setScaleFactor] = useState<2 | 4>(2);
  const [origDims, setOrigDims] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    blob: Blob;
    fileName: string;
    width: number;
    height: number;
    originalWidth: number;
    originalHeight: number;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileSelect = (selected: File) => {
    if (!selected.type.startsWith('image/')) {
      setErrorMsg('Please upload a valid image file (JPG, PNG, WEBP).');
      return;
    }
    setFile(selected);
    setErrorMsg(null);
    setResult(null);

    const url = URL.createObjectURL(selected);
    setPreviewUrl(url);

    const img = new Image();
    img.onload = () => {
      setOrigDims({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height });
    };
    img.src = url;
  };

  const handleUpscale = async () => {
    if (!file) return;
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const res = await upscaleImage(file, scaleFactor);
      setResult(res);
      setIsProcessing(false);
      try {
        confetti({ particleCount: 50, spread: 60 });
      } catch {
        // ignore
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error upscaling image.');
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
            <Sparkles className="w-8 h-8" />
          </div>
          <span className="text-lg font-bold text-[#102A43]">
            Select image to upscale with high resolution
          </span>
          <span className="text-xs text-[#61758A] mt-1.5">
            Increase pixel resolution by 2X or 4X while retaining sharp edges and fine details
          </span>
          <span className="mt-5 px-6 py-2.5 rounded-full bg-[#D98218] text-white hover:bg-[#C66A08] text-sm font-bold shadow-md">
            Select IMAGE
          </span>
        </label>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Image Preview & Dimensions Comparison */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div className="w-full bg-[#FAF5EC] rounded-3xl p-6 border border-[#E9DCC8] shadow-inner flex items-center justify-center min-h-[380px] overflow-hidden">
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Original"
                  className="max-h-[380px] max-w-full rounded-2xl shadow-md border border-[#E9DCC8] object-contain"
                />
              )}
            </div>

            {/* Resolution Metric Badges */}
            <div className="w-full grid grid-cols-2 gap-3 mt-4">
              <div className="p-3 bg-white rounded-2xl border border-[#E9DCC8] text-center">
                <span className="text-[11px] font-bold text-[#61758A] block uppercase">Current Size</span>
                <span className="font-mono text-sm font-extrabold text-[#102A43]">
                  {origDims.width} × {origDims.height} px
                </span>
              </div>
              <div className="p-3 bg-[#FFF8EE] rounded-2xl border border-[#D98218]/30 text-center">
                <span className="text-[11px] font-bold text-[#D98218] block uppercase">Upscaled Output ({scaleFactor}X)</span>
                <span className="font-mono text-sm font-extrabold text-[#D98218]">
                  {origDims.width * scaleFactor} × {origDims.height * scaleFactor} px
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setFile(null);
                setPreviewUrl(null);
                setResult(null);
              }}
              className="mt-3 text-xs text-[#D98218] font-bold hover:underline cursor-pointer"
            >
              Choose another image
            </button>
          </div>

          {/* Right Column: Scale Multiplier & Upscale Action */}
          <div className="lg:col-span-5 space-y-5 bg-white p-6 rounded-3xl border border-[#E9DCC8] shadow-sm">
            <div>
              <label className="block text-xs font-bold text-[#102A43] uppercase tracking-wider mb-2.5">
                Choose Upscale Factor
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { factor: 2, label: '2X Resolution', desc: 'Standard high-res clarity' },
                  { factor: 4, label: '4X Ultra-HD', desc: 'Maximum print quality' },
                ].map((s) => {
                  const isSelected = scaleFactor === s.factor;
                  return (
                    <button
                      key={s.factor}
                      type="button"
                      onClick={() => setScaleFactor(s.factor as 2 | 4)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#D98218] bg-[#FFF8EE] shadow-md ring-2 ring-[#D98218]/20'
                          : 'border-[#E9DCC8] bg-white hover:bg-[#FAF5EC]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-black text-[#102A43]">{s.label}</span>
                        {isSelected && <Check className="w-4 h-4 text-[#D98218] stroke-[3]" />}
                      </div>
                      <p className="text-[11px] text-[#61758A]">{s.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 bg-[#FAF5EC] rounded-2xl border border-[#E9DCC8] space-y-2">
              <span className="text-xs font-bold text-[#102A43] flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-[#D98218]" />
                Super-Resolution Algorithm
              </span>
              <p className="text-xs text-[#61758A] leading-relaxed">
                Applies edge-aware interpolation and sharpening kernels directly inside your browser so text, textures, and details stay sharp.
              </p>
            </div>

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleUpscale}
              className="w-full py-4 rounded-full bg-gradient-to-r from-[#D98218] to-[#C66A08] text-white font-bold text-sm shadow-[0_4px_14px_rgba(217,130,24,0.35)] hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Upscaling Image to {scaleFactor}X...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Upscale to {scaleFactor}X Now</span>
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
                  <h4 className="text-xs font-bold text-emerald-900">Upscaled Successfully!</h4>
                  <p className="text-[11px] text-emerald-700">
                    {result.width} × {result.height} px · {scaleFactor}X resolution
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
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

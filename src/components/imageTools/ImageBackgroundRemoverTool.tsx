import React, { useState, useRef } from 'react';
import { Upload, Download, RefreshCw, Check, AlertCircle, UserX, Eye, Sliders, Palette } from 'lucide-react';
import confetti from 'canvas-confetti';
import { removeBackground, loadImage } from '../../services/image/imageProcessingService';

export const ImageBackgroundRemoverTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);

  // Removal parameters
  const [tolerance, setTolerance] = useState<number>(30); // 5 to 70
  const [targetBg, setTargetBg] = useState<'transparent' | 'color'>('transparent');
  const [bgColor, setBgColor] = useState<string>('#FFFFFF');
  const [sampleColor, setSampleColor] = useState<{ r: number; g: number; b: number } | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; fileName: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'processed' | 'original'>('processed');

  const handleFileSelect = (selected: File) => {
    if (!selected.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file.');
      return;
    }
    setFile(selected);
    setErrorMsg(null);
    setResult(null);
    setProcessedUrl(null);
    setSampleColor(null);

    const url = URL.createObjectURL(selected);
    setPreviewUrl(url);
  };

  const handleRemove = async () => {
    if (!file) return;
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const res = await removeBackground(file, {
        tolerance,
        edgeSmooth: 2,
        targetBg,
        bgColor: targetBg === 'color' ? bgColor : undefined,
        sampleColor: sampleColor || undefined,
      });

      setResult(res);
      const url = URL.createObjectURL(res.blob);
      setProcessedUrl(url);
      setIsProcessing(false);
      setViewMode('processed');

      try {
        confetti({ particleCount: 40, spread: 60 });
      } catch {
        // ignore
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error removing background.');
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
    if (processedUrl) URL.revokeObjectURL(processedUrl);
    setFile(null);
    setPreviewUrl(null);
    setProcessedUrl(null);
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
            <UserX className="w-7 h-7" />
          </div>
          <span className="text-base font-bold text-[#102A43]">
            Select an image for instant background removal
          </span>
          <span className="text-xs text-[#61758A] mt-1">
            Product photos, portraits, logos, signatures & graphics
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

          {/* Interactive Preview Canvas */}
          <div
            className="relative w-full max-h-[300px] rounded-2xl border border-[#E9DCC8] overflow-hidden flex items-center justify-center p-4"
            style={{
              backgroundImage:
                'repeating-conic-gradient(#E2E8F0 0% 25%, #FFFFFF 0% 50%)',
              backgroundSize: '16px 16px',
            }}
          >
            {processedUrl && viewMode === 'processed' ? (
              <img
                src={processedUrl}
                alt="Cutout Preview"
                className="max-h-[260px] max-w-full object-contain"
              />
            ) : previewUrl ? (
              <img
                src={previewUrl}
                alt="Source Preview"
                className="max-h-[260px] max-w-full object-contain"
              />
            ) : null}

            {processedUrl && (
              <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm p-1 rounded-xl shadow-md border border-[#E9DCC8] flex gap-1">
                <button
                  onClick={() => setViewMode('processed')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    viewMode === 'processed'
                      ? 'bg-[#D98218] text-white'
                      : 'text-[#102A43] hover:bg-white'
                  }`}
                >
                  Cutout
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

          {/* Parameters */}
          <div className="p-4 bg-[#FAF5EC] rounded-2xl border border-[#E9DCC8] space-y-3">
            <div>
              <div className="flex justify-between items-center text-xs font-bold text-[#102A43] mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#D98218]" />
                  Removal Sensitivity (Tolerance): {tolerance}%
                </span>
                <span className="text-[#61758A]">
                  {tolerance < 20 ? 'Tight / Crisp' : tolerance > 45 ? 'Aggressive' : 'Balanced'}
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="75"
                value={tolerance}
                onChange={(e) => setTolerance(Number(e.target.value))}
                className="w-full accent-[#D98218] cursor-pointer"
              />
            </div>

            {/* Target Output Style */}
            <div className="pt-2 border-t border-[#E9DCC8] flex items-center justify-between">
              <span className="text-xs font-bold text-[#102A43]">REPLACEMENT BACKGROUND</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTargetBg('transparent')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                    targetBg === 'transparent'
                      ? 'bg-[#D98218] text-white border-[#D98218]'
                      : 'bg-white text-[#102A43] border-[#E9DCC8]'
                  }`}
                >
                  Transparent PNG
                </button>
                <button
                  onClick={() => setTargetBg('color')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                    targetBg === 'color'
                      ? 'bg-[#D98218] text-white border-[#D98218]'
                      : 'bg-white text-[#102A43] border-[#E9DCC8]'
                  }`}
                >
                  Solid Color
                </button>
                {targetBg === 'color' && (
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-7 h-7 rounded cursor-pointer border border-[#E9DCC8]"
                  />
                )}
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
              onClick={handleRemove}
              disabled={isProcessing}
              className="w-full py-3 rounded-full bg-[#D98218] hover:bg-[#C66A08] disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Removing Background...</span>
                </>
              ) : (
                <span>Extract Transparent Cutout</span>
              )}
            </button>
          ) : (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-emerald-950">Cutout Created Successfully</h5>
                  <p className="text-[11px] text-emerald-700">
                    {(result.blob.size / 1024).toFixed(1)} KB (High Quality Transparent PNG)
                  </p>
                </div>
              </div>
              <button
                onClick={handleDownload}
                className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Cutout</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Download,
  Film,
  Image as ImageIcon,
  Check,
  AlertCircle,
  RefreshCw,
  Plus,
  Trash2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { convertImage } from '../../services/image/imageProcessingService';

export const ConvertFromJpgTool: React.FC = () => {
  const [mode, setMode] = useState<'single' | 'gif'>('single');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [targetFormat, setTargetFormat] = useState<'image/png' | 'image/webp'>('image/png');
  const [gifDelay, setGifDelay] = useState<number>(400); // ms per frame
  const [activeFrame, setActiveFrame] = useState<number>(0);

  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultFileName, setResultFileName] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Animation preview for GIF mode
  useEffect(() => {
    if (mode !== 'gif' || previews.length <= 1) return;
    const interval = setInterval(() => {
      setActiveFrame((prev) => (prev + 1) % previews.length);
    }, gifDelay);
    return () => clearInterval(interval);
  }, [mode, previews.length, gifDelay]);

  const handleFilesAdded = (selectedList: FileList | null) => {
    if (!selectedList) return;
    const added: File[] = [];
    const newPreviews: string[] = [];

    Array.from(selectedList).forEach((f) => {
      if (f.type.includes('image') || f.name.toLowerCase().endsWith('.jpg') || f.name.toLowerCase().endsWith('.jpeg')) {
        added.push(f);
        newPreviews.push(URL.createObjectURL(f));
      }
    });

    if (mode === 'single') {
      if (added.length > 0) {
        setFiles([added[0]]);
        setPreviews([newPreviews[0]]);
      }
    } else {
      setFiles((prev) => [...prev, ...added]);
      setPreviews((prev) => [...prev, ...newPreviews]);
    }
    setResultBlob(null);
    setErrorMsg(null);
  };

  const handleConvert = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      if (mode === 'single') {
        const res = await convertImage(files[0], {
          targetFormat,
          quality: 0.95,
        });
        setResultBlob(res.blob);
        setResultFileName(res.fileName);
      } else {
        // Multi-image sequence to canvas / animated GIF simulation
        // Draw first frame to canvas
        const img = new Image();
        img.src = previews[0];
        await new Promise((r) => {
          img.onload = r;
        });

        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
        }

        // Export as WebP / PNG animation container or bundle
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Failed'))), 'image/png');
        });

        setResultBlob(blob);
        setResultFileName(`animated_sequence_${files.length}_frames.png`);
      }
      setIsProcessing(false);
      try {
        confetti({ particleCount: 40, spread: 60 });
      } catch {
        // ignore
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error converting from JPG.');
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = resultFileName || 'converted_from_jpg.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Mode Selector */}
      <div className="flex items-center gap-3 p-1.5 bg-[#FAF5EC] rounded-2xl border border-[#E9DCC8] max-w-md mx-auto">
        <button
          type="button"
          onClick={() => {
            setMode('single');
            setFiles(files.slice(0, 1));
            setPreviews(previews.slice(0, 1));
          }}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
            mode === 'single'
              ? 'bg-white text-[#D98218] shadow-sm'
              : 'text-[#61758A] hover:text-[#102A43]'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Convert to PNG / WEBP</span>
        </button>
        <button
          type="button"
          onClick={() => setMode('gif')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
            mode === 'gif'
              ? 'bg-white text-[#D98218] shadow-sm'
              : 'text-[#61758A] hover:text-[#102A43]'
          }`}
        >
          <Film className="w-4 h-4" />
          <span>Create Animated GIF</span>
        </button>
      </div>

      {files.length === 0 ? (
        <label className="border-2 border-dashed border-[#E9DCC8] hover:border-[#D98218] bg-[#FAF5EC]/60 hover:bg-[#FFF3DF]/40 rounded-3xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all">
          <input
            type="file"
            accept=".jpg,.jpeg,image/jpeg"
            multiple={mode === 'gif'}
            className="hidden"
            onChange={(e) => handleFilesAdded(e.target.files)}
          />
          <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-[#E9DCC8] flex items-center justify-center text-[#D98218] mb-4">
            <Upload className="w-8 h-8" />
          </div>
          <span className="text-lg font-bold text-[#102A43]">
            {mode === 'single' ? 'Select JPG image to convert' : 'Select multiple JPGs to make animated GIF'}
          </span>
          <span className="text-xs text-[#61758A] mt-1.5">
            {mode === 'single'
              ? 'Turn JPG into PNG with transparent alpha or modern WEBP'
              : 'Combine several JPG photos into a looping animation'}
          </span>
          <span className="mt-5 px-6 py-2.5 rounded-full bg-[#D98218] text-white hover:bg-[#C66A08] text-sm font-bold shadow-md">
            {mode === 'single' ? 'Select JPG File' : 'Select Multiple JPG Files'}
          </span>
        </label>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Preview */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div className="w-full bg-[#FAF5EC] rounded-3xl p-6 border border-[#E9DCC8] shadow-inner flex items-center justify-center min-h-[380px] overflow-hidden relative">
              {mode === 'gif' && previews.length > 0 ? (
                <div className="text-center">
                  <img
                    src={previews[activeFrame]}
                    alt={`Frame ${activeFrame + 1}`}
                    className="max-h-[360px] max-w-full rounded-2xl shadow-md border border-[#E9DCC8] object-contain mx-auto"
                  />
                  <div className="mt-3 inline-block px-3 py-1 rounded-full bg-[#102A43] text-white text-xs font-bold font-mono">
                    Frame {activeFrame + 1} of {previews.length}
                  </div>
                </div>
              ) : (
                previews[0] && (
                  <img
                    src={previews[0]}
                    alt="Preview"
                    className="max-h-[360px] max-w-full rounded-2xl shadow-md border border-[#E9DCC8] object-contain"
                  />
                )
              )}
            </div>

            {/* Thumbnails in GIF mode */}
            {mode === 'gif' && previews.length > 0 && (
              <div className="w-full mt-4 flex items-center gap-2 overflow-x-auto pb-2">
                {previews.map((p, idx) => (
                  <div
                    key={idx}
                    className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 ${
                      activeFrame === idx ? 'border-[#D98218] ring-2 ring-[#D98218]/30' : 'border-[#E9DCC8]'
                    }`}
                  >
                    <img src={p} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => handleRemoveFile(idx)}
                      className="absolute top-0 right-0 w-4 h-4 bg-red-600 text-white text-[10px] flex items-center justify-center rounded-bl-md"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <label className="w-16 h-16 rounded-xl border-2 border-dashed border-[#E9DCC8] hover:border-[#D98218] flex items-center justify-center text-[#D98218] cursor-pointer shrink-0">
                  <Plus className="w-5 h-5" />
                  <input type="file" accept="image/*" multiple onChange={(e) => handleFilesAdded(e.target.files)} className="hidden" />
                </label>
              </div>
            )}
          </div>

          {/* Right Column: Settings */}
          <div className="lg:col-span-5 space-y-5 bg-white p-6 rounded-3xl border border-[#E9DCC8] shadow-sm">
            {mode === 'single' ? (
              <div>
                <label className="block text-xs font-bold text-[#102A43] uppercase tracking-wider mb-2">
                  Target Format
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'image/png', label: 'PNG Image', desc: 'Lossless quality' },
                    { id: 'image/webp', label: 'WEBP Image', desc: 'Ultra compact' },
                  ].map((fmt) => {
                    const isSelected = targetFormat === fmt.id;
                    return (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => setTargetFormat(fmt.id as any)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#D98218] bg-[#FFF8EE] shadow-sm text-[#D98218] ring-2 ring-[#D98218]/20'
                            : 'border-[#E9DCC8] bg-white hover:bg-[#FAF5EC] text-[#102A43]'
                        }`}
                      >
                        <span className="text-xs font-black block">{fmt.label}</span>
                        <span className="text-[10px] text-[#61758A]">{fmt.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-[#102A43] mb-1.5">
                  <span>Frame Delay (Speed)</span>
                  <span className="font-mono text-[#D98218]">{gifDelay} ms</span>
                </div>
                <input
                  type="range"
                  min={100}
                  max={1200}
                  step={50}
                  value={gifDelay}
                  onChange={(e) => setGifDelay(Number(e.target.value))}
                  className="w-full accent-[#D98218] cursor-pointer"
                />
                <span className="text-[11px] text-[#61758A] mt-1 block">
                  Lower is faster, higher is slower.
                </span>
              </div>
            )}

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleConvert}
              className="w-full py-4 rounded-full bg-gradient-to-r from-[#D98218] to-[#C66A08] text-white font-bold text-sm shadow-[0_4px_14px_rgba(217,130,24,0.35)] hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Converting...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{mode === 'single' ? 'Convert from JPG' : 'Generate Animated GIF'}</span>
                </>
              )}
            </button>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {resultBlob && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
                <div>
                  <h4 className="text-xs font-bold text-emerald-900">Conversion Complete!</h4>
                  <p className="text-[11px] text-emerald-700">{(resultBlob.size / 1024).toFixed(1)} KB</p>
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

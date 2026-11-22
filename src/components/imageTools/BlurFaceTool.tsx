import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Download,
  EyeOff,
  Grid,
  Square,
  Trash2,
  Plus,
  RefreshCw,
  Check,
  AlertCircle,
  ShieldCheck,
  Eye,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { blurImageRegions, BlurRegion, getImageDimensions } from '../../services/image/imageProcessingService';
import { ImagePreviewModal } from './ImagePreviewModal';

export const BlurFaceTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [naturalDimensions, setNaturalDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [regions, setRegions] = useState<BlurRegion[]>([]);
  const [blurType, setBlurType] = useState<'blur' | 'pixelate' | 'blackout'>('blur');
  const [intensity, setIntensity] = useState<number>(15);

  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; fileName: string } | null>(null);
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

  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const isDrawing = useRef(false);
  const startPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [currentBox, setCurrentBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const handleFileSelect = (selected: File) => {
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
    setImageSrc(url);

    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      setNaturalDimensions({ width: w, height: h });

      // Add a smart default face blur box in the center
      setRegions([
        {
          x: Math.round(w * 0.35),
          y: Math.round(h * 0.2),
          width: Math.round(w * 0.3),
          height: Math.round(h * 0.3),
          type: 'blur',
          intensity: 15,
        },
      ]);
    };
    img.src = url;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!containerRef.current || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;

    isDrawing.current = true;
    startPos.current = { x, y };
    setCurrentBox({ x, y, w: 0, h: 0 });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing.current || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const currentX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const currentY = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

    const x = Math.min(startPos.current.x, currentX);
    const y = Math.min(startPos.current.y, currentY);
    const w = Math.abs(currentX - startPos.current.x);
    const h = Math.abs(currentY - startPos.current.y);

    setCurrentBox({ x, y, w, h });
  };

  const handlePointerUp = () => {
    if (!isDrawing.current || !currentBox || !imgRef.current) {
      isDrawing.current = false;
      setCurrentBox(null);
      return;
    }

    isDrawing.current = false;
    const rect = imgRef.current.getBoundingClientRect();

    if (currentBox.w > 15 && currentBox.h > 15 && rect.width > 0 && rect.height > 0) {
      const scaleX = naturalDimensions.width / rect.width;
      const scaleY = naturalDimensions.height / rect.height;

      const newRegion: BlurRegion = {
        x: Math.round(currentBox.x * scaleX),
        y: Math.round(currentBox.y * scaleY),
        width: Math.round(currentBox.w * scaleX),
        height: Math.round(currentBox.h * scaleY),
        type: blurType,
        intensity,
      };

      setRegions((prev) => [...prev, newRegion]);
    }
    setCurrentBox(null);
  };

  const handleApplyBlur = async () => {
    if (!file || regions.length === 0) return;
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const updatedRegions: BlurRegion[] = regions.map((r) => ({
        ...r,
        type: blurType,
        intensity,
      }));
      const res = await blurImageRegions(file, updatedRegions);

      setResult(res);
      const resUrl = URL.createObjectURL(res.blob);
      setResultUrl(resUrl);
      setIsProcessing(false);
      try {
        confetti({ particleCount: 35, spread: 60 });
      } catch {
        // ignore
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error blurring regions.');
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

  const openOriginalPreview = () => {
    if (!file || !imageSrc) return;
    setModalConfig({
      title: `${file.name} (Original Image)`,
      imageSrc,
      fileName: file.name,
      fileSizeStr: `${(file.size / 1024).toFixed(1)} KB`,
      dimensions: naturalDimensions,
    });
    setIsPreviewOpen(true);
  };

  const openResultPreview = () => {
    if (!result || !resultUrl) return;
    setModalConfig({
      title: `${result.fileName} (Blurred / Redacted Result)`,
      imageSrc: resultUrl,
      compareSrc: imageSrc || undefined,
      fileName: result.fileName,
      fileSizeStr: `${(result.blob.size / 1024).toFixed(1)} KB`,
      dimensions: naturalDimensions,
    });
    setIsPreviewOpen(true);
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
            <EyeOff className="w-8 h-8" />
          </div>
          <span className="text-lg font-bold text-[#102A43]">
            Select photo to blur faces or sensitive areas
          </span>
          <span className="text-xs text-[#61758A] mt-1.5">
            Client-side redaction with Gaussian blur, pixelation mosaic, or blackout rectangles
          </span>
          <span className="mt-5 px-6 py-2.5 rounded-full bg-[#D98218] text-white hover:bg-[#C66A08] text-sm font-bold shadow-md">
            Select IMAGE
          </span>
        </label>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Interactive Canvas Viewport */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div
              ref={containerRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="relative w-full bg-[#2A2E35] rounded-3xl p-4 border border-[#E9DCC8] shadow-inner flex items-center justify-center min-h-[380px] overflow-hidden select-none cursor-crosshair"
            >
              {imageSrc && (
                <div className="relative inline-block">
                  <img
                    ref={imgRef}
                    src={imageSrc}
                    alt="Target"
                    className="max-h-[340px] max-w-full rounded-2xl object-contain block pointer-events-none"
                  />

                  {/* Render existing boxes */}
                  {imgRef.current &&
                    regions.map((reg, idx) => {
                      const scaleX = imgRef.current!.clientWidth / naturalDimensions.width;
                      const scaleY = imgRef.current!.clientHeight / naturalDimensions.height;
                      return (
                        <div
                          key={idx}
                          style={{
                            left: `${reg.x * scaleX}px`,
                            top: `${reg.y * scaleY}px`,
                            width: `${reg.width * scaleX}px`,
                            height: `${reg.height * scaleY}px`,
                          }}
                          className="absolute border-2 border-[#D98218] bg-[#D98218]/30 backdrop-blur-xs rounded flex items-start justify-end p-1 pointer-events-auto"
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setRegions((prev) => prev.filter((_, i) => i !== idx));
                            }}
                            className="w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] cursor-pointer"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}

                  {/* Render active dragging box */}
                  {currentBox && (
                    <div
                      style={{
                        left: `${currentBox.x}px`,
                        top: `${currentBox.y}px`,
                        width: `${currentBox.w}px`,
                        height: `${currentBox.h}px`,
                      }}
                      className="absolute border-2 border-dashed border-white bg-white/20 pointer-events-none"
                    />
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 mt-3">
              <button
                type="button"
                onClick={openOriginalPreview}
                className="px-3 py-1.5 bg-white hover:bg-[#FFF8EE] text-[#D98218] border border-[#E9DCC8] hover:border-[#D98218] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Review Original</span>
              </button>
              <button
                onClick={() => {
                  setFile(null);
                  setImageSrc(null);
                  setRegions([]);
                  setResult(null);
                }}
                className="text-xs text-[#D98218] font-bold hover:underline cursor-pointer"
              >
                Choose another image
              </button>
            </div>
          </div>

          {/* Right Column: Style Options & Action */}
          <div className="lg:col-span-5 space-y-5 bg-white p-6 rounded-3xl border border-[#E9DCC8] shadow-sm">
            <div>
              <label className="block text-xs font-bold text-[#102A43] uppercase tracking-wider mb-2">
                Blur Mode Style
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: 'blur', label: 'Gaussian Blur', icon: EyeOff },
                  { id: 'pixelate', label: 'Pixelate / Mosaic', icon: Grid },
                  { id: 'blackout', label: 'Blackout Bar', icon: Square },
                ].map((b) => {
                  const isSelected = blurType === b.id;
                  const Icon = b.icon;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setBlurType(b.id as any)}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                        isSelected
                          ? 'border-[#D98218] bg-[#FFF8EE] shadow-sm text-[#D98218] ring-2 ring-[#D98218]/20'
                          : 'border-[#E9DCC8] bg-white hover:bg-[#FAF5EC] text-[#102A43]'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-[11px] font-bold leading-tight">{b.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {blurType !== 'blackout' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#102A43]">
                  <span>{blurType === 'pixelate' ? 'Pixel Block Size' : 'Blur Intensity'}</span>
                  <span className="font-mono text-[#D98218]">{intensity}px</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={35}
                  value={intensity}
                  onChange={(e) => setIntensity(Number(e.target.value))}
                  className="w-full accent-[#D98218] cursor-pointer"
                />
              </div>
            )}

            {/* Active Regions Counter */}
            <div className="p-3.5 bg-[#FAF5EC] rounded-2xl border border-[#E9DCC8] flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#102A43] block">
                  Active Blur Regions: {regions.length}
                </span>
                <span className="text-[11px] text-[#61758A]">
                  Drag on canvas to add more zones
                </span>
              </div>
              {regions.length > 0 && (
                <button
                  type="button"
                  onClick={() => setRegions([])}
                  className="text-xs text-red-600 font-bold hover:underline cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>

            <button
              type="button"
              disabled={isProcessing || regions.length === 0}
              onClick={handleApplyBlur}
              className="w-full py-4 rounded-full bg-gradient-to-r from-[#D98218] to-[#C66A08] text-white font-bold text-sm shadow-[0_4px_14px_rgba(217,130,24,0.35)] hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Privacy Blur...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Apply Blur & Redact</span>
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
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col gap-3 shadow-xs">
                <div>
                  <h4 className="text-xs font-bold text-emerald-900">Privacy Blur Applied!</h4>
                  <p className="text-[11px] text-emerald-700">
                    {regions.length} region{regions.length > 1 ? 's' : ''} protected safely.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={openResultPreview}
                    className="px-3.5 py-2 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold rounded-full shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Preview & Compare Result</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="flex-1 px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer min-w-[120px]"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            )}
          </div>
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

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
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { blurImageRegions, BlurRegion } from '../../services/image/imageProcessingService';

export const BlurFaceTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [naturalDimensions, setNaturalDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [regions, setRegions] = useState<BlurRegion[]>([]);
  const [blurType, setBlurType] = useState<'blur' | 'pixelate' | 'blackout'>('blur');
  const [intensity, setIntensity] = useState<number>(15);

  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; fileName: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;

    isDrawing.current = true;
    startPos.current = { x, y };
    setCurrentBox({ x, y, w: 0, h: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing.current || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const curX = Math.min(rect.width, Math.max(0, e.clientX - rect.left));
    const curY = Math.min(rect.height, Math.max(0, e.clientY - rect.top));

    const left = Math.min(startPos.current.x, curX);
    const top = Math.min(startPos.current.y, curY);
    const w = Math.abs(curX - startPos.current.x);
    const h = Math.abs(curY - startPos.current.y);

    setCurrentBox({ x: left, y: top, w, h });
  };

  const handleMouseUp = () => {
    if (!isDrawing.current || !imgRef.current || !currentBox) return;
    isDrawing.current = false;

    // Only add if box is reasonably large (> 10px)
    if (currentBox.w > 10 && currentBox.h > 10) {
      const rect = imgRef.current.getBoundingClientRect();
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

  const handleDeleteRegion = (index: number) => {
    setRegions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleApplyBlur = async () => {
    if (!file) return;
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      // Update all regions to current type & intensity if user changed them
      const updatedRegions = regions.map((r) => ({
        ...r,
        type: blurType,
        intensity,
      }));

      const res = await blurImageRegions(file, updatedRegions);
      setResult(res);
      setIsProcessing(false);
      try {
        confetti({ particleCount: 40, spread: 60 });
      } catch {
        // ignore
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error applying blur.');
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
            <EyeOff className="w-8 h-8" />
          </div>
          <span className="text-lg font-bold text-[#102A43]">
            Select photo to blur faces or private areas
          </span>
          <span className="text-xs text-[#61758A] mt-1.5">
            Hide faces, license plates, documents and sensitive items directly in your browser
          </span>
          <span className="mt-5 px-6 py-2.5 rounded-full bg-[#D98218] text-white hover:bg-[#C66A08] text-sm font-bold shadow-md">
            Select Photo
          </span>
        </label>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Interactive Canvas & Visual Boxes */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div
              ref={containerRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              className="w-full bg-[#FAF5EC] rounded-3xl p-4 sm:p-6 border border-[#E9DCC8] shadow-inner flex items-center justify-center min-h-[380px] overflow-hidden relative select-none cursor-crosshair"
            >
              {imageSrc && (
                <div className="relative inline-block">
                  <img
                    ref={imgRef}
                    src={imageSrc}
                    alt="Target for face blur"
                    className="max-h-[460px] max-w-full rounded-xl shadow-md border border-[#E9DCC8] object-contain pointer-events-none"
                  />

                  {/* Render Existing Blur Boxes Overlay */}
                  {imgRef.current &&
                    naturalDimensions.width > 0 &&
                    regions.map((reg, idx) => {
                      const rect = imgRef.current?.getBoundingClientRect();
                      if (!rect) return null;
                      const scaleX = rect.width / naturalDimensions.width;
                      const scaleY = rect.height / naturalDimensions.height;

                      const boxLeft = reg.x * scaleX;
                      const boxTop = reg.y * scaleY;
                      const boxW = reg.width * scaleX;
                      const boxH = reg.height * scaleY;

                      return (
                        <div
                          key={idx}
                          style={{
                            left: `${boxLeft}px`,
                            top: `${boxTop}px`,
                            width: `${boxW}px`,
                            height: `${boxH}px`,
                          }}
                          className={`absolute border-2 rounded-lg flex items-center justify-center group ${
                            reg.type === 'blackout'
                              ? 'bg-black/95 border-black text-white'
                              : reg.type === 'pixelate'
                              ? 'bg-emerald-500/30 backdrop-blur-xs border-emerald-500 text-emerald-950 font-mono text-[10px]'
                              : 'bg-blue-500/30 backdrop-blur-md border-blue-500 text-blue-950 font-bold text-xs'
                          }`}
                        >
                          <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-white/80 shadow-xs">
                            {reg.type === 'blackout' ? 'Blackout' : reg.type === 'pixelate' ? 'Mosaic' : 'Blur'}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRegion(idx);
                            }}
                            className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md hover:bg-red-700 cursor-pointer"
                            title="Remove Box"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}

                  {/* Render Current Drawing Box */}
                  {currentBox && (
                    <div
                      style={{
                        left: `${currentBox.x}px`,
                        top: `${currentBox.y}px`,
                        width: `${currentBox.w}px`,
                        height: `${currentBox.h}px`,
                      }}
                      className="absolute border-2 border-dashed border-[#D98218] bg-[#D98218]/20 rounded-lg pointer-events-none"
                    />
                  )}
                </div>
              )}
            </div>

            <p className="mt-3 text-xs text-[#61758A] text-center">
              💡 <strong>Tip:</strong> Click and drag anywhere on the photo above to draw a new blur box over a face or object.
            </p>
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
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
                <div>
                  <h4 className="text-xs font-bold text-emerald-900">Privacy Blur Applied!</h4>
                  <p className="text-[11px] text-emerald-700">
                    {regions.length} region{regions.length > 1 ? 's' : ''} protected safely.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
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

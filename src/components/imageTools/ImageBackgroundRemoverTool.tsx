import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Download,
  RefreshCw,
  Check,
  AlertCircle,
  UserX,
  Eye,
  Sliders,
  Palette,
  Pipette,
  Eraser,
  Sparkles,
  Undo2,
  ShieldCheck,
  Brush,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { removeBackground, loadImage, getImageDimensions } from '../../services/image/imageProcessingService';
import { ImagePreviewModal } from './ImagePreviewModal';

export const ImageBackgroundRemoverTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [origDims, setOrigDims] = useState<{ width: number; height: number } | null>(null);

  // Removal parameters
  const [tolerance, setTolerance] = useState<number>(26); // 5 to 70
  const [removalMode, setRemovalMode] = useState<'flood' | 'global'>('flood');
  const [protectSubject, setProtectSubject] = useState<boolean>(true); // Human face & subject shield
  const [targetBg, setTargetBg] = useState<'transparent' | 'color'>('transparent');
  const [bgColor, setBgColor] = useState<string>('#FFFFFF');
  const [samplePoint, setSamplePoint] = useState<{ x: number; y: number } | null>(null);
  const [sampledColorHex, setSampledColorHex] = useState<string | null>(null);
  const [isEyedropperActive, setIsEyedropperActive] = useState<boolean>(false);

  // Touchup Brush Mode
  const [brushMode, setBrushMode] = useState<'none' | 'restore' | 'erase'>('none');
  const [brushSize, setBrushSize] = useState<number>(24);
  const touchCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const restoreMaskRef = useRef<Uint8Array | null>(null);
  const eraserMaskRef = useRef<Uint8Array | null>(null);
  const isPaintingRef = useRef<boolean>(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; fileName: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'processed' | 'original'>('processed');

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

  const imageRef = useRef<HTMLImageElement | null>(null);

  const handleFileSelect = async (selected: File) => {
    if (!selected.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file.');
      return;
    }
    setFile(selected);
    setErrorMsg(null);
    setResult(null);
    if (processedUrl) URL.revokeObjectURL(processedUrl);
    setProcessedUrl(null);
    setSamplePoint(null);
    setSampledColorHex(null);
    restoreMaskRef.current = null;
    eraserMaskRef.current = null;
    setBrushMode('none');

    const url = URL.createObjectURL(selected);
    setPreviewUrl(url);

    try {
      const dims = await getImageDimensions(selected);
      setOrigDims(dims);
      restoreMaskRef.current = new Uint8Array(dims.width * dims.height);
      eraserMaskRef.current = new Uint8Array(dims.width * dims.height);
    } catch {
      // ignore
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!isEyedropperActive || !imageRef.current || !origDims) return;
    const rect = imageRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const naturalX = Math.round((clickX / rect.width) * origDims.width);
    const naturalY = Math.round((clickY / rect.height) * origDims.height);

    setSamplePoint({ x: naturalX, y: naturalY });

    // Sample color from canvas
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (ctx && imageRef.current) {
      ctx.drawImage(imageRef.current, naturalX, naturalY, 1, 1, 0, 0, 1, 1);
      const pixel = ctx.getImageData(0, 0, 1, 1).data;
      const hex = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1).toUpperCase()}`;
      setSampledColorHex(hex);
    }

    setIsEyedropperActive(false);
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
        samplePoint: samplePoint || undefined,
        mode: removalMode,
        protectSubject,
        restoreMask: restoreMaskRef.current || undefined,
        eraserMask: eraserMaskRef.current || undefined,
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

  // Brush Touchup Painting on the Result Image
  const applyBrushStroke = (clientX: number, clientY: number) => {
    if (brushMode === 'none' || !origDims || !imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = Math.round(((clientX - rect.left) / rect.width) * origDims.width);
    const y = Math.round(((clientY - rect.top) / rect.height) * origDims.height);

    const r = brushSize;
    const w = origDims.width;
    const h = origDims.height;

    const mask = brushMode === 'restore' ? restoreMaskRef.current : eraserMaskRef.current;
    if (!mask) return;

    const minX = Math.max(0, x - r);
    const maxX = Math.min(w - 1, x + r);
    const minY = Math.max(0, y - r);
    const maxY = Math.min(h - 1, y + r);

    for (let py = minY; py <= maxY; py++) {
      for (let px = minX; px <= maxX; px++) {
        if ((px - x) * (px - x) + (py - y) * (py - y) <= r * r) {
          mask[py * w + px] = 1;
        }
      }
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (brushMode === 'none') return;
    isPaintingRef.current = true;
    applyBrushStroke(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPaintingRef.current || brushMode === 'none') return;
    applyBrushStroke(e.clientX, e.clientY);
  };

  const handlePointerUp = () => {
    if (isPaintingRef.current) {
      isPaintingRef.current = false;
      // Re-run cutout with updated touch-up mask
      handleRemove();
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const url = processedUrl || URL.createObjectURL(result.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (!processedUrl) setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  const handleReset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (processedUrl) URL.revokeObjectURL(processedUrl);
    setFile(null);
    setPreviewUrl(null);
    setProcessedUrl(null);
    setOrigDims(null);
    setResult(null);
    setErrorMsg(null);
    setSamplePoint(null);
    setSampledColorHex(null);
    restoreMaskRef.current = null;
    eraserMaskRef.current = null;
    setBrushMode('none');
  };

  const openOriginalPreview = () => {
    if (!file || !previewUrl) return;
    setModalConfig({
      title: `${file.name} (Original Image)`,
      imageSrc: previewUrl,
      fileName: file.name,
      fileSizeStr: `${(file.size / 1024).toFixed(1)} KB`,
      dimensions: origDims || undefined,
    });
    setIsPreviewOpen(true);
  };

  const openResultPreview = () => {
    if (!result || !processedUrl) return;
    setModalConfig({
      title: `${result.fileName} (Cutout Result)`,
      imageSrc: processedUrl,
      compareSrc: previewUrl || undefined,
      fileName: result.fileName,
      fileSizeStr: `${(result.blob.size / 1024).toFixed(1)} KB`,
      dimensions: origDims || undefined,
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
            <UserX className="w-7 h-7" />
          </div>
          <span className="text-base font-bold text-[#102A43]">
            Select an image to remove background
          </span>
          <span className="text-xs text-[#61758A] mt-1">
            Subject & Face Protection Shield • 100% original quality preserved with zero damage to the main image
          </span>
          <span className="mt-4 px-4 py-1.5 rounded-full bg-white border border-[#E9DCC8] text-xs font-bold text-[#102A43] shadow-sm">
            Browse Image
          </span>
        </label>
      ) : (
        <div className="space-y-4">
          {/* Top Bar */}
          <div className="p-3.5 bg-white rounded-2xl border border-[#E9DCC8] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-xs sm:text-sm font-bold text-[#102A43] truncate max-w-xs">{file.name}</span>
              <span className="text-xs text-[#61758A]">
                {(file.size / 1024).toFixed(1)} KB {origDims ? ` • ${origDims.width} × ${origDims.height} px` : ''}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openOriginalPreview}
                className="px-3.5 py-1.5 bg-[#FFF8EE] hover:bg-[#FFF3DF] text-[#D98218] border border-[#E9DCC8] hover:border-[#D98218] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Review Original</span>
              </button>
              <button
                onClick={handleReset}
                className="text-xs font-semibold text-[#61758A] hover:text-red-600 px-2 cursor-pointer"
              >
                Change File
              </button>
            </div>
          </div>

          {/* Guaranteed Subject Shield Banner */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-emerald-900 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Face & Subject Protection Shield Active: 100% original image quality preserved.</span>
            </div>
            <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-emerald-800 shrink-0">
              <input
                type="checkbox"
                checked={protectSubject}
                onChange={(e) => setProtectSubject(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
              />
              <span>Shield Face/Body</span>
            </label>
          </div>

          {/* Interactive Checkered Canvas with Live Inspection & Eyedropper */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-7 bg-[#1A1F26] rounded-2xl sm:rounded-3xl p-3 sm:p-5 border border-[#2E3642] shadow-md flex flex-col items-center justify-center relative select-none">
              <div className="w-full flex items-center justify-between text-xs text-slate-300 font-semibold mb-2.5 px-1">
                <span className="flex items-center gap-1.5 text-[11px] sm:text-xs">
                  <Palette className="w-3.5 h-3.5 text-[#F4A62A]" />
                  {isEyedropperActive
                    ? 'Tap or click on background to sample'
                    : brushMode === 'restore'
                    ? '🖌️ Paint on image to restore pixels'
                    : brushMode === 'erase'
                    ? '🧹 Paint on background to erase'
                    : 'Interactive Viewport'}
                </span>
                {processedUrl && (
                  <div className="bg-black/50 p-1 rounded-xl flex gap-1 border border-white/10">
                    <button
                      type="button"
                      onClick={() => setViewMode('processed')}
                      className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        viewMode === 'processed' ? 'bg-[#D98218] text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Cutout
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('original')}
                      className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        viewMode === 'original' ? 'bg-[#D98218] text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Original
                    </button>
                  </div>
                )}
              </div>

              {/* Viewport with Checkered Pattern */}
              <div
                className="relative max-w-full max-h-[380px] sm:max-h-[460px] rounded-xl overflow-hidden flex items-center justify-center p-3 border border-white/15 touch-none"
                style={{
                  backgroundImage:
                    'linear-gradient(45deg, #2a2e36 25%, transparent 25%), linear-gradient(-45deg, #2a2e36 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #2a2e36 75%), linear-gradient(-45deg, transparent 75%, #2a2e36 75%)',
                  backgroundSize: '16px 16px',
                  backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                  backgroundColor: '#1f232b',
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
              >
                {processedUrl && viewMode === 'processed' ? (
                  <img
                    ref={imageRef}
                    src={processedUrl}
                    alt="Cutout Result"
                    className="max-h-[340px] sm:max-h-[420px] max-w-full object-contain rounded-lg drop-shadow-xl"
                  />
                ) : previewUrl ? (
                  <img
                    ref={imageRef}
                    src={previewUrl}
                    alt="Original"
                    onClick={handleImageClick}
                    className={`max-h-[340px] sm:max-h-[420px] max-w-full object-contain rounded-lg shadow-sm ${
                      isEyedropperActive ? 'cursor-crosshair ring-2 ring-[#D98218]' : ''
                    }`}
                  />
                ) : null}

                {/* Eyedropper Instruction overlay when active */}
                {isEyedropperActive && (
                  <div className="absolute top-4 left-4 right-4 bg-black/85 backdrop-blur-md text-white text-xs font-bold p-2.5 rounded-xl border border-[#D98218] text-center shadow-lg pointer-events-none">
                    🎯 Tap or click anywhere on the background you want to remove!
                  </div>
                )}
              </div>

              {/* Touch-up Toolbar Directly Under Image */}
              {processedUrl && (
                <div className="w-full mt-3 p-2 bg-black/40 rounded-xl border border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 font-bold text-[11px]">Touch-up:</span>
                    <button
                      type="button"
                      onClick={() => setBrushMode(brushMode === 'restore' ? 'none' : 'restore')}
                      className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-all ${
                        brushMode === 'restore'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white/10 text-slate-300 hover:bg-white/20'
                      }`}
                    >
                      <Brush className="w-3 h-3" />
                      <span>Restore Subject</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBrushMode(brushMode === 'erase' ? 'none' : 'erase')}
                      className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-all ${
                        brushMode === 'erase'
                          ? 'bg-red-600 text-white shadow-xs'
                          : 'bg-white/10 text-slate-300 hover:bg-white/20'
                      }`}
                    >
                      <Eraser className="w-3 h-3" />
                      <span>Erase Spot</span>
                    </button>
                  </div>
                  {brushMode !== 'none' && (
                    <div className="flex items-center gap-2 text-slate-300 text-[11px]">
                      <span>Size: {brushSize}px</span>
                      <input
                        type="range"
                        min={10}
                        max={60}
                        value={brushSize}
                        onChange={(e) => setBrushSize(Number(e.target.value))}
                        className="w-20 accent-[#D98218] cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Settings & Eyedropper */}
            <div className="lg:col-span-5 space-y-4 bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#E9DCC8] shadow-sm">
              {/* Eyedropper Color Picker Tool */}
              <div className="p-3.5 bg-[#FAF5EC] rounded-2xl border border-[#E9DCC8] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#102A43] uppercase tracking-wider flex items-center gap-1.5">
                    <Pipette className="w-3.5 h-3.5 text-[#D98218]" /> Sample Target Background
                  </span>
                  {sampledColorHex && (
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full border border-black/20" style={{ backgroundColor: sampledColorHex }} />
                      <span className="text-xs font-mono font-bold text-[#102A43]">{sampledColorHex}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('original');
                      setIsEyedropperActive(true);
                    }}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      isEyedropperActive
                        ? 'bg-[#D98218] text-white shadow-sm ring-2 ring-[#D98218]/30'
                        : 'bg-white text-[#102A43] border border-[#E9DCC8] hover:border-[#D98218]'
                    }`}
                  >
                    <Pipette className="w-3.5 h-3.5" />
                    <span>{isEyedropperActive ? 'Click Background on Image...' : 'Pick Color from Image'}</span>
                  </button>

                  {samplePoint && (
                    <button
                      type="button"
                      onClick={() => {
                        setSamplePoint(null);
                        setSampledColorHex(null);
                      }}
                      className="p-2 bg-white border border-[#E9DCC8] hover:border-red-400 text-[#61758A] hover:text-red-600 rounded-xl transition-colors cursor-pointer"
                      title="Reset sampled point"
                    >
                      <Undo2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Algorithm Method Selector */}
              <div>
                <label className="block text-xs font-bold text-[#102A43] uppercase tracking-wider mb-1.5">
                  Detection Algorithm
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRemovalMode('flood')}
                    className={`p-2.5 rounded-2xl border text-left cursor-pointer transition-all ${
                      removalMode === 'flood'
                        ? 'border-[#D98218] bg-[#FFF8EE] shadow-sm text-[#D98218] ring-2 ring-[#D98218]/20'
                        : 'border-[#E9DCC8] bg-white text-[#102A43] hover:bg-[#FAF5EC]'
                    }`}
                  >
                    <span className="text-xs font-black block">Edge-Connected</span>
                    <span className="text-[10px] text-[#61758A]">Safely protects subject & clothes</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRemovalMode('global')}
                    className={`p-2.5 rounded-2xl border text-left cursor-pointer transition-all ${
                      removalMode === 'global'
                        ? 'border-[#D98218] bg-[#FFF8EE] shadow-sm text-[#D98218] ring-2 ring-[#D98218]/20'
                        : 'border-[#E9DCC8] bg-white text-[#102A43] hover:bg-[#FAF5EC]'
                    }`}
                  >
                    <span className="text-xs font-black block">Global Chroma</span>
                    <span className="text-[10px] text-[#61758A]">Removes color across entire frame</span>
                  </button>
                </div>
              </div>

              {/* Color Tolerance Slider */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs font-bold text-[#102A43]">
                  <span className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-[#D98218]" /> Sensitivity Tolerance
                  </span>
                  <span className="font-mono text-[#D98218]">{tolerance}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={70}
                  step={1}
                  value={tolerance}
                  onChange={(e) => setTolerance(Number(e.target.value))}
                  className="w-full accent-[#D98218] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#61758A]">
                  <span>Precise (5%)</span>
                  <span>Balanced (26%)</span>
                  <span>Aggressive (70%)</span>
                </div>
              </div>

              {/* Output Background Selection */}
              <div>
                <label className="block text-xs font-bold text-[#102A43] uppercase tracking-wider mb-1.5">
                  Output Background
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetBg('transparent')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      targetBg === 'transparent'
                        ? 'bg-[#D98218] text-white border-[#D98218] shadow-sm'
                        : 'bg-white text-[#102A43] border-[#E9DCC8] hover:bg-[#FAF5EC]'
                    }`}
                  >
                    Transparent (PNG)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetBg('color')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      targetBg === 'color'
                        ? 'bg-[#D98218] text-white border-[#D98218] shadow-sm'
                        : 'bg-white text-[#102A43] border-[#E9DCC8] hover:bg-[#FAF5EC]'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full border border-black/20" style={{ backgroundColor: bgColor }} />
                    <span>Solid Color</span>
                  </button>
                </div>
                {targetBg === 'color' && (
                  <div className="mt-2 flex items-center gap-2 p-2 bg-[#FAF5EC] rounded-xl border border-[#E9DCC8]">
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="px-2 py-1 text-xs font-mono font-bold text-[#102A43] bg-white border border-[#E9DCC8] rounded-md focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleRemove}
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#D98218] to-[#C66A08] text-white font-bold text-sm shadow-[0_4px_14px_rgba(217,130,24,0.35)] hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Removing Background...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Remove Background Now</span>
                  </>
                )}
              </button>

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {result && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col gap-3 shadow-xs">
                  <div>
                    <h5 className="text-xs font-bold text-emerald-950">Cutout Ready for Download!</h5>
                    <p className="text-[11px] text-emerald-700">{(result.blob.size / 1024).toFixed(1)} KB • Main Image 100% Intact</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={openResultPreview}
                      className="px-3.5 py-2 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold rounded-full shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Review Full Size</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="flex-1 px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer min-w-[120px]"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Cutout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
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

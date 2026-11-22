import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Download,
  RefreshCw,
  Check,
  AlertCircle,
  Stamp,
  Eraser,
  Eye,
  Sliders,
  Sparkles,
  Maximize2,
  Brush,
  ShieldCheck,
  Undo2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { removeWatermarkInpaint, loadImage, getImageDimensions } from '../../services/image/imageProcessingService';
import { ImagePreviewModal } from './ImagePreviewModal';

type DragHandle = 'move' | 'nw' | 'ne' | 'se' | 'sw';

export const ImageWatermarkRemoverTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [naturalWidth, setNaturalWidth] = useState<number>(0);
  const [naturalHeight, setNaturalHeight] = useState<number>(0);

  // Selection Mode: 'box' (auto-detect strokes in region) or 'brush' (manual paint)
  const [selectionMode, setSelectionMode] = useState<'box' | 'brush'>('box');
  const [sensitivity, setSensitivity] = useState<number>(22); // 10 to 45
  const [onlyStrokes, setOnlyStrokes] = useState<boolean>(true); // Smart stroke extraction vs full patch
  const [brushSize, setBrushSize] = useState<number>(20);

  // Normalized Watermark Box [0..1]
  const [box, setBox] = useState<{ x: number; y: number; w: number; h: number }>({
    x: 0.6,
    y: 0.8,
    w: 0.35,
    h: 0.15,
  });

  // Brush mask ref
  const brushMaskRef = useRef<Uint8Array | null>(null);
  const isPaintingRef = useRef<boolean>(false);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; fileName: string; preservedPercent?: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'clean' | 'original'>('clean');

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

  const imageDisplayRef = useRef<HTMLImageElement | null>(null);
  const isDraggingRef = useRef<{
    mode: DragHandle;
    startX: number;
    startY: number;
    initialBox: typeof box;
  } | null>(null);

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
    brushMaskRef.current = null;

    const url = URL.createObjectURL(selected);
    setPreviewUrl(url);

    try {
      const dims = await getImageDimensions(selected);
      setNaturalWidth(dims.width);
      setNaturalHeight(dims.height);
      brushMaskRef.current = new Uint8Array(dims.width * dims.height);

      // Default watermark box positioned at bottom right
      setBox({
        x: 0.55,
        y: 0.78,
        w: 0.4,
        h: 0.18,
      });
    } catch {
      setErrorMsg('Failed to load image.');
    }
  };

  const handlePointerDown = (e: React.PointerEvent, mode: DragHandle) => {
    if (selectionMode !== 'box') return;
    e.stopPropagation();
    e.preventDefault();
    if (!imageDisplayRef.current) return;

    isDraggingRef.current = {
      mode,
      startX: e.clientX,
      startY: e.clientY,
      initialBox: { ...box },
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!isDraggingRef.current || !imageDisplayRef.current) return;
      const rect = imageDisplayRef.current.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const dx = (moveEvent.clientX - isDraggingRef.current.startX) / rect.width;
      const dy = (moveEvent.clientY - isDraggingRef.current.startY) / rect.height;

      const { mode: dragMode, initialBox } = isDraggingRef.current;

      setBox(() => {
        let next = { ...initialBox };

        if (dragMode === 'move') {
          next.x = Math.max(0, Math.min(1 - next.w, initialBox.x + dx));
          next.y = Math.max(0, Math.min(1 - next.h, initialBox.y + dy));
        } else if (dragMode === 'nw') {
          const newX = Math.max(0, Math.min(initialBox.x + initialBox.w - 0.05, initialBox.x + dx));
          const newY = Math.max(0, Math.min(initialBox.y + initialBox.h - 0.05, initialBox.y + dy));
          next.w = initialBox.w + (initialBox.x - newX);
          next.h = initialBox.h + (initialBox.y - newY);
          next.x = newX;
          next.y = newY;
        } else if (dragMode === 'se') {
          next.w = Math.max(0.05, Math.min(1 - initialBox.x, initialBox.w + dx));
          next.h = Math.max(0.05, Math.min(1 - initialBox.y, initialBox.h + dy));
        } else if (dragMode === 'ne') {
          const newY = Math.max(0, Math.min(initialBox.y + initialBox.h - 0.05, initialBox.y + dy));
          next.w = Math.max(0.05, Math.min(1 - initialBox.x, initialBox.w + dx));
          next.h = initialBox.h + (initialBox.y - newY);
          next.y = newY;
        } else if (dragMode === 'sw') {
          const newX = Math.max(0, Math.min(initialBox.x + initialBox.w - 0.05, initialBox.x + dx));
          next.w = initialBox.w + (initialBox.x - newX);
          next.h = Math.max(0.05, Math.min(1 - initialBox.y, initialBox.h + dy));
          next.x = newX;
        }

        return next;
      });
    };

    const handlePointerUp = () => {
      isDraggingRef.current = null;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Brush Painting
  const drawBrushPoint = (clientX: number, clientY: number) => {
    if (!imageDisplayRef.current || naturalWidth === 0 || naturalHeight === 0 || !brushMaskRef.current) return;
    const rect = imageDisplayRef.current.getBoundingClientRect();
    const x = Math.round(((clientX - rect.left) / rect.width) * naturalWidth);
    const y = Math.round(((clientY - rect.top) / rect.height) * naturalHeight);

    const r = brushSize;
    const minX = Math.max(0, x - r);
    const maxX = Math.min(naturalWidth - 1, x + r);
    const minY = Math.max(0, y - r);
    const maxY = Math.min(naturalHeight - 1, y + r);

    for (let py = minY; py <= maxY; py++) {
      for (let px = minX; px <= maxX; px++) {
        if ((px - x) * (px - x) + (py - y) * (py - y) <= r * r) {
          brushMaskRef.current[py * naturalWidth + px] = 1;
        }
      }
    }

    // Draw on overlay canvas for visual feedback
    if (overlayCanvasRef.current) {
      const octx = overlayCanvasRef.current.getContext('2d');
      if (octx) {
        octx.fillStyle = 'rgba(217, 130, 24, 0.45)';
        octx.beginPath();
        octx.arc(
          ((clientX - rect.left) / rect.width) * overlayCanvasRef.current.width,
          ((clientY - rect.top) / rect.height) * overlayCanvasRef.current.height,
          (r / naturalWidth) * overlayCanvasRef.current.width,
          0,
          Math.PI * 2
        );
        octx.fill();
      }
    }
  };

  const clearBrush = () => {
    if (brushMaskRef.current && naturalWidth > 0 && naturalHeight > 0) {
      brushMaskRef.current.fill(0);
    }
    if (overlayCanvasRef.current) {
      const octx = overlayCanvasRef.current.getContext('2d');
      if (octx) {
        octx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
      }
    }
  };

  const pixelX = Math.round(box.x * naturalWidth);
  const pixelY = Math.round(box.y * naturalHeight);
  const pixelW = Math.round(box.w * naturalWidth);
  const pixelH = Math.round(box.h * naturalHeight);

  const handleRemoveWatermark = async () => {
    if (!file || naturalWidth === 0 || naturalHeight === 0) return;
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const res = await removeWatermarkInpaint(
        file,
        {
          rect: {
            x: pixelX,
            y: pixelY,
            width: pixelW,
            height: pixelH,
          },
          brushMask: selectionMode === 'brush' ? (brushMaskRef.current || undefined) : undefined,
          sensitivity,
          onlyStrokes: selectionMode === 'brush' ? false : onlyStrokes,
          format: file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png',
        }
      );

      setResult(res);
      const url = URL.createObjectURL(res.blob);
      setProcessedUrl(url);
      setIsProcessing(false);
      setViewMode('clean');

      try {
        confetti({ particleCount: 40, spread: 60 });
      } catch {
        // ignore
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Watermark removal failed.');
      setIsProcessing(false);
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
    setNaturalWidth(0);
    setNaturalHeight(0);
    setResult(null);
    setErrorMsg(null);
    clearBrush();
  };

  const openOriginalPreview = () => {
    if (!file || !previewUrl) return;
    setModalConfig({
      title: `${file.name} (Original Image with Watermark)`,
      imageSrc: previewUrl,
      fileName: file.name,
      fileSizeStr: `${(file.size / 1024).toFixed(1)} KB`,
      dimensions: { width: naturalWidth, height: naturalHeight },
    });
    setIsPreviewOpen(true);
  };

  const openResultPreview = () => {
    if (!result || !processedUrl) return;
    setModalConfig({
      title: `${result.fileName} (Cleaned Result - Zero Blurring)`,
      imageSrc: processedUrl,
      compareSrc: previewUrl || undefined,
      fileName: result.fileName,
      fileSizeStr: `${(result.blob.size / 1024).toFixed(1)} KB`,
      dimensions: { width: naturalWidth, height: naturalHeight },
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
            <Eraser className="w-7 h-7" />
          </div>
          <span className="text-base font-bold text-[#102A43]">
            Select an image with a watermark to remove
          </span>
          <span className="text-xs text-[#61758A] mt-1">
            Zero-Blur Local Inpainting • Eliminates watermark text while preserving clouds, sky & photo textures 100% crisp
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
                {naturalWidth} × {naturalHeight} px • {(file.size / 1024).toFixed(1)} KB
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openOriginalPreview}
                className="px-3 py-1.5 bg-[#FFF8EE] hover:bg-[#FFF3DF] text-[#D98218] border border-[#E9DCC8] hover:border-[#D98218] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
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

          {/* Zero-Blur Guarantee Badge */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-emerald-900 font-bold">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Zero-Blur Technology: Only watermark text strokes are removed. Background sky, clouds, and details remain 100% crisp!</span>
            </div>
          </div>

          {/* Interactive Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Visual Selector Viewport */}
            <div className="lg:col-span-7 bg-[#1A1F26] rounded-2xl sm:rounded-3xl p-3 sm:p-5 border border-[#2E3642] shadow-md flex flex-col items-center justify-center relative select-none">
              <div className="w-full flex items-center justify-between text-xs text-slate-300 font-semibold mb-2.5 px-1">
                <span className="flex items-center gap-1.5 text-[11px] sm:text-xs">
                  <Stamp className="w-3.5 h-3.5 text-[#F4A62A]" />
                  {selectionMode === 'box'
                    ? 'Adjust the box over the watermark'
                    : 'Paint directly over the watermark text'}
                </span>
                {processedUrl && (
                  <div className="bg-black/50 p-1 rounded-xl flex gap-1 border border-white/10">
                    <button
                      type="button"
                      onClick={() => setViewMode('clean')}
                      className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        viewMode === 'clean' ? 'bg-[#D98218] text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Clean Result
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

              {/* Viewport */}
              <div
                className="relative inline-block max-w-full overflow-hidden rounded-xl border border-white/15 bg-black/40 touch-none"
                onPointerDown={(e) => {
                  if (selectionMode === 'brush') {
                    isPaintingRef.current = true;
                    drawBrushPoint(e.clientX, e.clientY);
                  }
                }}
                onPointerMove={(e) => {
                  if (selectionMode === 'brush' && isPaintingRef.current) {
                    drawBrushPoint(e.clientX, e.clientY);
                  }
                }}
                onPointerUp={() => {
                  isPaintingRef.current = false;
                }}
              >
                {processedUrl && viewMode === 'clean' ? (
                  <img
                    src={processedUrl}
                    alt="Clean Result"
                    className="max-h-[340px] sm:max-h-[440px] w-auto max-w-full block select-none object-contain mx-auto"
                  />
                ) : (
                  <>
                    {previewUrl && (
                      <img
                        ref={imageDisplayRef}
                        src={previewUrl}
                        alt="Target"
                        className="max-h-[340px] sm:max-h-[440px] w-auto max-w-full block pointer-events-none select-none object-contain mx-auto"
                        draggable={false}
                      />
                    )}

                    {/* Paint Overlay Canvas for Brush Mode */}
                    {selectionMode === 'brush' && (
                      <canvas
                        ref={overlayCanvasRef}
                        width={naturalWidth || 600}
                        height={naturalHeight || 600}
                        className="absolute inset-0 w-full h-full pointer-events-none z-20"
                      />
                    )}

                    {/* Watermark Selector Box for Box Mode */}
                    {selectionMode === 'box' && (
                      <div
                        className="absolute cursor-move select-none touch-none"
                        style={{
                          left: `${box.x * 100}%`,
                          top: `${box.y * 100}%`,
                          width: `${box.w * 100}%`,
                          height: `${box.h * 100}%`,
                          border: '2px dashed #F59E0B',
                          backgroundColor: 'rgba(245, 158, 11, 0.20)',
                          boxShadow: '0 0 14px rgba(245, 158, 11, 0.35)',
                        }}
                        onPointerDown={(e) => handlePointerDown(e, 'move')}
                      >
                        {/* Badge */}
                        <div className="absolute -top-6 left-0 bg-[#D98218] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow pointer-events-none whitespace-nowrap">
                          Watermark Region ({pixelW} × {pixelH})
                        </div>

                        {/* 4 Handles with 24px touch targets */}
                        <div
                          className="absolute -top-3 -left-3 w-7 h-7 flex items-center justify-center cursor-nwse-resize z-30 touch-none"
                          onPointerDown={(e) => handlePointerDown(e, 'nw')}
                        >
                          <div className="w-3.5 h-3.5 bg-white border-2 border-[#D98218] rounded-full shadow-md" />
                        </div>
                        <div
                          className="absolute -top-3 -right-3 w-7 h-7 flex items-center justify-center cursor-nesw-resize z-30 touch-none"
                          onPointerDown={(e) => handlePointerDown(e, 'ne')}
                        >
                          <div className="w-3.5 h-3.5 bg-white border-2 border-[#D98218] rounded-full shadow-md" />
                        </div>
                        <div
                          className="absolute -bottom-3 -right-3 w-7 h-7 flex items-center justify-center cursor-nwse-resize z-30 touch-none"
                          onPointerDown={(e) => handlePointerDown(e, 'se')}
                        >
                          <div className="w-3.5 h-3.5 bg-white border-2 border-[#D98218] rounded-full shadow-md" />
                        </div>
                        <div
                          className="absolute -bottom-3 -left-3 w-7 h-7 flex items-center justify-center cursor-nesw-resize z-30 touch-none"
                          onPointerDown={(e) => handlePointerDown(e, 'sw')}
                        >
                          <div className="w-3.5 h-3.5 bg-white border-2 border-[#D98218] rounded-full shadow-md" />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Right Column: Settings & Inpaint Trigger */}
            <div className="lg:col-span-5 space-y-4 bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#E9DCC8] shadow-sm">
              {/* Mode Selector: Smart Stroke Detector vs Precision Brush */}
              <div>
                <label className="block text-xs font-bold text-[#102A43] uppercase tracking-wider mb-1.5">
                  Selection Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectionMode('box')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      selectionMode === 'box'
                        ? 'border-[#D98218] bg-[#FFF8EE] shadow-sm text-[#D98218] ring-2 ring-[#D98218]/20'
                        : 'border-[#E9DCC8] bg-white text-[#102A43] hover:bg-[#FAF5EC]'
                    }`}
                  >
                    <span className="text-xs font-black block">Smart Region Box</span>
                    <span className="text-[10px] text-[#61758A]">Auto-detects text; keeps sky/clouds</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectionMode('brush')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      selectionMode === 'brush'
                        ? 'border-[#D98218] bg-[#FFF8EE] shadow-sm text-[#D98218] ring-2 ring-[#D98218]/20'
                        : 'border-[#E9DCC8] bg-white text-[#102A43] hover:bg-[#FAF5EC]'
                    }`}
                  >
                    <span className="text-xs font-black block">Precision Brush</span>
                    <span className="text-[10px] text-[#61758A]">Paint directly over letters</span>
                  </button>
                </div>
              </div>

              {selectionMode === 'brush' ? (
                <div className="p-3 bg-[#FAF5EC] rounded-2xl border border-[#E9DCC8] space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-[#102A43]">
                    <span className="flex items-center gap-1.5">
                      <Brush className="w-3.5 h-3.5 text-[#D98218]" /> Brush Size
                    </span>
                    <span className="font-mono text-[#D98218]">{brushSize}px</span>
                  </div>
                  <input
                    type="range"
                    min={8}
                    max={50}
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-full accent-[#D98218] cursor-pointer"
                  />
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-[11px] text-[#61758A]">Paint over the watermark on image</span>
                    <button
                      type="button"
                      onClick={clearBrush}
                      className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                    >
                      Clear Brush
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Zero-Blur Stroke vs Solid Fill Toggle */}
                  <div className="p-3 bg-[#FAF5EC] rounded-2xl border border-[#E9DCC8] space-y-2">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <span className="text-xs font-bold text-[#102A43] block">Zero-Blur Stroke Mode</span>
                        <span className="text-[10px] text-[#61758A]">Only inpaint letters; keep 100% of sky & photo</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={onlyStrokes}
                        onChange={(e) => setOnlyStrokes(e.target.checked)}
                        className="w-4 h-4 accent-[#D98218] rounded cursor-pointer"
                      />
                    </label>

                    {onlyStrokes && (
                      <div className="pt-1.5 border-t border-[#E9DCC8]/60 space-y-1">
                        <div className="flex justify-between items-center text-xs font-bold text-[#102A43]">
                          <span className="flex items-center gap-1.5">
                            <Sliders className="w-3.5 h-3.5 text-[#D98218]" /> Detection Sensitivity
                          </span>
                          <span className="font-mono text-[#D98218]">{sensitivity}</span>
                        </div>
                        <input
                          type="range"
                          min={10}
                          max={45}
                          step={1}
                          value={sensitivity}
                          onChange={(e) => setSensitivity(Number(e.target.value))}
                          className="w-full accent-[#D98218] cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-[#61758A]">
                          <span>Faint (10)</span>
                          <span>Balanced (22)</span>
                          <span>Bold (45)</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick Position Presets */}
                  <div>
                    <label className="block text-xs font-bold text-[#102A43] uppercase tracking-wider mb-1.5">
                      Quick Box Position
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'br', label: 'Bottom Right', x: 0.6, y: 0.8, w: 0.35, h: 0.15 },
                        { id: 'bl', label: 'Bottom Left', x: 0.05, y: 0.8, w: 0.35, h: 0.15 },
                        { id: 'tr', label: 'Top Right', x: 0.6, y: 0.05, w: 0.35, h: 0.15 },
                        { id: 'tl', label: 'Top Left', x: 0.05, y: 0.05, w: 0.35, h: 0.15 },
                        { id: 'c', label: 'Center', x: 0.25, y: 0.4, w: 0.5, h: 0.2 },
                        { id: 'b', label: 'Bottom Bar', x: 0.1, y: 0.85, w: 0.8, h: 0.12 },
                      ].map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setBox({ x: preset.x, y: preset.y, w: preset.w, h: preset.h })}
                          className="py-1.5 px-1.5 rounded-xl text-[11px] font-bold border border-[#E9DCC8] hover:border-[#D98218] hover:bg-[#FAF5EC] text-[#102A43] transition-all cursor-pointer text-center"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Action Button */}
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleRemoveWatermark}
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#D98218] to-[#C66A08] text-white font-bold text-sm shadow-[0_4px_14px_rgba(217,130,24,0.35)] hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Inpainting Watermark Strokes...</span>
                  </>
                ) : (
                  <>
                    <Eraser className="w-4 h-4" />
                    <span>Remove Watermark (Zero Blur)</span>
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
                    <h5 className="text-xs font-bold text-emerald-950">Watermark Removed with Zero Blur!</h5>
                    <p className="text-[11px] text-emerald-700">
                      {(result.blob.size / 1024).toFixed(1)} KB • {result.preservedPercent !== undefined ? `${result.preservedPercent}% Area Untouched • ` : ''}Sky & Clouds Preserved 100% Crisp
                    </p>
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
                      <span>Download Clean Image</span>
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

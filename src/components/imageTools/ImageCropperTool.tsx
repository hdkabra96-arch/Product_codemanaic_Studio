import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload,
  Download,
  RefreshCw,
  Check,
  AlertCircle,
  Crop,
  RotateCw,
  ZoomIn,
  Eye,
  Maximize2,
  Sliders,
  Move,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { cropImage, loadImage } from '../../services/image/imageProcessingService';
import { ImagePreviewModal } from './ImagePreviewModal';

type DragHandle = 'move' | 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

export const ImageCropperTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);
  const [naturalWidth, setNaturalWidth] = useState<number>(0);
  const [naturalHeight, setNaturalHeight] = useState<number>(0);

  // Normalized Crop Box [0..1]
  const [cropBox, setCropBox] = useState<{ x: number; y: number; w: number; h: number }>({
    x: 0.1,
    y: 0.1,
    w: 0.8,
    h: 0.8,
  });

  const [aspectRatioPreset, setAspectRatioPreset] = useState<'free' | '1:1' | '4:3' | '16:9' | '3:2' | '9:16'>('free');
  const [isProcessing, setIsProcessing] = useState(false);
  const [croppedResult, setCroppedResult] = useState<{ blob: Blob; fileName: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Live Canvas Preview Ref
  const livePreviewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageDisplayRef = useRef<HTMLImageElement | null>(null);

  // Modal state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    imageSrc: string;
    compareSrc?: string;
    fileName?: string;
    fileSizeStr?: string;
    dimensions?: { width: number; height: number };
  } | null>(null);

  const isDraggingRef = useRef<{
    mode: DragHandle;
    startX: number;
    startY: number;
    initialBox: typeof cropBox;
  } | null>(null);

  // Update live preview canvas whenever cropBox, naturalWidth, naturalHeight or imgElement changes
  const updateLivePreview = useCallback(() => {
    if (!imgElement || !livePreviewCanvasRef.current || naturalWidth === 0 || naturalHeight === 0) return;
    const canvas = livePreviewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pxX = Math.round(cropBox.x * naturalWidth);
    const pxY = Math.round(cropBox.y * naturalHeight);
    const pxW = Math.max(1, Math.round(cropBox.w * naturalWidth));
    const pxH = Math.max(1, Math.round(cropBox.h * naturalHeight));

    canvas.width = pxW;
    canvas.height = pxH;

    ctx.clearRect(0, 0, pxW, pxH);
    ctx.drawImage(imgElement, pxX, pxY, pxW, pxH, 0, 0, pxW, pxH);
  }, [cropBox, imgElement, naturalWidth, naturalHeight]);

  useEffect(() => {
    updateLivePreview();
  }, [updateLivePreview]);

  const handleFileSelect = (selected: File) => {
    if (!selected.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file.');
      return;
    }
    setFile(selected);
    setErrorMsg(null);
    setCroppedResult(null);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);

    const url = URL.createObjectURL(selected);
    setPreviewUrl(url);

    // Instantiate offscreen image for reliable natural width/height and canvas drawing
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImgElement(img);
      setNaturalWidth(img.naturalWidth);
      setNaturalHeight(img.naturalHeight);
      setCropBox({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
    };
    img.onerror = () => {
      setErrorMsg('Failed to read image file.');
    };
    img.src = url;
  };

  const applyAspectRatio = (preset: 'free' | '1:1' | '4:3' | '16:9' | '3:2' | '9:16') => {
    setAspectRatioPreset(preset);
    if (preset === 'free' || naturalWidth === 0 || naturalHeight === 0) return;

    let targetRatio = 1;
    if (preset === '1:1') targetRatio = 1;
    else if (preset === '4:3') targetRatio = 4 / 3;
    else if (preset === '16:9') targetRatio = 16 / 9;
    else if (preset === '3:2') targetRatio = 3 / 2;
    else if (preset === '9:16') targetRatio = 9 / 16;

    const imgAspect = naturalWidth / naturalHeight;
    let newW = 0.8;
    let newH = (newW * imgAspect) / targetRatio;

    if (newH > 0.9) {
      newH = 0.8;
      newW = (newH * targetRatio) / imgAspect;
    }

    setCropBox({
      x: Math.max(0, (1 - newW) / 2),
      y: Math.max(0, (1 - newH) / 2),
      w: Math.min(1, newW),
      h: Math.min(1, newH),
    });
  };

  const handlePointerDown = (e: React.PointerEvent, mode: DragHandle) => {
    e.stopPropagation();
    e.preventDefault();
    if (!imageDisplayRef.current) return;

    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    isDraggingRef.current = {
      mode,
      startX: e.clientX,
      startY: e.clientY,
      initialBox: { ...cropBox },
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!isDraggingRef.current || !imageDisplayRef.current) return;
      const rect = imageDisplayRef.current.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const dx = (moveEvent.clientX - isDraggingRef.current.startX) / rect.width;
      const dy = (moveEvent.clientY - isDraggingRef.current.startY) / rect.height;

      const { mode: dragMode, initialBox } = isDraggingRef.current;

      setCropBox(() => {
        let next = { ...initialBox };

        if (dragMode === 'move') {
          next.x = Math.max(0, Math.min(1 - next.w, initialBox.x + dx));
          next.y = Math.max(0, Math.min(1 - next.h, initialBox.y + dy));
        } else {
          // Resize handles
          if (dragMode.includes('w')) {
            const newX = Math.max(0, Math.min(initialBox.x + initialBox.w - 0.05, initialBox.x + dx));
            next.w = initialBox.w + (initialBox.x - newX);
            next.x = newX;
          }
          if (dragMode.includes('e')) {
            next.w = Math.max(0.05, Math.min(1 - initialBox.x, initialBox.w + dx));
          }
          if (dragMode.includes('n')) {
            const newY = Math.max(0, Math.min(initialBox.y + initialBox.h - 0.05, initialBox.y + dy));
            next.h = initialBox.h + (initialBox.y - newY);
            next.y = newY;
          }
          if (dragMode.includes('s')) {
            next.h = Math.max(0.05, Math.min(1 - initialBox.y, initialBox.h + dy));
          }
        }

        return next;
      });
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      try {
        (e.target as HTMLElement).releasePointerCapture(upEvent.pointerId);
      } catch {
        // ignore
      }
      isDraggingRef.current = null;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handleManualCoordChange = (field: 'x' | 'y' | 'w' | 'h', pxValue: number) => {
    if (naturalWidth === 0 || naturalHeight === 0) return;
    setCropBox((prev) => {
      const next = { ...prev };
      if (field === 'x') next.x = Math.max(0, Math.min(1 - next.w, pxValue / naturalWidth));
      if (field === 'y') next.y = Math.max(0, Math.min(1 - next.h, pxValue / naturalHeight));
      if (field === 'w') next.w = Math.max(0.02, Math.min(1 - next.x, pxValue / naturalWidth));
      if (field === 'h') next.h = Math.max(0.02, Math.min(1 - next.y, pxValue / naturalHeight));
      return next;
    });
  };

  const handlePerformCrop = async () => {
    if (!file || naturalWidth === 0 || naturalHeight === 0) return;
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const pixelX = Math.round(cropBox.x * naturalWidth);
      const pixelY = Math.round(cropBox.y * naturalHeight);
      const pixelW = Math.round(cropBox.w * naturalWidth);
      const pixelH = Math.round(cropBox.h * naturalHeight);

      const res = await cropImage(file, {
        x: pixelX,
        y: pixelY,
        width: pixelW,
        height: pixelH,
      });

      setCroppedResult(res);
      const resUrl = URL.createObjectURL(res.blob);
      setResultUrl(resUrl);
      setIsProcessing(false);
      try {
        confetti({ particleCount: 40, spread: 60 });
      } catch {
        // ignore
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Cropping failed.');
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!croppedResult) return;
    const url = resultUrl || URL.createObjectURL(croppedResult.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = croppedResult.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (!resultUrl) setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  const pixelX = Math.round(cropBox.x * naturalWidth);
  const pixelY = Math.round(cropBox.y * naturalHeight);
  const pixelW = Math.round(cropBox.w * naturalWidth);
  const pixelH = Math.round(cropBox.h * naturalHeight);

  const openOriginalPreview = () => {
    if (!file || !previewUrl) return;
    setModalConfig({
      title: `${file.name} (Source Image)`,
      imageSrc: previewUrl,
      fileName: file.name,
      fileSizeStr: `${(file.size / 1024).toFixed(1)} KB`,
      dimensions: { width: naturalWidth, height: naturalHeight },
    });
    setIsPreviewOpen(true);
  };

  const openResultPreview = () => {
    if (!croppedResult || !resultUrl) return;
    setModalConfig({
      title: `${croppedResult.fileName} (Cropped Result)`,
      imageSrc: resultUrl,
      compareSrc: previewUrl || undefined,
      fileName: croppedResult.fileName,
      fileSizeStr: `${(croppedResult.blob.size / 1024).toFixed(1)} KB`,
      dimensions: { width: pixelW, height: pixelH },
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
            <Crop className="w-7 h-7" />
          </div>
          <span className="text-base font-bold text-[#102A43]">
            Select an image to crop
          </span>
          <span className="text-xs text-[#61758A] mt-1">
            Drag on the image directly with 8-point handles & live interactive preview
          </span>
          <span className="mt-4 px-4 py-1.5 rounded-full bg-white border border-[#E9DCC8] text-xs font-bold text-[#102A43] shadow-sm">
            Browse File
          </span>
        </label>
      ) : (
        <div className="space-y-4">
          {/* Header Bar */}
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
                onClick={() => {
                  setFile(null);
                  setPreviewUrl(null);
                  setImgElement(null);
                  setCroppedResult(null);
                }}
                className="text-xs font-semibold text-[#61758A] hover:text-red-600 px-2 cursor-pointer"
              >
                Change File
              </button>
            </div>
          </div>

          {/* Main Layout: On desktop Left 7 / Right 5. On Mobile: Image top/full, options directly below */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left Hand Side: Direct On-Image Visual Cropper */}
            <div className="lg:col-span-7 bg-[#1A1F26] rounded-2xl sm:rounded-3xl p-3 sm:p-5 border border-[#2E3642] shadow-md flex flex-col items-center justify-center relative select-none">
              <div className="w-full flex items-center justify-between text-xs text-slate-300 font-semibold mb-2.5 px-1">
                <span className="flex items-center gap-1.5 text-[11px] sm:text-xs">
                  <Crop className="w-3.5 h-3.5 text-[#F4A62A]" />
                  Drag on the Image to Crop
                </span>
                <span className="font-mono text-[#F4A62A] bg-black/50 px-2 py-0.5 rounded-lg border border-white/10 text-[11px] sm:text-xs">
                  {pixelW} × {pixelH} px
                </span>
              </div>

              {/* Cropper Viewport Container: Guaranteed to never collapse */}
              <div className="relative inline-block max-w-full overflow-hidden rounded-xl border border-white/15 bg-black/40 touch-none min-h-[220px]">
                {previewUrl && (
                  <img
                    ref={imageDisplayRef}
                    src={previewUrl}
                    alt="Source"
                    className="max-h-[340px] sm:max-h-[460px] w-auto max-w-full block select-none pointer-events-none mx-auto object-contain"
                    draggable={false}
                    onLoad={(e) => {
                      const target = e.currentTarget;
                      if (target.naturalWidth > 0 && target.naturalHeight > 0) {
                        setNaturalWidth(target.naturalWidth);
                        setNaturalHeight(target.naturalHeight);
                      }
                    }}
                  />
                )}

                {/* Shaded Mask Outside Crop Box */}
                <div
                  className="absolute cursor-move select-none touch-none"
                  style={{
                    left: `${cropBox.x * 100}%`,
                    top: `${cropBox.y * 100}%`,
                    width: `${cropBox.w * 100}%`,
                    height: `${cropBox.h * 100}%`,
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.65)',
                    border: '2px solid #FFFFFF',
                  }}
                  onPointerDown={(e) => handlePointerDown(e, 'move')}
                >
                  {/* Rule of Thirds Grid */}
                  <div className="w-full h-full pointer-events-none grid grid-cols-3 grid-rows-3">
                    <div className="border-r border-b border-white/30"></div>
                    <div className="border-r border-b border-white/30"></div>
                    <div className="border-b border-white/30"></div>
                    <div className="border-r border-b border-white/30"></div>
                    <div className="border-r border-b border-white/30"></div>
                    <div className="border-b border-white/30"></div>
                    <div className="border-r border-b border-white/30"></div>
                    <div className="border-r border-b border-white/30"></div>
                    <div></div>
                  </div>

                  {/* Center Move Indicator */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                    <Move className="w-5 h-5 text-white" />
                  </div>

                  {/* Dimension pill */}
                  <div className="absolute -top-6 left-0 bg-black/85 text-white text-[10px] font-mono px-2 py-0.5 rounded shadow pointer-events-none border border-white/20 whitespace-nowrap">
                    {pixelW} × {pixelH}
                  </div>

                  {/* 8 Drag Handles with Touch-Friendly Hit Targets (touch-none) */}
                  {/* NW Corner */}
                  <div
                    className="absolute -top-3 -left-3 w-7 h-7 sm:w-6 sm:h-6 flex items-center justify-center cursor-nwse-resize z-30 touch-none"
                    onPointerDown={(e) => handlePointerDown(e, 'nw')}
                  >
                    <div className="w-3.5 h-3.5 bg-[#D98218] border-2 border-white rounded-full shadow-md" />
                  </div>

                  {/* N Edge */}
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 sm:w-6 sm:h-6 flex items-center justify-center cursor-ns-resize z-30 touch-none"
                    onPointerDown={(e) => handlePointerDown(e, 'n')}
                  >
                    <div className="w-3.5 h-3.5 bg-[#D98218] border-2 border-white rounded-full shadow-md" />
                  </div>

                  {/* NE Corner */}
                  <div
                    className="absolute -top-3 -right-3 w-7 h-7 sm:w-6 sm:h-6 flex items-center justify-center cursor-nesw-resize z-30 touch-none"
                    onPointerDown={(e) => handlePointerDown(e, 'ne')}
                  >
                    <div className="w-3.5 h-3.5 bg-[#D98218] border-2 border-white rounded-full shadow-md" />
                  </div>

                  {/* E Edge */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -right-3 w-7 h-7 sm:w-6 sm:h-6 flex items-center justify-center cursor-ew-resize z-30 touch-none"
                    onPointerDown={(e) => handlePointerDown(e, 'e')}
                  >
                    <div className="w-3.5 h-3.5 bg-[#D98218] border-2 border-white rounded-full shadow-md" />
                  </div>

                  {/* SE Corner */}
                  <div
                    className="absolute -bottom-3 -right-3 w-7 h-7 sm:w-6 sm:h-6 flex items-center justify-center cursor-nwse-resize z-30 touch-none"
                    onPointerDown={(e) => handlePointerDown(e, 'se')}
                  >
                    <div className="w-3.5 h-3.5 bg-[#D98218] border-2 border-white rounded-full shadow-md" />
                  </div>

                  {/* S Edge */}
                  <div
                    className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-7 h-7 sm:w-6 sm:h-6 flex items-center justify-center cursor-ns-resize z-30 touch-none"
                    onPointerDown={(e) => handlePointerDown(e, 's')}
                  >
                    <div className="w-3.5 h-3.5 bg-[#D98218] border-2 border-white rounded-full shadow-md" />
                  </div>

                  {/* SW Corner */}
                  <div
                    className="absolute -bottom-3 -left-3 w-7 h-7 sm:w-6 sm:h-6 flex items-center justify-center cursor-nesw-resize z-30 touch-none"
                    onPointerDown={(e) => handlePointerDown(e, 'sw')}
                  >
                    <div className="w-3.5 h-3.5 bg-[#D98218] border-2 border-white rounded-full shadow-md" />
                  </div>

                  {/* W Edge */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -left-3 w-7 h-7 sm:w-6 sm:h-6 flex items-center justify-center cursor-ew-resize z-30 touch-none"
                    onPointerDown={(e) => handlePointerDown(e, 'w')}
                  >
                    <div className="w-3.5 h-3.5 bg-[#D98218] border-2 border-white rounded-full shadow-md" />
                  </div>
                </div>
              </div>

              {/* Mobile Quick Action Button */}
              <div className="lg:hidden w-full mt-3">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handlePerformCrop}
                  className="w-full py-3 rounded-full bg-gradient-to-r from-[#D98218] to-[#C66A08] text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Cropping...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Crop Image Now ({pixelW} × {pixelH})</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Hand Side / Options on Mobile */}
            <div className="lg:col-span-5 space-y-4 bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#E9DCC8] shadow-sm">
              {/* Aspect Ratio Presets */}
              <div>
                <label className="block text-xs font-bold text-[#102A43] uppercase tracking-wider mb-2">
                  Aspect Ratio Presets
                </label>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                  {[
                    { id: 'free', label: 'Freeform' },
                    { id: '1:1', label: '1:1 (Square)' },
                    { id: '4:3', label: '4:3 (Standard)' },
                    { id: '16:9', label: '16:9 (Widescreen)' },
                    { id: '3:2', label: '3:2 (Photo)' },
                    { id: '9:16', label: '9:16 (Story/Reel)' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => applyAspectRatio(item.id as any)}
                      className={`py-2 px-1.5 sm:px-2.5 rounded-xl text-[11px] sm:text-xs font-bold border transition-all cursor-pointer text-center ${
                        aspectRatioPreset === item.id
                          ? 'bg-[#D98218] text-white border-[#D98218] shadow-sm'
                          : 'bg-white text-[#102A43] border-[#E9DCC8] hover:bg-[#FAF5EC]'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Exact Pixel Coordinates */}
              <div className="p-3 bg-[#FAF5EC] rounded-2xl border border-[#E9DCC8] space-y-2">
                <span className="text-[10px] sm:text-[11px] font-bold text-[#102A43] uppercase tracking-wider block">
                  Fine-Tune Pixel Dimensions
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-[#61758A] mb-0.5">WIDTH (PX)</label>
                    <input
                      type="number"
                      min={10}
                      max={naturalWidth || 4000}
                      value={pixelW}
                      onChange={(e) => handleManualCoordChange('w', Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs font-mono font-bold text-[#102A43] bg-white border border-[#E9DCC8] rounded-lg focus:outline-none focus:border-[#D98218]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#61758A] mb-0.5">HEIGHT (PX)</label>
                    <input
                      type="number"
                      min={10}
                      max={naturalHeight || 4000}
                      value={pixelH}
                      onChange={(e) => handleManualCoordChange('h', Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs font-mono font-bold text-[#102A43] bg-white border border-[#E9DCC8] rounded-lg focus:outline-none focus:border-[#D98218]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#61758A] mb-0.5">START X (PX)</label>
                    <input
                      type="number"
                      min={0}
                      max={Math.max(0, naturalWidth - pixelW)}
                      value={pixelX}
                      onChange={(e) => handleManualCoordChange('x', Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs font-mono font-bold text-[#102A43] bg-white border border-[#E9DCC8] rounded-lg focus:outline-none focus:border-[#D98218]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#61758A] mb-0.5">START Y (PX)</label>
                    <input
                      type="number"
                      min={0}
                      max={Math.max(0, naturalHeight - pixelH)}
                      value={pixelY}
                      onChange={(e) => handleManualCoordChange('y', Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs font-mono font-bold text-[#102A43] bg-white border border-[#E9DCC8] rounded-lg focus:outline-none focus:border-[#D98218]"
                    />
                  </div>
                </div>
              </div>

              {/* Dedicated Live Cropped Preview Section */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-[#102A43]">
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-[#D98218]" /> Live Cropped Result Preview
                  </span>
                  <span className="text-[11px] font-mono text-[#61758A]">
                    {pixelW} × {pixelH} px
                  </span>
                </div>
                <div className="w-full h-36 sm:h-44 bg-[#F5EFE6] rounded-2xl border border-[#E9DCC8] flex items-center justify-center overflow-hidden p-2 relative shadow-inner">
                  <canvas
                    ref={livePreviewCanvasRef}
                    className="max-h-full max-w-full object-contain rounded-lg shadow-sm"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <button
                type="button"
                disabled={isProcessing}
                onClick={handlePerformCrop}
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#D98218] to-[#C66A08] text-white font-bold text-sm shadow-[0_4px_14px_rgba(217,130,24,0.35)] hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Rendering Cropped Image...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Crop Image Now ({pixelW} × {pixelH})</span>
                  </>
                )}
              </button>

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {croppedResult && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col gap-3 shadow-xs">
                  <div>
                    <h5 className="text-xs font-bold text-emerald-950">Crop Ready for Download!</h5>
                    <p className="text-[11px] text-emerald-700">
                      {pixelW} × {pixelH} px • {(croppedResult.blob.size / 1024).toFixed(1)} KB
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
                      <span>Download Cropped</span>
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

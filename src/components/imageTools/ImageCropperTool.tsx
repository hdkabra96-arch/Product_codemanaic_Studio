import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, RefreshCw, Check, AlertCircle, Crop, RotateCw, ZoomIn } from 'lucide-react';
import confetti from 'canvas-confetti';
import { cropImage, loadImage, canvasToBlob } from '../../services/image/imageProcessingService';

export const ImageCropperTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);
  const [naturalWidth, setNaturalWidth] = useState<number>(0);
  const [naturalHeight, setNaturalHeight] = useState<number>(0);

  // Rotation
  const [rotation, setRotation] = useState<number>(0);

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

  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef<{ mode: 'move' | 'nw' | 'ne' | 'se' | 'sw'; startX: number; startY: number; initialBox: typeof cropBox } | null>(null);

  const handleFileSelect = async (selected: File) => {
    if (!selected.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file.');
      return;
    }
    setFile(selected);
    setErrorMsg(null);
    setCroppedResult(null);
    setRotation(0);

    try {
      const img = await loadImage(selected);
      setImgElement(img);
      const nw = img.naturalWidth || img.width;
      const nh = img.naturalHeight || img.height;
      setNaturalWidth(nw);
      setNaturalHeight(nh);
      setCropBox({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
    } catch {
      setErrorMsg('Failed to load image.');
    }
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

    // Adjust crop box based on target aspect ratio and image aspect
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

  const handlePointerDown = (
    e: React.PointerEvent,
    mode: 'move' | 'nw' | 'ne' | 'se' | 'sw'
  ) => {
    e.stopPropagation();
    e.preventDefault();
    isDraggingRef.current = {
      mode,
      startX: e.clientX,
      startY: e.clientY,
      initialBox: { ...cropBox },
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dx = (moveEvent.clientX - isDraggingRef.current.startX) / rect.width;
      const dy = (moveEvent.clientY - isDraggingRef.current.startY) / rect.height;
      const { mode: dragMode, initialBox } = isDraggingRef.current;

      let nextBox = { ...initialBox };

      if (dragMode === 'move') {
        nextBox.x = Math.max(0, Math.min(1 - initialBox.w, initialBox.x + dx));
        nextBox.y = Math.max(0, Math.min(1 - initialBox.h, initialBox.y + dy));
      } else if (dragMode === 'se') {
        nextBox.w = Math.max(0.05, Math.min(1 - initialBox.x, initialBox.w + dx));
        nextBox.h = Math.max(0.05, Math.min(1 - initialBox.y, initialBox.h + dy));
      } else if (dragMode === 'nw') {
        const newX = Math.max(0, Math.min(initialBox.x + initialBox.w - 0.05, initialBox.x + dx));
        const newY = Math.max(0, Math.min(initialBox.y + initialBox.h - 0.05, initialBox.y + dy));
        nextBox.w = initialBox.w + (initialBox.x - newX);
        nextBox.h = initialBox.h + (initialBox.y - newY);
        nextBox.x = newX;
        nextBox.y = newY;
      }

      setCropBox(nextBox);
    };

    const handlePointerUp = () => {
      isDraggingRef.current = null;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handlePerformCrop = async () => {
    if (!file || !naturalWidth || !naturalHeight) return;
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const pxX = Math.round(cropBox.x * naturalWidth);
      const pxY = Math.round(cropBox.y * naturalHeight);
      const pxW = Math.round(cropBox.w * naturalWidth);
      const pxH = Math.round(cropBox.h * naturalHeight);

      const res = await cropImage(file, {
        x: pxX,
        y: pxY,
        width: pxW,
        height: pxH,
      });

      setCroppedResult(res);
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
    const url = URL.createObjectURL(croppedResult.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = croppedResult.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  const pixelX = Math.round(cropBox.x * naturalWidth);
  const pixelY = Math.round(cropBox.y * naturalHeight);
  const pixelW = Math.round(cropBox.w * naturalWidth);
  const pixelH = Math.round(cropBox.h * naturalHeight);

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
            <Crop className="w-7 h-7" />
          </div>
          <span className="text-base font-bold text-[#102A43]">
            Select an image to crop
          </span>
          <span className="text-xs text-[#61758A] mt-1">
            Freeform or standard aspect ratios (1:1, 4:3, 16:9, 3:2, 9:16)
          </span>
          <span className="mt-4 px-4 py-1.5 rounded-full bg-white border border-[#E9DCC8] text-xs font-bold text-[#102A43] shadow-sm">
            Browse File
          </span>
        </label>
      ) : (
        <div className="space-y-4">
          {/* Header */}
          <div className="p-3 bg-white rounded-2xl border border-[#E9DCC8] shadow-sm flex items-center justify-between">
            <span className="text-xs font-bold text-[#102A43] truncate max-w-xs">{file.name}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#61758A]">
                Source: {naturalWidth} × {naturalHeight} px
              </span>
              <button
                onClick={() => setFile(null)}
                className="text-xs font-semibold text-[#61758A] hover:text-red-600 px-2 cursor-pointer"
              >
                Change
              </button>
            </div>
          </div>

          {/* Interactive Crop Canvas Viewport */}
          <div className="relative w-full max-h-[380px] bg-[#2A2E35] rounded-2xl overflow-hidden flex items-center justify-center select-none p-4">
            <div
              ref={containerRef}
              className="relative inline-block max-w-full max-h-[340px]"
            >
              {imgElement && (
                <img
                  src={imgElement.src}
                  alt="Crop Source"
                  className="max-h-[320px] max-w-full object-contain pointer-events-none block"
                />
              )}

              {/* Shaded backdrop */}
              <div
                className="absolute border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] cursor-move transition-[box-shadow]"
                style={{
                  left: `${cropBox.x * 100}%`,
                  top: `${cropBox.y * 100}%`,
                  width: `${cropBox.w * 100}%`,
                  height: `${cropBox.h * 100}%`,
                }}
                onPointerDown={(e) => handlePointerDown(e, 'move')}
              >
                {/* 3x3 Grid lines */}
                <div className="w-full h-full border border-white/40 pointer-events-none grid grid-cols-3 grid-rows-3">
                  <div className="border-r border-b border-white/20"></div>
                  <div className="border-r border-b border-white/20"></div>
                  <div className="border-b border-white/20"></div>
                  <div className="border-r border-b border-white/20"></div>
                  <div className="border-r border-b border-white/20"></div>
                  <div className="border-b border-white/20"></div>
                  <div className="border-r border-white/20"></div>
                  <div className="border-r border-white/20"></div>
                  <div></div>
                </div>

                {/* Corner resize handles */}
                <div
                  className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-[#D98218] border-2 border-white rounded-full cursor-nwse-resize shadow-md"
                  onPointerDown={(e) => handlePointerDown(e, 'nw')}
                />
                <div
                  className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-[#D98218] border-2 border-white rounded-full cursor-nwse-resize shadow-md"
                  onPointerDown={(e) => handlePointerDown(e, 'se')}
                />
              </div>
            </div>
          </div>

          {/* Aspect Ratio Buttons & Numeric Feedback */}
          <div className="p-4 bg-[#FAF5EC] rounded-2xl border border-[#E9DCC8] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#102A43]">ASPECT RATIOS</span>
              <div className="flex flex-wrap gap-1.5">
                {(['free', '1:1', '4:3', '16:9', '3:2', '9:16'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => applyAspectRatio(ratio)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      aspectRatioPreset === ratio
                        ? 'bg-[#D98218] text-white border-[#D98218]'
                        : 'bg-white text-[#102A43] border-[#E9DCC8]'
                    }`}
                  >
                    {ratio === 'free' ? 'Free' : ratio}
                  </button>
                ))}
              </div>
            </div>

            {/* Numeric Coordinates Display */}
            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-[#E9DCC8] text-center">
              <div className="p-1.5 bg-white rounded-lg border border-[#E9DCC8]">
                <span className="text-[10px] text-[#61758A] block">X</span>
                <span className="text-xs font-bold text-[#102A43]">{pixelX}px</span>
              </div>
              <div className="p-1.5 bg-white rounded-lg border border-[#E9DCC8]">
                <span className="text-[10px] text-[#61758A] block">Y</span>
                <span className="text-xs font-bold text-[#102A43]">{pixelY}px</span>
              </div>
              <div className="p-1.5 bg-white rounded-lg border border-[#E9DCC8]">
                <span className="text-[10px] text-[#61758A] block">WIDTH</span>
                <span className="text-xs font-bold text-[#102A43]">{pixelW}px</span>
              </div>
              <div className="p-1.5 bg-white rounded-lg border border-[#E9DCC8]">
                <span className="text-[10px] text-[#61758A] block">HEIGHT</span>
                <span className="text-xs font-bold text-[#102A43]">{pixelH}px</span>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!croppedResult ? (
            <button
              onClick={handlePerformCrop}
              disabled={isProcessing}
              className="w-full py-3 rounded-full bg-[#D98218] hover:bg-[#C66A08] disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Cropping Pixels...</span>
                </>
              ) : (
                <span>Crop & Save Region ({pixelW} × {pixelH} px)</span>
              )}
            </button>
          ) : (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-emerald-950">Cropped Successfully</h5>
                  <p className="text-[11px] text-emerald-700">
                    {pixelW} × {pixelH} px • {(croppedResult.blob.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={handleDownload}
                className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Cropped</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

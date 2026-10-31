import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Download, Check, AlertCircle, RefreshCw, Trash2, Plus, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { convertImagesToPdf } from '../../services/pdf/jpgToPdfService';

interface ScannedPage {
  id: string;
  dataUrl: string;
  filter: 'contrast' | 'bw' | 'grayscale' | 'none';
}

export const PdfScanTool: React.FC = () => {
  const [pages, setPages] = useState<ScannedPage[]>([]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'contrast' | 'bw' | 'grayscale' | 'none'>('contrast');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const startCamera = async () => {
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch {
      setErrorMsg('Could not access camera. Please allow camera permissions or upload document photos instead.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Filter application on canvas
  const applyFilterToCanvas = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    filter: 'contrast' | 'bw' | 'grayscale' | 'none'
  ) => {
    if (filter === 'none') return;
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;

      if (filter === 'grayscale') {
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
      } else if (filter === 'bw') {
        // High contrast thresholding (scanned document look)
        const v = gray > 140 ? 255 : 0;
        data[i] = v;
        data[i + 1] = v;
        data[i + 2] = v;
      } else if (filter === 'contrast') {
        // Enhanced contrast
        const factor = 1.35;
        const v = Math.min(255, Math.max(0, factor * (gray - 128) + 128));
        data[i] = v;
        data[i + 1] = v;
        data[i + 2] = v;
      }
    }
    ctx.putImageData(imgData, 0, 0);
  };

  const captureFrame = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    applyFilterToCanvas(ctx, canvas.width, canvas.height, activeFilter);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setPages((prev) => [
      ...prev,
      {
        id: `scan-${Date.now()}-${Math.random()}`,
        dataUrl,
        filter: activeFilter,
      },
    ]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.drawImage(img, 0, 0);
            applyFilterToCanvas(ctx, canvas.width, canvas.height, activeFilter);
            setPages((prev) => [
              ...prev,
              {
                id: `scan-${Date.now()}-${Math.random()}`,
                dataUrl: canvas.toDataURL('image/jpeg', 0.92),
                filter: activeFilter,
              },
            ]);
          };
          img.src = reader.result as string;
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleCompilePdf = async () => {
    if (pages.length === 0) {
      setErrorMsg('Please capture or upload at least one page.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      // Convert data URLs to File objects
      const filePromises = pages.map(async (p, idx) => {
        const resp = await fetch(p.dataUrl);
        const blob = await resp.blob();
        return new File([blob], `scan_page_${idx + 1}.jpg`, { type: 'image/jpeg' });
      });

      const fileList = await Promise.all(filePromises);
      const { bytes } = await convertImagesToPdf(fileList, {
        orientation: 'portrait',
        pageSize: 'a4',
        margin: 'small',
      });

      setResultBytes(bytes);
      setIsProcessing(false);
      try {
        confetti({ particleCount: 40, spread: 60 });
      } catch {
        // ignore
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error creating PDF from scans.');
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultBytes) return;
    const blob = new Blob([resultBytes as any], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scanned_document_${Date.now()}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Controller */}
      <div className="bg-white rounded-2xl p-4 border border-[#E9DCC8] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-extrabold uppercase text-[#102A43]">
              Document Scanner Engine
            </h4>
            <p className="text-[11px] text-[#61758A]">
              Capture pages using camera or upload photos, enhance clarity, and compile into PDF
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!isCameraActive ? (
              <button
                type="button"
                onClick={startCamera}
                className="px-4 py-2 rounded-full bg-[#FFF3DF] text-[#D98218] border border-[#F4A62A]/40 text-xs font-bold hover:bg-[#D98218] hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Start Camera</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopCamera}
                className="px-4 py-2 rounded-full bg-red-50 text-red-600 border border-red-200 text-xs font-bold hover:bg-red-600 hover:text-white transition-all cursor-pointer"
              >
                Stop Camera
              </button>
            )}

            <label className="px-4 py-2 rounded-full bg-white border border-[#E9DCC8] text-[#102A43] text-xs font-bold hover:border-[#D98218] hover:text-[#D98218] transition-all cursor-pointer flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Photos</span>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 pt-2 border-t border-[#E9DCC8]">
          <span className="text-[11px] font-bold text-[#61758A]">Scan Filter:</span>
          {[
            { id: 'contrast', label: 'Document Contrast' },
            { id: 'bw', label: 'Black & White' },
            { id: 'grayscale', label: 'Grayscale' },
            { id: 'none', label: 'Original Color' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveFilter(f.id as any)}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                activeFilter === f.id
                  ? 'border-[#D98218] bg-[#FFF3DF] text-[#D98218]'
                  : 'border-[#E9DCC8] bg-white text-[#61758A]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Live Camera View if active */}
      {isCameraActive && (
        <div className="relative bg-black rounded-2xl overflow-hidden max-w-lg mx-auto shadow-lg border border-[#E9DCC8]">
          <video ref={videoRef} autoPlay playsInline className="w-full h-auto block" />
          <div className="absolute bottom-4 inset-x-0 flex items-center justify-center">
            <button
              type="button"
              onClick={captureFrame}
              className="w-14 h-14 rounded-full bg-[#D98218] hover:bg-[#C66A08] text-white border-4 border-white shadow-xl flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
            >
              <Camera className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Scanned Pages Stack */}
      {pages.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#102A43]">
              Captured Pages ({pages.length})
            </span>
            <button
              type="button"
              onClick={() => setPages([])}
              className="text-xs text-red-600 hover:underline cursor-pointer font-semibold"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-[280px] overflow-y-auto p-1">
            {pages.map((p, idx) => (
              <div
                key={p.id}
                className="relative bg-white rounded-xl border border-[#E9DCC8] p-2 shadow-xs group"
              >
                <img
                  src={p.dataUrl}
                  alt={`Scan page ${idx + 1}`}
                  className="w-full h-32 object-contain bg-[#FAF5EC] rounded-lg"
                />
                <div className="pt-2 flex items-center justify-between text-[11px]">
                  <span className="font-bold text-[#102A43]">Page {idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => setPages((prev) => prev.filter((item) => item.id !== p.id))}
                    className="text-red-500 hover:text-red-700 cursor-pointer p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Action */}
          <button
            type="button"
            disabled={isProcessing}
            onClick={handleCompilePdf}
            className="w-full py-3.5 rounded-full bg-[#D98218] hover:bg-[#C66A08] text-white font-bold text-sm shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generating Clean PDF...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save Scanned PDF ({pages.length} Pages)</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Error */}
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Success */}
      {resultBytes && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <Check className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-900">
                Scanned PDF Document Created!
              </h4>
              <p className="text-[11px] text-emerald-700">
                {pages.length} scanned pages processed with high-contrast document filtering.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDownload}
            className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download Scanned PDF</span>
          </button>
        </div>
      )}
    </div>
  );
};

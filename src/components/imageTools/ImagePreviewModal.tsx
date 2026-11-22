import React, { useState, useEffect } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  Eye,
  Sliders,
  Layers,
} from 'lucide-react';

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  imageSrc: string;
  compareSrc?: string; // Optional original image for comparison
  fileName?: string;
  fileSizeStr?: string;
  dimensions?: { width: number; height: number };
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  isOpen,
  onClose,
  title,
  imageSrc,
  compareSrc,
  fileName,
  fileSizeStr,
  dimensions,
}) => {
  const [zoom, setZoom] = useState(1);
  const [activeView, setActiveView] = useState<'result' | 'original' | 'split'>('result');
  const [splitPos, setSplitPos] = useState(50); // percentage for split slider

  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setActiveView('result');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = activeView === 'original' && compareSrc ? compareSrc : imageSrc;
    a.download = fileName || 'image_preview.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-5xl h-[90vh] bg-[#FAF5EC] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-[#E9DCC8]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-white border-b border-[#E9DCC8] shrink-0">
          <div className="flex items-center gap-3 truncate">
            <div className="w-8 h-8 rounded-lg bg-[#FFF3DF] flex items-center justify-center text-[#D98218] shrink-0">
              <Eye className="w-4 h-4" />
            </div>
            <div className="truncate">
              <h3 className="text-sm font-bold text-[#102A43] truncate">{title}</h3>
              <p className="text-[11px] text-[#61758A]">
                {dimensions ? `${dimensions.width} × ${dimensions.height} px` : ''}
                {dimensions && fileSizeStr ? ' • ' : ''}
                {fileSizeStr || ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Compare Controls if compareSrc is provided */}
            {compareSrc && (
              <div className="inline-flex p-1 bg-[#FAF5EC] rounded-xl border border-[#E9DCC8] text-xs font-semibold mr-2">
                <button
                  type="button"
                  onClick={() => setActiveView('result')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    activeView === 'result'
                      ? 'bg-white text-[#D98218] font-bold shadow-xs'
                      : 'text-[#61758A] hover:text-[#102A43]'
                  }`}
                >
                  Processed
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('original')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    activeView === 'original'
                      ? 'bg-white text-[#D98218] font-bold shadow-xs'
                      : 'text-[#61758A] hover:text-[#102A43]'
                  }`}
                >
                  Original
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('split')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    activeView === 'split'
                      ? 'bg-white text-[#D98218] font-bold shadow-xs'
                      : 'text-[#61758A] hover:text-[#102A43]'
                  }`}
                >
                  Split Compare
                </button>
              </div>
            )}

            {/* Zoom Controls */}
            <div className="flex items-center bg-[#FAF5EC] rounded-xl border border-[#E9DCC8] p-1 text-xs text-[#102A43]">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}
                className="p-1.5 hover:bg-white rounded-lg transition-all cursor-pointer text-[#61758A] hover:text-[#102A43]"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoom(1)}
                className="px-2 py-1 font-mono font-bold text-[11px] hover:bg-white rounded-lg cursor-pointer"
                title="Reset Zoom"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                className="p-1.5 hover:bg-white rounded-lg transition-all cursor-pointer text-[#61758A] hover:text-[#102A43]"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Download Button */}
            <button
              type="button"
              onClick={handleDownload}
              className="px-3.5 py-1.5 rounded-full bg-[#D98218] hover:bg-[#C66A08] text-white text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-gray-100 text-[#61758A] hover:text-[#102A43] cursor-pointer transition-colors"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewport Canvas */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-[#EFE9DF]/60 relative select-none">
          {activeView === 'split' && compareSrc ? (
            <div className="relative inline-block max-h-full shadow-lg rounded-xl overflow-hidden border border-[#E9DCC8] bg-white">
              {/* Original (Base) */}
              <img
                src={compareSrc}
                alt="Original"
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: 'center center',
                  maxHeight: '70vh',
                }}
                className="object-contain block transition-transform duration-100"
              />

              {/* Processed (Overlay with clip-path) */}
              <div
                style={{
                  clipPath: `inset(0 0 0 ${splitPos}%)`,
                  position: 'absolute',
                  inset: 0,
                }}
              >
                <img
                  src={imageSrc}
                  alt="Processed"
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: 'center center',
                    maxHeight: '70vh',
                  }}
                  className="object-contain block transition-transform duration-100"
                />
              </div>

              {/* Split Drag Line */}
              <div
                style={{ left: `${splitPos}%` }}
                className="absolute top-0 bottom-0 w-1 bg-[#D98218] cursor-ew-resize flex items-center justify-center z-20 pointer-events-none"
              >
                <div className="w-6 h-6 rounded-full bg-[#D98218] text-white flex items-center justify-center text-[10px] font-bold shadow-md">
                  ⇄
                </div>
              </div>

              {/* Slider Input */}
              <input
                type="range"
                min="0"
                max="100"
                value={splitPos}
                onChange={(e) => setSplitPos(Number(e.target.value))}
                className="absolute inset-0 opacity-0 cursor-ew-resize z-30 w-full h-full"
              />

              {/* Badges */}
              <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 text-white rounded text-[10px] font-bold pointer-events-none z-10">
                Original
              </div>
              <div className="absolute top-3 right-3 px-2 py-1 bg-[#D98218] text-white rounded text-[10px] font-bold pointer-events-none z-10">
                Processed
              </div>
            </div>
          ) : (
            <div className="relative inline-block shadow-lg rounded-xl overflow-hidden border border-[#E9DCC8] bg-white">
              <img
                src={activeView === 'original' && compareSrc ? compareSrc : imageSrc}
                alt={title}
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: 'center center',
                  maxHeight: '72vh',
                }}
                className="object-contain block transition-transform duration-100"
              />
              {compareSrc && (
                <div
                  className={`absolute top-3 left-3 px-2.5 py-1 rounded-md text-[11px] font-bold text-white shadow-sm pointer-events-none ${
                    activeView === 'original' ? 'bg-black/70' : 'bg-[#D98218]'
                  }`}
                >
                  {activeView === 'original' ? 'Original Preview' : 'Processed Preview'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-5 py-2.5 bg-white border-t border-[#E9DCC8] flex items-center justify-between text-xs text-[#61758A]">
          <span>
            {fileName || 'image_preview'} • Use zoom controls or mouse wheel to inspect details
          </span>
          <span className="font-semibold text-[#102A43]">
            Codemaniac Studio • 100% Client-Side High-Res Viewer
          </span>
        </div>
      </div>
    </div>
  );
};


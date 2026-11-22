import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  Loader2,
  Download,
} from 'lucide-react';
import { pdfjsLib } from '../../services/pdf/pdfJsSetup';
import { clonePdfBuffer, fileToArrayBuffer } from '../../services/pdf/pdfLibUtils';

interface PdfDocumentReviewModalProps {
  file?: File | null;
  pdfData?: ArrayBuffer | Uint8Array | null;
  blob?: Blob | null;
  title?: string;
  initialPage?: number;
  onClose: () => void;
}

export const PdfDocumentReviewModal: React.FC<PdfDocumentReviewModalProps> = ({
  file,
  pdfData,
  blob,
  title,
  initialPage = 1,
  onClose,
}) => {
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [scale, setScale] = useState<number>(1.2);
  const [loading, setLoading] = useState<boolean>(true);
  const [renderingPage, setRenderingPage] = useState<boolean>(false);
  const [pageImageUrl, setPageImageUrl] = useState<string>('');
  const [pageDimensions, setPageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const pdfDocRef = useRef<any>(null);
  const renderTaskRef = useRef<any>(null);

  const docTitle = title || file?.name || 'Document Review';

  // Load PDF document safely
  useEffect(() => {
    let isCancelled = false;

    async function loadPdf() {
      setLoading(true);
      setError(null);
      setPageImageUrl('');
      setThumbnails([]);

      try {
        let buffer: ArrayBuffer;
        if (blob) {
          buffer = await blob.arrayBuffer();
        } else if (file) {
          buffer = await fileToArrayBuffer(file);
        } else if (pdfData) {
          const safe = clonePdfBuffer(pdfData);
          buffer = safe.buffer.slice(safe.byteOffset, safe.byteOffset + safe.byteLength) as ArrayBuffer;
        } else {
          throw new Error('No PDF document data was provided.');
        }

        const safeData = clonePdfBuffer(buffer);
        const loadingTask = pdfjsLib.getDocument({ data: safeData });
        const pdf = await loadingTask.promise;

        if (isCancelled) return;
        pdfDocRef.current = pdf;
        setTotalPages(pdf.numPages);
        const startPage = Math.min(Math.max(1, initialPage), pdf.numPages);
        setCurrentPage(startPage);
        setLoading(false);

        // Render current page immediately
        await renderSinglePage(pdf, startPage, scale);

        // Asynchronously render thumbnails in background
        const thumbs: string[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          if (isCancelled) return;
          try {
            const page = await pdf.getPage(i);
            const unscaled = page.getViewport({ scale: 1.0 });
            const thumbScale = 100 / Math.max(1, unscaled.width);
            const thumbViewport = page.getViewport({ scale: thumbScale });

            const canvas = document.createElement('canvas');
            canvas.width = Math.round(thumbViewport.width);
            canvas.height = Math.round(thumbViewport.height);
            const ctx = canvas.getContext('2d');
            if (ctx) {
              // @ts-expect-error - PDF.js typed interface compatibility
              await page.render({ canvasContext: ctx, viewport: thumbViewport }).promise;
              thumbs.push(canvas.toDataURL('image/jpeg', 0.8));
            } else {
              thumbs.push('');
            }
          } catch {
            thumbs.push('');
          }
          if (i % 2 === 0 || i === pdf.numPages) {
            setThumbnails([...thumbs]);
          }
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load PDF document for preview.');
          setLoading(false);
        }
      }
    }

    loadPdf();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // ignore
        }
      }
    };
  }, [file, pdfData, blob]);

  // Helper to render a specific page at target scale
  const renderSinglePage = async (pdf: any, pageNum: number, currentScale: number) => {
    if (!pdf || pageNum < 1 || pageNum > pdf.numPages) return;

    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch {
        // ignore
      }
    }

    setRenderingPage(true);
    try {
      const page = await pdf.getPage(pageNum);
      // High-DPI multiplier for sharp vector & text readability
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const viewport = page.getViewport({ scale: currentScale * dpr });

      const canvas = document.createElement('canvas');
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Could not create canvas context');

      // White background for transparent pages
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport,
      };

      const task = page.render(renderContext);
      renderTaskRef.current = task;
      await task.promise;

      setPageDimensions({
        width: Math.round(viewport.width / dpr),
        height: Math.round(viewport.height / dpr),
      });
      setPageImageUrl(canvas.toDataURL('image/png'));
      setRenderingPage(false);
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') {
        console.warn('Page render error:', err);
        setRenderingPage(false);
      }
    }
  };

  // Re-render when currentPage or scale changes
  useEffect(() => {
    if (pdfDocRef.current && !loading) {
      renderSinglePage(pdfDocRef.current, currentPage, scale);
    }
  }, [currentPage, scale]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        setCurrentPage((p) => Math.max(1, p - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentPage((p) => Math.min(totalPages, p + 1));
      } else if (e.key === '+' || e.key === '=') {
        setScale((s) => Math.min(3.0, +(s + 0.2).toFixed(1)));
      } else if (e.key === '-') {
        setScale((s) => Math.max(0.6, +(s - 0.2).toFixed(1)));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalPages, onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-between overflow-hidden animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="h-14 bg-[#0F172A] text-white px-4 flex items-center justify-between border-b border-white/10 shrink-0 select-none shadow-md">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#D98218]/20 flex items-center justify-center text-[#D98218] shrink-0 border border-[#D98218]/40">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold truncate max-w-xs sm:max-w-md text-white">
              {docTitle}
            </h3>
            <p className="text-[10px] text-white/60">
              {totalPages > 0 ? `Total: ${totalPages} Pages · Page ${currentPage}` : 'Loading document...'}
            </p>
          </div>
        </div>

        {/* Page navigation & Zoom controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {totalPages > 0 && (
            <div className="flex items-center gap-1 bg-white/10 rounded-lg px-2 py-1 text-xs">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="p-1 hover:bg-white/20 rounded disabled:opacity-30 cursor-pointer"
                title="Previous Page (Left Arrow)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono text-xs px-1.5 font-bold">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="p-1 hover:bg-white/20 rounded disabled:opacity-30 cursor-pointer"
                title="Next Page (Right Arrow)"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Zoom controls */}
          <div className="hidden sm:flex items-center gap-1 bg-white/10 rounded-lg px-2 py-1 text-xs">
            <button
              type="button"
              onClick={() => setScale((s) => Math.max(0.6, +(s - 0.2).toFixed(1)))}
              disabled={scale <= 0.6}
              className="p-1 hover:bg-white/20 rounded disabled:opacity-30 cursor-pointer"
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] w-12 text-center font-semibold">
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setScale((s) => Math.min(3.0, +(s + 0.2).toFixed(1)))}
              disabled={scale >= 3.0}
              className="p-1 hover:bg-white/20 rounded disabled:opacity-30 cursor-pointer"
              title="Zoom In (+)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setScale(1.0)}
              className="px-1.5 py-0.5 hover:bg-white/20 rounded text-[10px] font-semibold text-white/80 cursor-pointer ml-1"
              title="Reset to 100%"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-rose-500/80 flex items-center justify-center transition-colors text-white cursor-pointer ml-1"
            title="Close Review (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Document Viewport */}
      <div className="flex-1 overflow-auto p-4 sm:p-8 flex items-center justify-center relative bg-[#1E293B]/95">
        {loading ? (
          <div className="flex flex-col items-center gap-3 text-white/90">
            <Loader2 className="w-9 h-9 animate-spin text-[#D98218]" />
            <p className="text-sm font-semibold">Loading document preview...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs max-w-md text-center">
            <p className="font-bold text-sm mb-1">Failed to Preview Document</p>
            <p>{error}</p>
          </div>
        ) : (
          <div className="relative flex flex-col items-center max-w-full my-auto">
            {renderingPage && !pageImageUrl && (
              <div className="flex flex-col items-center gap-2 text-white/80 py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#D98218]" />
                <p className="text-xs">Rendering page {currentPage}...</p>
              </div>
            )}

            {pageImageUrl && (
              <div
                className="relative bg-white shadow-2xl rounded-sm overflow-hidden border border-white/20 transition-all duration-150"
                style={{
                  width: pageDimensions ? `${pageDimensions.width * (scale / 1.2)}px` : undefined,
                  maxWidth: '92vw',
                }}
              >
                {renderingPage && (
                  <div className="absolute inset-0 bg-black/15 backdrop-blur-[1px] flex items-center justify-center z-10">
                    <Loader2 className="w-7 h-7 animate-spin text-[#D98218]" />
                  </div>
                )}
                <img
                  src={pageImageUrl}
                  alt={`Document Page ${currentPage}`}
                  className="w-full h-auto block select-none pointer-events-none"
                />
              </div>
            )}
          </div>
        )}

        {/* Floating Quick Navigation Arrows */}
        {totalPages > 1 && !loading && (
          <>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center disabled:opacity-20 transition-all cursor-pointer shadow-xl backdrop-blur-sm border border-white/10"
              title="Previous Page (Left Arrow)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center disabled:opacity-20 transition-all cursor-pointer shadow-xl backdrop-blur-sm border border-white/10"
              title="Next Page (Right Arrow)"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Bottom Thumbnail Strip */}
      {thumbnails.length > 0 && (
        <div className="h-28 bg-[#0F172A] border-t border-white/10 px-4 py-2 flex items-center gap-3 overflow-x-auto shrink-0 select-none">
          {thumbnails.map((thumb, idx) => {
            const pageNum = idx + 1;
            const isCurrent = pageNum === currentPage;
            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => setCurrentPage(pageNum)}
                className={`flex flex-col items-center gap-1 shrink-0 p-1 rounded-lg transition-all cursor-pointer ${
                  isCurrent
                    ? 'ring-2 ring-[#D98218] bg-white/15 scale-105'
                    : 'opacity-70 hover:opacity-100 hover:bg-white/5'
                }`}
              >
                <div className="w-14 h-18 bg-white/5 rounded border border-white/15 overflow-hidden flex items-center justify-center">
                  {thumb ? (
                    <img
                      src={thumb}
                      alt={`Page ${pageNum}`}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-[10px] text-white/40">#{pageNum}</span>
                  )}
                </div>
                <span className="text-[10px] font-bold text-white/80">#{pageNum}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

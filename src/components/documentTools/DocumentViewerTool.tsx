import React, { useState, useRef } from 'react';
import {
  Eye,
  Upload,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  FileCheck,
  ShieldCheck,
  RefreshCw,
  Layers,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { renderDocumentPages } from '../../services/document/documentService';

export const DocumentViewerTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [pages, setPages] = useState<string[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setError(null);
      setIsRendering(true);
      setCurrentPage(1);
      setPages([]);

      try {
        const result = await renderDocumentPages(selected, 30);
        if (result.pages.length === 0) {
          setError('Could not render preview for this document format.');
        } else {
          setPages(result.pages);
          setTotalPages(result.totalPages);
        }
      } catch (err: any) {
        console.error(err);
        setError(err?.message || 'Failed to render document preview.');
      } finally {
        setIsRendering(false);
      }
    }
  };

  const handleReset = () => {
    setFile(null);
    setPages([]);
    setTotalPages(0);
    setCurrentPage(1);
    setZoomLevel(100);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownloadOriginal = () => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Tool Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E9DCC8]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF3DF] text-[#D98218] text-xs font-bold uppercase tracking-wider mb-2 border border-[#F4A62A]/30">
            <Eye className="w-3.5 h-3.5" />
            <span>Document Previewer</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#102A43]">Document Viewer</h2>
          <p className="text-sm text-[#61758A] mt-1">
            Preview and read documents online in your browser. Fast rendering without server uploads.
          </p>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="space-y-6">
        {!file ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#E9DCC8] hover:border-[#D98218] bg-white rounded-3xl p-10 sm:p-14 text-center cursor-pointer transition-all hover:shadow-[0_8px_30px_rgba(217,130,24,0.08)] flex flex-col items-center justify-center min-h-[340px]"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.md,.json,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-18 h-18 rounded-3xl bg-[#FFF3DF] text-[#D98218] flex items-center justify-center mb-4 shadow-sm">
              <Eye className="w-9 h-9 stroke-[2.2]" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-[#102A43]">
              Drop any document to preview instantly
            </h3>
            <p className="text-sm text-[#61758A] mt-2 max-w-md">
              Supports PDF, Word (.docx), Markdown (.md), and plain text files. Rendered securely directly in your browser.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#D98218] text-white font-bold text-sm shadow-md hover:bg-[#B86B0E] transition-all">
              <Upload className="w-4 h-4" />
              <span>Select Document</span>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Viewer Controls Toolbar */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E9DCC8] shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#FFF3DF] text-[#D98218] flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-[#102A43] text-sm truncate">{file.name}</h4>
                  <p className="text-xs text-[#61758A]">{formatFileSize(file.size)}</p>
                </div>
              </div>

              {/* Page & Zoom Navigation */}
              {pages.length > 0 && (
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  {/* Page selector */}
                  <div className="flex items-center gap-1.5 bg-[#FAF5EC] px-3 py-1.5 rounded-xl border border-[#E9DCC8]">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                      className="p-1 rounded-lg hover:bg-white text-[#102A43] disabled:opacity-40 transition-all"
                      title="Previous Page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-bold text-[#102A43] px-1">
                      {currentPage} / {totalPages || pages.length}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(pages.length, p + 1))}
                      disabled={currentPage >= pages.length}
                      className="p-1 rounded-lg hover:bg-white text-[#102A43] disabled:opacity-40 transition-all"
                      title="Next Page"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Zoom controls */}
                  <div className="flex items-center gap-1 bg-[#FAF5EC] px-2 py-1.5 rounded-xl border border-[#E9DCC8]">
                    <button
                      onClick={() => setZoomLevel((z) => Math.max(50, z - 15))}
                      className="p-1 rounded-lg hover:bg-white text-[#102A43] transition-all"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-bold text-[#102A43] px-2">{zoomLevel}%</span>
                    <button
                      onClick={() => setZoomLevel((z) => Math.min(200, z + 15))}
                      className="p-1 rounded-lg hover:bg-white text-[#102A43] transition-all"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={handleDownloadOriginal}
                    className="p-2 rounded-xl bg-[#FAF5EC] border border-[#E9DCC8] hover:border-[#D98218] text-[#102A43] transition-all"
                    title="Download Original"
                  >
                    <Download className="w-4 h-4 text-[#D98218]" />
                  </button>
                </div>
              )}

              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-xl border border-[#E9DCC8] text-xs font-bold text-[#61758A] hover:text-[#102A43] hover:border-[#D98218] transition-all flex items-center gap-1.5 shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Open New</span>
              </button>
            </div>

            {isRendering && (
              <div className="bg-white rounded-3xl p-16 border border-[#E9DCC8] text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-[#D98218] animate-spin mx-auto" />
                <h4 className="font-bold text-[#102A43]">Rendering Document Pages...</h4>
                <p className="text-xs text-[#61758A]">
                  Generating high-fidelity page preview with PDF.js engine
                </p>
              </div>
            )}

            {/* Document Page Canvas Display */}
            {pages.length > 0 && !isRendering && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Thumbnails Sidebar */}
                <div className="lg:col-span-3 bg-white rounded-3xl p-4 border border-[#E9DCC8] shadow-sm max-h-[750px] overflow-y-auto space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-[#E9DCC8]">
                    <Layers className="w-4 h-4 text-[#D98218]" />
                    <span className="text-xs font-bold text-[#102A43] uppercase tracking-wider">
                      Pages ({pages.length})
                    </span>
                  </div>
                  <div className="space-y-3">
                    {pages.map((pageImg, idx) => {
                      const pageNum = idx + 1;
                      const isActive = currentPage === pageNum;
                      return (
                        <div
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`p-2 rounded-2xl cursor-pointer border-2 transition-all text-center ${
                            isActive
                              ? 'border-[#D98218] bg-[#FFF8EE] shadow-sm'
                              : 'border-[#E9DCC8]/60 hover:border-[#D98218]/40 bg-[#FAF5EC]/50'
                          }`}
                        >
                          <img
                            src={pageImg}
                            alt={`Page ${pageNum}`}
                            className="w-full rounded-lg shadow-sm border border-neutral-200 object-contain max-h-36 mx-auto"
                          />
                          <span
                            className={`block mt-1.5 text-xs font-bold ${
                              isActive ? 'text-[#D98218]' : 'text-[#61758A]'
                            }`}
                          >
                            Page {pageNum}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Main Active Page Display */}
                <div className="lg:col-span-9 bg-[#102A43]/5 rounded-3xl p-6 border border-[#E9DCC8] shadow-inner flex items-center justify-center min-h-[600px] overflow-auto">
                  <div
                    style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
                    className="transition-transform duration-200"
                  >
                    <img
                      src={pages[currentPage - 1]}
                      alt={`Page ${currentPage}`}
                      className="rounded-xl shadow-2xl border border-neutral-300 max-w-full bg-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

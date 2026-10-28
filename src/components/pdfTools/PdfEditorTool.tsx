import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Download,
  Check,
  AlertCircle,
  RefreshCw,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Edit3,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { renderPdfPageToCanvas, getPdfPageCount, fileToArrayBuffer } from '../../services/pdf/pdfLibUtils';
import { saveEditedPdf, EditorAnnotation } from '../../services/pdf/editorWatermarkService';

export const PdfEditorTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1.0);
  const [annotations, setAnnotations] = useState<EditorAnnotation[]>([]);
  const [newText, setNewText] = useState('Approved by Codemaniac Studio');
  const [textColor, setTextColor] = useState('#D98218');
  const [fontSize, setFontSize] = useState(16);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [canvasUrl, setCanvasUrl] = useState<string>('');

  const loadPagePreview = async (fileObj: File, pageNum: number, zoomLevel: number) => {
    try {
      const buf = await fileToArrayBuffer(fileObj);
      const canvas = await renderPdfPageToCanvas(buf, pageNum, zoomLevel * 1.2);
      setCanvasUrl(canvas.toDataURL('image/png'));
    } catch (err) {
      console.warn('Canvas render error:', err);
    }
  };

  const handleFileSelected = async (selected: File | null) => {
    if (!selected) return;
    setErrorMsg(null);
    setResultBlob(null);
    setAnnotations([]);
    try {
      const buf = await fileToArrayBuffer(selected);
      const pages = await getPdfPageCount(buf);
      setFile(selected);
      setTotalPages(pages);
      setCurrentPage(1);
      loadPagePreview(selected, 1, zoom);
    } catch {
      setErrorMsg('Could not read PDF. Please provide a valid PDF file.');
    }
  };

  useEffect(() => {
    if (file) {
      loadPagePreview(file, currentPage, zoom);
    }
  }, [file, currentPage, zoom]);

  const addTextAnnotation = () => {
    if (!newText.trim()) return;
    const newAnnot: EditorAnnotation = {
      id: `text-${Date.now()}`,
      pageNum: currentPage,
      type: 'text',
      x: 0.1, // 10% from left
      y: 0.85, // near top
      text: newText,
      fontSize: fontSize,
      color: textColor,
      opacity: 1.0,
    };
    setAnnotations((prev) => [...prev, newAnnot]);
  };

  const addHighlightAnnotation = () => {
    const newAnnot: EditorAnnotation = {
      id: `hl-${Date.now()}`,
      pageNum: currentPage,
      type: 'highlight',
      x: 0.1,
      y: 0.8,
      width: 0.8,
      height: 0.04,
      color: '#F59E0B',
      opacity: 0.4,
    };
    setAnnotations((prev) => [...prev, newAnnot]);
  };

  const removeAnnotation = (id: string) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSave = async () => {
    if (!file) return;
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const buf = await fileToArrayBuffer(file);
      const bytes = await saveEditedPdf(buf, annotations);
      const blob = new Blob([bytes as any], { type: 'application/pdf' });
      setResultBlob(blob);
      setIsProcessing(false);
      try {
        confetti({ particleCount: 35, spread: 55 });
      } catch {
        // ignore
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error saving edited PDF.');
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultBlob || !file) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    a.download = `${baseName}_edited.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  const pageAnnotations = annotations.filter((a) => a.pageNum === currentPage);

  return (
    <div className="space-y-4">
      {!file ? (
        <label className="border-2 border-dashed border-[#E9DCC8] hover:border-[#D98218] bg-[#FAF5EC]/60 hover:bg-[#FFF3DF]/40 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all">
          <input
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => handleFileSelected(e.target.files?.[0] || null)}
          />
          <div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-[#E9DCC8] flex items-center justify-center text-[#D98218] mb-2">
            <Upload className="w-6 h-6" />
          </div>
          <span className="text-sm font-bold text-[#102A43]">Select PDF to edit</span>
          <span className="text-xs text-[#61758A] mt-0.5">
            Add text overlays, highlights, shapes, and annotations
          </span>
        </label>
      ) : (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-[#FAF5EC] rounded-xl border border-[#E9DCC8] text-xs">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="p-1 rounded bg-white border border-[#E9DCC8] disabled:opacity-40 cursor-pointer"
                title="Previous page"
              >
                <ChevronLeft className="w-4 h-4 text-[#102A43]" />
              </button>
              <span className="font-bold text-[#102A43] px-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="p-1 rounded bg-white border border-[#E9DCC8] disabled:opacity-40 cursor-pointer"
                title="Next page"
              >
                <ChevronRight className="w-4 h-4 text-[#102A43]" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoom((z) => Math.max(0.7, z - 0.15))}
                className="p-1 rounded bg-white border border-[#E9DCC8] cursor-pointer"
                title="Zoom out"
              >
                <ZoomOut className="w-4 h-4 text-[#102A43]" />
              </button>
              <span className="font-mono text-[#102A43] font-bold">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.min(1.5, z + 0.15))}
                className="p-1 rounded bg-white border border-[#E9DCC8] cursor-pointer"
                title="Zoom in"
              >
                <ZoomIn className="w-4 h-4 text-[#102A43]" />
              </button>
            </div>
          </div>

          {/* Add Elements Panel */}
          <div className="p-3 bg-white rounded-xl border border-[#E9DCC8] space-y-2 text-xs">
            <span className="font-bold text-[#102A43] block">ADD OVERLAY TO CURRENT PAGE:</span>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="Text to add..."
                className="flex-1 p-2 bg-[#FAF5EC] border border-[#E9DCC8] rounded-lg text-xs text-[#102A43] focus:outline-none focus:border-[#D98218]"
              />
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-8 h-8 rounded border border-[#E9DCC8] cursor-pointer"
                  title="Text color"
                />
                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="p-1.5 bg-[#FAF5EC] border border-[#E9DCC8] rounded-lg text-xs"
                >
                  <option value={12}>12pt</option>
                  <option value={16}>16pt</option>
                  <option value={20}>20pt</option>
                  <option value={24}>24pt</option>
                </select>
                <button
                  onClick={addTextAnnotation}
                  className="px-3 py-1.5 bg-[#D98218] hover:bg-[#C66A08] text-white font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Text</span>
                </button>
                <button
                  onClick={addHighlightAnnotation}
                  className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-lg cursor-pointer"
                >
                  + Highlight
                </button>
              </div>
            </div>
          </div>

          {/* Canvas Preview Container */}
          <div
            ref={canvasContainerRef}
            className="relative max-h-72 overflow-auto bg-gray-100 p-4 rounded-xl border border-[#E9DCC8] flex items-center justify-center"
          >
            {canvasUrl ? (
              <div className="relative inline-block shadow-md">
                <img
                  src={canvasUrl}
                  alt={`Page ${currentPage}`}
                  className="max-w-full h-auto block select-none pointer-events-none"
                />

                {/* Overlaid preview markers */}
                {pageAnnotations.map((annot) => (
                  <div
                    key={annot.id}
                    style={{
                      position: 'absolute',
                      left: `${annot.x * 100}%`,
                      bottom: `${annot.y * 100}%`,
                      color: annot.color,
                      fontSize: `${annot.fontSize || 14}px`,
                      fontWeight: 'bold',
                      backgroundColor: annot.type === 'highlight' ? 'rgba(245, 158, 11, 0.4)' : 'transparent',
                      padding: '2px 4px',
                      borderRadius: '3px',
                      border: '1px dashed #D98218',
                    }}
                    className="cursor-move select-none"
                  >
                    {annot.text || 'Highlighted Area'}
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-xs text-[#61758A]">Loading page preview...</span>
            )}
          </div>

          {/* Annotations List */}
          {annotations.length > 0 && (
            <div className="p-2.5 bg-[#FAF5EC] rounded-xl border border-[#E9DCC8] text-xs">
              <span className="font-bold text-[#102A43] block mb-1.5">
                ACTIVE ANNOTATIONS ({annotations.length})
              </span>
              <div className="max-h-24 overflow-y-auto space-y-1">
                {annotations.map((annot) => (
                  <div
                    key={annot.id}
                    className="flex items-center justify-between p-1.5 bg-white rounded border border-[#E9DCC8]"
                  >
                    <span className="truncate">
                      Page {annot.pageNum}: <strong>{annot.text || annot.type}</strong>
                    </span>
                    <button
                      onClick={() => removeAnnotation(annot.id)}
                      className="text-red-600 hover:text-red-800 p-0.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {resultBlob ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-900">PDF Saved with Overlays!</h4>
                  <span className="text-[11px] text-emerald-700">
                    {(resultBlob.size / 1024).toFixed(1)} KB · Ready to save
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-[#D98218] hover:bg-[#C66A08] text-white text-xs font-bold rounded-full shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Edited PDF</span>
                </button>
                <button
                  onClick={() => setResultBlob(null)}
                  className="p-2 bg-white border border-[#E9DCC8] rounded-full text-[#102A43] cursor-pointer"
                  title="Edit further"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleSave}
              disabled={isProcessing}
              className="w-full py-3 rounded-full bg-gradient-to-r from-[#D98218] to-[#C66A08] text-white font-bold text-sm shadow-md hover:shadow-lg disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              <span>{isProcessing ? 'Generating PDF...' : 'Save & Download Edited PDF'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

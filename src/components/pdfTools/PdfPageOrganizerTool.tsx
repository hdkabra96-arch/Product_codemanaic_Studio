import React, { useState } from 'react';
import {
  Upload,
  Download,
  Check,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Trash2,
  Eye,
  FileText,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { reorganizePdfPages } from '../../services/pdf/mergeSplitService';
import { renderAllPdfThumbnails, fileToArrayBuffer } from '../../services/pdf/pdfLibUtils';
import { PdfDocumentReviewModal } from './PdfDocumentReviewModal';

interface PageItem {
  id: string;
  originalPageNum: number;
  rotation: number;
  thumbnailUrl: string;
}

export const PdfPageOrganizerTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loadingThumbnails, setLoadingThumbnails] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Review modal state
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewData, setReviewData] = useState<{
    file?: File | null;
    blob?: Blob | null;
    title: string;
    initialPage?: number;
  } | null>(null);

  const handleFileSelected = async (selected: File | null) => {
    if (!selected) return;
    setErrorMsg(null);
    setResultBlob(null);
    setFile(selected);
    setLoadingThumbnails(true);

    try {
      const buf = await fileToArrayBuffer(selected);
      const thumbs = await renderAllPdfThumbnails(buf, 160);
      const items: PageItem[] = thumbs.map((thumb, idx) => ({
        id: `page-${idx + 1}`,
        originalPageNum: idx + 1,
        rotation: 0,
        thumbnailUrl: thumb,
      }));

      setPages(items);
      setLoadingThumbnails(false);
    } catch {
      setErrorMsg('Could not load PDF page thumbnails.');
      setLoadingThumbnails(false);
    }
  };

  const movePage = (index: number, direction: 'left' | 'right') => {
    const targetIdx = direction === 'left' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= pages.length) return;
    const next = [...pages];
    const temp = next[index];
    next[index] = next[targetIdx];
    next[targetIdx] = temp;
    setPages(next);
  };

  const rotatePage = (index: number) => {
    const next = [...pages];
    next[index] = {
      ...next[index],
      rotation: (next[index].rotation + 90) % 360,
    };
    setPages(next);
  };

  const deletePage = (index: number) => {
    if (pages.length <= 1) {
      setErrorMsg('Cannot delete the only page in the document.');
      return;
    }
    setPages((prev) => prev.filter((_, i) => i !== index));
  };

  const openDocumentReview = (pageNum: number = 1) => {
    if (!file) return;
    setReviewData({
      file,
      title: `${file.name} (Review Document)`,
      initialPage: pageNum,
    });
    setIsReviewOpen(true);
  };

  const openResultReview = () => {
    if (!resultBlob || !file) return;
    setReviewData({
      blob: resultBlob,
      title: `${file.name.replace(/\.[^/.]+$/, '')}_organized.pdf (Preview)`,
      initialPage: 1,
    });
    setIsReviewOpen(true);
  };

  const handleSave = async () => {
    if (!file || pages.length === 0) return;
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const buf = await fileToArrayBuffer(file);
      const order = pages.map((p) => ({
        pageNum: p.originalPageNum,
        rotation: p.rotation,
      }));
      const { bytes } = await reorganizePdfPages(buf, order);
      const blob = new Blob([bytes as any], { type: 'application/pdf' });
      setResultBlob(blob);
      setIsProcessing(false);
      try {
        confetti({ particleCount: 35, spread: 55 });
      } catch {
        // ignore
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error organizing pages.');
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultBlob || !file) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    a.download = `${baseName}_organized.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

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
          <span className="text-sm font-bold text-[#102A43]">Select PDF to organize</span>
          <span className="text-xs text-[#61758A] mt-0.5">
            Reorder, rotate, delete, or click any page to review it properly
          </span>
        </label>
      ) : (
        <div className="space-y-4">
          {/* Header Card with Review Option */}
          <div className="p-3.5 bg-white rounded-xl border border-[#E9DCC8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="truncate">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#D98218] shrink-0" />
                <p className="text-xs font-bold text-[#102A43] truncate">{file.name}</p>
              </div>
              <p className="text-[11px] text-[#61758A] mt-1">
                {pages.length} pages in new arrangement · Click any page to review full size
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => openDocumentReview(1)}
                className="px-3 py-1.5 bg-[#FFF8EE] hover:bg-[#FFF3DF] text-[#D98218] border border-[#E9DCC8] hover:border-[#D98218] rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                title="Review document pages properly"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Review Document</span>
              </button>
              <button
                onClick={() => {
                  setFile(null);
                  setPages([]);
                  setResultBlob(null);
                }}
                className="text-xs text-[#61758A] hover:text-[#D98218] font-semibold px-2 py-1 cursor-pointer"
              >
                Change File
              </button>
            </div>
          </div>

          {loadingThumbnails ? (
            <div className="p-8 text-center text-xs text-[#61758A] bg-[#FAF5EC] rounded-xl border border-[#E9DCC8] animate-pulse">
              Rendering page thumbnails...
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-80 overflow-y-auto p-3 bg-[#FAF5EC]/60 rounded-xl border border-[#E9DCC8]">
              {pages.map((item, idx) => (
                <div
                  key={item.id}
                  className="bg-white p-2 rounded-xl border border-[#E9DCC8] shadow-xs flex flex-col items-center justify-between space-y-2 group hover:border-[#D98218] transition-all"
                >
                  {/* Thumbnail Container: Clicking opens full page review */}
                  <div
                    onClick={() => openDocumentReview(item.originalPageNum)}
                    className="relative w-full aspect-[3/4] bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center border border-gray-100 cursor-pointer"
                    title={`Click to review Page ${item.originalPageNum} in high resolution`}
                  >
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={`Page ${item.originalPageNum}`}
                        style={{ transform: `rotate(${item.rotation}deg)` }}
                        className="max-h-full max-w-full object-contain transition-transform duration-200 pointer-events-none"
                      />
                    ) : (
                      <span className="text-xs text-gray-400">Page {item.originalPageNum}</span>
                    )}

                    {/* Hover review overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white rounded-lg gap-1 text-[11px] font-bold">
                      <Eye className="w-4 h-4" />
                      <span>Review</span>
                    </div>

                    <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#102A43]/85 text-white z-10">
                      #{idx + 1}
                    </span>
                    {item.rotation > 0 && (
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#D98218] text-white z-10">
                        {item.rotation}°
                      </span>
                    )}
                  </div>

                  {/* Actions per card */}
                  <div className="flex items-center gap-1 w-full justify-between pt-1 border-t border-gray-100">
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => movePage(idx, 'left')}
                        disabled={idx === 0}
                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 cursor-pointer text-[#102A43]"
                        title="Move left"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => movePage(idx, 'right')}
                        disabled={idx === pages.length - 1}
                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 cursor-pointer text-[#102A43]"
                        title="Move right"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => rotatePage(idx)}
                        className="p-1 rounded hover:bg-[#FFF3DF] text-[#D98218] cursor-pointer"
                        title="Rotate 90°"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => openDocumentReview(item.originalPageNum)}
                        className="p-1 rounded hover:bg-[#FFF3DF] text-[#D98218] cursor-pointer"
                        title="Review page full size"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deletePage(idx)}
                        className="p-1 rounded hover:bg-red-50 text-red-600 cursor-pointer"
                        title="Delete page"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {resultBlob ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-900">PDF Successfully Reorganized!</h4>
                  <span className="text-[11px] text-emerald-700">
                    {pages.length} pages · {(resultBlob.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={openResultReview}
                  className="px-3.5 py-2 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold rounded-full shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Review reorganized PDF before downloading"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Review Result</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-[#D98218] hover:bg-[#C66A08] text-white text-xs font-bold rounded-full shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={() => setResultBlob(null)}
                  className="p-2 bg-white border border-[#E9DCC8] rounded-full text-[#102A43] hover:bg-gray-50 cursor-pointer"
                  title="Organize again"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleSave}
              disabled={pages.length === 0 || isProcessing}
              className="w-full py-3 rounded-full bg-gradient-to-r from-[#D98218] to-[#C66A08] text-white font-bold text-sm shadow-md hover:shadow-lg disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{isProcessing ? 'Saving Arrangement...' : 'Save Reorganized PDF'}</span>
            </button>
          )}
        </div>
      )}

      {/* Full Document Review Modal */}
      {isReviewOpen && reviewData && (
        <PdfDocumentReviewModal
          file={reviewData.file}
          blob={reviewData.blob}
          title={reviewData.title}
          initialPage={reviewData.initialPage}
          onClose={() => setIsReviewOpen(false)}
        />
      )}
    </div>
  );
};

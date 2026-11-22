import React, { useState } from 'react';
import {
  Upload,
  Download,
  Check,
  AlertCircle,
  RefreshCw,
  RotateCw,
  Trash2,
  Eye,
  FileText,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { rotatePagesInPdf, deletePagesFromPdf, parsePageRangeString } from '../../services/pdf/mergeSplitService';
import { getPdfPageCount, fileToArrayBuffer, renderAllPdfThumbnails } from '../../services/pdf/pdfLibUtils';
import { PdfDocumentReviewModal } from './PdfDocumentReviewModal';

interface PdfRotationDeletionToolProps {
  mode: 'rotation' | 'deletion';
}

export const PdfRotationDeletionTool: React.FC<PdfRotationDeletionToolProps> = ({ mode }) => {
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [rotationAngle, setRotationAngle] = useState<90 | 180 | 270>(90);
  const [targetScope, setTargetScope] = useState<'all' | 'custom'>('all');
  const [rangeInput, setRangeInput] = useState('1');
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [loadingThumbs, setLoadingThumbs] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Review modal state
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewData, setReviewData] = useState<{
    file?: File | null;
    pdfData?: Uint8Array | null;
    title: string;
    initialPage?: number;
  } | null>(null);

  const handleFileSelected = async (selected: File | null) => {
    if (!selected) return;
    setErrorMsg(null);
    setResultBlob(null);
    setThumbnails([]);
    setLoadingThumbs(true);

    try {
      const buf = await fileToArrayBuffer(selected);
      const count = await getPdfPageCount(buf);
      setFile(selected);
      setTotalPages(count);
      setSelectedPages(mode === 'deletion' ? [] : [1]);
      setRangeInput(mode === 'deletion' ? '' : '1');

      renderAllPdfThumbnails(buf, 140)
        .then((thumbs) => {
          setThumbnails(thumbs);
          setLoadingThumbs(false);
        })
        .catch(() => setLoadingThumbs(false));
    } catch {
      setErrorMsg('Could not read PDF.');
      setLoadingThumbs(false);
    }
  };

  const togglePage = (p: number) => {
    const next = selectedPages.includes(p)
      ? selectedPages.filter((x) => x !== p)
      : [...selectedPages, p].sort((a, b) => a - b);
    setSelectedPages(next);
    setRangeInput(next.join(', '));
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
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        setReviewData({
          pdfData: new Uint8Array(reader.result as ArrayBuffer),
          title: `${file.name.replace(/\.[^/.]+$/, '')}_${mode === 'rotation' ? 'rotated' : 'modified'}.pdf (Preview)`,
          initialPage: 1,
        });
        setIsReviewOpen(true);
      }
    };
    reader.readAsArrayBuffer(resultBlob);
  };

  const handleProcess = async () => {
    if (!file) return;
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const buf = await fileToArrayBuffer(file);
      let bytes: Uint8Array;

      if (mode === 'rotation') {
        const pagesToRotate =
          targetScope === 'all'
            ? 'all'
            : parsePageRangeString(rangeInput || '1', totalPages);
        const res = await rotatePagesInPdf(buf, rotationAngle, pagesToRotate);
        bytes = res.bytes;
      } else {
        const pagesToDelete =
          selectedPages.length > 0
            ? selectedPages
            : parsePageRangeString(rangeInput, totalPages);
        if (pagesToDelete.length === 0) {
          throw new Error('Please select at least one page to delete.');
        }
        if (pagesToDelete.length >= totalPages) {
          throw new Error('Cannot delete all pages of the document. At least one page must remain.');
        }
        const res = await deletePagesFromPdf(buf, pagesToDelete);
        bytes = res.bytes;
      }

      const blob = new Blob([bytes as any], { type: 'application/pdf' });
      setResultBlob(blob);
      setIsProcessing(false);
      try {
        confetti({ particleCount: 35, spread: 55 });
      } catch {
        // ignore
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error processing document.');
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultBlob || !file) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    a.download = `${baseName}_${mode === 'rotation' ? 'rotated' : 'modified'}.pdf`;
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
            {mode === 'rotation' ? <RotateCw className="w-6 h-6" /> : <Trash2 className="w-6 h-6" />}
          </div>
          <span className="text-sm font-bold text-[#102A43]">
            Select PDF to {mode === 'rotation' ? 'rotate' : 'delete pages'}
          </span>
          <span className="text-xs text-[#61758A] mt-0.5">
            {mode === 'rotation'
              ? 'Rotate all pages or specific pages by 90°, 180°, or 270°'
              : 'Safely remove selected pages with visual page review'}
          </span>
        </label>
      ) : (
        <div className="space-y-4">
          {/* File Card with Review Option */}
          <div className="p-3.5 bg-white rounded-xl border border-[#E9DCC8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="truncate">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#D98218] shrink-0" />
                <p className="text-xs font-bold text-[#102A43] truncate">{file.name}</p>
              </div>
              <p className="text-[11px] text-[#61758A] mt-1">
                Total: <strong className="text-[#D98218]">{totalPages} pages</strong>
                {mode === 'deletion' && (
                  <>
                    {' '}· Selected to delete:{' '}
                    <strong className="text-rose-600">{selectedPages.length}</strong>
                  </>
                )}
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
                  setResultBlob(null);
                  setThumbnails([]);
                }}
                className="text-xs text-[#61758A] hover:text-[#D98218] font-semibold px-2 py-1 cursor-pointer"
              >
                Change
              </button>
            </div>
          </div>

          {mode === 'rotation' ? (
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#102A43] block mb-1">ROTATION ANGLE:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { angle: 90 as const, label: '90° Clockwise' },
                    { angle: 180 as const, label: '180° Flip' },
                    { angle: 270 as const, label: '270° (90° CCW)' },
                  ].map((r) => (
                    <button
                      key={r.angle}
                      type="button"
                      onClick={() => setRotationAngle(r.angle)}
                      className={`p-2.5 rounded-xl border text-center font-bold cursor-pointer transition-all ${
                        rotationAngle === r.angle
                          ? 'border-[#D98218] bg-[#FFF8EE] text-[#D98218]'
                          : 'border-[#E9DCC8] bg-white text-[#102A43] hover:bg-[#FAF5EC]'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-[#102A43] block mb-1">PAGES TO ROTATE:</label>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setTargetScope('all')}
                    className={`flex-1 py-1.5 rounded-lg font-bold cursor-pointer ${
                      targetScope === 'all'
                        ? 'bg-[#D98218] text-white'
                        : 'bg-white border border-[#E9DCC8] text-[#102A43]'
                    }`}
                  >
                    All Pages ({totalPages})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetScope('custom')}
                    className={`flex-1 py-1.5 rounded-lg font-bold cursor-pointer ${
                      targetScope === 'custom'
                        ? 'bg-[#D98218] text-white'
                        : 'bg-white border border-[#E9DCC8] text-[#102A43]'
                    }`}
                  >
                    Custom Pages / Range
                  </button>
                </div>

                {targetScope === 'custom' && (
                  <input
                    type="text"
                    value={rangeInput}
                    onChange={(e) => setRangeInput(e.target.value)}
                    placeholder="e.g. 1, 3, 5-7"
                    className="w-full p-2 bg-white border border-[#E9DCC8] rounded-lg font-mono text-xs text-[#102A43]"
                  />
                )}
              </div>
            </div>
          ) : (
            /* Deletion Mode with Visual Page Review */
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <label className="font-bold text-[#102A43] uppercase flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Select Pages to Delete (Click to mark · Hover to review):</span>
                </label>
                <span className="text-[11px] text-[#61758A]">
                  Marked: <strong className="text-rose-600">{selectedPages.length}</strong> / {totalPages}
                </span>
              </div>

              {/* Visual Thumbnail Cards for Deletion */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 max-h-72 overflow-y-auto p-3 bg-[#FAF5EC]/60 rounded-xl border border-[#E9DCC8]">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                  const isMarked = selectedPages.includes(p);
                  const thumb = thumbnails[p - 1];

                  return (
                    <div
                      key={p}
                      onClick={() => togglePage(p)}
                      className={`group relative rounded-xl border-2 p-1.5 transition-all cursor-pointer flex flex-col items-center select-none ${
                        isMarked
                          ? 'border-rose-500 bg-rose-50/60 shadow-xs ring-1 ring-rose-400'
                          : 'border-[#E9DCC8] bg-white hover:border-rose-300'
                      }`}
                    >
                      {/* Page Thumbnail Image */}
                      <div className="w-full aspect-[3/4] bg-[#F7F7F7] rounded-lg overflow-hidden flex items-center justify-center relative border border-gray-200">
                        {thumb ? (
                          <img
                            src={thumb}
                            alt={`Page ${p}`}
                            className={`w-full h-full object-contain pointer-events-none transition-all ${
                              isMarked ? 'opacity-40 grayscale' : ''
                            }`}
                          />
                        ) : (
                          <span className="text-xs text-[#61758A] font-semibold">
                            {loadingThumbs ? 'Loading...' : `Page ${p}`}
                          </span>
                        )}

                        {/* Hover action: Review full page */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDocumentReview(p);
                          }}
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white rounded-lg gap-1 text-[11px] font-bold z-10"
                          title={`Review page ${p} in high-resolution`}
                        >
                          <Eye className="w-4 h-4" />
                          <span>Review</span>
                        </button>

                        {/* Marked for deletion badge */}
                        {isMarked && (
                          <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-xs z-20">
                            <Trash2 className="w-3 h-3" />
                          </div>
                        )}
                      </div>

                      {/* Bottom Label */}
                      <div className="w-full flex items-center justify-between px-1 mt-1.5 text-[11px]">
                        <span className="font-bold text-[#102A43]">Page {p}</span>
                        <span
                          className={`text-[10px] font-bold ${
                            isMarked ? 'text-rose-600' : 'text-[#61758A]'
                          }`}
                        >
                          {isMarked ? 'Delete' : 'Keep'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#61758A] block mb-1">
                  OR ENTER PAGE RANGE TO DELETE:
                </label>
                <input
                  type="text"
                  value={rangeInput}
                  onChange={(e) => {
                    setRangeInput(e.target.value);
                    setSelectedPages(parsePageRangeString(e.target.value, totalPages));
                  }}
                  placeholder="e.g. 2, 4-6"
                  className="w-full p-2 bg-white border border-[#E9DCC8] rounded-lg font-mono text-xs text-[#102A43]"
                />
              </div>

              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800">
                Safety Guard: At least 1 page must remain in the PDF. Current remaining:{' '}
                <strong>{Math.max(0, totalPages - selectedPages.length)}</strong> pages.
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
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-900">
                    {mode === 'rotation' ? 'Document Rotated!' : 'Pages Removed!'}
                  </h4>
                  <span className="text-[11px] text-emerald-700">
                    Remaining size: {(resultBlob.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={openResultReview}
                  className="px-3.5 py-2 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold rounded-full shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Review modified document before downloading"
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
                  title="Process again"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleProcess}
              disabled={isProcessing || (mode === 'deletion' && selectedPages.length === 0)}
              className={`w-full py-3 rounded-full text-white font-bold text-sm shadow-md hover:shadow-lg disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2 ${
                mode === 'deletion' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-gradient-to-r from-[#D98218] to-[#C66A08]'
              }`}
            >
              {mode === 'rotation' ? (
                <>
                  <RotateCw className="w-4 h-4" />
                  <span>{isProcessing ? 'Rotating...' : 'Apply Rotation'}</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>
                    {isProcessing
                      ? 'Deleting Pages...'
                      : `Delete ${selectedPages.length} Pages`}
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Full Document Review Modal */}
      {isReviewOpen && reviewData && (
        <PdfDocumentReviewModal
          file={reviewData.file}
          pdfData={reviewData.pdfData}
          title={reviewData.title}
          initialPage={reviewData.initialPage}
          onClose={() => setIsReviewOpen(false)}
        />
      )}
    </div>
  );
};

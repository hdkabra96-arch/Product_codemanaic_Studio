import React, { useState } from 'react';
import {
  Upload,
  Download,
  Check,
  AlertCircle,
  RefreshCw,
  FileMinus,
  Eye,
  CheckSquare,
  Square,
  FileText,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { extractPagesFromPdf, parsePageRangeString } from '../../services/pdf/mergeSplitService';
import { getPdfPageCount, fileToArrayBuffer, renderAllPdfThumbnails } from '../../services/pdf/pdfLibUtils';
import { PdfDocumentReviewModal } from './PdfDocumentReviewModal';

export const PdfPageExtractorTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [rangeInput, setRangeInput] = useState('1');
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
      setSelectedPages([1]);
      setRangeInput('1');

      renderAllPdfThumbnails(buf, 140)
        .then((thumbs) => {
          setThumbnails(thumbs);
          setLoadingThumbs(false);
        })
        .catch(() => {
          setLoadingThumbs(false);
        });
    } catch {
      setErrorMsg('Could not read PDF file.');
      setLoadingThumbs(false);
    }
  };

  const handleRangeInputChange = (val: string) => {
    setRangeInput(val);
    const parsed = parsePageRangeString(val, totalPages);
    setSelectedPages(parsed);
  };

  const togglePage = (pageNum: number) => {
    const next = selectedPages.includes(pageNum)
      ? selectedPages.filter((p) => p !== pageNum)
      : [...selectedPages, pageNum].sort((a, b) => a - b);
    setSelectedPages(next);
    setRangeInput(next.join(', '));
  };

  const selectAll = () => {
    const all = Array.from({ length: totalPages }, (_, i) => i + 1);
    setSelectedPages(all);
    setRangeInput(totalPages > 1 ? `1-${totalPages}` : '1');
  };

  const deselectAll = () => {
    setSelectedPages([]);
    setRangeInput('');
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
          title: `${file.name.replace(/\.[^/.]+$/, '')}_extracted.pdf (Extracted Review)`,
          initialPage: 1,
        });
        setIsReviewOpen(true);
      }
    };
    reader.readAsArrayBuffer(resultBlob);
  };

  const handleExtract = async () => {
    if (!file) return;
    if (selectedPages.length === 0) {
      setErrorMsg('Please select at least one page to extract.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const buf = await fileToArrayBuffer(file);
      const { bytes } = await extractPagesFromPdf(buf, selectedPages);
      const blob = new Blob([bytes as any], { type: 'application/pdf' });
      setResultBlob(blob);
      setIsProcessing(false);
      try {
        confetti({ particleCount: 35, spread: 55 });
      } catch {
        // ignore
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error extracting pages.');
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultBlob || !file) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    a.download = `${baseName}_extracted.pdf`;
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
          <span className="text-sm font-bold text-[#102A43]">Select PDF to extract pages</span>
          <span className="text-xs text-[#61758A] mt-0.5">
            Choose specific pages with visual thumbnails and full document review
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
                Total: <strong className="text-[#D98218]">{totalPages} pages</strong> · Selected:{' '}
                <strong className="text-[#102A43]">{selectedPages.length}</strong>
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

          {/* Page Range Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#102A43] block">
                ENTER PAGE RANGE OR NUMBERS:
              </label>
              <span className="text-[10px] text-[#61758A]">e.g. 1, 3, 5-8</span>
            </div>
            <input
              type="text"
              value={rangeInput}
              onChange={(e) => handleRangeInputChange(e.target.value)}
              placeholder="e.g. 1, 3, 5-8"
              className="w-full p-2.5 bg-white border border-[#E9DCC8] rounded-xl text-xs font-mono text-[#102A43] focus:outline-none focus:border-[#D98218]"
            />
          </div>

          {/* Visual Page Thumbnails Review & Selection Grid */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-[#102A43] uppercase flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-[#D98218]" />
                <span>Select Pages (Click to toggle · Hover to review):</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-[11px] text-[#D98218] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <CheckSquare className="w-3 h-3" />
                  <span>Select All</span>
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="text-[11px] text-[#61758A] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Square className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 max-h-72 overflow-y-auto p-3 bg-[#FAF5EC]/60 rounded-xl border border-[#E9DCC8]">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                const isSelected = selectedPages.includes(p);
                const thumb = thumbnails[p - 1];

                return (
                  <div
                    key={p}
                    onClick={() => togglePage(p)}
                    className={`group relative rounded-xl border-2 p-1.5 transition-all cursor-pointer flex flex-col items-center select-none ${
                      isSelected
                        ? 'border-[#D98218] bg-[#FFF8EE] shadow-xs'
                        : 'border-[#E9DCC8] bg-white hover:border-[#D98218]/50'
                    }`}
                  >
                    {/* Page Thumbnail Image */}
                    <div className="w-full aspect-[3/4] bg-[#F7F7F7] rounded-lg overflow-hidden flex items-center justify-center relative border border-gray-200">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={`Page ${p}`}
                          className="w-full h-full object-contain pointer-events-none"
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
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white rounded-lg gap-1 text-[11px] font-bold"
                        title={`Review page ${p} in high-resolution`}
                      >
                        <Eye className="w-4 h-4" />
                        <span>Review</span>
                      </button>

                      {/* Selected Badge */}
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#D98218] text-white flex items-center justify-center shadow-xs">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    {/* Bottom Label */}
                    <div className="w-full flex items-center justify-between px-1 mt-1.5 text-[11px]">
                      <span className="font-bold text-[#102A43]">Page {p}</span>
                      <span
                        className={`text-[10px] font-semibold ${
                          isSelected ? 'text-[#D98218]' : 'text-[#61758A]'
                        }`}
                      >
                        {isSelected ? 'Extract' : 'Skip'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

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
                  <h4 className="text-xs font-bold text-emerald-900">Pages Extracted!</h4>
                  <span className="text-[11px] text-emerald-700">
                    {selectedPages.length} pages · {(resultBlob.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={openResultReview}
                  className="px-3.5 py-2 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold rounded-full shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Review extracted pages before downloading"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Review Extracted PDF</span>
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
                  title="Extract more"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleExtract}
              disabled={selectedPages.length === 0 || isProcessing}
              className="w-full py-3 rounded-full bg-gradient-to-r from-[#D98218] to-[#C66A08] text-white font-bold text-sm shadow-md hover:shadow-lg disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <FileMinus className="w-4 h-4" />
              <span>{isProcessing ? 'Extracting...' : `Extract ${selectedPages.length} ${selectedPages.length === 1 ? 'Page' : 'Pages'}`}</span>
            </button>
          )}
        </div>
      )}

      {/* Document Review Modal */}
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

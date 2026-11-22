import React, { useState } from 'react';
import {
  Upload,
  Minimize2,
  Download,
  Check,
  AlertCircle,
  RefreshCw,
  Eye,
  FileText,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { compressPdf, CompressionPreset, CompressionResult } from '../../services/pdf/compressionService';
import { fileToArrayBuffer, getPdfPageCount, renderAllPdfThumbnails } from '../../services/pdf/pdfLibUtils';
import { PdfDocumentReviewModal } from './PdfDocumentReviewModal';

export const PdfCompressorTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [showThumbnails, setShowThumbnails] = useState<boolean>(true);
  const [preset, setPreset] = useState<CompressionPreset>('medium');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<CompressionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Review modal state
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewData, setReviewData] = useState<{
    data?: Uint8Array | ArrayBuffer | null;
    file?: File | null;
    title: string;
    initialPage?: number;
  } | null>(null);

  const handleFileChange = async (selected: File | null) => {
    if (!selected) return;
    setFile(selected);
    setResult(null);
    setErrorMsg(null);
    setThumbnails([]);

    try {
      const buf = await fileToArrayBuffer(selected);
      const count = await getPdfPageCount(buf);
      setPageCount(count);

      renderAllPdfThumbnails(buf, 130)
        .then((thumbs) => setThumbnails(thumbs))
        .catch(() => {});
    } catch {
      // ignore
    }
  };

  const handleCompress = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(10);
    setErrorMsg(null);

    try {
      const buf = await fileToArrayBuffer(file);
      const res = await compressPdf(buf, preset, (pct) => setProgress(pct));
      setResult(res);
      setIsProcessing(false);
      setProgress(100);
      try {
        confetti({ particleCount: 40, spread: 60 });
      } catch {
        // ignore
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error processing PDF.');
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result || !file) return;
    const blob = new Blob([result.bytes as any], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const suffix = preset === 'low' ? 'high_quality' : preset === 'medium' ? 'optimized' : 'compact';
    a.download = `${baseName}_${suffix}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  // Open review for original document
  const openOriginalReview = (initialPage: number = 1) => {
    if (!file) return;
    setReviewData({
      file,
      title: `${file.name} (Original Document)`,
      initialPage,
    });
    setIsReviewOpen(true);
  };

  // Open review for compressed document
  const openCompressedReview = (initialPage: number = 1) => {
    if (!result || !file) return;
    const qualityTag =
      result.qualityLevel === 'high'
        ? 'High Quality Master'
        : result.qualityLevel === 'medium'
        ? 'Balanced'
        : 'Compact';
    setReviewData({
      data: result.bytes,
      title: `${file.name.replace(/\.[^/.]+$/, '')} (${qualityTag} Review)`,
      initialPage,
    });
    setIsReviewOpen(true);
  };

  // Planned sizes based on given file size
  const fileSizeKb = file ? file.size / 1024 : 0;
  const getPlannedSizeInfo = (p: CompressionPreset) => {
    if (fileSizeKb === 0) return { size: '0 KB', desc: '', tag: '' };

    if (p === 'low') {
      // HIGH QUALITY: Size is MORE THAN OR EQUAL TO the given file size
      const min = Math.max(1, +(fileSizeKb * 1.02).toFixed(1));
      const max = Math.max(1, +(fileSizeKb * 1.15).toFixed(1));
      return {
        size: `~${min} KB - ${max} KB`,
        desc: '≥ Given file size (Full vector retention)',
        tag: 'More than given file size (Lossless)',
      };
    }

    if (p === 'medium') {
      // MEDIUM QUALITY: Balanced reduction ~20% - 40%
      const min = Math.max(1, +(fileSizeKb * 0.6).toFixed(1));
      const max = Math.max(1, +(fileSizeKb * 0.8).toFixed(1));
      return {
        size: `~${min} KB - ${max} KB`,
        desc: '~20% - 40% size reduction',
        tag: 'Balanced savings & crisp text',
      };
    }

    // HIGH COMPRESSION (COMPACT): ~40% - 60%
    const min = Math.max(1, +(fileSizeKb * 0.4).toFixed(1));
    const max = Math.max(1, +(fileSizeKb * 0.6).toFixed(1));
    return {
      size: `~${min} KB - ${max} KB`,
      desc: '~40% - 60% size reduction',
      tag: 'Smallest file size for sharing',
    };
  };

  return (
    <div className="space-y-5">
      {!file ? (
        <label className="border-2 border-dashed border-[#E9DCC8] hover:border-[#D98218] bg-[#FAF5EC]/60 hover:bg-[#FFF3DF]/40 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all">
          <input
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileChange(e.target.files[0]);
              }
            }}
          />
          <div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-[#E9DCC8] flex items-center justify-center text-[#D98218] mb-2">
            <Upload className="w-6 h-6" />
          </div>
          <span className="text-sm font-bold text-[#102A43]">Select PDF to compress or optimize</span>
          <span className="text-xs text-[#61758A] mt-0.5">
            Properly planned quality levels: High Quality (≥ original size), Balanced, and Compact
          </span>
        </label>
      ) : (
        <div className="space-y-4">
          {/* File summary & Review Action */}
          <div className="p-3.5 bg-white rounded-xl border border-[#E9DCC8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="truncate">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#D98218] shrink-0" />
                <p className="text-xs font-bold text-[#102A43] truncate">{file.name}</p>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#61758A] mt-1">
                <span>
                  Given File Size:{' '}
                  <strong className="text-[#102A43]">
                    {fileSizeKb > 1024
                      ? `${(fileSizeKb / 1024).toFixed(2)} MB`
                      : `${fileSizeKb.toFixed(1)} KB`}
                  </strong>
                </span>
                {pageCount > 0 && (
                  <>
                    <span>•</span>
                    <span>
                      Pages: <strong className="text-[#102A43]">{pageCount}</strong>
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => openOriginalReview(1)}
                className="px-3 py-1.5 bg-[#FFF8EE] hover:bg-[#FFF3DF] text-[#D98218] border border-[#E9DCC8] hover:border-[#D98218] rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                title="Review document pages properly"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Review Document</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setResult(null);
                  setThumbnails([]);
                }}
                className="text-xs text-[#61758A] hover:text-[#D98218] font-semibold px-2 py-1 cursor-pointer"
              >
                Change
              </button>
            </div>
          </div>

          {/* Document Pages Review Strip */}
          <div className="p-3 bg-white rounded-xl border border-[#E9DCC8] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-bold text-[#102A43]">
                <Eye className="w-3.5 h-3.5 text-[#D98218]" />
                <span>Document Page Review ({pageCount || '...'} pages)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowThumbnails(!showThumbnails)}
                className="text-[11px] text-[#61758A] hover:text-[#D98218] flex items-center gap-1 font-semibold cursor-pointer"
              >
                <span>{showThumbnails ? 'Hide Previews' : 'Show Previews'}</span>
                {showThumbnails ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {showThumbnails && (
              <div>
                <p className="text-[11px] text-[#61758A] mb-2">
                  Click any page thumbnail to open high-resolution document review:
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1 select-none">
                  {thumbnails.length > 0
                    ? thumbnails.map((thumb, idx) => {
                        const pageNum = idx + 1;
                        return (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => openOriginalReview(pageNum)}
                            className="group flex flex-col items-center gap-1 shrink-0 p-1 rounded-lg border border-[#E9DCC8] hover:border-[#D98218] hover:shadow-xs transition-all bg-[#FAF5EC]/30 cursor-pointer"
                            title={`Click to review page ${pageNum}`}
                          >
                            <div className="w-16 h-20 bg-white rounded border border-[#E9DCC8] overflow-hidden flex items-center justify-center relative">
                              {thumb ? (
                                <img
                                  src={thumb}
                                  alt={`Page ${pageNum}`}
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <span className="text-[10px] text-[#61758A]">#{pageNum}</span>
                              )}
                              <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                <Eye className="w-4 h-4" />
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-[#102A43]">
                              Page {pageNum}
                            </span>
                          </button>
                        );
                      })
                    : Array.from({ length: Math.min(pageCount || 4, 6) }, (_, i) => i + 1).map(
                        (p) => (
                          <div
                            key={p}
                            className="w-16 h-20 bg-gray-50 border border-dashed border-[#E9DCC8] rounded flex flex-col items-center justify-center text-[10px] text-[#61758A] shrink-0 animate-pulse"
                          >
                            <span>Loading #{p}</span>
                          </div>
                        )
                      )}
                </div>
              </div>
            )}
          </div>

          {/* Quality Levels - Planned Properly */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-[#102A43] uppercase flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#D98218]" />
                <span>Planned Quality & File Size Options:</span>
              </label>
              <span className="text-[11px] text-[#61758A]">
                Given Size:{' '}
                <strong className="text-[#102A43]">{fileSizeKb.toFixed(1)} KB</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              {(
                [
                  {
                    id: 'low' as CompressionPreset,
                    title: 'High Quality',
                    subtitle: 'Lossless Print & Archival',
                    badge: 'Ultra Quality',
                    badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
                    features: '100% Vector sharpness, zero raster blur',
                  },
                  {
                    id: 'medium' as CompressionPreset,
                    title: 'Medium Quality',
                    subtitle: 'Balanced Quality & Size',
                    badge: 'Recommended',
                    badgeClass: 'bg-[#FFF3DF] text-[#D98218] border border-[#E9DCC8]',
                    features: 'Crisp vector text, optimized streams',
                  },
                  {
                    id: 'high' as CompressionPreset,
                    title: 'High Compression',
                    subtitle: 'Compact for Sharing',
                    badge: 'Max Savings',
                    badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200',
                    features: 'Smallest file size for email/chat',
                  },
                ] as const
              ).map((p) => {
                const info = getPlannedSizeInfo(p.id);
                const isSelected = preset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPreset(p.id)}
                    className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#D98218] bg-[#FFF8EE] shadow-xs ring-1 ring-[#D98218]/40'
                        : 'border-[#E9DCC8] bg-white hover:bg-[#FAF5EC]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${p.badgeClass}`}>
                          {p.badge}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#D98218]" />}
                      </div>
                      <p className="font-bold text-[#102A43] text-sm">{p.title}</p>
                      <p className="text-[11px] font-medium text-[#102A43]/80 mt-0.5">{p.subtitle}</p>
                      <p className="text-[10px] text-[#61758A] mt-1">{p.features}</p>
                    </div>

                    {/* Planned Size Details */}
                    <div className="mt-3 pt-2.5 border-t border-[#E9DCC8]/60">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#61758A]">Planned Size:</span>
                        <span
                          className={`font-bold font-mono ${
                            p.id === 'low' ? 'text-emerald-800' : 'text-[#102A43]'
                          }`}
                        >
                          {info.size}
                        </span>
                      </div>
                      <p
                        className={`text-[10px] font-semibold mt-0.5 ${
                          p.id === 'low' ? 'text-emerald-700' : 'text-[#D98218]'
                        }`}
                      >
                        {info.tag}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quality Planning Breakdown Guide */}
          <div className="p-3 bg-white rounded-xl border border-[#E9DCC8] text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-[#102A43]">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Quality & Size Plan Details:</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
              <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/80">
                <span className="font-bold text-emerald-900 block mb-0.5">🌟 High Quality (Ultra)</span>
                <p className="text-emerald-800">
                  <strong>Planned Size: ≥ {fileSizeKb.toFixed(1)} KB</strong> (More than given size). Keeps 100% of vectors, fonts, and full print resolution with zero quality loss.
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/80">
                <span className="font-bold text-amber-900 block mb-0.5">⚖️ Medium Quality</span>
                <p className="text-amber-800">
                  <strong>Planned Size: ~{(fileSizeKb * 0.7).toFixed(1)} KB</strong> (~30% smaller). Streamlines unreferenced PDF objects while keeping text 100% vector sharp.
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200/80">
                <span className="font-bold text-blue-900 block mb-0.5">🚀 High Compression</span>
                <p className="text-blue-800">
                  <strong>Planned Size: ~{(fileSizeKb * 0.5).toFixed(1)} KB</strong> (~50% smaller). Maximum stream compression for quick email attachments and messaging.
                </p>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isProcessing ? (
            <div className="p-4 bg-white rounded-xl border border-[#E9DCC8] space-y-2">
              <div className="flex justify-between text-xs font-bold text-[#102A43]">
                <span>
                  {preset === 'low'
                    ? 'Processing high-fidelity lossless PDF...'
                    : 'Optimizing and compressing pages...'}
                </span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-2 bg-[#FAF5EC] rounded-full overflow-hidden">
                <div
                  style={{ width: `${progress}%` }}
                  className="h-full bg-gradient-to-r from-[#D98218] to-[#C66A08] transition-all"
                />
              </div>
            </div>
          ) : result ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-900">
                      {result.qualityLevel === 'high'
                        ? 'High Quality Master Created!'
                        : 'PDF Optimization Completed!'}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-emerald-800">
                      <span className="text-emerald-700 font-medium">
                        Given Size: {(result.originalBytes / 1024).toFixed(1)} KB
                      </span>
                      <span>→</span>
                      <strong className="text-sm font-bold text-emerald-950 font-mono">
                        {(result.compressedBytes / 1024).toFixed(1)} KB
                      </strong>
                      {result.qualityLevel === 'high' ? (
                        <span className="px-2 py-0.5 bg-emerald-200 text-emerald-950 rounded-full text-[10px] font-bold">
                          Lossless Quality (≥ Given Size)
                        </span>
                      ) : (
                        result.percentageSaved > 0 && (
                          <span className="px-2 py-0.5 bg-emerald-200/80 text-emerald-900 rounded-full text-[10px] font-bold">
                            {result.percentageSaved}% Saved
                          </span>
                        )
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openCompressedReview(1)}
                    className="px-3.5 py-2 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold rounded-full shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Review document before downloading"
                  >
                    <Eye className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Review Output PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="px-4 py-2 bg-[#D98218] hover:bg-[#C66A08] text-white text-xs font-bold rounded-full shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setResult(null)}
                    className="p-2 bg-white border border-emerald-200 rounded-full text-[#102A43] hover:bg-emerald-100 cursor-pointer"
                    title="Process again"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Quality & Size Comparison Bar */}
              <div className="p-2.5 bg-white/70 rounded-xl border border-emerald-100 flex items-center justify-between text-[11px] text-[#61758A]">
                <span>
                  Given Size:{' '}
                  <strong className="text-[#102A43]">
                    {(result.originalBytes / 1024).toFixed(1)} KB
                  </strong>
                </span>
                <span>
                  Quality Level:{' '}
                  <strong className="text-emerald-800 font-bold uppercase">
                    {result.qualityLevel === 'high' ? 'High Quality (Lossless)' : result.qualityLevel}
                  </strong>
                </span>
                <span>
                  Result Size:{' '}
                  <strong className="text-[#102A43]">
                    {(result.compressedBytes / 1024).toFixed(1)} KB
                  </strong>
                </span>
              </div>
            </div>
          ) : (
            <button
              onClick={handleCompress}
              className="w-full py-3 rounded-full bg-gradient-to-r from-[#D98218] to-[#C66A08] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Minimize2 className="w-4 h-4" />
              <span>
                {preset === 'low'
                  ? 'Apply High Quality (Lossless Print Ready)'
                  : preset === 'medium'
                  ? 'Apply Balanced Medium Quality'
                  : 'Compress PDF for Sharing'}
              </span>
            </button>
          )}
        </div>
      )}

      {/* Full Document Review Modal */}
      {isReviewOpen && reviewData && (
        <PdfDocumentReviewModal
          file={reviewData.file}
          pdfData={reviewData.data}
          title={reviewData.title}
          initialPage={reviewData.initialPage}
          onClose={() => setIsReviewOpen(false)}
        />
      )}
    </div>
  );
};

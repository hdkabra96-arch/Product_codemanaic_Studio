import React, { useState } from 'react';
import {
  Upload,
  Download,
  Check,
  AlertCircle,
  RefreshCw,
  LayoutGrid,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Trash2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { reorganizePdfPages } from '../../services/pdf/mergeSplitService';
import { renderAllPdfThumbnails, fileToArrayBuffer } from '../../services/pdf/pdfLibUtils';

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

  const handleFileSelected = async (selected: File | null) => {
    if (!selected) return;
    setErrorMsg(null);
    setResultBlob(null);
    setFile(selected);
    setLoadingThumbnails(true);

    try {
      const buf = await fileToArrayBuffer(selected);
      const thumbs = await renderAllPdfThumbnails(buf, 140);
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
            Reorder, rotate, or delete individual pages visually
          </span>
        </label>
      ) : (
        <div className="space-y-4">
          <div className="p-3 bg-white rounded-xl border border-[#E9DCC8] flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-[#102A43] truncate max-w-xs">{file.name}</p>
              <p className="text-[#61758A]">
                {pages.length} pages in new arrangement
              </p>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setPages([]);
                setResultBlob(null);
              }}
              className="text-[#61758A] hover:text-[#D98218] font-semibold cursor-pointer"
            >
              Change File
            </button>
          </div>

          {loadingThumbnails ? (
            <div className="p-8 text-center text-xs text-[#61758A] bg-[#FAF5EC] rounded-xl border border-[#E9DCC8]">
              Rendering page thumbnails...
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-72 overflow-y-auto p-2 bg-[#FAF5EC] rounded-xl border border-[#E9DCC8]">
              {pages.map((item, idx) => (
                <div
                  key={item.id}
                  className="bg-white p-2 rounded-xl border border-[#E9DCC8] shadow-xs flex flex-col items-center justify-between space-y-2"
                >
                  <div className="relative w-full aspect-[3/4] bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center border border-gray-100">
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={`Page ${item.originalPageNum}`}
                        style={{ transform: `rotate(${item.rotation}deg)` }}
                        className="max-h-full max-w-full object-contain transition-transform duration-200"
                      />
                    ) : (
                      <span className="text-xs text-gray-400">Page {item.originalPageNum}</span>
                    )}
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#102A43]/80 text-white">
                      #{idx + 1}
                    </span>
                    {item.rotation > 0 && (
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#D98218] text-white">
                        {item.rotation}°
                      </span>
                    )}
                  </div>

                  {/* Actions per card */}
                  <div className="flex items-center gap-1 w-full justify-between pt-1 border-t border-gray-100">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => movePage(idx, 'left')}
                        disabled={idx === 0}
                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 cursor-pointer text-[#102A43]"
                        title="Move left"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => movePage(idx, 'right')}
                        disabled={idx === pages.length - 1}
                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 cursor-pointer text-[#102A43]"
                        title="Move right"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => rotatePage(idx)}
                        className="p-1 rounded hover:bg-[#FFF3DF] text-[#D98218] cursor-pointer"
                        title="Rotate 90°"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button
                      onClick={() => deletePage(idx)}
                      className="p-1 rounded hover:bg-red-50 text-red-600 cursor-pointer"
                      title="Delete page"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-900">PDF Sequence Saved!</h4>
                  <span className="text-[11px] text-emerald-700">
                    {pages.length} pages · {(resultBlob.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-[#D98218] hover:bg-[#C66A08] text-white text-xs font-bold rounded-full shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={() => setResultBlob(null)}
                  className="p-2 bg-white border border-[#E9DCC8] rounded-full text-[#102A43] cursor-pointer"
                  title="Modify again"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleSave}
              disabled={pages.length === 0 || isProcessing || loadingThumbnails}
              className="w-full py-3 rounded-full bg-gradient-to-r from-[#D98218] to-[#C66A08] text-white font-bold text-sm shadow-md hover:shadow-lg disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <LayoutGrid className="w-4 h-4" />
              <span>{isProcessing ? 'Saving Arrangement...' : 'Save Reorganized PDF'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

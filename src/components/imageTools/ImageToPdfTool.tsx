import React, { useState } from 'react';
import { Upload, Download, RefreshCw, Check, AlertCircle, FilePlus2, ArrowUp, ArrowDown, Trash2, Plus } from 'lucide-react';
import confetti from 'canvas-confetti';
import { imagesToPdf, ImageToPdfOptions } from '../../services/image/imageProcessingService';

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
}

export const ImageToPdfTool: React.FC = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [pageSize, setPageSize] = useState<'a4' | 'letter' | 'fit'>('a4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [margin, setMargin] = useState<number>(20); // 0, 20, 40 points

  const [isProcessing, setIsProcessing] = useState(false);
  const [resultPdf, setResultPdf] = useState<{ bytes: Uint8Array; fileName: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newItems: ImageItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (f.type.startsWith('image/')) {
        newItems.push({
          id: `${Date.now()}-${Math.random()}`,
          file: f,
          previewUrl: URL.createObjectURL(f),
        });
      }
    }

    if (newItems.length === 0) {
      setErrorMsg('Please select valid image files (JPG, PNG, WEBP, etc.).');
      return;
    }

    setImages((prev) => [...prev, ...newItems]);
    setErrorMsg(null);
    setResultPdf(null);
  };

  const moveUp = (index: number) => {
    if (index <= 0) return;
    setImages((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const moveDown = (index: number) => {
    if (index >= images.length - 1) return;
    setImages((prev) => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleGeneratePdf = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const files = images.map((img) => img.file);
      const pdfBytes = await imagesToPdf(files, {
        pageSize,
        orientation,
        margin,
      });

      const baseName = images[0].file.name.replace(/\.[^/.]+$/, '');
      setResultPdf({
        bytes: pdfBytes,
        fileName: `${baseName}_converted.pdf`,
      });
      setIsProcessing(false);

      try {
        confetti({ particleCount: 45, spread: 60 });
      } catch {
        // ignore
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error converting images to PDF.');
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultPdf) return;
    const blob = new Blob([resultPdf.bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = resultPdf.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  return (
    <div className="space-y-4">
      {images.length === 0 ? (
        <label className="border-2 border-dashed border-[#E9DCC8] hover:border-[#D98218] bg-[#FAF5EC]/60 hover:bg-[#FFF3DF]/40 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all">
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleAddFiles(e.target.files)}
          />
          <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-[#E9DCC8] flex items-center justify-center text-[#D98218] mb-3">
            <FilePlus2 className="w-7 h-7" />
          </div>
          <span className="text-base font-bold text-[#102A43]">
            Select multiple images to convert to PDF
          </span>
          <span className="text-xs text-[#61758A] mt-1">
            Reorder pages, choose orientation, margins & document size
          </span>
          <span className="mt-4 px-4 py-1.5 rounded-full bg-white border border-[#E9DCC8] text-xs font-bold text-[#102A43] shadow-sm">
            Browse Images
          </span>
        </label>
      ) : (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-[#E9DCC8]">
            <span className="text-xs font-bold text-[#102A43]">
              {images.length} {images.length === 1 ? 'Page' : 'Pages'} in Document
            </span>
            <label className="px-3 py-1.5 rounded-xl bg-white border border-[#E9DCC8] hover:border-[#D98218] text-xs font-bold text-[#102A43] flex items-center gap-1 cursor-pointer transition-colors shadow-sm">
              <Plus className="w-3.5 h-3.5 text-[#D98218]" />
              <span>Add More</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleAddFiles(e.target.files)}
              />
            </label>
          </div>

          {/* List of Images with Re-order buttons */}
          <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
            {images.map((item, idx) => (
              <div
                key={item.id}
                className="p-2.5 bg-white rounded-xl border border-[#E9DCC8] flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-md bg-[#FFF3DF] text-[#D98218] text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <img
                    src={item.previewUrl}
                    alt="thumb"
                    className="w-9 h-9 object-cover rounded-lg border border-[#E9DCC8] shrink-0"
                  />
                  <div className="min-w-0">
                    <h5 className="text-xs font-bold text-[#102A43] truncate max-w-[160px] sm:max-w-xs">
                      {item.file.name}
                    </h5>
                    <span className="text-[10px] text-[#61758A]">
                      {(item.file.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveUp(idx)}
                    disabled={idx === 0}
                    className="p-1 rounded-md border border-[#E9DCC8] disabled:opacity-30 text-[#102A43] hover:text-[#D98218] cursor-pointer"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => moveDown(idx)}
                    disabled={idx === images.length - 1}
                    className="p-1 rounded-md border border-[#E9DCC8] disabled:opacity-30 text-[#102A43] hover:text-[#D98218] cursor-pointer"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => removeImage(idx)}
                    className="p-1 rounded-md border border-[#E9DCC8] text-red-500 hover:bg-red-50 cursor-pointer ml-1"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Page Settings */}
          <div className="p-4 bg-[#FAF5EC] rounded-2xl border border-[#E9DCC8] grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-[#102A43] block mb-1">PAGE SIZE</label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value as any)}
                className="w-full p-2 rounded-xl border border-[#E9DCC8] text-xs font-bold bg-white focus:outline-none"
              >
                <option value="a4">Standard A4 (595 × 842 pt)</option>
                <option value="letter">US Letter (612 × 792 pt)</option>
                <option value="fit">Fit to Image Size</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[#102A43] block mb-1">ORIENTATION</label>
              <div className="flex gap-1">
                {(['portrait', 'landscape'] as const).map((o) => (
                  <button
                    key={o}
                    onClick={() => setOrientation(o)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      orientation === o
                        ? 'bg-[#102A43] text-white border-[#102A43]'
                        : 'bg-white text-[#102A43] border-[#E9DCC8]'
                    }`}
                  >
                    {o.charAt(0).toUpperCase() + o.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#102A43] block mb-1">MARGIN</label>
              <div className="flex gap-1">
                {[
                  { label: 'None', val: 0 },
                  { label: 'Small', val: 20 },
                  { label: 'Normal', val: 40 },
                ].map((m) => (
                  <button
                    key={m.label}
                    onClick={() => setMargin(m.val)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      margin === m.val
                        ? 'bg-[#D98218] text-white border-[#D98218]'
                        : 'bg-white text-[#102A43] border-[#E9DCC8]'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!resultPdf ? (
            <button
              onClick={handleGeneratePdf}
              disabled={isProcessing}
              className="w-full py-3 rounded-full bg-[#D98218] hover:bg-[#C66A08] disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Compiling PDF Document...</span>
                </>
              ) : (
                <span>Convert {images.length} Images to Single PDF</span>
              )}
            </button>
          ) : (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-emerald-950">PDF Document Created</h5>
                  <p className="text-[11px] text-emerald-700">
                    {images.length} pages • {(resultPdf.bytes.length / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={handleDownload}
                className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

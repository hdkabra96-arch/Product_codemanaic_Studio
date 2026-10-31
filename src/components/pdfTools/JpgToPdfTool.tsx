import React, { useState } from 'react';
import {
  Upload,
  Download,
  Check,
  AlertCircle,
  RefreshCw,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  FileCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { convertImagesToPdf, JpgToPdfOptions } from '../../services/pdf/jpgToPdfService';

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
}

export const JpgToPdfTool: React.FC = () => {
  const [imageList, setImageList] = useState<ImageItem[]>([]);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape' | 'fit_image'>('portrait');
  const [pageSize, setPageSize] = useState<'a4' | 'letter' | 'fit_image'>('a4');
  const [margin, setMargin] = useState<'none' | 'small' | 'big'>('small');

  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddFiles = (files: FileList | null) => {
    if (!files) return;
    setErrorMsg(null);
    const newItems: ImageItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (
        !file.type.startsWith('image/') &&
        !file.name.match(/\.(jpg|jpeg|png|webp|bmp|gif)$/i)
      ) {
        continue;
      }
      const previewUrl = URL.createObjectURL(file);
      newItems.push({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        file,
        previewUrl,
      });
    }

    if (newItems.length === 0) {
      setErrorMsg('Please select valid image files (JPG, PNG, WebP).');
      return;
    }

    setImageList((prev) => [...prev, ...newItems]);
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= imageList.length) return;
    const updated = [...imageList];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setImageList(updated);
  };

  const removeImage = (index: number) => {
    const item = imageList[index];
    if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
    setImageList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConvert = async () => {
    if (imageList.length === 0) {
      setErrorMsg('Please add at least one image to convert.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const files = imageList.map((item) => item.file);
      const opts: JpgToPdfOptions = {
        orientation,
        pageSize,
        margin,
      };

      const { bytes } = await convertImagesToPdf(files, opts);
      setResultBytes(bytes);
      setIsProcessing(false);
      try {
        confetti({ particleCount: 40, spread: 60 });
      } catch {
        // ignore
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error converting images to PDF.');
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultBytes) return;
    const blob = new Blob([resultBytes as any], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'images_converted.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      {imageList.length === 0 ? (
        <label className="border-2 border-dashed border-[#E9DCC8] hover:border-[#D98218] bg-[#FAF5EC]/60 hover:bg-[#FFF3DF]/40 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all">
          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => handleAddFiles(e.target.files)}
          />
          <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-[#E9DCC8] flex items-center justify-center text-[#D98218] mb-3">
            <Upload className="w-7 h-7" />
          </div>
          <span className="text-base font-bold text-[#102A43]">Select JPG / PNG images</span>
          <span className="text-xs text-[#61758A] mt-1">
            Convert JPG, PNG, and WebP images into a single PDF document in seconds
          </span>
          <span className="mt-4 px-4 py-1.5 rounded-full bg-white border border-[#E9DCC8] text-xs font-bold text-[#102A43] shadow-xs">
            Select Multiple Images
          </span>
        </label>
      ) : (
        <div className="space-y-5">
          {/* Top Bar with Add More */}
          <div className="p-3 bg-white rounded-2xl border border-[#E9DCC8] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#102A43]">
                {imageList.length} Image{imageList.length > 1 ? 's' : ''} Ready
              </span>
            </div>
            <label className="px-3 py-1.5 rounded-full bg-[#FFF3DF] text-[#D98218] text-xs font-bold hover:bg-[#D98218] hover:text-white transition-all cursor-pointer flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" />
              <span>Add More</span>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleAddFiles(e.target.files)}
              />
            </label>
          </div>

          {/* Image Order Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[300px] overflow-y-auto p-1">
            {imageList.map((item, idx) => (
              <div
                key={item.id}
                className="relative bg-white rounded-xl border border-[#E9DCC8] p-2 flex flex-col justify-between group shadow-xs"
              >
                <div className="h-28 bg-[#FAF5EC] rounded-lg overflow-hidden flex items-center justify-center">
                  <img
                    src={item.previewUrl}
                    alt={item.file.name}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="pt-2 flex items-center justify-between text-[11px] text-[#61758A]">
                  <span className="font-bold text-[#102A43]">#{idx + 1}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveImage(idx, 'up')}
                      className="p-1 rounded bg-[#FAF5EC] hover:bg-[#E9DCC8] text-[#102A43] disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === imageList.length - 1}
                      onClick={() => moveImage(idx, 'down')}
                      className="p-1 rounded bg-[#FAF5EC] hover:bg-[#E9DCC8] text-[#102A43] disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="p-1 rounded bg-red-50 hover:bg-red-100 text-red-600 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Orientation */}
            <div className="bg-white rounded-2xl p-3 border border-[#E9DCC8] space-y-1.5">
              <label className="block text-[11px] font-extrabold uppercase text-[#102A43]">
                Page Orientation
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'portrait', label: 'Portrait' },
                  { id: 'landscape', label: 'Landscape' },
                ].map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setOrientation(o.id as any)}
                    className={`py-1.5 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                      orientation === o.id
                        ? 'border-[#D98218] bg-[#FFF3DF] text-[#D98218]'
                        : 'border-[#E9DCC8] bg-white text-[#61758A]'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Page Size */}
            <div className="bg-white rounded-2xl p-3 border border-[#E9DCC8] space-y-1.5">
              <label className="block text-[11px] font-extrabold uppercase text-[#102A43]">
                Page Size
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'a4', label: 'A4 Standard' },
                  { id: 'fit_image', label: 'Fit to Image' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setPageSize(s.id as any)}
                    className={`py-1.5 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                      pageSize === s.id
                        ? 'border-[#D98218] bg-[#FFF3DF] text-[#D98218]'
                        : 'border-[#E9DCC8] bg-white text-[#61758A]'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Margins */}
            <div className="bg-white rounded-2xl p-3 border border-[#E9DCC8] space-y-1.5">
              <label className="block text-[11px] font-extrabold uppercase text-[#102A43]">
                Margin
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'none', label: 'None' },
                  { id: 'small', label: 'Small' },
                  { id: 'big', label: 'Big' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMargin(m.id as any)}
                    className={`py-1.5 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                      margin === m.id
                        ? 'border-[#D98218] bg-[#FFF3DF] text-[#D98218]'
                        : 'border-[#E9DCC8] bg-white text-[#61758A]'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Convert Action */}
          <button
            type="button"
            disabled={isProcessing}
            onClick={handleConvert}
            className="w-full py-3.5 rounded-full bg-[#D98218] hover:bg-[#C66A08] text-white font-bold text-sm shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generating PDF from Images...</span>
              </>
            ) : (
              <>
                <FileCheck className="w-4 h-4" />
                <span>Convert to PDF</span>
              </>
            )}
          </button>

          {/* Error */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success */}
          {resultBytes && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <Check className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-900">
                    PDF Document Created Successfully!
                  </h4>
                  <p className="text-[11px] text-emerald-700">
                    {imageList.length} images compiled with selected layout and margins.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDownload}
                className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
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

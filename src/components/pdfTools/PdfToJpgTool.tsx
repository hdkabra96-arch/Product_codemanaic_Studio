import React, { useState } from 'react';
import { Upload, Download, Check, AlertCircle, RefreshCw, FileImage, Archive } from 'lucide-react';
import confetti from 'canvas-confetti';
import { fileToArrayBuffer, getPdfPageCount } from '../../services/pdf/pdfLibUtils';
import { convertPdfToImages, PageImageResult } from '../../services/pdf/pdfToJpgService';

export const PdfToJpgTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState(0);

  // Options
  const [imageFormat, setImageFormat] = useState<'image/jpeg' | 'image/png'>('image/jpeg');
  const [qualityDpi, setQualityDpi] = useState<number>(1.8); // 1.8x = 180 DPI high fidelity
  const [jpegQuality, setJpegQuality] = useState<number>(0.92);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPct, setProgressPct] = useState(0);
  const [currentPageRendered, setCurrentPageRendered] = useState(0);
  const [images, setImages] = useState<PageImageResult[]>([]);
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileSelected = async (selected: File | null) => {
    if (!selected) return;
    setErrorMsg(null);
    setImages([]);
    setZipBlob(null);
    try {
      const buf = await fileToArrayBuffer(selected);
      const count = await getPdfPageCount(buf);
      setFile(selected);
      setTotalPages(count);
    } catch {
      setErrorMsg('Could not read PDF. Please provide a valid PDF file.');
    }
  };

  const handleConvert = async () => {
    if (!file) return;
    setIsProcessing(true);
    setErrorMsg(null);
    setProgressPct(5);

    try {
      const buf = await fileToArrayBuffer(file);
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      const res = await convertPdfToImages(
        buf,
        baseName,
        {
          format: imageFormat,
          dpiScale: qualityDpi,
          quality: jpegQuality,
        },
        (pct, page) => {
          setProgressPct(pct);
          setCurrentPageRendered(page);
        }
      );

      setImages(res.images);
      setZipBlob(res.zipBlob);
      setIsProcessing(false);
      try {
        confetti({ particleCount: 40, spread: 60 });
      } catch {
        // ignore
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error converting PDF pages to images.');
      setIsProcessing(false);
    }
  };

  const handleDownloadSingle = (img: PageImageResult) => {
    const url = URL.createObjectURL(img.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = img.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  const handleDownloadAllZip = () => {
    if (!zipBlob || !file) return;
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    a.download = `${baseName}_images.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <label className="border-2 border-dashed border-[#E9DCC8] hover:border-[#D98218] bg-[#FAF5EC]/60 hover:bg-[#FFF3DF]/40 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all">
          <input
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => handleFileSelected(e.target.files?.[0] || null)}
          />
          <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-[#E9DCC8] flex items-center justify-center text-[#D98218] mb-3">
            <Upload className="w-7 h-7" />
          </div>
          <span className="text-base font-bold text-[#102A43]">Select PDF to convert to JPG</span>
          <span className="text-xs text-[#61758A] mt-1">
            Convert each page into high-resolution JPG or PNG images with instant ZIP download
          </span>
          <span className="mt-4 px-4 py-1.5 rounded-full bg-white border border-[#E9DCC8] text-xs font-bold text-[#102A43] shadow-xs">
            Browse Files
          </span>
        </label>
      ) : (
        <div className="space-y-5">
          {/* File Meta */}
          <div className="p-3.5 bg-white rounded-2xl border border-[#E9DCC8] flex items-center justify-between">
            <div className="truncate">
              <h4 className="text-xs font-bold text-[#102A43] truncate">{file.name}</h4>
              <p className="text-[11px] text-[#61758A]">
                {(file.size / 1024).toFixed(1)} KB · Total Pages: <strong>{totalPages}</strong>
              </p>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setImages([]);
                setZipBlob(null);
              }}
              className="text-xs text-[#61758A] hover:text-[#D98218] font-semibold cursor-pointer"
            >
              Change PDF
            </button>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-[#E9DCC8] space-y-2">
              <label className="block text-xs font-extrabold uppercase text-[#102A43]">
                Output Image Format
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'image/jpeg', label: 'JPG (Compressed)' },
                  { id: 'image/png', label: 'PNG (Lossless)' },
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setImageFormat(fmt.id as any)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      imageFormat === fmt.id
                        ? 'border-[#D98218] bg-[#FFF3DF] text-[#D98218]'
                        : 'border-[#E9DCC8] bg-white text-[#61758A]'
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-[#E9DCC8] space-y-2">
              <label className="block text-xs font-extrabold uppercase text-[#102A43]">
                Resolution & Clarity
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { scale: 1.5, label: 'Standard (150 DPI)' },
                  { scale: 2.2, label: 'Ultra High (300 DPI)' },
                ].map((dpi) => (
                  <button
                    key={dpi.scale}
                    type="button"
                    onClick={() => setQualityDpi(dpi.scale)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      qualityDpi === dpi.scale
                        ? 'border-[#D98218] bg-[#FFF3DF] text-[#D98218]'
                        : 'border-[#E9DCC8] bg-white text-[#61758A]'
                    }`}
                  >
                    {dpi.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Convert Action */}
          {images.length === 0 && (
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleConvert}
              className="w-full py-3.5 rounded-full bg-[#D98218] hover:bg-[#C66A08] text-white font-bold text-sm shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Converting Page {currentPageRendered} of {totalPages} ({progressPct}%)...</span>
                </>
              ) : (
                <>
                  <FileImage className="w-4 h-4" />
                  <span>Convert to {imageFormat === 'image/jpeg' ? 'JPG' : 'PNG'} Images</span>
                </>
              )}
            </button>
          )}

          {/* Error */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Converted Pages Gallery */}
          {images.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-900">
                    {images.length} Pages Successfully Converted!
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadAllZip}
                  className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Archive className="w-4 h-4" />
                  <span>Download All Images (ZIP)</span>
                </button>
              </div>

              {/* Grid of Pages */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[460px] overflow-y-auto p-2">
                {images.map((img) => (
                  <div
                    key={img.pageNum}
                    className="p-3 bg-white rounded-xl border border-[#E9DCC8] shadow-xs flex flex-col justify-between space-y-2 group"
                  >
                    <div className="bg-[#FAF5EC] rounded-lg p-1 overflow-hidden flex items-center justify-center">
                      <img
                        src={img.dataUrl}
                        alt={`Page ${img.pageNum}`}
                        className="max-h-40 object-contain rounded shadow-xs"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-[#E9DCC8]">
                      <span className="text-xs font-bold text-[#102A43]">
                        Page {img.pageNum}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDownloadSingle(img)}
                        className="text-xs font-bold text-[#D98218] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>JPG</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

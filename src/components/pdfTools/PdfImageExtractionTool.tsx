import React, { useState } from 'react';
import { Upload, Download, Check, AlertCircle, RefreshCw, FileImage, Archive } from 'lucide-react';
import confetti from 'canvas-confetti';
import { extractImagesFromPdf, ExtractedImageItem } from '../../services/pdf/ocrImageExtractService';
import { fileToArrayBuffer } from '../../services/pdf/pdfLibUtils';

export const PdfImageExtractionTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [images, setImages] = useState<ExtractedImageItem[]>([]);
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleExtract = async (selected: File) => {
    setFile(selected);
    setIsProcessing(true);
    setProgress(10);
    setErrorMsg(null);
    setImages([]);
    setZipBlob(null);

    try {
      const buf = await fileToArrayBuffer(selected);
      const baseName = selected.name.replace(/\.[^/.]+$/, '');
      const res = await extractImagesFromPdf(buf, baseName, (pct) => setProgress(pct));
      setImages(res.images);
      setZipBlob(res.zipBlob);
      setProgress(100);
      setIsProcessing(false);
      try {
        confetti({ particleCount: 35, spread: 55 });
      } catch {
        // ignore
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error extracting images from PDF.');
      setIsProcessing(false);
    }
  };

  const handleDownloadSingle = (item: ExtractedImageItem) => {
    const url = URL.createObjectURL(item.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = item.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  };

  const handleDownloadZip = () => {
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
    <div className="space-y-4">
      {!file ? (
        <label className="border-2 border-dashed border-[#E9DCC8] hover:border-[#D98218] bg-[#FAF5EC]/60 hover:bg-[#FFF3DF]/40 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all">
          <input
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleExtract(e.target.files[0]);
              }
            }}
          />
          <div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-[#E9DCC8] flex items-center justify-center text-[#D98218] mb-2">
            <FileImage className="w-6 h-6" />
          </div>
          <span className="text-sm font-bold text-[#102A43]">Select PDF to extract images</span>
          <span className="text-xs text-[#61758A] mt-0.5">
            Extracts high-resolution images with individual and ZIP download
          </span>
        </label>
      ) : (
        <div className="space-y-4">
          <div className="p-3 bg-white rounded-xl border border-[#E9DCC8] flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-[#102A43] truncate max-w-xs">{file.name}</p>
              <p className="text-[#61758A]">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setImages([]);
                setZipBlob(null);
              }}
              className="text-[#61758A] hover:text-[#D98218] font-semibold cursor-pointer"
            >
              Change
            </button>
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
                <span>Extracting page images...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-2 bg-[#FAF5EC] rounded-full overflow-hidden">
                <div
                  style={{ width: `${progress}%` }}
                  className="h-full bg-gradient-to-r from-[#D98218] to-[#C66A08] transition-all"
                />
              </div>
            </div>
          ) : images.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#102A43]">
                  EXTRACTED IMAGES ({images.length})
                </span>
                {zipBlob && (
                  <button
                    onClick={handleDownloadZip}
                    className="px-3.5 py-1.5 bg-[#D98218] hover:bg-[#C66A08] text-white text-xs font-bold rounded-full shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>Download All as ZIP ({(zipBlob.size / 1024).toFixed(1)} KB)</span>
                  </button>
                )}
              </div>

              {/* Images Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-72 overflow-y-auto p-2 bg-[#FAF5EC] rounded-xl border border-[#E9DCC8]">
                {images.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-2 rounded-xl border border-[#E9DCC8] shadow-xs flex flex-col justify-between space-y-2"
                  >
                    <div className="w-full aspect-[4/3] bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center border border-gray-100">
                      <img
                        src={item.dataUrl}
                        alt={item.name}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-gray-100">
                      <span className="truncate max-w-[90px] text-[#102A43] font-medium" title={item.name}>
                        Image {idx + 1}
                      </span>
                      <button
                        onClick={() => handleDownloadSingle(item)}
                        className="text-[#D98218] hover:text-[#C66A08] font-bold flex items-center gap-0.5 cursor-pointer"
                      >
                        <Download className="w-3 h-3" />
                        <span>PNG</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

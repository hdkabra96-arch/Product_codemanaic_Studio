import React, { useState } from 'react';
import { Upload, Download, RefreshCw, Check, AlertCircle, ShieldAlert, ShieldCheck, Info } from 'lucide-react';
import confetti from 'canvas-confetti';
import { stripImageMetadata } from '../../services/image/imageProcessingService';

export const ImageMetadataRemoverTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    blob: Blob;
    fileName: string;
    originalSize: number;
    newSize: number;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileSelect = (selected: File) => {
    if (!selected.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file.');
      return;
    }
    setFile(selected);
    setErrorMsg(null);
    setResult(null);

    const url = URL.createObjectURL(selected);
    setPreviewUrl(url);
  };

  const handleStripMetadata = async () => {
    if (!file) return;
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const res = await stripImageMetadata(file);
      setResult(res);
      setIsProcessing(false);

      try {
        confetti({ particleCount: 40, spread: 60 });
      } catch {
        // ignore
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error stripping metadata.');
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  const handleReset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setErrorMsg(null);
  };

  return (
    <div className="space-y-4">
      {!file ? (
        <label className="border-2 border-dashed border-[#E9DCC8] hover:border-[#D98218] bg-[#FAF5EC]/60 hover:bg-[#FFF3DF]/40 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelect(e.target.files[0]);
              }
            }}
          />
          <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-[#E9DCC8] flex items-center justify-center text-[#D98218] mb-3">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <span className="text-base font-bold text-[#102A43]">
            Select an image to wipe all EXIF & metadata
          </span>
          <span className="text-xs text-[#61758A] mt-1">
            Purges GPS coordinates, camera serial, shutter speed, date & device identity
          </span>
          <span className="mt-4 px-4 py-1.5 rounded-full bg-white border border-[#E9DCC8] text-xs font-bold text-[#102A43] shadow-sm">
            Browse Image
          </span>
        </label>
      ) : (
        <div className="space-y-4">
          {/* Header */}
          <div className="p-4 bg-white rounded-2xl border border-[#E9DCC8] shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-[#102A43] truncate max-w-xs">{file.name}</span>
              <span className="text-xs text-[#61758A]">{(file.size / 1024).toFixed(1)} KB</span>
            </div>
            <button
              onClick={handleReset}
              className="text-xs font-semibold text-[#61758A] hover:text-red-600 cursor-pointer"
            >
              Change File
            </button>
          </div>

          {/* Privacy Analysis Box */}
          <div className="p-4 bg-[#FAF5EC] rounded-2xl border border-[#E9DCC8] space-y-3">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-[#D98218] shrink-0" />
              <h5 className="text-xs font-bold text-[#102A43] uppercase tracking-wider">
                Sensitive Metadata Tags to be Stripped
              </h5>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-white rounded-xl border border-[#E9DCC8]">
                <span className="font-bold text-[#102A43] block">GPS Geolocation</span>
                <span className="text-[11px] text-[#61758A]">Exact latitude, longitude & altitude</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-[#E9DCC8]">
                <span className="font-bold text-[#102A43] block">Device Information</span>
                <span className="text-[11px] text-[#61758A]">Camera model, phone brand, lens info</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-[#E9DCC8]">
                <span className="font-bold text-[#102A43] block">Timestamps</span>
                <span className="text-[11px] text-[#61758A]">Original creation, digitize & edit dates</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-[#E9DCC8]">
                <span className="font-bold text-[#102A43] block">Embedded Thumbnails</span>
                <span className="text-[11px] text-[#61758A]">Hidden cached preview frames</span>
              </div>
            </div>

            <p className="text-[11px] text-[#61758A] leading-relaxed pt-1">
              Sanitizing reconstructs the raw RGB pixel matrix into a fresh, unpolluted image container.
              All non-visual metadata tags are discarded permanently.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!result ? (
            <button
              onClick={handleStripMetadata}
              disabled={isProcessing}
              className="w-full py-3 rounded-full bg-[#D98218] hover:bg-[#C66A08] disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sanitizing Image Pixels...</span>
                </>
              ) : (
                <span>Wipe All EXIF & Metadata</span>
              )}
            </button>
          ) : (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-emerald-950">Image 100% Sanitized & Safe</h5>
                  <p className="text-[11px] text-emerald-700">
                    EXIF stripped • {(result.newSize / 1024).toFixed(1)} KB clean file
                  </p>
                </div>
              </div>
              <button
                onClick={handleDownload}
                className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Clean Image</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

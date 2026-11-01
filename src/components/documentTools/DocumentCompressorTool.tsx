import React, { useState, useRef } from 'react';
import {
  Minimize2,
  Upload,
  Download,
  FileCheck,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Zap,
  Sliders,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { compressDocumentFile } from '../../services/document/documentService';

export const DocumentCompressorTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preset, setPreset] = useState<'recommended' | 'extreme' | 'low'>('recommended');
  const [isCompressing, setIsCompressing] = useState(false);
  const [result, setResult] = useState<{
    blob: Blob;
    fileName: string;
    originalSize: number;
    compressedSize: number;
  } | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (!selected.name.toLowerCase().endsWith('.pdf')) {
        setError('Please select a PDF document to compress.');
        return;
      }
      setFile(selected);
      setError(null);
      setResult(null);
      setDownloadUrl(null);
    }
  };

  const handleCompress = async () => {
    if (!file) return;
    setIsCompressing(true);
    setError(null);

    try {
      const res = await compressDocumentFile(file, preset);
      setResult(res);
      const url = URL.createObjectURL(res.blob);
      setDownloadUrl(url);
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to compress document.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setDownloadUrl(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const savedPercent =
    result && result.originalSize > 0
      ? Math.max(0, Math.round(((result.originalSize - result.compressedSize) / result.originalSize) * 100))
      : 0;

  return (
    <div className="space-y-8">
      {/* Tool Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E9DCC8]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF3DF] text-[#D98218] text-xs font-bold uppercase tracking-wider mb-2 border border-[#F4A62A]/30">
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Document Optimizer</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#102A43]">Document Compressor</h2>
          <p className="text-sm text-[#61758A] mt-1">
            Reduce document file size by optimizing object streams and stripping unnecessary internal bloat.
          </p>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          {!file ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#E9DCC8] hover:border-[#D98218] bg-white rounded-3xl p-10 sm:p-14 text-center cursor-pointer transition-all hover:shadow-[0_8px_30px_rgba(217,130,24,0.08)] flex flex-col items-center justify-center min-h-[320px]"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-18 h-18 rounded-3xl bg-[#FFF3DF] text-[#D98218] flex items-center justify-center mb-4 shadow-sm">
                <Minimize2 className="w-9 h-9 stroke-[2.2]" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-[#102A43]">
                Drop your PDF document here to compress
              </h3>
              <p className="text-sm text-[#61758A] mt-2 max-w-md">
                Fast, lossless and high-compression presets. Documents never leave your browser.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#D98218] text-white font-bold text-sm shadow-md hover:bg-[#B86B0E] transition-all">
                <Upload className="w-4 h-4" />
                <span>Select PDF File</span>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* File Info Bar */}
              <div className="bg-white rounded-2xl p-5 border border-[#E9DCC8] flex items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-[#FFF3DF] text-[#D98218] flex items-center justify-center shrink-0">
                    <FileCheck className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-[#102A43] truncate">{file.name}</h4>
                    <p className="text-xs text-[#61758A] mt-0.5">
                      Original Size: {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleReset}
                  className="px-4 py-2 rounded-xl border border-[#E9DCC8] text-xs font-bold text-[#61758A] hover:text-[#102A43] hover:border-[#D98218] transition-all flex items-center gap-1.5 shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Choose Another</span>
                </button>
              </div>

              {/* Compression Preset Selection */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E9DCC8] shadow-sm space-y-6">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#D98218]" />
                  <h4 className="text-base font-bold text-[#102A43]">Choose Compression Level</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <button
                    type="button"
                    onClick={() => setPreset('recommended')}
                    className={`p-5 rounded-2xl text-left border-2 transition-all ${
                      preset === 'recommended'
                        ? 'border-[#D98218] bg-[#FFF8EE] shadow-sm'
                        : 'border-[#E9DCC8] hover:border-[#D98218]/50 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-[#102A43]">Recommended</span>
                      <Zap className="w-4 h-4 text-[#D98218]" />
                    </div>
                    <p className="text-xs text-[#61758A]">
                      Optimal balance of file size reduction and pristine visual quality.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreset('extreme')}
                    className={`p-5 rounded-2xl text-left border-2 transition-all ${
                      preset === 'extreme'
                        ? 'border-[#D98218] bg-[#FFF8EE] shadow-sm'
                        : 'border-[#E9DCC8] hover:border-[#D98218]/50 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-[#102A43]">Extreme</span>
                      <Minimize2 className="w-4 h-4 text-[#D98218]" />
                    </div>
                    <p className="text-xs text-[#61758A]">
                      Maximum size reduction. Strips non-essential thumbnails and metadata.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreset('low')}
                    className={`p-5 rounded-2xl text-left border-2 transition-all ${
                      preset === 'low'
                        ? 'border-[#D98218] bg-[#FFF8EE] shadow-sm'
                        : 'border-[#E9DCC8] hover:border-[#D98218]/50 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-[#102A43]">Low</span>
                      <Sparkles className="w-4 h-4 text-[#D98218]" />
                    </div>
                    <p className="text-xs text-[#61758A]">
                      Light re-compression with 100% preservation of all elements.
                    </p>
                  </button>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleCompress}
                    disabled={isCompressing}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#D98218] hover:bg-[#B86B0E] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isCompressing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Compressing Document...</span>
                      </>
                    ) : (
                      <>
                        <Minimize2 className="w-4 h-4" />
                        <span>Compress Document Now</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Compression Results & Download */}
              {result && downloadUrl && (
                <div className="bg-emerald-50 rounded-3xl p-6 sm:p-8 border border-emerald-200 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[#102A43]">Document Compressed!</h3>
                      <p className="text-sm text-[#61758A] mt-0.5">{result.fileName}</p>
                    </div>
                  </div>

                  {/* Size Comparison Card */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-emerald-200">
                      <span className="text-xs text-[#61758A] font-medium block">Original Size</span>
                      <span className="text-lg font-bold text-[#102A43]">
                        {formatFileSize(result.originalSize)}
                      </span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-emerald-200">
                      <span className="text-xs text-[#61758A] font-medium block">Compressed Size</span>
                      <span className="text-lg font-bold text-emerald-700">
                        {formatFileSize(result.compressedSize)}
                      </span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-emerald-200">
                      <span className="text-xs text-[#61758A] font-medium block">Space Saved</span>
                      <span className="text-lg font-bold text-[#D98218]">
                        {savedPercent > 0 ? `-${savedPercent}%` : 'Optimized'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <a
                      href={downloadUrl}
                      download={result.fileName}
                      className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-[#D98218] hover:bg-[#B86B0E] text-white font-bold text-sm shadow-md transition-all"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Compressed File</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-[#E9DCC8] shadow-sm space-y-5">
            <h4 className="font-bold text-[#102A43] text-base">Compression Benefits</h4>
            <ul className="space-y-3 text-xs text-[#61758A]">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#D98218] shrink-0 mt-0.5" />
                <span>Re-indexes object streams with high deflate efficiency</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#D98218] shrink-0 mt-0.5" />
                <span>Removes redundant structural overhead</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#D98218] shrink-0 mt-0.5" />
                <span>Perfect for email attachments and web upload limits</span>
              </li>
            </ul>

            <div className="pt-4 border-t border-[#E9DCC8]">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Private & Client-Side</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

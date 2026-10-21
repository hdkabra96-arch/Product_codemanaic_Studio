import React, { useState } from 'react';
import { Upload, Minimize2, Download, Check, AlertCircle, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { compressPdf, CompressionPreset, CompressionResult } from '../../services/pdf/compressionService';
import { fileToArrayBuffer } from '../../services/pdf/pdfLibUtils';

export const PdfCompressorTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preset, setPreset] = useState<CompressionPreset>('medium');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<CompressionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
      setErrorMsg(err instanceof Error ? err.message : 'Error compressing PDF.');
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result || !file) return;
    const blob = new Blob([result.bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    a.download = `${baseName}_compressed.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
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
                setFile(e.target.files[0]);
                setResult(null);
                setErrorMsg(null);
              }
            }}
          />
          <div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-[#E9DCC8] flex items-center justify-center text-[#D98218] mb-2">
            <Upload className="w-6 h-6" />
          </div>
          <span className="text-sm font-bold text-[#102A43]">Select PDF to compress</span>
          <span className="text-xs text-[#61758A] mt-0.5">
            Optimize and reduce PDF size with smart downsampling
          </span>
        </label>
      ) : (
        <div className="space-y-4">
          <div className="p-3 bg-white rounded-xl border border-[#E9DCC8] flex items-center justify-between">
            <div className="truncate">
              <p className="text-xs font-bold text-[#102A43] truncate">{file.name}</p>
              <p className="text-[11px] text-[#61758A]">
                Original Size: <strong className="text-[#102A43]">{(file.size / 1024).toFixed(1)} KB</strong>
              </p>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setResult(null);
              }}
              className="text-xs text-[#61758A] hover:text-[#D98218] font-semibold cursor-pointer"
            >
              Change
            </button>
          </div>

          {/* Preset Buttons */}
          <div>
            <label className="block text-xs font-bold text-[#102A43] uppercase mb-2">
              Compression Level
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              {[
                {
                  id: 'high' as CompressionPreset,
                  title: 'High Compression',
                  sub: 'Smallest file size',
                  badge: 'Max Savings',
                },
                {
                  id: 'medium' as CompressionPreset,
                  title: 'Medium Compression',
                  sub: 'Balanced quality & size',
                  badge: 'Recommended',
                },
                {
                  id: 'low' as CompressionPreset,
                  title: 'Low Compression',
                  sub: 'Crisp vector & images',
                  badge: 'High Quality',
                },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPreset(p.id)}
                  className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                    preset === p.id
                      ? 'border-[#D98218] bg-[#FFF8EE] shadow-xs'
                      : 'border-[#E9DCC8] bg-white hover:bg-[#FAF5EC]'
                  }`}
                >
                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#FFF3DF] text-[#D98218] mb-1">
                    {p.badge}
                  </span>
                  <p className="font-bold text-[#102A43]">{p.title}</p>
                  <p className="text-[11px] text-[#61758A] mt-0.5">{p.sub}</p>
                </button>
              ))}
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
                <span>Optimizing and compressing pages...</span>
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
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-900">Compression Completed!</h4>
                  <span className="text-[11px] text-emerald-700">
                    {(result.originalBytes / 1024).toFixed(1)} KB →{' '}
                    <strong>{(result.compressedBytes / 1024).toFixed(1)} KB</strong>
                    {result.percentageSaved > 0 && ` (${result.percentageSaved}% smaller)`}
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
                  onClick={() => setResult(null)}
                  className="p-2 bg-white border border-[#E9DCC8] rounded-full text-[#102A43] cursor-pointer"
                  title="Compress again"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleCompress}
              className="w-full py-3 rounded-full bg-gradient-to-r from-[#D98218] to-[#C66A08] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Minimize2 className="w-4 h-4" />
              <span>Compress PDF Now</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

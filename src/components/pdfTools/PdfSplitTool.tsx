import React, { useState } from 'react';
import { Upload, Scissors, Download, Check, AlertCircle, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { splitPdf } from '../../services/pdf/mergeSplitService';
import { getPdfPageCount, fileToArrayBuffer } from '../../services/pdf/pdfLibUtils';

export const PdfSplitTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [splitMode, setSplitMode] = useState<'each_page' | 'ranges'>('each_page');
  const [rangesStr, setRangesStr] = useState('1-2; 3-5');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; fileName: string; filesCount: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileSelected = async (selected: File | null) => {
    if (!selected) return;
    setErrorMsg(null);
    setResult(null);
    try {
      const buf = await fileToArrayBuffer(selected);
      const count = await getPdfPageCount(buf);
      setFile(selected);
      setTotalPages(count);
      if (count > 1) {
        setRangesStr(`1-${Math.ceil(count / 2)}; ${Math.ceil(count / 2) + 1}-${count}`);
      } else {
        setRangesStr('1');
      }
    } catch {
      setErrorMsg('Could not read PDF. Please check if the file is valid and unencrypted.');
    }
  };

  const handleSplit = async () => {
    if (!file) return;
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const buf = await fileToArrayBuffer(file);
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      const res = await splitPdf(buf, baseName, splitMode, rangesStr);
      setResult(res);
      setIsProcessing(false);
      try {
        confetti({ particleCount: 35, spread: 55 });
      } catch {
        // ignore
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error splitting PDF document.');
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

  return (
    <div className="space-y-5">
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
          <span className="text-sm font-bold text-[#102A43]">Select PDF to split</span>
          <span className="text-xs text-[#61758A] mt-0.5">
            Extract all pages or custom ranges
          </span>
        </label>
      ) : (
        <div className="space-y-4">
          {/* File Card */}
          <div className="p-3 bg-white rounded-xl border border-[#E9DCC8] flex items-center justify-between">
            <div className="truncate">
              <p className="text-xs font-bold text-[#102A43] truncate">{file.name}</p>
              <p className="text-[11px] text-[#61758A]">
                {(file.size / 1024).toFixed(1)} KB · Total Pages: <strong className="text-[#D98218]">{totalPages}</strong>
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

          {/* Mode Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setSplitMode('each_page')}
              className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                splitMode === 'each_page'
                  ? 'border-[#D98218] bg-[#FFF8EE]'
                  : 'border-[#E9DCC8] bg-white hover:bg-[#FAF5EC]'
              }`}
            >
              <p className="font-bold text-[#102A43]">Split Every Page</p>
              <p className="text-[11px] text-[#61758A] mt-0.5">
                Generates a ZIP archive with each page as an individual PDF ({totalPages} files)
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSplitMode('ranges')}
              className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                splitMode === 'ranges'
                  ? 'border-[#D98218] bg-[#FFF8EE]'
                  : 'border-[#E9DCC8] bg-white hover:bg-[#FAF5EC]'
              }`}
            >
              <p className="font-bold text-[#102A43]">Custom Page Ranges</p>
              <p className="text-[11px] text-[#61758A] mt-0.5">
                Define specific ranges or groups (e.g. 1-2; 3-5)
              </p>
            </button>
          </div>

          {splitMode === 'ranges' && (
            <div className="p-3 bg-[#FAF5EC] rounded-xl border border-[#E9DCC8] space-y-1.5">
              <label className="text-xs font-bold text-[#102A43] block">
                PAGE RANGES (Use semicolon &apos;;&apos; for separate output files)
              </label>
              <input
                type="text"
                value={rangesStr}
                onChange={(e) => setRangesStr(e.target.value)}
                placeholder="e.g. 1-2; 3-5 or 1,3,5"
                className="w-full p-2 bg-white rounded-lg border border-[#E9DCC8] text-xs font-mono text-[#102A43] focus:outline-none focus:border-[#D98218]"
              />
              <span className="text-[11px] text-[#61758A] block">
                Separate ranges by semicolon (;) to get multiple PDFs in a ZIP, or single range for one PDF.
              </span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {result ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-900">PDF Split Successfully!</h4>
                  <span className="text-[11px] text-emerald-700">
                    Generated {result.filesCount} {result.filesCount === 1 ? 'file' : 'files'} · {(result.blob.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-[#D98218] hover:bg-[#C66A08] text-white text-xs font-bold rounded-full shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download {result.fileName.endsWith('.zip') ? 'ZIP' : 'PDF'}</span>
                </button>
                <button
                  onClick={() => setResult(null)}
                  className="p-2 bg-white border border-[#E9DCC8] rounded-full text-[#102A43] cursor-pointer"
                  title="Split again"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleSplit}
              disabled={isProcessing}
              className="w-full py-3 rounded-full bg-gradient-to-r from-[#D98218] to-[#C66A08] text-white font-bold text-sm shadow-md hover:shadow-lg disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Scissors className="w-4 h-4" />
              <span>{isProcessing ? 'Splitting PDF...' : 'Split PDF Now'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

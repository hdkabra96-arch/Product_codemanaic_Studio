import React, { useState } from 'react';
import { Upload, Download, Check, AlertCircle, RefreshCw, FileMinus } from 'lucide-react';
import confetti from 'canvas-confetti';
import { extractPagesFromPdf, parsePageRangeString } from '../../services/pdf/mergeSplitService';
import { getPdfPageCount, fileToArrayBuffer } from '../../services/pdf/pdfLibUtils';

export const PdfPageExtractorTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [rangeInput, setRangeInput] = useState('1');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileSelected = async (selected: File | null) => {
    if (!selected) return;
    setErrorMsg(null);
    setResultBlob(null);
    try {
      const buf = await fileToArrayBuffer(selected);
      const count = await getPdfPageCount(buf);
      setFile(selected);
      setTotalPages(count);
      setSelectedPages([1]);
      setRangeInput('1');
    } catch {
      setErrorMsg('Could not read PDF file.');
    }
  };

  const handleRangeInputChange = (val: string) => {
    setRangeInput(val);
    const parsed = parsePageRangeString(val, totalPages);
    setSelectedPages(parsed);
  };

  const togglePage = (pageNum: number) => {
    const next = selectedPages.includes(pageNum)
      ? selectedPages.filter((p) => p !== pageNum)
      : [...selectedPages, pageNum].sort((a, b) => a - b);
    setSelectedPages(next);
    setRangeInput(next.join(', '));
  };

  const handleExtract = async () => {
    if (!file) return;
    if (selectedPages.length === 0) {
      setErrorMsg('Please select at least one page to extract.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const buf = await fileToArrayBuffer(file);
      const { bytes } = await extractPagesFromPdf(buf, selectedPages);
      const blob = new Blob([bytes as any], { type: 'application/pdf' });
      setResultBlob(blob);
      setIsProcessing(false);
      try {
        confetti({ particleCount: 35, spread: 55 });
      } catch {
        // ignore
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error extracting pages.');
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultBlob || !file) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    a.download = `${baseName}_extracted.pdf`;
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
          <span className="text-sm font-bold text-[#102A43]">Select PDF to extract pages</span>
          <span className="text-xs text-[#61758A] mt-0.5">
            Choose specific pages to export into a new standalone PDF
          </span>
        </label>
      ) : (
        <div className="space-y-4">
          <div className="p-3 bg-white rounded-xl border border-[#E9DCC8] flex items-center justify-between">
            <div className="truncate">
              <p className="text-xs font-bold text-[#102A43] truncate">{file.name}</p>
              <p className="text-[11px] text-[#61758A]">
                Total: <strong className="text-[#D98218]">{totalPages} pages</strong> · Selected:{' '}
                <strong className="text-[#102A43]">{selectedPages.length}</strong>
              </p>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setResultBlob(null);
              }}
              className="text-xs text-[#61758A] hover:text-[#D98218] font-semibold cursor-pointer"
            >
              Change
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#102A43] block">
              ENTER PAGE RANGE OR NUMBERS:
            </label>
            <input
              type="text"
              value={rangeInput}
              onChange={(e) => handleRangeInputChange(e.target.value)}
              placeholder="e.g. 1, 3, 5-8"
              className="w-full p-2.5 bg-white border border-[#E9DCC8] rounded-xl text-xs font-mono text-[#102A43] focus:outline-none focus:border-[#D98218]"
            />
          </div>

          {/* Quick page toggle buttons */}
          <div>
            <label className="text-xs font-bold text-[#61758A] block mb-1.5">
              OR SELECT PAGES DIRECTLY:
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-[#FAF5EC] rounded-xl border border-[#E9DCC8]">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                const isSelected = selectedPages.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#D98218] text-white shadow-xs'
                        : 'bg-white text-[#102A43] border border-[#E9DCC8] hover:border-[#D98218]'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

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
                  <h4 className="text-xs font-bold text-emerald-900">Pages Extracted!</h4>
                  <span className="text-[11px] text-emerald-700">
                    {selectedPages.length} pages · {(resultBlob.size / 1024).toFixed(1)} KB
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
                  title="Extract more"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleExtract}
              disabled={selectedPages.length === 0 || isProcessing}
              className="w-full py-3 rounded-full bg-gradient-to-r from-[#D98218] to-[#C66A08] text-white font-bold text-sm shadow-md hover:shadow-lg disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <FileMinus className="w-4 h-4" />
              <span>{isProcessing ? 'Extracting...' : `Extract ${selectedPages.length} Pages`}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

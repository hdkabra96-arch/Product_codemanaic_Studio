import React, { useState } from 'react';
import { Upload, Check, AlertCircle, RefreshCw, GitCompare, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import confetti from 'canvas-confetti';
import { fileToArrayBuffer } from '../../services/pdf/pdfLibUtils';
import { compareTwoPdfFiles, PdfComparisonResult } from '../../services/pdf/comparePdfService';

export const PdfCompareTool: React.FC = () => {
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<PdfComparisonResult | null>(null);
  const [activePageIdx, setActivePageIdx] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCompare = async () => {
    if (!file1 || !file2) {
      setErrorMsg('Please upload both PDF files to run the comparison.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const [buf1, buf2] = await Promise.all([
        fileToArrayBuffer(file1),
        fileToArrayBuffer(file2),
      ]);

      const res = await compareTwoPdfFiles(buf1, file1.name, buf2, file2.name);
      setResult(res);
      setActivePageIdx(0);
      setIsProcessing(false);
      try {
        confetti({ particleCount: 35, spread: 60 });
      } catch {
        // ignore
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error comparing PDF files.');
      setIsProcessing(false);
    }
  };

  const activePage = result?.pageComparisons[activePageIdx];

  return (
    <div className="space-y-6">
      {/* Upload 2 Files Side by Side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Document 1 (Original) */}
        <div className="space-y-2">
          <label className="block text-xs font-extrabold uppercase text-[#102A43]">
            Document 1 (Original)
          </label>
          {!file1 ? (
            <label className="border-2 border-dashed border-[#E9DCC8] hover:border-[#D98218] bg-[#FAF5EC]/60 hover:bg-[#FFF3DF]/40 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all h-36">
              <input
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setFile1(e.target.files[0]);
                    setResult(null);
                  }
                }}
              />
              <Upload className="w-6 h-6 text-[#D98218] mb-1.5" />
              <span className="text-xs font-bold text-[#102A43]">Select Original PDF</span>
              <span className="text-[10px] text-[#61758A]">Base version for comparison</span>
            </label>
          ) : (
            <div className="p-3 bg-white rounded-xl border border-[#E9DCC8] flex items-center justify-between">
              <div className="truncate">
                <p className="text-xs font-bold text-[#102A43] truncate">{file1.name}</p>
                <p className="text-[10px] text-[#61758A]">
                  {(file1.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFile1(null);
                  setResult(null);
                }}
                className="text-xs text-[#61758A] hover:text-[#D98218] font-semibold cursor-pointer"
              >
                Change
              </button>
            </div>
          )}
        </div>

        {/* Document 2 (Modified) */}
        <div className="space-y-2">
          <label className="block text-xs font-extrabold uppercase text-[#102A43]">
            Document 2 (Modified)
          </label>
          {!file2 ? (
            <label className="border-2 border-dashed border-[#E9DCC8] hover:border-[#D98218] bg-[#FAF5EC]/60 hover:bg-[#FFF3DF]/40 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all h-36">
              <input
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setFile2(e.target.files[0]);
                    setResult(null);
                  }
                }}
              />
              <Upload className="w-6 h-6 text-[#D98218] mb-1.5" />
              <span className="text-xs font-bold text-[#102A43]">Select Modified PDF</span>
              <span className="text-[10px] text-[#61758A]">New version to inspect changes</span>
            </label>
          ) : (
            <div className="p-3 bg-white rounded-xl border border-[#E9DCC8] flex items-center justify-between">
              <div className="truncate">
                <p className="text-xs font-bold text-[#102A43] truncate">{file2.name}</p>
                <p className="text-[10px] text-[#61758A]">
                  {(file2.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFile2(null);
                  setResult(null);
                }}
                className="text-xs text-[#61758A] hover:text-[#D98218] font-semibold cursor-pointer"
              >
                Change
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Action Compare */}
      {file1 && file2 && !result && (
        <button
          type="button"
          disabled={isProcessing}
          onClick={handleCompare}
          className="w-full py-3.5 rounded-full bg-[#D98218] hover:bg-[#C66A08] text-white font-bold text-sm shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Analyzing Document Differences...</span>
            </>
          ) : (
            <>
              <GitCompare className="w-4 h-4" />
              <span>Compare PDF Documents</span>
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

      {/* Comparison Results */}
      {result && (
        <div className="space-y-4">
          {/* Summary KPI Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-white rounded-2xl border border-[#E9DCC8] shadow-xs text-center">
              <span className="text-[10px] text-[#61758A] font-bold uppercase">Similarity</span>
              <div className="text-xl font-extrabold text-[#D98218] mt-0.5">
                {result.similarityScore}%
              </div>
            </div>
            <div className="p-3 bg-white rounded-2xl border border-[#E9DCC8] shadow-xs text-center">
              <span className="text-[10px] text-[#61758A] font-bold uppercase">Pages</span>
              <div className="text-xl font-extrabold text-[#102A43] mt-0.5">
                {result.doc1Pages} vs {result.doc2Pages}
              </div>
            </div>
            <div className="p-3 bg-white rounded-2xl border border-[#E9DCC8] shadow-xs text-center">
              <span className="text-[10px] text-[#61758A] font-bold uppercase">Additions</span>
              <div className="text-xl font-extrabold text-emerald-600 mt-0.5">
                +{result.totalAdditions}
              </div>
            </div>
            <div className="p-3 bg-white rounded-2xl border border-[#E9DCC8] shadow-xs text-center">
              <span className="text-[10px] text-[#61758A] font-bold uppercase">Deletions</span>
              <div className="text-xl font-extrabold text-red-600 mt-0.5">
                -{result.totalDeletions}
              </div>
            </div>
          </div>

          {/* Page-by-Page Comparison Viewer */}
          {activePage && (
            <div className="bg-white rounded-2xl p-4 border border-[#E9DCC8] shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#E9DCC8] pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#102A43]">
                    Page {activePage.pageNum} Comparison
                  </span>
                  {activePage.isIdentical ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                      Identical
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      {activePage.additionsCount} Additions · {activePage.deletionsCount} Deletions
                    </span>
                  )}
                </div>

                {/* Page Navigation */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={activePageIdx <= 0}
                    onClick={() => setActivePageIdx((i) => Math.max(0, i - 1))}
                    className="p-1 rounded-lg border border-[#E9DCC8] hover:border-[#D98218] text-[#102A43] disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-[#61758A] px-1 font-semibold">
                    {activePageIdx + 1} / {result.pageComparisons.length}
                  </span>
                  <button
                    type="button"
                    disabled={activePageIdx >= result.pageComparisons.length - 1}
                    onClick={() => setActivePageIdx((i) => Math.min(result.pageComparisons.length - 1, i + 1))}
                    className="p-1 rounded-lg border border-[#E9DCC8] hover:border-[#D98218] text-[#102A43] disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Side-by-side or highlighted text diff */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-[#FAF5EC]/50 rounded-xl border border-[#E9DCC8] space-y-2">
                  <span className="text-[11px] font-bold text-[#61758A] uppercase">
                    {result.doc1Name} (Original)
                  </span>
                  <div className="text-xs text-[#102A43] leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap font-sans">
                    {activePage.doc1Text || <em className="text-[#61758A]">No text on this page</em>}
                  </div>
                </div>

                <div className="p-3 bg-[#FAF5EC]/50 rounded-xl border border-[#E9DCC8] space-y-2">
                  <span className="text-[11px] font-bold text-[#61758A] uppercase">
                    {result.doc2Name} (Modified with Diff Highlights)
                  </span>
                  <div className="text-xs leading-relaxed max-h-60 overflow-y-auto font-sans flex flex-wrap gap-1">
                    {activePage.wordsDiff.map((wd, idx) => {
                      if (wd.type === 'added') {
                        return (
                          <span
                            key={idx}
                            className="bg-emerald-100 text-emerald-800 font-semibold px-1 rounded"
                          >
                            +{wd.text}
                          </span>
                        );
                      }
                      if (wd.type === 'removed') {
                        return (
                          <span
                            key={idx}
                            className="bg-red-100 text-red-700 line-through px-1 rounded text-[11px]"
                          >
                            -{wd.text}
                          </span>
                        );
                      }
                      return (
                        <span key={idx} className="text-[#102A43]">
                          {wd.text}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

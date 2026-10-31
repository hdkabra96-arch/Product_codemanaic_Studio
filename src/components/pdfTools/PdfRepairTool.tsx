import React, { useState } from 'react';
import { Upload, Download, Check, AlertCircle, RefreshCw, Wrench, ShieldAlert, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { fileToArrayBuffer } from '../../services/pdf/pdfLibUtils';
import { repairCorruptPdf, RepairPdfResult } from '../../services/pdf/pdfaRepairService';

export const PdfRepairTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [repairResult, setRepairResult] = useState<RepairPdfResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileSelected = (selected: File | null) => {
    if (!selected) return;
    setFile(selected);
    setRepairResult(null);
    setErrorMsg(null);
  };

  const handleRepair = async () => {
    if (!file) return;
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const buf = await fileToArrayBuffer(file);
      const res = await repairCorruptPdf(buf, file.name);
      setRepairResult(res);
      setIsProcessing(false);
      try {
        confetti({ particleCount: 40, spread: 60 });
      } catch {
        // ignore
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error repairing damaged PDF document.');
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!repairResult || !file) return;
    const blob = new Blob([repairResult.bytes as any], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    a.download = `${baseName}_repaired.pdf`;
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
            <Wrench className="w-7 h-7" />
          </div>
          <span className="text-base font-bold text-[#102A43]">Select Damaged or Corrupt PDF</span>
          <span className="text-xs text-[#61758A] mt-1">
            Analyze, recover streams, rebuild broken xref tables, and restore unreadable PDF documents
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
                Original Size: <strong>{(file.size / 1024).toFixed(1)} KB</strong>
              </p>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setRepairResult(null);
              }}
              className="text-xs text-[#61758A] hover:text-[#D98218] font-semibold cursor-pointer"
            >
              Change PDF
            </button>
          </div>

          {/* Diagnostic Info Banner */}
          <div className="p-4 bg-[#FFF3DF]/60 rounded-2xl border border-[#F4A62A]/40 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-[#D98218] shrink-0 mt-0.5" />
            <div className="text-xs text-[#102A43]">
              <span className="font-bold">Automated Deep Diagnostic Recovery:</span> Our engine checks for corrupted stream dictionaries, truncated EOF markers, and broken object offsets, reconstructing a clean ISO 32000-compliant document.
            </div>
          </div>

          {/* Action Button */}
          {!repairResult && (
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleRepair}
              className="w-full py-3.5 rounded-full bg-[#D98218] hover:bg-[#C66A08] text-white font-bold text-sm shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Reconstructing PDF Object Table...</span>
                </>
              ) : (
                <>
                  <Wrench className="w-4 h-4" />
                  <span>Repair PDF Document</span>
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

          {/* Success */}
          {repairResult && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-900">
                      PDF Successfully Repaired & Recovered!
                    </h4>
                    <p className="text-[11px] text-emerald-700">
                      Recovered {repairResult.pageCount} pages · Cleaned size: {(repairResult.recoveredSize / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Repaired PDF</span>
                </button>
              </div>

              {/* Recovery Log */}
              <div className="p-4 bg-white rounded-2xl border border-[#E9DCC8] shadow-xs space-y-2">
                <h5 className="text-xs font-extrabold uppercase text-[#102A43]">
                  Diagnostic Resolution Log
                </h5>
                <div className="space-y-1.5">
                  {repairResult.fixedIssues.map((issue, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-[#102A43]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{issue}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

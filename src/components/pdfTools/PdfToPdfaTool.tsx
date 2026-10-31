import React, { useState } from 'react';
import { Upload, Download, Check, AlertCircle, RefreshCw, ShieldCheck, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { fileToArrayBuffer, getPdfPageCount } from '../../services/pdf/pdfLibUtils';
import { convertToPdfA } from '../../services/pdf/pdfaRepairService';

export const PdfToPdfaTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [conformance, setConformance] = useState<'1b' | '2b'>('1b');

  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);
  const [report, setReport] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileSelected = async (selected: File | null) => {
    if (!selected) return;
    setErrorMsg(null);
    setResultBytes(null);
    setReport([]);
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

    try {
      const buf = await fileToArrayBuffer(file);
      const res = await convertToPdfA(buf, conformance);
      setResultBytes(res.bytes);
      setReport(res.report);
      setIsProcessing(false);
      try {
        confetti({ particleCount: 40, spread: 60 });
      } catch {
        // ignore
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error converting PDF to PDF/A.');
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultBytes || !file) return;
    const blob = new Blob([resultBytes as any], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    a.download = `${baseName}_pdfa_${conformance}.pdf`;
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
          <span className="text-base font-bold text-[#102A43]">Select PDF to convert to PDF/A</span>
          <span className="text-xs text-[#61758A] mt-1">
            Transform into ISO 19005-1 standardized format for long-term document archiving
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
                setResultBytes(null);
                setReport([]);
              }}
              className="text-xs text-[#61758A] hover:text-[#D98218] font-semibold cursor-pointer"
            >
              Change PDF
            </button>
          </div>

          {/* Conformance Level Selector */}
          <div className="bg-white rounded-2xl p-4 border border-[#E9DCC8] space-y-3">
            <label className="block text-xs font-extrabold uppercase text-[#102A43]">
              ISO Conformance Level
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  id: '1b',
                  title: 'PDF/A-1b (ISO 19005-1)',
                  desc: 'Basic visual preservation conformance standard for long-term archiving',
                },
                {
                  id: '2b',
                  title: 'PDF/A-2b (ISO 19005-2)',
                  desc: 'Supports JPEG 2000, transparency, and embedded compliant attachments',
                },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setConformance(c.id as any)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    conformance === c.id
                      ? 'border-[#D98218] bg-[#FFF3DF] text-[#102A43] shadow-xs'
                      : 'border-[#E9DCC8] bg-white text-[#61758A]'
                  }`}
                >
                  <h5 className="text-xs font-bold text-[#102A43]">{c.title}</h5>
                  <p className="text-[11px] text-[#61758A] mt-1">{c.desc}</p>
                </button>
              ))}
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
                <span>Injecting ISO PDF/A Dictionaries...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Convert to PDF/A-{conformance.toUpperCase()}</span>
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
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-900">
                      PDF/A Conformance Validation Complete!
                    </h4>
                    <p className="text-[11px] text-emerald-700">
                      Standardized under ISO 19005-{conformance === '1b' ? '1' : '2'} specifications.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF/A</span>
                </button>
              </div>

              {/* Conformance Checklist */}
              {report.length > 0 && (
                <div className="p-4 bg-white rounded-2xl border border-[#E9DCC8] shadow-xs space-y-2">
                  <h5 className="text-xs font-extrabold uppercase text-[#102A43]">
                    Archival Audit Checklist
                  </h5>
                  <div className="space-y-1.5">
                    {report.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-[#102A43]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

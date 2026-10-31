import React, { useState } from 'react';
import { Upload, Download, Check, AlertCircle, RefreshCw, Hash } from 'lucide-react';
import confetti from 'canvas-confetti';
import { fileToArrayBuffer, getPdfPageCount } from '../../services/pdf/pdfLibUtils';
import {
  addPageNumbersToPdf,
  PageNumberPosition,
  PageNumberFormat,
  PageNumberOptions,
} from '../../services/pdf/pageNumbersService';

export const PdfPageNumbersTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState(0);

  // Configuration options
  const [position, setPosition] = useState<PageNumberPosition>('bottom-center');
  const [format, setFormat] = useState<PageNumberFormat>('Page {n} of {p}');
  const [fontSize, setFontSize] = useState<number>(11);
  const [fontColor, setFontColor] = useState<string>('#102A43');
  const [startNumber, setStartNumber] = useState<number>(1);
  const [margin, setMargin] = useState<number>(25);
  const [targetPages, setTargetPages] = useState<'all' | 'odd' | 'even'>('all');

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileSelected = async (selected: File | null) => {
    if (!selected) return;
    setErrorMsg(null);
    setResultBytes(null);
    try {
      const buf = await fileToArrayBuffer(selected);
      const count = await getPdfPageCount(buf);
      setFile(selected);
      setTotalPages(count);
    } catch {
      setErrorMsg('Could not read PDF. Please provide a valid, unprotected PDF file.');
    }
  };

  const handleAddPageNumbers = async () => {
    if (!file) return;
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const buf = await fileToArrayBuffer(file);
      const opts: PageNumberOptions = {
        position,
        format,
        fontSize,
        fontColor,
        startNumber,
        margin,
        targetPages,
      };

      const { bytes } = await addPageNumbersToPdf(buf, opts);
      setResultBytes(bytes);
      setIsProcessing(false);
      try {
        confetti({ particleCount: 40, spread: 60 });
      } catch {
        // ignore
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error adding page numbers.');
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
    a.download = `${baseName}_numbered.pdf`;
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
          <span className="text-base font-bold text-[#102A43]">Select PDF to add page numbers</span>
          <span className="text-xs text-[#61758A] mt-1">
            Choose position, typography, and numbering format with live preview
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
              }}
              className="text-xs text-[#61758A] hover:text-[#D98218] font-semibold cursor-pointer"
            >
              Change PDF
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Position 3x3 Selector */}
            <div className="bg-white rounded-2xl p-4 border border-[#E9DCC8] shadow-xs space-y-3">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#102A43]">
                Page Number Position
              </label>

              <div className="p-4 bg-[#FAF5EC]/70 rounded-xl border border-[#E9DCC8] flex flex-col items-center">
                {/* 3x3 Grid simulation on document sheet */}
                <div className="w-48 h-60 bg-white border-2 border-dashed border-[#E9DCC8] rounded-lg shadow-xs p-2 grid grid-cols-3 grid-rows-3 gap-2">
                  {[
                    { id: 'top-left', label: 'Top Left' },
                    { id: 'top-center', label: 'Top Center' },
                    { id: 'top-right', label: 'Top Right' },
                    { id: 'mid-left', label: '', disabled: true },
                    { id: 'mid-center', label: '', disabled: true },
                    { id: 'mid-right', label: '', disabled: true },
                    { id: 'bottom-left', label: 'Bottom Left' },
                    { id: 'bottom-center', label: 'Bottom Center' },
                    { id: 'bottom-right', label: 'Bottom Right' },
                  ].map((pos) => {
                    if (pos.disabled) {
                      return <div key={pos.id} className="opacity-0" />;
                    }
                    const isSelected = position === pos.id;
                    return (
                      <button
                        key={pos.id}
                        type="button"
                        onClick={() => setPosition(pos.id as PageNumberPosition)}
                        title={pos.label}
                        className={`rounded-md flex items-center justify-center transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-[#D98218] border-[#D98218] text-white shadow-sm ring-2 ring-[#D98218]/30'
                            : 'bg-[#FAF5EC] border-[#E9DCC8] hover:border-[#D98218] text-[#61758A]'
                        }`}
                      >
                        <span className="text-[9px] font-bold">123</span>
                      </button>
                    );
                  })}
                </div>
                <span className="text-[11px] font-semibold text-[#D98218] mt-2 capitalize">
                  Selected: {position.replace('-', ' ')}
                </span>
              </div>
            </div>

            {/* Typography & Format Options */}
            <div className="bg-white rounded-2xl p-4 border border-[#E9DCC8] shadow-xs space-y-4">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#102A43]">
                Format & Typography
              </label>

              {/* Numbering Format */}
              <div>
                <label className="block text-[11px] font-bold text-[#102A43] uppercase mb-1">
                  Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'Page {n} of {p}', label: 'Page 1 of 10' },
                    { id: '{n}', label: '1, 2, 3...' },
                    { id: '- {n} -', label: '- 1 -' },
                    { id: 'Page {n}', label: 'Page 1' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFormat(f.id as PageNumberFormat)}
                      className={`p-2 text-xs rounded-xl border text-left transition-all cursor-pointer ${
                        format === f.id
                          ? 'border-[#D98218] bg-[#FFF3DF] text-[#D98218] font-bold shadow-xs'
                          : 'border-[#E9DCC8] bg-white text-[#61758A] hover:border-[#D98218]/50'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size & Color */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#102A43] uppercase mb-1">
                    Font Size ({fontSize} pt)
                  </label>
                  <input
                    type="range"
                    min="8"
                    max="22"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full accent-[#D98218]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#102A43] uppercase mb-1">
                    Text Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={fontColor}
                      onChange={(e) => setFontColor(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-[#E9DCC8]"
                    />
                    <span className="text-xs font-mono font-bold text-[#102A43]">{fontColor}</span>
                  </div>
                </div>
              </div>

              {/* Target Pages */}
              <div>
                <label className="block text-[11px] font-bold text-[#102A43] uppercase mb-1">
                  Target Pages
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'all', label: 'All Pages' },
                    { id: 'odd', label: 'Odd Only' },
                    { id: 'even', label: 'Even Only' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTargetPages(t.id as any)}
                      className={`p-2 text-xs rounded-xl border text-center transition-all cursor-pointer ${
                        targetPages === t.id
                          ? 'border-[#D98218] bg-[#FFF3DF] text-[#D98218] font-bold'
                          : 'border-[#E9DCC8] bg-white text-[#61758A]'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            type="button"
            disabled={isProcessing}
            onClick={handleAddPageNumbers}
            className="w-full py-3.5 rounded-full bg-[#D98218] hover:bg-[#C66A08] text-white font-bold text-sm shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Applying Page Numbers...</span>
              </>
            ) : (
              <>
                <Hash className="w-4 h-4" />
                <span>Insert Page Numbers</span>
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
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <Check className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-900">
                    Page Numbers Added Successfully!
                  </h4>
                  <p className="text-[11px] text-emerald-700">
                    Numbered across document pages with clean vector alignment.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDownload}
                className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download Numbered PDF</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

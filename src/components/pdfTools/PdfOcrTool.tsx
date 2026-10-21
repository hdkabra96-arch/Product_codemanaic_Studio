import React, { useState } from 'react';
import { Upload, Download, Check, AlertCircle, RefreshCw, ScanText, Copy } from 'lucide-react';
import confetti from 'canvas-confetti';
import { performOcrOnPdf, OcrResult } from '../../services/pdf/ocrImageExtractService';
import { fileToArrayBuffer } from '../../services/pdf/pdfLibUtils';

export const PdfOcrTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState('eng');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [result, setResult] = useState<OcrResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleStartOcr = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(5);
    setStatusText('Preparing document...');
    setErrorMsg(null);
    setResult(null);

    try {
      const buf = await fileToArrayBuffer(file);
      const res = await performOcrOnPdf(buf, language, (pct, status) => {
        setProgress(pct);
        setStatusText(status);
      });
      setResult(res);
      setProgress(100);
      setIsProcessing(false);
      try {
        confetti({ particleCount: 40, spread: 60 });
      } catch {
        // ignore
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'OCR Recognition failed.');
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!result || !file) return;
    const url = URL.createObjectURL(result.textBlob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    a.download = `${baseName}_ocr_text.txt`;
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
                setFile(e.target.files[0]);
                setResult(null);
                setErrorMsg(null);
              }
            }}
          />
          <div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-[#E9DCC8] flex items-center justify-center text-[#D98218] mb-2">
            <ScanText className="w-6 h-6" />
          </div>
          <span className="text-sm font-bold text-[#102A43]">Select PDF for OCR text recognition</span>
          <span className="text-xs text-[#61758A] mt-0.5">
            Extracts searchable text from scanned PDFs using neural OCR
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
                setResult(null);
              }}
              className="text-[#61758A] hover:text-[#D98218] font-semibold cursor-pointer"
            >
              Change
            </button>
          </div>

          <div className="p-3 bg-[#FAF5EC] rounded-xl border border-[#E9DCC8] flex items-center justify-between text-xs">
            <span className="font-bold text-[#102A43]">OCR RECOGNITION LANGUAGE:</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={isProcessing}
              className="p-1.5 bg-white border border-[#E9DCC8] rounded-lg text-xs font-semibold text-[#102A43]"
            >
              <option value="eng">English (eng)</option>
              <option value="spa">Spanish (spa)</option>
              <option value="fra">French (fra)</option>
              <option value="deu">German (deu)</option>
            </select>
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
                <span>{statusText || 'Recognizing text with OCR...'}</span>
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
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#102A43]">RECOGNIZED TEXT OUTPUT:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="px-3 py-1 bg-white border border-[#E9DCC8] text-xs font-bold text-[#102A43] hover:border-[#D98218] rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy Text'}</span>
                  </button>
                  <button
                    onClick={handleDownloadTxt}
                    className="px-3.5 py-1 bg-[#D98218] hover:bg-[#C66A08] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .TXT</span>
                  </button>
                  <button
                    onClick={() => setResult(null)}
                    className="p-1 bg-white border border-[#E9DCC8] rounded-lg text-[#102A43] cursor-pointer"
                    title="Run again"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <textarea
                rows={7}
                readOnly
                value={result.fullText}
                className="w-full p-3 bg-white border border-[#E9DCC8] rounded-xl font-mono text-xs text-[#102A43] focus:outline-none"
              />
            </div>
          ) : (
            <button
              onClick={handleStartOcr}
              disabled={isProcessing}
              className="w-full py-3 rounded-full bg-gradient-to-r from-[#D98218] to-[#C66A08] text-white font-bold text-sm shadow-md hover:shadow-lg disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <ScanText className="w-4 h-4" />
              <span>Perform OCR Recognition</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

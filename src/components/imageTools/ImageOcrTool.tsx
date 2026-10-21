import React, { useState } from 'react';
import { Upload, Download, RefreshCw, Check, AlertCircle, ScanText, Copy, Languages } from 'lucide-react';
import confetti from 'canvas-confetti';
import { createWorker } from 'tesseract.js';

export const ImageOcrTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [language, setLanguage] = useState<string>('eng');

  // OCR state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [statusText, setStatusText] = useState<string>('');
  const [extractedText, setExtractedText] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileSelect = (selected: File) => {
    if (!selected.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file.');
      return;
    }
    setFile(selected);
    setErrorMsg(null);
    setExtractedText('');
    setProgress(0);

    const url = URL.createObjectURL(selected);
    setPreviewUrl(url);
  };

  const handleRunOcr = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(5);
    setStatusText('Initializing OCR Engine...');
    setErrorMsg(null);

    let worker: any = null;
    try {
      worker = await createWorker(language, undefined, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            const pct = Math.round((m.progress || 0) * 80) + 15;
            setProgress(pct);
            setStatusText(`Recognizing text... ${Math.round((m.progress || 0) * 100)}%`);
          } else if (m.status === 'loading tesseract core') {
            setProgress(10);
            setStatusText('Loading OCR Core engine...');
          } else if (m.status === 'loading language traineddata') {
            setProgress(15);
            setStatusText(`Loading ${language.toUpperCase()} language model...`);
          }
        },
      });

      const ret = await worker.recognize(file);
      const text = ret.data.text || '';

      setProgress(100);
      setStatusText('Text recognized successfully!');
      setExtractedText(text);
      setIsProcessing(false);

      try {
        confetti({ particleCount: 40, spread: 60 });
      } catch {
        // ignore
      }
    } catch (err) {
      console.error('OCR Error:', err);
      setErrorMsg(err instanceof Error ? err.message : 'OCR failed to recognize text.');
      setIsProcessing(false);
    } finally {
      if (worker) {
        await worker.terminate();
      }
    }
  };

  const handleCopy = () => {
    if (!extractedText) return;
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!extractedText || !file) return;
    const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    a.download = `${baseName}_ocr.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  const wordCount = extractedText.trim() ? extractedText.trim().split(/\s+/).length : 0;
  const charCount = extractedText.length;

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
            <ScanText className="w-7 h-7" />
          </div>
          <span className="text-base font-bold text-[#102A43]">
            Select an image with text to extract
          </span>
          <span className="text-xs text-[#61758A] mt-1">
            Documents, receipts, invoices, screenshots, photos & signs
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
              <div className="w-12 h-12 rounded-xl bg-[#FAF5EC] border border-[#E9DCC8] overflow-hidden flex items-center justify-center shrink-0">
                {previewUrl && (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-[#102A43] truncate max-w-xs">{file.name}</h4>
                <span className="text-xs text-[#61758A]">{(file.size / 1024).toFixed(1)} KB</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-[#FAF5EC] px-3 py-1.5 rounded-xl border border-[#E9DCC8]">
                <Languages className="w-3.5 h-3.5 text-[#D98218]" />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  disabled={isProcessing}
                  className="text-xs font-bold text-[#102A43] bg-transparent focus:outline-none cursor-pointer"
                >
                  <option value="eng">English (eng)</option>
                  <option value="spa">Spanish (spa)</option>
                  <option value="fra">French (fra)</option>
                  <option value="deu">German (deu)</option>
                  <option value="por">Portuguese (por)</option>
                  <option value="ita">Italian (ita)</option>
                </select>
              </div>

              <button
                onClick={() => setFile(null)}
                className="text-xs font-semibold text-[#61758A] hover:text-red-600 px-2 cursor-pointer"
              >
                Change
              </button>
            </div>
          </div>

          {/* Progress Bar when processing */}
          {isProcessing && (
            <div className="p-4 bg-[#FFF3DF]/60 border border-[#F4A62A]/40 rounded-2xl space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-[#102A43]">
                <span>{statusText}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-[#E9DCC8]">
                <div
                  className="h-full bg-[#D98218] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action or Result */}
          {!extractedText ? (
            <button
              onClick={handleRunOcr}
              disabled={isProcessing}
              className="w-full py-3 rounded-full bg-[#D98218] hover:bg-[#C66A08] disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Extracting Optical Characters...</span>
                </>
              ) : (
                <span>Extract Text with OCR</span>
              )}
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#102A43]">
                  RECOGNIZED TEXT ({wordCount} words, {charCount} characters)
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="px-3 py-1.5 rounded-lg bg-white border border-[#E9DCC8] hover:border-[#D98218] text-xs font-bold text-[#102A43] flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy Text'}</span>
                  </button>
                  <button
                    onClick={handleDownloadTxt}
                    className="px-3.5 py-1.5 rounded-lg bg-[#D98218] hover:bg-[#C66A08] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .TXT</span>
                  </button>
                </div>
              </div>

              <textarea
                rows={8}
                value={extractedText}
                onChange={(e) => setExtractedText(e.target.value)}
                placeholder="Extracted text will appear here..."
                className="w-full p-4 rounded-xl border border-[#E9DCC8] bg-white text-sm text-[#102A43] leading-relaxed focus:outline-none focus:border-[#D98218]"
              />

              <button
                onClick={handleRunOcr}
                className="text-xs font-semibold text-[#D98218] hover:underline cursor-pointer"
              >
                Re-run OCR with different settings
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

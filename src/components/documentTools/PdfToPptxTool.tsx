import React, { useState, useRef } from 'react';
import {
  Presentation,
  Upload,
  ArrowRight,
  Download,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  MonitorPlay,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { processPdfToPptx } from '../../services/document/documentService';

export const PdfToPptxTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [resultFileName, setResultFileName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (!selected.name.toLowerCase().endsWith('.pdf')) {
        setError('Please select a valid PDF file (.pdf).');
        return;
      }
      setFile(selected);
      setError(null);
      setDownloadUrl(null);
      setProgress(0);
    }
  };

  const handleConvert = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    setProgress(10);

    try {
      const result = await processPdfToPptx(file, (pct) => setProgress(pct));
      const url = URL.createObjectURL(result.blob);
      setDownloadUrl(url);
      setResultFileName(result.fileName);
      setProgress(100);
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to convert PDF pages to PowerPoint presentation.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setDownloadUrl(null);
    setError(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-8">
      {/* Tool Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E9DCC8]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF3DF] text-[#D98218] text-xs font-bold uppercase tracking-wider mb-2 border border-[#F4A62A]/30">
            <Presentation className="w-3.5 h-3.5" />
            <span>Slide Deck Creator</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#102A43]">PDF to PPTX</h2>
          <p className="text-sm text-[#61758A] mt-1">
            Convert PDF pages into editable Microsoft PowerPoint (.pptx) presentation slides.
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
                <MonitorPlay className="w-9 h-9 stroke-[2.2]" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-[#102A43]">
                Drop your PDF file here
              </h3>
              <p className="text-sm text-[#61758A] mt-1.5 max-w-sm">
                or click to browse from your device. Each page is transformed into a 16:9 widescreen slide.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E9DCC8] shadow-sm space-y-6">
              <div className="flex items-center justify-between p-4 bg-[#FAF5EC] rounded-2xl border border-[#E9DCC8]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#FFF3DF] text-[#D98218] flex items-center justify-center shrink-0">
                    <FileCheck className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#102A43] truncate max-w-[200px] sm:max-w-xs">
                      {file.name}
                    </h4>
                    <p className="text-xs text-[#61758A]">
                      {(file.size / 1024).toFixed(1)} KB • PDF Document
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  className="text-xs font-semibold text-[#61758A] hover:text-[#D98218] transition-colors cursor-pointer px-3 py-1.5 rounded-lg hover:bg-white"
                >
                  Change File
                </button>
              </div>

              {isProcessing && (
                <div className="space-y-2 p-4 rounded-2xl bg-[#FAF5EC] border border-[#E9DCC8]">
                  <div className="flex justify-between text-xs font-bold text-[#102A43]">
                    <span>Converting Slides...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#E9DCC8] overflow-hidden">
                    <div
                      className="h-full bg-[#D98218] transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {downloadUrl ? (
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-emerald-900">PowerPoint Deck Ready!</h4>
                    <p className="text-xs text-emerald-700 mt-0.5">Slides converted to standard 16:9 widescreen presentation.</p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <a
                      href={downloadUrl}
                      download={resultFileName}
                      className="px-6 py-3 rounded-full bg-[#D98218] hover:bg-[#B76E13] text-white font-bold text-sm shadow-md transition-all flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download PPTX</span>
                    </a>
                    <button
                      onClick={handleReset}
                      className="px-5 py-3 rounded-full bg-white text-[#102A43] border border-[#E9DCC8] hover:border-[#D98218] font-bold text-sm transition-all"
                    >
                      Convert Another
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-2">
                  <button
                    onClick={handleConvert}
                    disabled={isProcessing}
                    className="w-full py-3.5 rounded-full bg-[#D98218] hover:bg-[#B76E13] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Rendering Slides to PPTX...</span>
                      </>
                    ) : (
                      <>
                        <span>Convert to PowerPoint (.pptx)</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Info Box */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-[#E9DCC8] shadow-sm space-y-4">
            <h4 className="text-sm font-extrabold text-[#102A43] uppercase tracking-wider">
              Tool Highlights
            </h4>
            <ul className="space-y-3 text-xs text-[#61758A]">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Renders high-resolution vector and graphic slide backgrounds for crisp projections.</span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#D98218] shrink-0 mt-0.5" />
                <span>Zero server uploads. Your slide decks are generated completely in your browser.</span>
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>Compatible with PowerPoint, Google Slides, and Apple Keynote.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

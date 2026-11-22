import React, { useState, useRef } from 'react';
import {
  Upload,
  Download,
  RefreshCw,
  Check,
  AlertCircle,
  FileText,
  Copy,
  Search,
  Eye,
  Sparkles,
  FileCode2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { pdfjsLib } from '../../services/pdf/pdfJsSetup';
import { clonePdfBuffer, fileToArrayBuffer } from '../../services/pdf/pdfLibUtils';
import { PdfDocumentReviewModal } from './PdfDocumentReviewModal';

interface PageTextResult {
  pageNumber: number;
  text: string;
  wordCount: number;
  charCount: number;
}

export const PdfToTextTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [statusText, setStatusText] = useState<string>('');
  const [pageResults, setPageResults] = useState<PageTextResult[]>([]);
  const [combinedText, setCombinedText] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pages'>('all');
  const [selectedPageNum, setSelectedPageNum] = useState<number>(1);
  const [includePageHeaders, setIncludePageHeaders] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Review Modal State
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  const handleFileSelect = async (selected: File) => {
    if (!selected.type.includes('pdf') && !selected.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg('Please upload a valid PDF document.');
      return;
    }

    setFile(selected);
    setErrorMsg(null);
    setPageResults([]);
    setCombinedText('');
    setProgress(0);

    try {
      const buf = await fileToArrayBuffer(selected);
      setFileBuffer(buf);

      const safeData = clonePdfBuffer(buf);
      const loadingTask = pdfjsLib.getDocument({ data: safeData });
      const pdf = await loadingTask.promise;
      setTotalPages(pdf.numPages);
    } catch (err) {
      console.error('PDF load error:', err);
      setErrorMsg('Could not read PDF metadata. Ensure file is not password-protected.');
    }
  };

  const handleExtractText = async () => {
    if (!file || !fileBuffer) return;
    setIsProcessing(true);
    setProgress(5);
    setStatusText('Loading PDF Document...');
    setErrorMsg(null);

    try {
      const safeData = clonePdfBuffer(fileBuffer);
      const loadingTask = pdfjsLib.getDocument({ data: safeData });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;

      const results: PageTextResult[] = [];
      const combinedChunks: string[] = [];

      for (let i = 1; i <= numPages; i++) {
        const pct = Math.round((i / numPages) * 90);
        setProgress(pct);
        setStatusText(`Extracting text from page ${i} of ${numPages}...`);

        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        // Sort items by vertical position (Y descending), then horizontal (X ascending)
        const items = textContent.items as Array<{
          str: string;
          transform: number[];
          hasEOL?: boolean;
        }>;

        let lastY: number | null = null;
        let pageStr = '';

        for (const item of items) {
          if (!item.str) continue;
          const currentY = item.transform[5];

          if (lastY !== null && Math.abs(currentY - lastY) > 8) {
            pageStr += '\n';
          } else if (pageStr.length > 0 && !pageStr.endsWith('\n') && !pageStr.endsWith(' ')) {
            pageStr += ' ';
          }

          pageStr += item.str;
          lastY = currentY;
        }

        const trimmed = pageStr.trim();
        const words = trimmed ? trimmed.split(/\s+/).length : 0;
        const chars = trimmed.length;

        results.push({
          pageNumber: i,
          text: trimmed,
          wordCount: words,
          charCount: chars,
        });

        if (includePageHeaders) {
          combinedChunks.push(`--- Page ${i} ---\n${trimmed}`);
        } else {
          combinedChunks.push(trimmed);
        }
      }

      setPageResults(results);
      setCombinedText(combinedChunks.join('\n\n'));
      setProgress(100);
      setStatusText('All pages extracted successfully!');
      setIsProcessing(false);

      try {
        confetti({ particleCount: 40, spread: 60 });
      } catch {
        // ignore
      }
    } catch (err) {
      console.error('Text extraction failed:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to extract text from PDF.');
      setIsProcessing(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!combinedText || !file) return;
    const blob = new Blob([combinedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    a.download = `${baseName}_extracted_text.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  const totalWords = pageResults.reduce((acc, p) => acc + p.wordCount, 0);
  const totalChars = pageResults.reduce((acc, p) => acc + p.charCount, 0);

  const filteredPages = searchQuery.trim()
    ? pageResults.filter((p) => p.text.toLowerCase().includes(searchQuery.toLowerCase()))
    : pageResults;

  const currentPage = pageResults.find((p) => p.pageNumber === selectedPageNum) || pageResults[0];

  return (
    <div className="space-y-6">
      {!file ? (
        <label className="border-2 border-dashed border-[#E9DCC8] hover:border-[#D98218] bg-[#FAF5EC]/60 hover:bg-[#FFF3DF]/40 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all">
          <input
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelect(e.target.files[0]);
              }
            }}
          />
          <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-[#E9DCC8] flex items-center justify-center text-[#D98218] mb-3">
            <FileText className="w-7 h-7" />
          </div>
          <span className="text-base font-bold text-[#102A43]">
            Select a PDF file to extract text
          </span>
          <span className="text-xs text-[#61758A] mt-1">
            Fast, client-side structured text stream extraction with exact page geometry preservation
          </span>
          <span className="mt-4 px-4 py-1.5 rounded-full bg-white border border-[#E9DCC8] text-xs font-bold text-[#102A43] shadow-sm">
            Browse PDF
          </span>
        </label>
      ) : (
        <div className="space-y-6">
          {/* Header Card with Review Document Button */}
          <div className="p-4 bg-white rounded-2xl border border-[#E9DCC8] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-[#102A43] truncate max-w-xs">{file.name}</span>
              <span className="text-xs text-[#61758A]">
                {totalPages} {totalPages === 1 ? 'page' : 'pages'} • {(file.size / 1024).toFixed(1)} KB
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsReviewOpen(true)}
                className="px-3.5 py-1.5 bg-[#FFF8EE] hover:bg-[#FFF3DF] text-[#D98218] border border-[#E9DCC8] hover:border-[#D98218] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Review Document</span>
              </button>
              <button
                onClick={() => {
                  setFile(null);
                  setFileBuffer(null);
                  setPageResults([]);
                  setCombinedText('');
                }}
                className="text-xs font-semibold text-[#61758A] hover:text-red-600 px-2 cursor-pointer"
              >
                Change File
              </button>
            </div>
          </div>

          {/* Options */}
          <div className="p-4 bg-[#FAF5EC] rounded-2xl border border-[#E9DCC8] flex flex-wrap items-center justify-between gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#102A43]">
              <input
                type="checkbox"
                checked={includePageHeaders}
                onChange={(e) => {
                  setIncludePageHeaders(e.target.checked);
                  if (pageResults.length > 0) {
                    const combined = pageResults
                      .map((p) => (e.target.checked ? `--- Page ${p.pageNumber} ---\n${p.text}` : p.text))
                      .join('\n\n');
                    setCombinedText(combined);
                  }
                }}
                className="rounded text-[#D98218] focus:ring-[#D98218] w-4 h-4 cursor-pointer"
              />
              <span>Include Page Header Dividers (e.g., --- Page 1 ---)</span>
            </label>
            <span className="text-xs text-[#61758A]">100% Client-Side Privacy</span>
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

          {/* Action or Result Workspace */}
          {pageResults.length === 0 ? (
            <button
              onClick={handleExtractText}
              disabled={isProcessing}
              className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#D98218] to-[#C66A08] text-white font-bold text-sm shadow-[0_4px_14px_rgba(217,130,24,0.35)] hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Extracting Document Text...</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  <span>Extract All Text from PDF ({totalPages} Pages)</span>
                </>
              )}
            </button>
          ) : (
            <div className="space-y-4">
              {/* Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-white rounded-2xl border border-[#E9DCC8] shadow-xs text-center">
                  <span className="text-[11px] text-[#61758A] block">TOTAL WORDS</span>
                  <span className="text-base font-extrabold text-[#102A43]">{totalWords.toLocaleString()}</span>
                </div>
                <div className="p-3 bg-white rounded-2xl border border-[#E9DCC8] shadow-xs text-center">
                  <span className="text-[11px] text-[#61758A] block">CHARACTERS</span>
                  <span className="text-base font-extrabold text-[#102A43]">{totalChars.toLocaleString()}</span>
                </div>
                <div className="p-3 bg-white rounded-2xl border border-[#E9DCC8] shadow-xs text-center">
                  <span className="text-[11px] text-[#61758A] block">TOTAL PAGES</span>
                  <span className="text-base font-extrabold text-[#102A43]">{totalPages}</span>
                </div>
                <div className="p-3 bg-white rounded-2xl border border-[#E9DCC8] shadow-xs text-center">
                  <span className="text-[11px] text-[#61758A] block">STATUS</span>
                  <span className="text-base font-extrabold text-emerald-600">Extracted</span>
                </div>
              </div>

              {/* View Switcher & Action Toolbar */}
              <div className="p-4 bg-white rounded-2xl border border-[#E9DCC8] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('all')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'all'
                        ? 'bg-[#D98218] text-white shadow-sm'
                        : 'bg-[#FAF5EC] text-[#102A43] hover:bg-[#FFF3DF]'
                    }`}
                  >
                    All Pages Combined
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('pages')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'pages'
                        ? 'bg-[#D98218] text-white shadow-sm'
                        : 'bg-[#FAF5EC] text-[#102A43] hover:bg-[#FFF3DF]'
                    }`}
                  >
                    Page-by-Page
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(activeTab === 'all' ? combinedText : (currentPage?.text || ''))}
                    className="px-3.5 py-1.5 rounded-xl bg-white border border-[#E9DCC8] hover:border-[#D98218] text-xs font-bold text-[#102A43] flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : activeTab === 'all' ? 'Copy All Text' : 'Copy Page Text'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadTxt}
                    className="px-4 py-1.5 rounded-xl bg-[#D98218] hover:bg-[#C66A08] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .TXT</span>
                  </button>
                </div>
              </div>

              {/* Text View */}
              {activeTab === 'all' ? (
                <div className="space-y-2">
                  <textarea
                    rows={14}
                    value={combinedText}
                    onChange={(e) => setCombinedText(e.target.value)}
                    className="w-full p-4 rounded-2xl border border-[#E9DCC8] bg-white font-sans text-sm text-[#102A43] leading-relaxed focus:outline-none focus:border-[#D98218] shadow-inner"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Page Selector Tabs */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
                    {pageResults.map((p) => (
                      <button
                        key={p.pageNumber}
                        type="button"
                        onClick={() => setSelectedPageNum(p.pageNumber)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                          selectedPageNum === p.pageNumber
                            ? 'bg-[#D98218] text-white shadow-xs'
                            : 'bg-white border border-[#E9DCC8] text-[#102A43] hover:bg-[#FAF5EC]'
                        }`}
                      >
                        Page {p.pageNumber} ({p.wordCount} words)
                      </button>
                    ))}
                  </div>

                  {currentPage && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-[#61758A]">
                        <span>PAGE {currentPage.pageNumber} OF {totalPages}</span>
                        <span>{currentPage.wordCount} words • {currentPage.charCount} chars</span>
                      </div>
                      <textarea
                        rows={12}
                        value={currentPage.text}
                        onChange={(e) => {
                          const updated = e.target.value;
                          setPageResults((prev) =>
                            prev.map((p) =>
                              p.pageNumber === currentPage.pageNumber
                                ? { ...p, text: updated, wordCount: updated.split(/\s+/).length, charCount: updated.length }
                                : p
                            )
                          );
                        }}
                        className="w-full p-4 rounded-2xl border border-[#E9DCC8] bg-white font-sans text-sm text-[#102A43] leading-relaxed focus:outline-none focus:border-[#D98218] shadow-inner"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Full PDF Document Review Modal */}
      {isReviewOpen && file && (
        <PdfDocumentReviewModal
          file={file}
          onClose={() => setIsReviewOpen(false)}
          title={`${file.name} (Document Review)`}
        />
      )}
    </div>
  );
};

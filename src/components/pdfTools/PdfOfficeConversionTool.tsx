import React, { useState } from 'react';
import {
  Upload,
  Download,
  Check,
  AlertCircle,
  RefreshCw,
  FileText,
  Sparkles,
  Eye,
  FileSpreadsheet,
  Presentation,
  ShieldCheck,
  Layers,
  Table,
  Type,
  Loader2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  convertPdfToWord,
  convertPdfToExcel,
  convertPdfToPowerPoint,
  convertWordToPdf,
  convertExcelToPdf,
  convertPowerPointToPdf,
  analyzeDocumentForConversion,
  DocumentAnalysisResult,
} from '../../services/pdf/officeConversionService';
import { fileToArrayBuffer } from '../../services/pdf/pdfLibUtils';
import { PdfDocumentReviewModal } from './PdfDocumentReviewModal';

interface PdfOfficeConversionToolProps {
  toolId:
    | 'pdf-to-word'
    | 'pdf-to-excel'
    | 'pdf-to-powerpoint'
    | 'word-to-pdf'
    | 'excel-to-pdf'
    | 'powerpoint-to-pdf';
}

export const PdfOfficeConversionTool: React.FC<PdfOfficeConversionToolProps> = ({
  toolId,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<DocumentAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultFileName, setResultFileName] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Review modal state
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewData, setReviewData] = useState<{
    file?: File | null;
    blob?: Blob | null;
    title: string;
    initialPage?: number;
  } | null>(null);

  const isPdfInput =
    toolId === 'pdf-to-word' || toolId === 'pdf-to-excel' || toolId === 'pdf-to-powerpoint';
  const isPdfOutput =
    toolId === 'word-to-pdf' || toolId === 'excel-to-pdf' || toolId === 'powerpoint-to-pdf';

  const getToolConfig = () => {
    switch (toolId) {
      case 'pdf-to-word':
        return {
          accept: '.pdf,application/pdf',
          expectedInput: 'PDF Document',
          outputExt: 'docx',
          actionText: 'Convert PDF to Word (.docx)',
          icon: <FileText className="w-5 h-5 text-blue-600" />,
          targetFormat: 'Microsoft Word Document (.docx)',
          colorTheme: 'blue',
        };
      case 'pdf-to-excel':
        return {
          accept: '.pdf,application/pdf',
          expectedInput: 'PDF Document',
          outputExt: 'xlsx',
          actionText: 'Convert PDF to Excel (.xlsx)',
          icon: <FileSpreadsheet className="w-5 h-5 text-emerald-600" />,
          targetFormat: 'Microsoft Excel Spreadsheet (.xlsx)',
          colorTheme: 'emerald',
        };
      case 'pdf-to-powerpoint':
        return {
          accept: '.pdf,application/pdf',
          expectedInput: 'PDF Document',
          outputExt: 'pptx',
          actionText: 'Convert PDF to PowerPoint (.pptx)',
          icon: <Presentation className="w-5 h-5 text-orange-600" />,
          targetFormat: 'Microsoft PowerPoint Presentation (.pptx)',
          colorTheme: 'orange',
        };
      case 'word-to-pdf':
        return {
          accept: '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          expectedInput: 'Word Document (.docx)',
          outputExt: 'pdf',
          actionText: 'Convert Word to PDF',
          icon: <FileText className="w-5 h-5 text-blue-600" />,
          targetFormat: 'Standard Adobe PDF Document (.pdf)',
          colorTheme: 'blue',
        };
      case 'excel-to-pdf':
        return {
          accept: '.xlsx,.xls,.csv',
          expectedInput: 'Excel Spreadsheet (.xlsx, .xls, .csv)',
          outputExt: 'pdf',
          actionText: 'Convert Excel to PDF',
          icon: <FileSpreadsheet className="w-5 h-5 text-emerald-600" />,
          targetFormat: 'Standard Landscape PDF Table (.pdf)',
          colorTheme: 'emerald',
        };
      case 'powerpoint-to-pdf':
        return {
          accept: '.pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation',
          expectedInput: 'PowerPoint (.pptx)',
          outputExt: 'pdf',
          actionText: 'Convert PowerPoint to PDF',
          icon: <Presentation className="w-5 h-5 text-orange-600" />,
          targetFormat: 'Standard 16:9 PDF Presentation (.pdf)',
          colorTheme: 'orange',
        };
    }
  };

  const config = getToolConfig();

  const handleFileChange = async (selected: File | null) => {
    if (!selected) return;
    setFile(selected);
    setResultBlob(null);
    setErrorMsg(null);
    setAnalysis(null);
    setIsAnalyzing(true);

    try {
      const buf = await fileToArrayBuffer(selected);
      const docAnalysis = await analyzeDocumentForConversion(buf, toolId);
      setAnalysis(docAnalysis);
      setIsAnalyzing(false);
    } catch {
      setIsAnalyzing(false);
    }
  };

  const handleConvert = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(15);
    setErrorMsg(null);

    try {
      const buf = await fileToArrayBuffer(file);
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      let outputBlob: Blob;

      switch (toolId) {
        case 'pdf-to-word':
          setProgress(40);
          outputBlob = await convertPdfToWord(buf, file.name);
          break;
        case 'pdf-to-excel':
          setProgress(50);
          outputBlob = await convertPdfToExcel(buf);
          break;
        case 'pdf-to-powerpoint':
          outputBlob = await convertPdfToPowerPoint(buf, (pct) => setProgress(pct));
          break;
        case 'word-to-pdf':
          setProgress(50);
          outputBlob = await convertWordToPdf(buf);
          break;
        case 'excel-to-pdf':
          setProgress(50);
          outputBlob = await convertExcelToPdf(buf);
          break;
        case 'powerpoint-to-pdf':
          setProgress(50);
          outputBlob = await convertPowerPointToPdf(buf);
          break;
      }

      setResultBlob(outputBlob);
      setResultFileName(`${baseName}.${config.outputExt}`);
      setProgress(100);
      setIsProcessing(false);
      try {
        confetti({ particleCount: 40, spread: 60 });
      } catch {
        // ignore
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error converting document.');
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = resultFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  // Open review modal for input PDF
  const openInputPdfReview = () => {
    if (!file) return;
    setReviewData({
      file,
      title: `${file.name} (Source Document Review)`,
      initialPage: 1,
    });
    setIsReviewOpen(true);
  };

  // Open review modal for output PDF
  const openOutputPdfReview = () => {
    if (!resultBlob) return;
    setReviewData({
      blob: resultBlob,
      title: `${resultFileName} (Converted PDF Output Review)`,
      initialPage: 1,
    });
    setIsReviewOpen(true);
  };

  return (
    <div className="space-y-5">
      {!file ? (
        <label className="border-2 border-dashed border-[#E9DCC8] hover:border-[#D98218] bg-[#FAF5EC]/60 hover:bg-[#FFF3DF]/40 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all">
          <input
            type="file"
            accept={config.accept}
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileChange(e.target.files[0]);
              }
            }}
          />
          <div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-[#E9DCC8] flex items-center justify-center text-[#D98218] mb-2">
            <Upload className="w-6 h-6" />
          </div>
          <span className="text-sm font-bold text-[#102A43]">
            Select {config.expectedInput}
          </span>
          <span className="text-xs text-[#61758A] mt-0.5">
            Automatic deep document analysis & high-fidelity conversion
          </span>
        </label>
      ) : (
        <div className="space-y-4">
          {/* File Card & Actions */}
          <div className="p-3.5 bg-white rounded-xl border border-[#E9DCC8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3 truncate">
              <div className="w-9 h-9 rounded-xl bg-[#FFF3DF] text-[#D98218] flex items-center justify-center shrink-0 border border-[#E9DCC8]">
                {config.icon}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-[#102A43] truncate">{file.name}</p>
                <p className="text-[11px] text-[#61758A] mt-0.5">
                  {(file.size / 1024).toFixed(1)} KB · {config.expectedInput}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isPdfInput && (
                <button
                  type="button"
                  onClick={openInputPdfReview}
                  className="px-3 py-1.5 bg-[#FFF8EE] hover:bg-[#FFF3DF] text-[#D98218] border border-[#E9DCC8] hover:border-[#D98218] rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  title="Review input document pages"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Review Document</span>
                </button>
              )}
              <button
                onClick={() => {
                  setFile(null);
                  setResultBlob(null);
                  setAnalysis(null);
                }}
                className="text-xs text-[#61758A] hover:text-[#D98218] font-semibold px-2 py-1 cursor-pointer"
              >
                Change
              </button>
            </div>
          </div>

          {/* Deep Document Pre-Conversion Analysis */}
          {isAnalyzing ? (
            <div className="p-4 bg-white rounded-xl border border-[#E9DCC8] flex items-center gap-3 text-xs text-[#102A43]">
              <Loader2 className="w-5 h-5 animate-spin text-[#D98218]" />
              <span>Analyzing document structure, word density & layout...</span>
            </div>
          ) : analysis ? (
            <div className="p-4 bg-white rounded-xl border border-[#E9DCC8] space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#102A43]">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Pre-Conversion Analysis & Conversion Plan:</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  {analysis.readinessScore}% Quality Readiness
                </span>
              </div>

              {/* Analysis Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-[#FAF5EC]/70 border border-[#E9DCC8]">
                  <span className="text-[10px] text-[#61758A] font-semibold block capitalize">
                    Total {analysis.itemType}
                  </span>
                  <span className="font-bold text-[#102A43] text-sm">
                    {analysis.totalPagesOrItems}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#FAF5EC]/70 border border-[#E9DCC8]">
                  <span className="text-[10px] text-[#61758A] font-semibold block">Total Words</span>
                  <span className="font-bold text-[#102A43] text-sm font-mono">
                    {analysis.totalWords.toLocaleString()}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#FAF5EC]/70 border border-[#E9DCC8]">
                  <span className="text-[10px] text-[#61758A] font-semibold block">Structure</span>
                  <span className="font-bold text-[#102A43] text-sm">
                    {analysis.detectedTables > 0
                      ? `${analysis.detectedTables} Tables`
                      : analysis.detectedHeadings > 0
                      ? `${analysis.detectedHeadings} Headings`
                      : 'Text Flow'}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#FAF5EC]/70 border border-[#E9DCC8]">
                  <span className="text-[10px] text-[#61758A] font-semibold block">Target Format</span>
                  <span className="font-bold text-[#D98218] text-xs font-mono uppercase">
                    .{config.outputExt}
                  </span>
                </div>
              </div>

              {/* Summary note & fidelity plan */}
              <div className="p-2.5 bg-[#FAF5EC]/50 rounded-lg border border-[#E9DCC8]/70 text-[11px] space-y-1.5">
                <p className="font-bold text-[#102A43]">{analysis.summary}</p>
                <div className="space-y-0.5">
                  {analysis.fidelityPlan.map((planItem, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[#61758A]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D98218] shrink-0" />
                      <span>{planItem}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isProcessing ? (
            <div className="p-4 bg-white rounded-xl border border-[#E9DCC8] space-y-2">
              <div className="flex justify-between text-xs font-bold text-[#102A43]">
                <span>Converting document into {config.targetFormat}...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-2 bg-[#FAF5EC] rounded-full overflow-hidden">
                <div
                  style={{ width: `${progress}%` }}
                  className="h-full bg-gradient-to-r from-[#D98218] to-[#C66A08] transition-all"
                />
              </div>
            </div>
          ) : resultBlob ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-900">Conversion Successful!</h4>
                  <span className="text-[11px] text-emerald-700 font-medium">
                    {resultFileName} ({(resultBlob.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isPdfOutput && (
                  <button
                    type="button"
                    onClick={openOutputPdfReview}
                    className="px-3.5 py-2 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold rounded-full shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Review converted PDF before downloading"
                  >
                    <Eye className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Review Converted PDF</span>
                  </button>
                )}
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-[#D98218] hover:bg-[#C66A08] text-white text-xs font-bold rounded-full shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download File</span>
                </button>
                <button
                  onClick={() => setResultBlob(null)}
                  className="p-2 bg-white border border-[#E9DCC8] rounded-full text-[#102A43] hover:bg-gray-50 cursor-pointer"
                  title="Convert again"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleConvert}
              disabled={isAnalyzing}
              className="w-full py-3 rounded-full bg-gradient-to-r from-[#D98218] to-[#C66A08] text-white font-bold text-sm shadow-md hover:shadow-lg disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{config.actionText}</span>
            </button>
          )}
        </div>
      )}

      {/* Full Document Review Modal */}
      {isReviewOpen && reviewData && (
        <PdfDocumentReviewModal
          file={reviewData.file}
          blob={reviewData.blob}
          title={reviewData.title}
          initialPage={reviewData.initialPage}
          onClose={() => setIsReviewOpen(false)}
        />
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { Upload, Download, Check, AlertCircle, RefreshCw, FileText, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  convertPdfToWord,
  convertPdfToExcel,
  convertPdfToPowerPoint,
  convertWordToPdf,
  convertExcelToPdf,
  convertPowerPointToPdf,
} from '../../services/pdf/officeConversionService';
import { fileToArrayBuffer } from '../../services/pdf/pdfLibUtils';

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultFileName, setResultFileName] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Determine accepted file extension and output details based on toolId
  const getToolConfig = () => {
    switch (toolId) {
      case 'pdf-to-word':
        return {
          accept: '.pdf,application/pdf',
          expectedInput: 'PDF Document',
          outputExt: 'docx',
          outputMime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          actionText: 'Convert PDF to Word (.docx)',
          notice: 'Generates an editable DOCX file with headings, paragraphs, and structured text.',
        };
      case 'pdf-to-excel':
        return {
          accept: '.pdf,application/pdf',
          expectedInput: 'PDF Document',
          outputExt: 'xlsx',
          outputMime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          actionText: 'Convert PDF to Excel (.xlsx)',
          notice: 'Extracts detected tables and text rows into genuine Excel worksheets.',
        };
      case 'pdf-to-powerpoint':
        return {
          accept: '.pdf,application/pdf',
          expectedInput: 'PDF Document',
          outputExt: 'pptx',
          outputMime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          actionText: 'Convert PDF to PowerPoint (.pptx)',
          notice: 'Creates presentation slides with high-fidelity page rendering and extracted text.',
        };
      case 'word-to-pdf':
        return {
          accept: '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          expectedInput: 'Word Document (.docx)',
          outputExt: 'pdf',
          outputMime: 'application/pdf',
          actionText: 'Convert Word to PDF',
          notice: 'Parses text, headings, and formatting into a high-quality multi-page PDF.',
        };
      case 'excel-to-pdf':
        return {
          accept: '.xlsx,.xls,.csv',
          expectedInput: 'Excel Spreadsheet (.xlsx, .xls, .csv)',
          outputExt: 'pdf',
          outputMime: 'application/pdf',
          actionText: 'Convert Excel to PDF',
          notice: 'Renders worksheet tables and cell data into a clean, formatted PDF table.',
        };
      case 'powerpoint-to-pdf':
        return {
          accept: '.pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation',
          expectedInput: 'PowerPoint (.pptx)',
          outputExt: 'pdf',
          outputMime: 'application/pdf',
          actionText: 'Convert PowerPoint to PDF',
          notice: 'Converts presentation slides with bullet points and slide layout into a PDF presentation.',
        };
    }
  };

  const config = getToolConfig();

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
                setFile(e.target.files[0]);
                setResultBlob(null);
                setErrorMsg(null);
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
            Real file transformation with genuine format output
          </span>
        </label>
      ) : (
        <div className="space-y-4">
          <div className="p-3 bg-white rounded-xl border border-[#E9DCC8] flex items-center justify-between">
            <div className="flex items-center gap-3 truncate">
              <div className="w-8 h-8 rounded-lg bg-[#FFF3DF] text-[#D98218] flex items-center justify-center font-bold text-xs shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-[#102A43] truncate">{file.name}</p>
                <p className="text-[11px] text-[#61758A]">
                  {(file.size / 1024).toFixed(1)} KB · Ready to convert
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setResultBlob(null);
              }}
              className="text-xs text-[#61758A] hover:text-[#D98218] font-semibold cursor-pointer shrink-0"
            >
              Change
            </button>
          </div>

          <div className="p-3 bg-[#FAF5EC] rounded-xl border border-[#E9DCC8] text-xs space-y-1">
            <span className="font-bold text-[#102A43] block">ENGINE SPECIFICATION:</span>
            <p className="text-[#61758A] leading-relaxed">{config.notice}</p>
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
                <span>Processing conversion...</span>
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
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-900">Conversion Completed!</h4>
                  <span className="text-[11px] text-emerald-700">
                    {resultFileName} ({(resultBlob.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-[#D98218] hover:bg-[#C66A08] text-white text-xs font-bold rounded-full shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download File</span>
                </button>
                <button
                  onClick={() => setResultBlob(null)}
                  className="p-2 bg-white border border-[#E9DCC8] rounded-full text-[#102A43] cursor-pointer"
                  title="Convert again"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleConvert}
              className="w-full py-3 rounded-full bg-gradient-to-r from-[#D98218] to-[#C66A08] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{config.actionText}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

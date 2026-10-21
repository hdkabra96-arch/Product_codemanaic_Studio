import React, { useState } from 'react';
import { Upload, Download, Check, AlertCircle, RefreshCw, Tag } from 'lucide-react';
import confetti from 'canvas-confetti';
import { readPdfMetadata, updatePdfMetadata, PdfMetadata } from '../../services/pdf/securityMetadataService';
import { fileToArrayBuffer } from '../../services/pdf/pdfLibUtils';

export const PdfMetadataEditorTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<PdfMetadata>({
    title: '',
    author: '',
    subject: '',
    keywords: '',
    creator: 'Codemaniac Studio',
    producer: 'Codemaniac Studio Metadata Engine',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileSelected = async (selected: File | null) => {
    if (!selected) return;
    setErrorMsg(null);
    setResultBlob(null);
    setFile(selected);

    try {
      const buf = await fileToArrayBuffer(selected);
      const meta = await readPdfMetadata(buf);
      setMetadata({
        title: meta.title || selected.name.replace(/\.[^/.]+$/, ''),
        author: meta.author || '',
        subject: meta.subject || '',
        keywords: meta.keywords || '',
        creator: meta.creator || 'Codemaniac Studio',
        producer: meta.producer || 'Codemaniac Studio PDF Engine',
        creationDate: meta.creationDate,
        modificationDate: meta.modificationDate,
      });
    } catch {
      setErrorMsg('Could not read document metadata.');
    }
  };

  const handleSave = async () => {
    if (!file) return;
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const buf = await fileToArrayBuffer(file);
      const bytes = await updatePdfMetadata(buf, metadata);
      const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      setResultBlob(blob);
      setIsProcessing(false);
      try {
        confetti({ particleCount: 35, spread: 55 });
      } catch {
        // ignore
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error updating PDF metadata.');
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultBlob || !file) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    a.download = `${baseName}_metadata_updated.pdf`;
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
            onChange={(e) => handleFileSelected(e.target.files?.[0] || null)}
          />
          <div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-[#E9DCC8] flex items-center justify-center text-[#D98218] mb-2">
            <Tag className="w-6 h-6" />
          </div>
          <span className="text-sm font-bold text-[#102A43]">Select PDF to edit metadata</span>
          <span className="text-xs text-[#61758A] mt-0.5">
            View and modify Title, Author, Subject, Keywords and properties
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
                setResultBlob(null);
              }}
              className="text-[#61758A] hover:text-[#D98218] font-semibold cursor-pointer"
            >
              Change
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-bold text-[#102A43] block mb-1">DOCUMENT TITLE:</label>
              <input
                type="text"
                value={metadata.title}
                onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                className="w-full p-2 bg-white border border-[#E9DCC8] rounded-xl text-xs text-[#102A43]"
              />
            </div>

            <div>
              <label className="font-bold text-[#102A43] block mb-1">AUTHOR / CREATOR:</label>
              <input
                type="text"
                value={metadata.author}
                onChange={(e) => setMetadata({ ...metadata, author: e.target.value })}
                placeholder="Author name or organization..."
                className="w-full p-2 bg-white border border-[#E9DCC8] rounded-xl text-xs text-[#102A43]"
              />
            </div>

            <div>
              <label className="font-bold text-[#102A43] block mb-1">SUBJECT / TOPIC:</label>
              <input
                type="text"
                value={metadata.subject}
                onChange={(e) => setMetadata({ ...metadata, subject: e.target.value })}
                placeholder="Document subject..."
                className="w-full p-2 bg-white border border-[#E9DCC8] rounded-xl text-xs text-[#102A43]"
              />
            </div>

            <div>
              <label className="font-bold text-[#102A43] block mb-1">KEYWORDS (COMMA-SEPARATED):</label>
              <input
                type="text"
                value={metadata.keywords}
                onChange={(e) => setMetadata({ ...metadata, keywords: e.target.value })}
                placeholder="report, 2026, codemaniac..."
                className="w-full p-2 bg-white border border-[#E9DCC8] rounded-xl text-xs text-[#102A43]"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {resultBlob ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-900">Metadata Updated!</h4>
                  <span className="text-[11px] text-emerald-700">
                    {(resultBlob.size / 1024).toFixed(1)} KB · Ready to save
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-[#D98218] hover:bg-[#C66A08] text-white text-xs font-bold rounded-full shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={() => setResultBlob(null)}
                  className="p-2 bg-white border border-[#E9DCC8] rounded-full text-[#102A43] cursor-pointer"
                  title="Edit again"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleSave}
              disabled={isProcessing}
              className="w-full py-3 rounded-full bg-gradient-to-r from-[#D98218] to-[#C66A08] text-white font-bold text-sm shadow-md hover:shadow-lg disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Tag className="w-4 h-4" />
              <span>{isProcessing ? 'Updating Metadata...' : 'Save Updated Metadata'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

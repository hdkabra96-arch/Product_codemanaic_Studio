import React, { useState, useRef } from 'react';
import {
  Info,
  Upload,
  Download,
  Copy,
  Check,
  FileText,
  Calendar,
  User,
  Tag,
  ShieldCheck,
  RefreshCw,
  Layers,
  FileCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { readDocumentProperties, DocumentMetadata } from '../../services/document/documentService';

export const DocumentMetadataViewerTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<DocumentMetadata | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setError(null);
      setIsReading(true);

      try {
        const meta = await readDocumentProperties(selected);
        setMetadata(meta);
        confetti({ particleCount: 50, spread: 55, origin: { y: 0.6 } });
      } catch (err: any) {
        console.error(err);
        setError(err?.message || 'Could not parse document properties.');
      } finally {
        setIsReading(false);
      }
    }
  };

  const handleCopyJson = () => {
    if (!metadata) return;
    navigator.clipboard.writeText(JSON.stringify(metadata, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadReport = () => {
    if (!metadata) return;
    const blob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${metadata.fileName}_metadata.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setFile(null);
    setMetadata(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-8">
      {/* Tool Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E9DCC8]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF3DF] text-[#D98218] text-xs font-bold uppercase tracking-wider mb-2 border border-[#F4A62A]/30">
            <Info className="w-3.5 h-3.5" />
            <span>Document Inspector</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#102A43]">Metadata Viewer</h2>
          <p className="text-sm text-[#61758A] mt-1">
            View document properties, creation dates, author, and internal metadata securely without uploading to any server.
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
                accept=".pdf,.docx,.xlsx,.pptx,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-18 h-18 rounded-3xl bg-[#FFF3DF] text-[#D98218] flex items-center justify-center mb-4 shadow-sm">
                <Info className="w-9 h-9 stroke-[2.2]" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-[#102A43]">
                Drop any document here to view metadata
              </h3>
              <p className="text-sm text-[#61758A] mt-2 max-w-md">
                Supports PDF, Word (.docx), Excel (.xlsx), PowerPoint (.pptx), and text files. All metadata stays 100% on your device.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#D98218] text-white font-bold text-sm shadow-md hover:bg-[#B86B0E] transition-all">
                <Upload className="w-4 h-4" />
                <span>Select Document</span>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* File Info Bar */}
              <div className="bg-white rounded-2xl p-5 border border-[#E9DCC8] flex items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-[#FFF3DF] text-[#D98218] flex items-center justify-center shrink-0">
                    <FileCheck className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-[#102A43] truncate">{file.name}</h4>
                    <p className="text-xs text-[#61758A] mt-0.5">
                      {formatFileSize(file.size)} • {file.type || 'Document'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleReset}
                  className="px-4 py-2 rounded-xl border border-[#E9DCC8] text-xs font-bold text-[#61758A] hover:text-[#102A43] hover:border-[#D98218] transition-all flex items-center gap-1.5 shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Choose Another</span>
                </button>
              </div>

              {isReading && (
                <div className="bg-white rounded-3xl p-12 border border-[#E9DCC8] text-center">
                  <RefreshCw className="w-8 h-8 text-[#D98218] animate-spin mx-auto mb-3" />
                  <p className="font-bold text-[#102A43]">Reading Document Metadata...</p>
                  <p className="text-xs text-[#61758A] mt-1">Analyzing internal headers and XML streams</p>
                </div>
              )}

              {/* Metadata Display Cards */}
              {metadata && (
                <div className="space-y-4">
                  <div className="bg-white rounded-3xl p-6 border border-[#E9DCC8] shadow-sm space-y-6">
                    <div className="flex items-center justify-between border-b border-[#E9DCC8] pb-4">
                      <h4 className="text-base font-bold text-[#102A43] flex items-center gap-2">
                        <Info className="w-4 h-4 text-[#D98218]" />
                        Document Properties
                      </h4>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleCopyJson}
                          className="px-3 py-1.5 rounded-xl bg-[#FAF5EC] border border-[#E9DCC8] text-xs font-semibold text-[#102A43] hover:border-[#D98218] flex items-center gap-1.5 transition-all"
                        >
                          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#D98218]" />}
                          <span>{copied ? 'Copied' : 'Copy JSON'}</span>
                        </button>
                        <button
                          onClick={handleDownloadReport}
                          className="px-3 py-1.5 rounded-xl bg-[#D98218] text-white text-xs font-semibold hover:bg-[#B86B0E] flex items-center gap-1.5 transition-all shadow-sm"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Export Report</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-[#FAF5EC] border border-[#E9DCC8]/60 space-y-1">
                        <span className="text-xs font-medium text-[#61758A] flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-[#D98218]" /> Document Title
                        </span>
                        <p className="text-sm font-bold text-[#102A43] break-words">
                          {metadata.title || 'Not specified'}
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-[#FAF5EC] border border-[#E9DCC8]/60 space-y-1">
                        <span className="text-xs font-medium text-[#61758A] flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[#D98218]" /> Author / Creator
                        </span>
                        <p className="text-sm font-bold text-[#102A43] break-words">
                          {metadata.author || 'Unknown'}
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-[#FAF5EC] border border-[#E9DCC8]/60 space-y-1">
                        <span className="text-xs font-medium text-[#61758A] flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-[#D98218]" /> Subject / Category
                        </span>
                        <p className="text-sm font-bold text-[#102A43] break-words">
                          {metadata.subject || 'Not specified'}
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-[#FAF5EC] border border-[#E9DCC8]/60 space-y-1">
                        <span className="text-xs font-medium text-[#61758A] flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-[#D98218]" /> Pages / Slides
                        </span>
                        <p className="text-sm font-bold text-[#102A43]">
                          {metadata.pageCount !== undefined ? `${metadata.pageCount} pages` : 'N/A'}
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-[#FAF5EC] border border-[#E9DCC8]/60 space-y-1">
                        <span className="text-xs font-medium text-[#61758A] flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#D98218]" /> Created Date
                        </span>
                        <p className="text-sm font-bold text-[#102A43] break-words">
                          {metadata.creationDate || 'Unknown'}
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-[#FAF5EC] border border-[#E9DCC8]/60 space-y-1">
                        <span className="text-xs font-medium text-[#61758A] flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#D98218]" /> Last Modified Date
                        </span>
                        <p className="text-sm font-bold text-[#102A43] break-words">
                          {metadata.modificationDate || 'Unknown'}
                        </p>
                      </div>
                    </div>

                    {/* Producer & Engine */}
                    <div className="p-4 rounded-2xl bg-white border border-[#E9DCC8] space-y-2">
                      <span className="text-xs font-semibold text-[#61758A] uppercase tracking-wider">
                        Producer / Software Engine
                      </span>
                      <p className="text-xs font-mono text-[#102A43] bg-[#FAF5EC] p-2.5 rounded-xl border border-[#E9DCC8]/60">
                        {metadata.producer || metadata.creator || 'Standard Office / PDF Producer'}
                      </p>
                    </div>

                    {/* Keywords Tag List */}
                    {metadata.keywords && metadata.keywords.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-xs font-semibold text-[#61758A] uppercase tracking-wider">
                          Keywords & Tags
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {metadata.keywords.filter(Boolean).map((kw, i) => (
                            <span
                              key={i}
                              className="px-2.5 py-1 rounded-lg bg-[#FFF3DF] text-[#D98218] text-xs font-semibold border border-[#F4A62A]/30"
                            >
                              {kw.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3">
              <Info className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-[#E9DCC8] shadow-sm space-y-5">
            <h4 className="font-bold text-[#102A43] text-base">Metadata Viewer Highlights</h4>
            <ul className="space-y-3 text-xs text-[#61758A]">
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#D98218] shrink-0 mt-0.5" />
                <span>Reads hidden author details, revision dates, and software generators</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#D98218] shrink-0 mt-0.5" />
                <span>Supports PDF, DOCX, XLSX, and PPTX formats</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#D98218] shrink-0 mt-0.5" />
                <span>Export properties as JSON or copy to clipboard</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#D98218] shrink-0 mt-0.5" />
                <span>Client-side only — your sensitive documents never touch a cloud server</span>
              </li>
            </ul>

            <div className="pt-4 border-t border-[#E9DCC8]">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>100% Private & In-Browser</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

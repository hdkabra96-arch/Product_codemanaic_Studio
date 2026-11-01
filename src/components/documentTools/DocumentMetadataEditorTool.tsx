import React, { useState, useRef } from 'react';
import {
  Edit3,
  Upload,
  Download,
  FileCheck,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Tag,
  Briefcase,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  readDocumentProperties,
  updateDocumentProperties,
  DocumentMetadata,
} from '../../services/document/documentService';

export const DocumentMetadataEditorTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<DocumentMetadata | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFileName, setDownloadFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [subject, setSubject] = useState('');
  const [keywords, setKeywords] = useState('');
  const [creator, setCreator] = useState('');

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
      const ext = selected.name.split('.').pop()?.toLowerCase();
      if (!['pdf', 'docx', 'xlsx', 'pptx'].includes(ext || '')) {
        setError('Please select a supported document: PDF, Word (.docx), Excel (.xlsx), or PowerPoint (.pptx).');
        return;
      }

      setFile(selected);
      setError(null);
      setDownloadUrl(null);
      setIsReading(true);

      try {
        const meta = await readDocumentProperties(selected);
        setMetadata(meta);
        setTitle(meta.title || '');
        setAuthor(meta.author || '');
        setSubject(meta.subject || '');
        setKeywords((meta.keywords || []).join(', '));
        setCreator(meta.creator || '');
      } catch (err: any) {
        console.error(err);
        setError(err?.message || 'Could not read document properties.');
      } finally {
        setIsReading(false);
      }
    }
  };

  const handleSaveMetadata = async () => {
    if (!file) return;
    setIsSaving(true);
    setError(null);

    try {
      const kwList = keywords
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);

      const result = await updateDocumentProperties(file, {
        title,
        author,
        subject,
        keywords: kwList,
        creator,
      });

      const url = URL.createObjectURL(result.blob);
      setDownloadUrl(url);
      setDownloadFileName(result.fileName);
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to update document metadata.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setMetadata(null);
    setTitle('');
    setAuthor('');
    setSubject('');
    setKeywords('');
    setCreator('');
    setDownloadUrl(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-8">
      {/* Tool Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E9DCC8]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF3DF] text-[#D98218] text-xs font-bold uppercase tracking-wider mb-2 border border-[#F4A62A]/30">
            <Edit3 className="w-3.5 h-3.5" />
            <span>Document Editor</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#102A43]">Metadata Editor</h2>
          <p className="text-sm text-[#61758A] mt-1">
            Edit and update document metadata (Title, Author, Subject, Keywords, Creator) and download the updated file.
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
                accept=".pdf,.docx,.xlsx,.pptx"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-18 h-18 rounded-3xl bg-[#FFF3DF] text-[#D98218] flex items-center justify-center mb-4 shadow-sm">
                <Edit3 className="w-9 h-9 stroke-[2.2]" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-[#102A43]">
                Drop your document here to edit metadata
              </h3>
              <p className="text-sm text-[#61758A] mt-2 max-w-md">
                Supports PDF, Word (.docx), Excel (.xlsx), and PowerPoint (.pptx).
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
                  <p className="font-bold text-[#102A43]">Reading Document Properties...</p>
                </div>
              )}

              {/* Edit Form */}
              {!isReading && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E9DCC8] shadow-sm space-y-6">
                  <div className="border-b border-[#E9DCC8] pb-4">
                    <h4 className="text-base font-bold text-[#102A43]">Edit Properties</h4>
                    <p className="text-xs text-[#61758A] mt-1">
                      Modify fields below. Changes will be saved directly into the document container.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-[#102A43] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#D98218]" /> Document Title
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Annual Financial Report 2026"
                        className="w-full px-4 py-3 rounded-2xl border border-[#E9DCC8] text-sm text-[#102A43] focus:border-[#D98218] focus:ring-2 focus:ring-[#D98218]/20 outline-none transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#102A43] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[#D98218]" /> Author
                        </label>
                        <input
                          type="text"
                          value={author}
                          onChange={(e) => setAuthor(e.target.value)}
                          placeholder="e.g. John Doe"
                          className="w-full px-4 py-3 rounded-2xl border border-[#E9DCC8] text-sm text-[#102A43] focus:border-[#D98218] focus:ring-2 focus:ring-[#D98218]/20 outline-none transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#102A43] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-[#D98218]" /> Subject
                        </label>
                        <input
                          type="text"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder="e.g. Business Strategy"
                          className="w-full px-4 py-3 rounded-2xl border border-[#E9DCC8] text-sm text-[#102A43] focus:border-[#D98218] focus:ring-2 focus:ring-[#D98218]/20 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#102A43] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-[#D98218]" /> Keywords (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                        placeholder="report, finance, q4, audit"
                        className="w-full px-4 py-3 rounded-2xl border border-[#E9DCC8] text-sm text-[#102A43] focus:border-[#D98218] focus:ring-2 focus:ring-[#D98218]/20 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#102A43] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-[#D98218]" /> Creator / Organization
                      </label>
                      <input
                        type="text"
                        value={creator}
                        onChange={(e) => setCreator(e.target.value)}
                        placeholder="e.g. Codemaniac Studio"
                        className="w-full px-4 py-3 rounded-2xl border border-[#E9DCC8] text-sm text-[#102A43] focus:border-[#D98218] focus:ring-2 focus:ring-[#D98218]/20 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
                    <button
                      onClick={handleSaveMetadata}
                      disabled={isSaving}
                      className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#D98218] hover:bg-[#B86B0E] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSaving ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Saving Document...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Save & Update Metadata</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Download card */}
              {downloadUrl && (
                <div className="bg-emerald-50 rounded-3xl p-6 sm:p-8 border border-emerald-200 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#102A43]">Metadata Updated Successfully!</h3>
                    <p className="text-sm text-[#61758A] mt-1">{downloadFileName}</p>
                  </div>
                  <div className="pt-2">
                    <a
                      href={downloadUrl}
                      download={downloadFileName}
                      className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-[#D98218] hover:bg-[#B86B0E] text-white font-bold text-sm shadow-md transition-all"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Updated Document</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-[#E9DCC8] shadow-sm space-y-5">
            <h4 className="font-bold text-[#102A43] text-base">Metadata Editor Features</h4>
            <ul className="space-y-3 text-xs text-[#61758A]">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#D98218] shrink-0 mt-0.5" />
                <span>Safely edit author, title, and keywords without altering document content</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#D98218] shrink-0 mt-0.5" />
                <span>Supports PDF, DOCX, XLSX, and PPTX standard containers</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#D98218] shrink-0 mt-0.5" />
                <span>Protects anonymity by removing unwanted personal information</span>
              </li>
            </ul>

            <div className="pt-4 border-t border-[#E9DCC8]">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Zero Server Uploads</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

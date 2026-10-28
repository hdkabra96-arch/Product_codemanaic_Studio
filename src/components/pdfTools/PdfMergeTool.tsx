import React, { useState } from 'react';
import { Upload, ArrowUp, ArrowDown, Trash2, Layers, Download, Check, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { mergePdfFiles } from '../../services/pdf/mergeSplitService';
import { getPdfPageCount, fileToArrayBuffer } from '../../services/pdf/pdfLibUtils';

interface FileWithMeta {
  file: File;
  id: string;
  pageCount: number;
}

export const PdfMergeTool: React.FC = () => {
  const [fileList, setFileList] = useState<FileWithMeta[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mergedBlob, setMergedBlob] = useState<Blob | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFilesAdded = async (files: FileList | null) => {
    if (!files) return;
    setErrorMsg(null);
    const newItems: FileWithMeta[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
        continue;
      }
      try {
        const buf = await fileToArrayBuffer(file);
        const pages = await getPdfPageCount(buf);
        newItems.push({
          file,
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          pageCount: pages,
        });
      } catch {
        newItems.push({
          file,
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          pageCount: 1,
        });
      }
    }

    if (newItems.length === 0) {
      setErrorMsg('Please select valid PDF files.');
      return;
    }

    setFileList((prev) => [...prev, ...newItems]);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= fileList.length) return;
    const updated = [...fileList];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setFileList(updated);
  };

  const removeItem = (index: number) => {
    setFileList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMerge = async () => {
    if (fileList.length < 2) {
      setErrorMsg('Please add at least 2 PDF files to merge.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const filesToMerge = fileList.map((item) => item.file);
      const { bytes } = await mergePdfFiles(filesToMerge);
      const blob = new Blob([bytes as any], { type: 'application/pdf' });
      setMergedBlob(blob);
      setIsProcessing(false);
      try {
        confetti({ particleCount: 40, spread: 60 });
      } catch {
        // ignore
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error merging PDF files.');
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!mergedBlob) return;
    const url = URL.createObjectURL(mergedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'merged_document.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  return (
    <div className="space-y-5">
      {/* Upload Zone */}
      <label className="border-2 border-dashed border-[#E9DCC8] hover:border-[#D98218] bg-[#FAF5EC]/60 hover:bg-[#FFF3DF]/40 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all">
        <input
          type="file"
          multiple
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => handleFilesAdded(e.target.files)}
        />
        <div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-[#E9DCC8] flex items-center justify-center text-[#D98218] mb-2">
          <Upload className="w-6 h-6" />
        </div>
        <span className="text-sm font-bold text-[#102A43]">
          Click or drop multiple PDF files here
        </span>
        <span className="text-xs text-[#61758A] mt-0.5">
          Select multiple files to combine in your desired order
        </span>
      </label>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      {/* Files List */}
      {fileList.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#102A43]">
            <span>FILES TO MERGE ({fileList.length})</span>
            <span className="text-[#61758A]">Reorder as needed</span>
          </div>

          <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
            {fileList.map((item, idx) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-white rounded-xl border border-[#E9DCC8] shadow-xs"
              >
                <div className="flex items-center gap-3 truncate">
                  <span className="w-6 h-6 rounded-full bg-[#FFF3DF] text-[#D98218] text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="truncate">
                    <p className="text-xs font-bold text-[#102A43] truncate">{item.file.name}</p>
                    <p className="text-[11px] text-[#61758A]">
                      {(item.file.size / 1024).toFixed(1)} KB · {item.pageCount} {item.pageCount === 1 ? 'page' : 'pages'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => moveItem(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1 text-[#61758A] hover:text-[#102A43] disabled:opacity-30 cursor-pointer"
                    title="Move up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => moveItem(idx, 'down')}
                    disabled={idx === fileList.length - 1}
                    className="p-1 text-[#61758A] hover:text-[#102A43] disabled:opacity-30 cursor-pointer"
                    title="Move down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeItem(idx)}
                    className="p-1 text-[#61758A] hover:text-red-600 cursor-pointer ml-1"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Merged Outcome / Action */}
      {mergedBlob ? (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-900">PDFs Successfully Merged!</h4>
              <span className="text-[11px] text-emerald-700">
                {(mergedBlob.size / 1024).toFixed(1)} KB · Ready to save
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
              onClick={() => {
                setMergedBlob(null);
                setFileList([]);
              }}
              className="p-2 bg-white border border-[#E9DCC8] rounded-full text-[#102A43] cursor-pointer"
              title="Start over"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleMerge}
          disabled={fileList.length < 2 || isProcessing}
          className="w-full py-3 rounded-full bg-gradient-to-r from-[#D98218] to-[#C66A08] text-white font-bold text-sm shadow-md hover:shadow-lg disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <Layers className="w-4 h-4" />
          <span>{isProcessing ? 'Merging PDFs...' : `Merge ${fileList.length} Files`}</span>
        </button>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { Upload, Download, Check, AlertCircle, RefreshCw, Lock, Unlock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { protectPdf, unlockPdf } from '../../services/pdf/securityMetadataService';
import { fileToArrayBuffer } from '../../services/pdf/pdfLibUtils';

export const PdfProtectUnlockTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<'protect' | 'unlock'>('protect');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAction = async () => {
    if (!file) return;
    setErrorMsg(null);

    if (activeTab === 'protect') {
      if (!password || password.length < 3) {
        setErrorMsg('Please enter a password with at least 3 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match. Please re-type.');
        return;
      }
    }

    setIsProcessing(true);

    try {
      const buf = await fileToArrayBuffer(file);
      let bytes: Uint8Array;

      if (activeTab === 'protect') {
        bytes = await protectPdf(buf, password);
      } else {
        bytes = await unlockPdf(buf, password);
      }

      const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      setResultBlob(blob);
      setIsProcessing(false);
      try {
        confetti({ particleCount: 35, spread: 55 });
      } catch {
        // ignore
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Security operation failed. Please verify credentials.'
      );
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultBlob || !file) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    a.download = `${baseName}_${activeTab === 'protect' ? 'protected' : 'unlocked'}.pdf`;
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
                setResultBlob(null);
                setErrorMsg(null);
              }
            }}
          />
          <div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-[#E9DCC8] flex items-center justify-center text-[#D98218] mb-2">
            <Lock className="w-6 h-6" />
          </div>
          <span className="text-sm font-bold text-[#102A43]">Select PDF to protect or unlock</span>
          <span className="text-xs text-[#61758A] mt-0.5">
            Add strong password protection or unlock authorized documents
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

          {/* Mode Selector Tabs */}
          <div className="flex rounded-xl bg-[#FAF5EC] p-1 border border-[#E9DCC8] text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('protect');
                setResultBlob(null);
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'protect'
                  ? 'bg-white text-[#D98218] shadow-xs'
                  : 'text-[#61758A] hover:text-[#102A43]'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Protect PDF</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('unlock');
                setResultBlob(null);
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'unlock'
                  ? 'bg-white text-[#D98218] shadow-xs'
                  : 'text-[#61758A] hover:text-[#102A43]'
              }`}
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Unlock PDF</span>
            </button>
          </div>

          {activeTab === 'protect' ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#102A43] block mb-1">
                  SET DOCUMENT PASSWORD:
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter secure password..."
                  className="w-full p-2.5 bg-white border border-[#E9DCC8] rounded-xl text-xs text-[#102A43] focus:outline-none focus:border-[#D98218]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#102A43] block mb-1">
                  CONFIRM PASSWORD:
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password..."
                  className="w-full p-2.5 bg-white border border-[#E9DCC8] rounded-xl text-xs text-[#102A43] focus:outline-none focus:border-[#D98218]"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="text-xs font-bold text-[#102A43] block mb-1">
                CURRENT DOCUMENT PASSWORD (If required):
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password or leave blank for permission lock..."
                className="w-full p-2.5 bg-white border border-[#E9DCC8] rounded-xl text-xs text-[#102A43] focus:outline-none focus:border-[#D98218]"
              />
              <span className="text-[11px] text-[#61758A] block mt-1">
                Removes encryption and restrictions so the document can be opened and edited freely.
              </span>
            </div>
          )}

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
                  <h4 className="text-xs font-bold text-emerald-900">
                    PDF {activeTab === 'protect' ? 'Protected' : 'Unlocked'} Successfully!
                  </h4>
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
                  title="Run again"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleAction}
              disabled={isProcessing}
              className="w-full py-3 rounded-full bg-gradient-to-r from-[#D98218] to-[#C66A08] text-white font-bold text-sm shadow-md hover:shadow-lg disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {activeTab === 'protect' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              <span>
                {isProcessing
                  ? 'Processing Security...'
                  : activeTab === 'protect'
                  ? 'Protect PDF with Password'
                  : 'Unlock & Decrypt PDF'}
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

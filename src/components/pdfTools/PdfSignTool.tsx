import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Download,
  Check,
  AlertCircle,
  RefreshCw,
  PenTool,
  Type,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
  Move,
  Trash2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { fileToArrayBuffer, renderPdfPageToCanvas, getPdfPageCount } from '../../services/pdf/pdfLibUtils';
import { signPdfDocument, SignaturePlacement } from '../../services/pdf/signPdfService';

export const PdfSignTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [signMethod, setSignMethod] = useState<'draw' | 'type' | 'upload'>('draw');

  // Draw signature state
  const sigCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Type signature state
  const [typedName, setTypedName] = useState('Alex Morgan');
  const [fontStyle, setFontStyle] = useState<'cursive' | 'serif' | 'handwriting'>('cursive');

  // Uploaded signature state
  const [uploadedSigUrl, setUploadedSigUrl] = useState<string>('');

  // Signature placement on document preview
  const [signatureDataUrl, setSignatureDataUrl] = useState<string>('');
  const [sigPosition, setSigPosition] = useState({ xPct: 0.55, yPct: 0.15, widthPct: 0.32, heightPct: 0.1 });
  const [signerName, setSignerName] = useState('Authorized Signer');
  const [includeDate, setIncludeDate] = useState(true);

  // Document canvas preview
  const [pagePreviewUrl, setPagePreviewUrl] = useState<string>('');
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load preview of current page
  const loadPagePreview = async (fileObj: File, pageNum: number) => {
    try {
      const buf = await fileToArrayBuffer(fileObj);
      const canvas = await renderPdfPageToCanvas(buf, pageNum, 1.2);
      setPagePreviewUrl(canvas.toDataURL('image/png'));
    } catch (err) {
      console.warn('Page preview error:', err);
    }
  };

  const handleFileSelected = async (selected: File | null) => {
    if (!selected) return;
    setErrorMsg(null);
    setResultBytes(null);
    try {
      const buf = await fileToArrayBuffer(selected);
      const count = await getPdfPageCount(buf);
      setFile(selected);
      setTotalPages(count);
      setCurrentPage(1);
      loadPagePreview(selected, 1);
    } catch {
      setErrorMsg('Could not read PDF. Please provide a valid, unprotected PDF file.');
    }
  };

  useEffect(() => {
    if (file) {
      loadPagePreview(file, currentPage);
    }
  }, [file, currentPage]);

  // Drawing canvas logic
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#102A43';
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = sigCanvasRef.current;
    if (canvas) {
      setSignatureDataUrl(canvas.toDataURL('image/png'));
    }
  };

  const clearCanvas = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    setSignatureDataUrl('');
  };

  // Generate typed signature data URL
  const generateTypedSignature = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 120;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#102A43';

    if (fontStyle === 'cursive') {
      ctx.font = 'italic 38px "Brush Script MT", "Caveat", "Dancing Script", cursive';
    } else if (fontStyle === 'serif') {
      ctx.font = 'italic 32px "Playfair Display", "Georgia", serif';
    } else {
      ctx.font = 'italic 34px "Comic Sans MS", "Segoe Print", cursive';
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(typedName || 'Signature', 200, 60);

    const url = canvas.toDataURL('image/png');
    setSignatureDataUrl(url);
  };

  useEffect(() => {
    if (signMethod === 'type') {
      generateTypedSignature();
    }
  }, [typedName, fontStyle, signMethod]);

  const handleUploadSignature = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const url = reader.result as string;
        setUploadedSigUrl(url);
        setSignatureDataUrl(url);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignPdf = async () => {
    if (!file || !signatureDataUrl) {
      setErrorMsg('Please draw, type, or upload your signature first.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const buf = await fileToArrayBuffer(file);
      const placement: SignaturePlacement = {
        signatureDataUrl,
        pageNum: currentPage,
        xPct: sigPosition.xPct,
        yPct: sigPosition.yPct,
        widthPct: sigPosition.widthPct,
        heightPct: sigPosition.heightPct,
        signerName: signerName.trim() || undefined,
        signDate: includeDate ? new Date().toLocaleDateString() : undefined,
      };

      const { bytes } = await signPdfDocument(buf, [placement]);
      setResultBytes(bytes);
      setIsProcessing(false);
      try {
        confetti({ particleCount: 45, spread: 65 });
      } catch {
        // ignore
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error signing PDF document.');
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultBytes || !file) return;
    const blob = new Blob([resultBytes as any], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    a.download = `${baseName}_signed.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <label className="border-2 border-dashed border-[#E9DCC8] hover:border-[#D98218] bg-[#FAF5EC]/60 hover:bg-[#FFF3DF]/40 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all">
          <input
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => handleFileSelected(e.target.files?.[0] || null)}
          />
          <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-[#E9DCC8] flex items-center justify-center text-[#D98218] mb-3">
            <Upload className="w-7 h-7" />
          </div>
          <span className="text-base font-bold text-[#102A43]">Select PDF to sign</span>
          <span className="text-xs text-[#61758A] mt-1">
            Sign electronically by drawing, typing, or uploading your digital signature
          </span>
          <span className="mt-4 px-4 py-1.5 rounded-full bg-white border border-[#E9DCC8] text-xs font-bold text-[#102A43] shadow-xs">
            Browse Files
          </span>
        </label>
      ) : (
        <div className="space-y-5">
          {/* Top File Meta */}
          <div className="p-3.5 bg-white rounded-2xl border border-[#E9DCC8] flex items-center justify-between">
            <div className="truncate">
              <h4 className="text-xs font-bold text-[#102A43] truncate">{file.name}</h4>
              <p className="text-[11px] text-[#61758A]">
                {(file.size / 1024).toFixed(1)} KB · Total Pages: <strong>{totalPages}</strong>
              </p>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setResultBytes(null);
                setSignatureDataUrl('');
              }}
              className="text-xs text-[#61758A] hover:text-[#D98218] font-semibold cursor-pointer"
            >
              Change PDF
            </button>
          </div>

          {/* Two-Column Studio Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Signature Creator */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-2xl p-4 border border-[#E9DCC8] shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#E9DCC8] pb-3">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#102A43]">
                    Create Signature
                  </span>
                  {/* Signature Method Tabs */}
                  <div className="inline-flex p-1 bg-[#FAF5EC] rounded-xl border border-[#E9DCC8] text-xs">
                    <button
                      type="button"
                      onClick={() => setSignMethod('draw')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        signMethod === 'draw'
                          ? 'bg-white text-[#D98218] shadow-xs'
                          : 'text-[#61758A] hover:text-[#102A43]'
                      }`}
                    >
                      <PenTool className="w-3.5 h-3.5" />
                      <span>Draw</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSignMethod('type')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        signMethod === 'type'
                          ? 'bg-white text-[#D98218] shadow-xs'
                          : 'text-[#61758A] hover:text-[#102A43]'
                      }`}
                    >
                      <Type className="w-3.5 h-3.5" />
                      <span>Type</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSignMethod('upload')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        signMethod === 'upload'
                          ? 'bg-white text-[#D98218] shadow-xs'
                          : 'text-[#61758A] hover:text-[#102A43]'
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Upload</span>
                    </button>
                  </div>
                </div>

                {/* Method 1: Draw */}
                {signMethod === 'draw' && (
                  <div className="space-y-2">
                    <div className="relative border-2 border-dashed border-[#E9DCC8] rounded-xl bg-[#FAF5EC]/30 overflow-hidden">
                      <canvas
                        ref={sigCanvasRef}
                        width={360}
                        height={120}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="w-full h-[120px] cursor-crosshair touch-none"
                      />
                      {!hasDrawn && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-xs text-[#61758A]/60 font-medium">
                          Draw your signature here with mouse or touch
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={clearCanvas}
                        className="text-[11px] font-bold text-red-600 hover:text-red-700 cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Clear</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Method 2: Type */}
                {signMethod === 'type' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#102A43] uppercase mb-1">
                        Your Name
                      </label>
                      <input
                        type="text"
                        value={typedName}
                        onChange={(e) => setTypedName(e.target.value)}
                        placeholder="Enter full legal name"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#E9DCC8] focus:border-[#D98218] focus:outline-none bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#102A43] uppercase mb-1">
                        Calligraphy Style
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'cursive', label: 'Cursive' },
                          { id: 'serif', label: 'Elegant' },
                          { id: 'handwriting', label: 'Handwriting' },
                        ].map((st) => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => setFontStyle(st.id as any)}
                            className={`p-2 text-xs rounded-xl border text-center transition-all cursor-pointer ${
                              fontStyle === st.id
                                ? 'border-[#D98218] bg-[#FFF3DF] text-[#D98218] font-bold shadow-xs'
                                : 'border-[#E9DCC8] bg-white text-[#61758A]'
                            }`}
                          >
                            {st.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Method 3: Upload */}
                {signMethod === 'upload' && (
                  <div className="space-y-2">
                    <label className="border-2 border-dashed border-[#E9DCC8] hover:border-[#D98218] rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer bg-[#FAF5EC]/40">
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={handleUploadSignature}
                      />
                      <Upload className="w-5 h-5 text-[#D98218] mb-1" />
                      <span className="text-xs font-bold text-[#102A43]">Upload Signature Image</span>
                      <span className="text-[10px] text-[#61758A]">PNG with transparent background recommended</span>
                    </label>
                  </div>
                )}

                {/* Signature Metadata Options */}
                <div className="space-y-2 pt-2 border-t border-[#E9DCC8]">
                  <div>
                    <label className="block text-[11px] font-bold text-[#102A43] uppercase mb-1">
                      Signer Caption
                    </label>
                    <input
                      type="text"
                      value={signerName}
                      onChange={(e) => setSignerName(e.target.value)}
                      placeholder="e.g. Authorized Signer or Name"
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#E9DCC8] focus:border-[#D98218] focus:outline-none bg-white"
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-[#102A43]">
                    <input
                      type="checkbox"
                      checked={includeDate}
                      onChange={(e) => setIncludeDate(e.target.checked)}
                      className="rounded border-[#E9DCC8] text-[#D98218] focus:ring-[#D98218]"
                    />
                    <span className="font-medium">Stamp current date under signature</span>
                  </label>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                disabled={!signatureDataUrl || isProcessing}
                onClick={handleSignPdf}
                className={`w-full py-3.5 rounded-full font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  signatureDataUrl && !isProcessing
                    ? 'bg-[#D98218] hover:bg-[#C66A08] text-white hover:shadow-lg'
                    : 'bg-[#E9DCC8] text-[#61758A] cursor-not-allowed opacity-70'
                }`}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Signing Document...</span>
                  </>
                ) : (
                  <>
                    <PenTool className="w-4 h-4" />
                    <span>Sign Document</span>
                  </>
                )}
              </button>
            </div>

            {/* Right Column: Interactive Page Placement Preview */}
            <div className="lg:col-span-7 space-y-3">
              <div className="bg-white rounded-2xl p-4 border border-[#E9DCC8] shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#E9DCC8] pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#102A43]">Placement Preview:</span>
                    <span className="text-xs font-semibold text-[#D98218]">
                      Page {currentPage} of {totalPages}
                    </span>
                  </div>
                  {/* Page Navigation */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="p-1 rounded-lg border border-[#E9DCC8] hover:border-[#D98218] text-[#102A43] disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="p-1 rounded-lg border border-[#E9DCC8] hover:border-[#D98218] text-[#102A43] disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Document Sheet with Overlay Signature */}
                <div
                  ref={previewContainerRef}
                  className="relative mx-auto bg-[#525659] p-3 rounded-xl shadow-inner overflow-hidden flex justify-center items-center max-h-[460px] overflow-y-auto"
                >
                  {pagePreviewUrl ? (
                    <div className="relative shadow-xl border border-gray-400 bg-white">
                      <img
                        src={pagePreviewUrl}
                        alt={`Page ${currentPage}`}
                        className="max-h-[420px] object-contain block pointer-events-none select-none"
                      />

                      {/* Interactive Draggable/Positioned Signature Box */}
                      {signatureDataUrl && (
                        <div
                          style={{
                            position: 'absolute',
                            left: `${sigPosition.xPct * 100}%`,
                            bottom: `${sigPosition.yPct * 100}%`,
                            width: `${sigPosition.widthPct * 100}%`,
                          }}
                          className="border-2 border-[#D98218] bg-[#FFF3DF]/40 rounded p-1 shadow-md cursor-move select-none"
                          onMouseDown={(e) => {
                            const startX = e.clientX;
                            const startY = e.clientY;
                            const startXPct = sigPosition.xPct;
                            const startYPct = sigPosition.yPct;

                            const onMouseMove = (ev: MouseEvent) => {
                              const dx = (ev.clientX - startX) / 250;
                              const dy = (startY - ev.clientY) / 320;
                              setSigPosition((prev) => ({
                                ...prev,
                                xPct: Math.max(0.05, Math.min(0.65, startXPct + dx)),
                                yPct: Math.max(0.05, Math.min(0.85, startYPct + dy)),
                              }));
                            };

                            const onMouseUp = () => {
                              window.removeEventListener('mousemove', onMouseMove);
                              window.removeEventListener('mouseup', onMouseUp);
                            };

                            window.addEventListener('mousemove', onMouseMove);
                            window.addEventListener('mouseup', onMouseUp);
                          }}
                        >
                          <img
                            src={signatureDataUrl}
                            alt="Signature"
                            className="w-full h-auto object-contain block pointer-events-none"
                          />
                          {(signerName || includeDate) && (
                            <div className="text-[8px] font-semibold text-[#102A43] text-center mt-0.5 truncate pointer-events-none">
                              {signerName} {includeDate && `· ${new Date().toLocaleDateString()}`}
                            </div>
                          )}
                          <div className="text-[7px] text-[#D98218] font-bold text-center mt-0.5 pointer-events-none flex items-center justify-center gap-1">
                            <Move className="w-2.5 h-2.5" /> Drag to reposition
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-20 text-white text-xs flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#D98218]" />
                      <span>Loading page preview...</span>
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-[#61758A] text-center">
                  Drag the amber signature box on the preview to position it anywhere on this page.
                </p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Download Card */}
          {resultBytes && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <Check className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-900">
                    PDF Document Successfully Signed!
                  </h4>
                  <p className="text-[11px] text-emerald-700">
                    Signature stamped with valid coordinates and certificate metadata.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDownload}
                className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download Signed PDF</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Upload, Download, Check, AlertCircle, RefreshCw, Stamp } from 'lucide-react';
import confetti from 'canvas-confetti';
import { applyWatermarkToPdf, WatermarkOptions } from '../../services/pdf/editorWatermarkService';
import { renderPdfPageToCanvas, fileToArrayBuffer } from '../../services/pdf/pdfLibUtils';

export const PdfWatermarkTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('CONFIDENTIAL');
  const [fontSize, setFontSize] = useState(36);
  const [fontColor, setFontColor] = useState('#D98218');
  const [opacity, setOpacity] = useState(0.35);
  const [rotation, setRotation] = useState(45);
  const [position, setPosition] = useState<WatermarkOptions['position']>('center');
  const [targetPages, setTargetPages] = useState<'all' | 'odd' | 'even'>('all');

  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadPreview = async (fileObj: File) => {
    try {
      const buf = await fileToArrayBuffer(fileObj);
      const canvas = await renderPdfPageToCanvas(buf, 1, 0.9);
      setPreviewUrl(canvas.toDataURL('image/png'));
    } catch {
      // ignore
    }
  };

  const handleFileSelected = (selected: File | null) => {
    if (!selected) return;
    setFile(selected);
    setResultBlob(null);
    setErrorMsg(null);
    loadPreview(selected);
  };

  useEffect(() => {
    if (file) {
      loadPreview(file);
    }
  }, [file]);

  const handleApply = async () => {
    if (!file) return;
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const buf = await fileToArrayBuffer(file);
      const bytes = await applyWatermarkToPdf(buf, {
        type: 'text',
        text,
        fontSize,
        fontColor,
        opacity,
        rotation,
        position,
        targetPages,
      });

      const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      setResultBlob(blob);
      setIsProcessing(false);
      try {
        confetti({ particleCount: 35, spread: 55 });
      } catch {
        // ignore
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error adding watermark.');
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultBlob || !file) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    a.download = `${baseName}_watermarked.pdf`;
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
            <Stamp className="w-6 h-6" />
          </div>
          <span className="text-sm font-bold text-[#102A43]">Select PDF to watermark</span>
          <span className="text-xs text-[#61758A] mt-0.5">
            Add custom text watermark with rotation, opacity, and live preview
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Watermark Controls */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#102A43] block mb-1">WATERMARK TEXT:</label>
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full p-2 bg-white border border-[#E9DCC8] rounded-xl text-xs font-bold text-[#102A43] focus:outline-none focus:border-[#D98218]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-[#102A43] block mb-1">COLOR:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={fontColor}
                      onChange={(e) => setFontColor(e.target.value)}
                      className="w-8 h-8 rounded border border-[#E9DCC8] cursor-pointer"
                    />
                    <span className="font-mono text-[11px] font-bold text-[#102A43]">
                      {fontColor.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-[#102A43] block mb-1">
                    FONT SIZE: {fontSize}pt
                  </label>
                  <input
                    type="range"
                    min={18}
                    max={64}
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full accent-[#D98218]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-[#102A43] block mb-1">
                    OPACITY: {Math.round(opacity * 100)}%
                  </label>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    value={Math.round(opacity * 100)}
                    onChange={(e) => setOpacity(Number(e.target.value) / 100)}
                    className="w-full accent-[#D98218]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#102A43] block mb-1">
                    ROTATION: {rotation}°
                  </label>
                  <input
                    type="range"
                    min={-90}
                    max={90}
                    value={rotation}
                    onChange={(e) => setRotation(Number(e.target.value))}
                    className="w-full accent-[#D98218]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-[#102A43] block mb-1">POSITION:</label>
                  <select
                    value={position}
                    onChange={(e) => setPosition(e.target.value as WatermarkOptions['position'])}
                    className="w-full p-2 bg-white border border-[#E9DCC8] rounded-xl text-xs"
                  >
                    <option value="center">Center</option>
                    <option value="top-left">Top Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="bottom-right">Bottom Right</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#102A43] block mb-1">TARGET PAGES:</label>
                  <select
                    value={targetPages}
                    onChange={(e) => setTargetPages(e.target.value as 'all' | 'odd' | 'even')}
                    className="w-full p-2 bg-white border border-[#E9DCC8] rounded-xl text-xs"
                  >
                    <option value="all">All Pages</option>
                    <option value="odd">Odd Pages Only</option>
                    <option value="even">Even Pages Only</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Live Interactive Preview */}
            <div className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-xl border border-[#E9DCC8]">
              <span className="text-[11px] font-bold text-[#61758A] mb-1">LIVE PREVIEW</span>
              <div className="relative max-h-52 overflow-hidden rounded shadow-sm border border-gray-200 inline-block bg-white">
                {previewUrl && (
                  <img src={previewUrl} alt="Preview" className="max-h-52 object-contain block" />
                )}
                {/* Simulated Watermark Text */}
                <div
                  style={{
                    position: 'absolute',
                    top:
                      position === 'center'
                        ? '50%'
                        : position.includes('top')
                        ? '20%'
                        : '80%',
                    left:
                      position === 'center'
                        ? '50%'
                        : position.includes('left')
                        ? '25%'
                        : '75%',
                    transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                    color: fontColor,
                    fontSize: `${fontSize * 0.45}px`,
                    opacity: opacity,
                    fontWeight: 'bold',
                    pointerEvents: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {text}
                </div>
              </div>
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
                  <h4 className="text-xs font-bold text-emerald-900">Watermark Added!</h4>
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
                  title="Apply another"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleApply}
              disabled={isProcessing}
              className="w-full py-3 rounded-full bg-gradient-to-r from-[#D98218] to-[#C66A08] text-white font-bold text-sm shadow-md hover:shadow-lg disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Stamp className="w-4 h-4" />
              <span>{isProcessing ? 'Watermarking PDF...' : 'Apply Watermark Now'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

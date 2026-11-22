import React, { useState } from 'react';
import { Upload, Download, RefreshCw, Check, AlertCircle, Stamp, Type, Image as ImageIcon, Eye } from 'lucide-react';
import confetti from 'canvas-confetti';
import { applyWatermark, WatermarkOptions, getImageDimensions } from '../../services/image/imageProcessingService';
import { ImagePreviewModal } from './ImagePreviewModal';

export const ImageWatermarkTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  // Watermark options
  const [wmType, setWmType] = useState<'text' | 'image'>('text');
  const [wmText, setWmText] = useState<string>('CODEMANIAC STUDIO');
  const [fontSize, setFontSize] = useState<number>(36);
  const [fontColor, setFontColor] = useState<string>('#FFFFFF');
  const [opacity, setOpacity] = useState<number>(65); // 10 to 100
  const [position, setPosition] = useState<
    'top-left' | 'top-right' | 'center' | 'bottom-left' | 'bottom-right' | 'tiled'
  >('bottom-right');
  const [rotation, setRotation] = useState<number>(0);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; fileName: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    imageSrc: string;
    compareSrc?: string;
    fileName?: string;
    fileSizeStr?: string;
    dimensions?: { width: number; height: number };
  } | null>(null);

  const handleFileSelect = async (selected: File) => {
    if (!selected.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file.');
      return;
    }
    setFile(selected);
    setErrorMsg(null);
    setResult(null);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);

    const url = URL.createObjectURL(selected);
    setPreviewUrl(url);

    try {
      const dims = await getImageDimensions(selected);
      setDimensions(dims);
    } catch {
      // ignore
    }
  };

  const handleApplyWatermark = async () => {
    if (!file) return;
    if (wmType === 'text' && !wmText.trim()) {
      setErrorMsg('Please enter watermark text.');
      return;
    }
    if (wmType === 'image' && !logoFile) {
      setErrorMsg('Please select a watermark logo image.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const res = await applyWatermark(file, {
        type: wmType,
        text: wmText,
        fontSize,
        textColor: fontColor,
        opacity: opacity / 100,
        position,
        rotation,
        watermarkImage: logoFile || undefined,
      });

      setResult(res);
      const resUrl = URL.createObjectURL(res.blob);
      setResultUrl(resUrl);
      setIsProcessing(false);

      try {
        confetti({ particleCount: 40, spread: 60 });
      } catch {
        // ignore
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error applying watermark.');
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const url = resultUrl || URL.createObjectURL(result.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (!resultUrl) setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  const handleReset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null);
    setPreviewUrl(null);
    setResultUrl(null);
    setDimensions(null);
    setResult(null);
    setErrorMsg(null);
  };

  const openOriginalPreview = () => {
    if (!file || !previewUrl) return;
    setModalConfig({
      title: `${file.name} (Original Image)`,
      imageSrc: previewUrl,
      fileName: file.name,
      fileSizeStr: `${(file.size / 1024).toFixed(1)} KB`,
      dimensions: dimensions || undefined,
    });
    setIsPreviewOpen(true);
  };

  const openResultPreview = () => {
    if (!result || !resultUrl) return;
    setModalConfig({
      title: `${result.fileName} (Watermarked Result)`,
      imageSrc: resultUrl,
      compareSrc: previewUrl || undefined,
      fileName: result.fileName,
      fileSizeStr: `${(result.blob.size / 1024).toFixed(1)} KB`,
      dimensions: dimensions || undefined,
    });
    setIsPreviewOpen(true);
  };

  return (
    <div className="space-y-4">
      {!file ? (
        <label className="border-2 border-dashed border-[#E9DCC8] hover:border-[#D98218] bg-[#FAF5EC]/60 hover:bg-[#FFF3DF]/40 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelect(e.target.files[0]);
              }
            }}
          />
          <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-[#E9DCC8] flex items-center justify-center text-[#D98218] mb-3">
            <Stamp className="w-7 h-7" />
          </div>
          <span className="text-base font-bold text-[#102A43]">
            Select an image to add watermark
          </span>
          <span className="text-xs text-[#61758A] mt-1">
            Stamp customizable text or logo with variable transparency and tiling
          </span>
          <span className="mt-4 px-4 py-1.5 rounded-full bg-white border border-[#E9DCC8] text-xs font-bold text-[#102A43] shadow-sm">
            Browse File
          </span>
        </label>
      ) : (
        <div className="space-y-4">
          {/* Header Card with Preview Option */}
          <div className="p-4 bg-white rounded-2xl border border-[#E9DCC8] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-[#102A43] truncate max-w-xs">{file.name}</span>
              <span className="text-xs text-[#61758A]">
                {(file.size / 1024).toFixed(1)} KB {dimensions ? ` • ${dimensions.width} × ${dimensions.height} px` : ''}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openOriginalPreview}
                className="px-3.5 py-1.5 bg-[#FFF8EE] hover:bg-[#FFF3DF] text-[#D98218] border border-[#E9DCC8] hover:border-[#D98218] rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Review Image</span>
              </button>
              <button
                onClick={handleReset}
                className="text-xs font-semibold text-[#61758A] hover:text-red-600 px-2 cursor-pointer"
              >
                Change File
              </button>
            </div>
          </div>

          {/* Watermark Setup Controls */}
          <div className="p-4 bg-[#FAF5EC] rounded-2xl border border-[#E9DCC8] space-y-4">
            {/* Mode selection */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setWmType('text')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-colors cursor-pointer ${
                  wmType === 'text'
                    ? 'bg-[#D98218] text-white border-[#D98218]'
                    : 'bg-white text-[#102A43] border-[#E9DCC8]'
                }`}
              >
                <Type className="w-4 h-4" />
                <span>Text Watermark</span>
              </button>
              <button
                type="button"
                onClick={() => setWmType('image')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-colors cursor-pointer ${
                  wmType === 'image'
                    ? 'bg-[#D98218] text-white border-[#D98218]'
                    : 'bg-white text-[#102A43] border-[#E9DCC8]'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>Image / Logo Stamp</span>
              </button>
            </div>

            {wmType === 'text' ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-[#102A43] block mb-1">WATERMARK TEXT</label>
                  <input
                    type="text"
                    value={wmText}
                    onChange={(e) => setWmText(e.target.value)}
                    placeholder="e.g. Confidential, Copyright 2026"
                    className="w-full p-2.5 bg-white border border-[#E9DCC8] rounded-xl text-xs font-bold text-[#102A43]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#102A43] block mb-1">FONT SIZE ({fontSize}px)</label>
                    <input
                      type="range"
                      min="16"
                      max="96"
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      className="w-full accent-[#D98218] cursor-pointer mt-1"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#102A43]">TEXT COLOR</label>
                    <input
                      type="color"
                      value={fontColor}
                      onChange={(e) => setFontColor(e.target.value)}
                      className="w-9 h-9 rounded-lg border border-[#E9DCC8] cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="text-xs font-bold text-[#102A43] block mb-1.5">UPLOAD LOGO IMAGE</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-[#61758A] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-[#102A43] file:text-white file:font-bold file:cursor-pointer"
                />
              </div>
            )}

            {/* Opacity slider */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold text-[#102A43] mb-1">
                <span>Opacity: {opacity}%</span>
                <span className="text-[#61758A]">
                  {opacity > 75 ? 'Solid' : opacity > 40 ? 'Semi-Transparent' : 'Subtle'}
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="w-full accent-[#D98218] cursor-pointer"
              />
            </div>

            {/* Position presets */}
            <div className="pt-2 border-t border-[#E9DCC8]">
              <span className="text-xs font-bold text-[#102A43] block mb-1.5">PLACEMENT POSITION</span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {[
                  { id: 'top-left', label: 'Top Left' },
                  { id: 'top-right', label: 'Top Right' },
                  { id: 'center', label: 'Center' },
                  { id: 'bottom-left', label: 'Bottom Left' },
                  { id: 'bottom-right', label: 'Bottom Right' },
                  { id: 'tiled', label: 'Tile All Over' },
                ].map((pos) => (
                  <button
                    key={pos.id}
                    onClick={() => setPosition(pos.id as any)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer text-center ${
                      position === pos.id
                        ? 'bg-[#102A43] text-white border-[#102A43]'
                        : 'bg-white text-[#102A43] border-[#E9DCC8]'
                    }`}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!result ? (
            <button
              onClick={handleApplyWatermark}
              disabled={isProcessing}
              className="w-full py-3 rounded-full bg-[#D98218] hover:bg-[#C66A08] disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Stamping Watermark...</span>
                </>
              ) : (
                <span>Stamp Watermark & Export</span>
              )}
            </button>
          ) : (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  onClick={openResultPreview}
                  className="w-12 h-12 rounded-xl bg-white border border-emerald-300 overflow-hidden shrink-0 cursor-pointer relative group"
                  title="Click to preview watermarked result"
                >
                  {resultUrl && (
                    <img src={resultUrl} alt="Result" className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                    <Eye className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <h5 className="text-xs font-bold text-emerald-950">Watermark Applied</h5>
                  <p className="text-[11px] text-emerald-700">
                    {(result.blob.size / 1024).toFixed(1)} KB (High Quality PNG)
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={openResultPreview}
                  className="px-3.5 py-2 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold rounded-full shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Preview & Compare Result</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Watermarked</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Full-Feature Image Preview Modal */}
      {modalConfig && (
        <ImagePreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title={modalConfig.title}
          imageSrc={modalConfig.imageSrc}
          compareSrc={modalConfig.compareSrc}
          fileName={modalConfig.fileName}
          fileSizeStr={modalConfig.fileSizeStr}
          dimensions={modalConfig.dimensions}
        />
      )}
    </div>
  );
};

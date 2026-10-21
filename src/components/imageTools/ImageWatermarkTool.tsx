import React, { useState } from 'react';
import { Upload, Download, RefreshCw, Check, AlertCircle, Stamp, Type, Image as ImageIcon } from 'lucide-react';
import confetti from 'canvas-confetti';
import { applyWatermark, WatermarkOptions, getImageDimensions } from '../../services/image/imageProcessingService';

export const ImageWatermarkTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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

  const handleFileSelect = (selected: File) => {
    if (!selected.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file.');
      return;
    }
    setFile(selected);
    setErrorMsg(null);
    setResult(null);

    const url = URL.createObjectURL(selected);
    setPreviewUrl(url);
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
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  const handleReset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setErrorMsg(null);
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
            Select an image to watermark
          </span>
          <span className="text-xs text-[#61758A] mt-1">
            Add text, logo branding, copyright protection & custom stamps
          </span>
          <span className="mt-4 px-4 py-1.5 rounded-full bg-white border border-[#E9DCC8] text-xs font-bold text-[#102A43] shadow-sm">
            Browse File
          </span>
        </label>
      ) : (
        <div className="space-y-4">
          {/* Header */}
          <div className="p-4 bg-white rounded-2xl border border-[#E9DCC8] shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-[#102A43] truncate max-w-xs">{file.name}</span>
              <span className="text-xs text-[#61758A]">{(file.size / 1024).toFixed(1)} KB</span>
            </div>
            <button
              onClick={handleReset}
              className="text-xs font-semibold text-[#61758A] hover:text-red-600 cursor-pointer"
            >
              Change File
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="flex gap-2 bg-[#FAF5EC] p-1.5 rounded-xl border border-[#E9DCC8]">
            <button
              onClick={() => setWmType('text')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                wmType === 'text'
                  ? 'bg-[#D98218] text-white shadow-sm'
                  : 'text-[#102A43] hover:bg-white/60'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>Text Watermark</span>
            </button>
            <button
              onClick={() => setWmType('image')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                wmType === 'image'
                  ? 'bg-[#D98218] text-white shadow-sm'
                  : 'text-[#102A43] hover:bg-white/60'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Logo / Graphic Stamp</span>
            </button>
          </div>

          {/* Configuration Panel */}
          <div className="p-4 bg-[#FAF5EC] rounded-2xl border border-[#E9DCC8] space-y-3">
            {wmType === 'text' ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-[#102A43] block mb-1">
                    WATERMARK TEXT
                  </label>
                  <input
                    type="text"
                    value={wmText}
                    onChange={(e) => setWmText(e.target.value)}
                    placeholder="© 2026 Your Name or Brand"
                    className="w-full p-2.5 rounded-xl border border-[#E9DCC8] text-xs font-bold text-[#102A43] bg-white focus:outline-none focus:border-[#D98218]"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-[#102A43] block mb-1">Font Size</label>
                    <input
                      type="number"
                      min="14"
                      max="140"
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      className="w-full p-2 rounded-lg border border-[#E9DCC8] text-xs font-bold bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#102A43] block mb-1">Text Color</label>
                    <input
                      type="color"
                      value={fontColor}
                      onChange={(e) => setFontColor(e.target.value)}
                      className="w-full h-8 rounded-lg cursor-pointer border border-[#E9DCC8]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#102A43] block mb-1">Rotation</label>
                    <select
                      value={rotation}
                      onChange={(e) => setRotation(Number(e.target.value))}
                      className="w-full p-2 rounded-lg border border-[#E9DCC8] text-xs font-bold bg-white"
                    >
                      <option value="0">0° Horizontal</option>
                      <option value="-30">-30° Diagonal</option>
                      <option value="-45">-45° Diagonal</option>
                      <option value="90">90° Vertical</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="text-xs font-bold text-[#102A43] block mb-1">
                  UPLOAD LOGO / STAMP (PNG / SVG / JPG)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setLogoFile(e.target.files[0]);
                    }
                  }}
                  className="w-full p-2 rounded-xl border border-[#E9DCC8] text-xs bg-white file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#FFF3DF] file:text-[#D98218]"
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
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-emerald-950">Watermark Applied</h5>
                  <p className="text-[11px] text-emerald-700">
                    {(result.blob.size / 1024).toFixed(1)} KB (High Quality PNG)
                  </p>
                </div>
              </div>
              <button
                onClick={handleDownload}
                className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Watermarked</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

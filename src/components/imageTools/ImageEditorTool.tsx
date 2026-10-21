import React, { useState, useEffect, useRef } from 'react';
import { Upload, Download, RefreshCw, Check, AlertCircle, Wand2, RotateCw, FlipHorizontal, FlipVertical, Type, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { processImageEditor } from '../../services/image/imageProcessingService';

interface EditorState {
  brightness: number;
  contrast: number;
  saturation: number;
  grayscale: number;
  sepia: number;
  invert: boolean;
  blur: number;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  annotationText: string;
  fontSize: number;
  fontColor: string;
  textPosition: 'top' | 'center' | 'bottom';
}

const DEFAULT_STATE: EditorState = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  grayscale: 0,
  sepia: 0,
  invert: false,
  blur: 0,
  rotation: 0,
  flipH: false,
  flipV: false,
  annotationText: '',
  fontSize: 32,
  fontColor: '#FFFFFF',
  textPosition: 'bottom',
};

export const ImageEditorTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<EditorState>(DEFAULT_STATE);
  const [history, setHistory] = useState<EditorState[]>([DEFAULT_STATE]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const [activeTab, setActiveTab] = useState<'adjust' | 'filters' | 'transform' | 'text'>('adjust');
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadBlob, setDownloadBlob] = useState<{ blob: Blob; fileName: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageElementRef = useRef<HTMLImageElement | null>(null);

  const handleFileSelect = (selected: File) => {
    if (!selected.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image.');
      return;
    }
    setFile(selected);
    setErrorMsg(null);
    setDownloadBlob(null);
    setState(DEFAULT_STATE);
    setHistory([DEFAULT_STATE]);
    setHistoryIndex(0);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageElementRef.current = img;
      renderLiveCanvas(img, DEFAULT_STATE);
    };
    img.src = URL.createObjectURL(selected);
  };

  const updateState = (updater: Partial<EditorState>) => {
    const next = { ...state, ...updater };
    setState(next);

    // Push to history
    const newHist = history.slice(0, historyIndex + 1);
    newHist.push(next);
    setHistory(newHist);
    setHistoryIndex(newHist.length - 1);

    if (imageElementRef.current) {
      renderLiveCanvas(imageElementRef.current, next);
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setState(prev);
      setHistoryIndex(historyIndex - 1);
      if (imageElementRef.current) {
        renderLiveCanvas(imageElementRef.current, prev);
      }
    }
  };

  const handleReset = () => {
    setState(DEFAULT_STATE);
    setHistory([DEFAULT_STATE]);
    setHistoryIndex(0);
    if (imageElementRef.current) {
      renderLiveCanvas(imageElementRef.current, DEFAULT_STATE);
    }
  };

  const renderLiveCanvas = (img: HTMLImageElement, s: EditorState) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isSideways = s.rotation % 180 !== 0;
    const w = isSideways ? img.naturalHeight : img.naturalWidth;
    const h = isSideways ? img.naturalWidth : img.naturalHeight;

    canvas.width = w;
    canvas.height = h;

    ctx.save();
    ctx.clearRect(0, 0, w, h);
    ctx.translate(w / 2, h / 2);
    ctx.rotate((s.rotation * Math.PI) / 180);
    ctx.scale(s.flipH ? -1 : 1, s.flipV ? -1 : 1);

    // CSS filter
    const b = 100 + s.brightness;
    const c = 100 + s.contrast;
    const sat = 100 + s.saturation;
    const filterParts = [`brightness(${b}%)`, `contrast(${c}%)`, `saturate(${sat}%)`];
    if (s.grayscale > 0) filterParts.push(`grayscale(${s.grayscale}%)`);
    if (s.sepia > 0) filterParts.push(`sepia(${s.sepia}%)`);
    if (s.invert) filterParts.push('invert(100%)');
    if (s.blur > 0) filterParts.push(`blur(${s.blur}px)`);

    ctx.filter = filterParts.join(' ');
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    ctx.restore();

    // Text annotation
    if (s.annotationText.trim()) {
      ctx.save();
      ctx.font = `bold ${s.fontSize}px sans-serif`;
      ctx.fillStyle = s.fontColor;
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.7)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      let yPos = h - 30;
      if (s.textPosition === 'top') yPos = s.fontSize + 30;
      else if (s.textPosition === 'center') yPos = h / 2;

      ctx.fillText(s.annotationText, w / 2, yPos);
      ctx.restore();
    }
  };

  const handleExport = async () => {
    if (!file) return;
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const res = await processImageEditor(file, {
        brightness: state.brightness,
        contrast: state.contrast,
        saturation: state.saturation,
        grayscale: state.grayscale,
        sepia: state.sepia,
        invert: state.invert,
        blur: state.blur,
        rotation: state.rotation,
        flipH: state.flipH,
        flipV: state.flipV,
        textAnnotation: state.annotationText
          ? {
              text: state.annotationText,
              fontSize: state.fontSize,
              color: state.fontColor,
              position: state.textPosition,
            }
          : undefined,
      });

      setDownloadBlob(res);
      setIsProcessing(false);
      try {
        confetti({ particleCount: 40, spread: 60 });
      } catch {
        // ignore
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error rendering edited image.');
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!downloadBlob) return;
    const url = URL.createObjectURL(downloadBlob.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = downloadBlob.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
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
            <Wand2 className="w-7 h-7" />
          </div>
          <span className="text-base font-bold text-[#102A43]">
            Select an image to edit
          </span>
          <span className="text-xs text-[#61758A] mt-1">
            Adjust lighting, color balance, rotation, filters & annotations
          </span>
          <span className="mt-4 px-4 py-1.5 rounded-full bg-white border border-[#E9DCC8] text-xs font-bold text-[#102A43] shadow-sm">
            Browse Image
          </span>
        </label>
      ) : (
        <div className="space-y-4">
          {/* Top Bar with Undo & Reset */}
          <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-[#E9DCC8]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#102A43] truncate max-w-[150px] sm:max-w-xs">
                {file.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="px-3 py-1 rounded-lg border border-[#E9DCC8] disabled:opacity-40 text-xs font-semibold text-[#102A43] hover:border-[#D98218] flex items-center gap-1 cursor-pointer"
                title="Undo"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Undo</span>
              </button>
              <button
                onClick={handleReset}
                className="px-3 py-1 rounded-lg border border-[#E9DCC8] text-xs font-semibold text-[#102A43] hover:border-red-400 hover:text-red-600 cursor-pointer"
              >
                Reset
              </button>
              <button
                onClick={() => setFile(null)}
                className="text-xs font-semibold text-[#61758A] hover:text-red-600 px-2 cursor-pointer"
              >
                Change
              </button>
            </div>
          </div>

          {/* Live Preview Canvas Container */}
          <div className="relative w-full max-h-[320px] bg-[#FAF5EC] rounded-2xl border border-[#E9DCC8] flex items-center justify-center p-3 overflow-hidden">
            <canvas
              ref={canvasRef}
              className="max-h-[300px] max-w-full object-contain rounded-lg shadow-sm"
            />
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-1.5 bg-[#FAF5EC] p-1.5 rounded-xl border border-[#E9DCC8]">
            {[
              { id: 'adjust', label: 'Tune' },
              { id: 'filters', label: 'Filters' },
              { id: 'transform', label: 'Transform' },
              { id: 'text', label: 'Text' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#D98218] text-white shadow-sm'
                    : 'text-[#102A43] hover:bg-white/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content Controls */}
          <div className="p-4 bg-white rounded-2xl border border-[#E9DCC8] space-y-3">
            {activeTab === 'adjust' && (
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-bold text-[#102A43] mb-1">
                    <span>Brightness</span>
                    <span>{state.brightness > 0 ? `+${state.brightness}` : state.brightness}</span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={state.brightness}
                    onChange={(e) => updateState({ brightness: Number(e.target.value) })}
                    className="w-full accent-[#D98218] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-[#102A43] mb-1">
                    <span>Contrast</span>
                    <span>{state.contrast > 0 ? `+${state.contrast}` : state.contrast}</span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={state.contrast}
                    onChange={(e) => updateState({ contrast: Number(e.target.value) })}
                    className="w-full accent-[#D98218] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-[#102A43] mb-1">
                    <span>Saturation</span>
                    <span>{state.saturation > 0 ? `+${state.saturation}` : state.saturation}</span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={state.saturation}
                    onChange={(e) => updateState({ saturation: Number(e.target.value) })}
                    className="w-full accent-[#D98218] cursor-pointer"
                  />
                </div>
              </div>
            )}

            {activeTab === 'filters' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-[#102A43] mb-1">
                      <span>Grayscale</span>
                      <span>{state.grayscale}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={state.grayscale}
                      onChange={(e) => updateState({ grayscale: Number(e.target.value) })}
                      className="w-full accent-[#D98218] cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-[#102A43] mb-1">
                      <span>Sepia</span>
                      <span>{state.sepia}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={state.sepia}
                      onChange={(e) => updateState({ sepia: Number(e.target.value) })}
                      className="w-full accent-[#D98218] cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 items-center pt-2 border-t border-[#E9DCC8]">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-[#102A43] mb-1">
                      <span>Blur</span>
                      <span>{state.blur}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={state.blur}
                      onChange={(e) => updateState({ blur: Number(e.target.value) })}
                      className="w-full accent-[#D98218] cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-center">
                    <button
                      onClick={() => updateState({ invert: !state.invert })}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        state.invert
                          ? 'bg-[#102A43] text-white border-[#102A43]'
                          : 'bg-white text-[#102A43] border-[#E9DCC8]'
                      }`}
                    >
                      Invert Colors
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'transform' && (
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => updateState({ rotation: (state.rotation + 90) % 360 })}
                  className="p-3 rounded-xl border border-[#E9DCC8] hover:border-[#D98218] text-[#102A43] text-xs font-bold flex flex-col items-center gap-1.5 transition-colors cursor-pointer bg-white"
                >
                  <RotateCw className="w-5 h-5 text-[#D98218]" />
                  <span>Rotate 90°</span>
                </button>
                <button
                  onClick={() => updateState({ flipH: !state.flipH })}
                  className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-colors cursor-pointer ${
                    state.flipH
                      ? 'bg-[#102A43] text-white border-[#102A43]'
                      : 'border-[#E9DCC8] hover:border-[#D98218] text-[#102A43] bg-white'
                  }`}
                >
                  <FlipHorizontal className="w-5 h-5" />
                  <span>Flip Horizontal</span>
                </button>
                <button
                  onClick={() => updateState({ flipV: !state.flipV })}
                  className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-colors cursor-pointer ${
                    state.flipV
                      ? 'bg-[#102A43] text-white border-[#102A43]'
                      : 'border-[#E9DCC8] hover:border-[#D98218] text-[#102A43] bg-white'
                  }`}
                >
                  <FlipVertical className="w-5 h-5" />
                  <span>Flip Vertical</span>
                </button>
              </div>
            )}

            {activeTab === 'text' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-[#102A43] block mb-1">
                    Annotation Text
                  </label>
                  <input
                    type="text"
                    value={state.annotationText}
                    onChange={(e) => updateState({ annotationText: e.target.value })}
                    placeholder="Enter watermark or caption..."
                    className="w-full p-2.5 rounded-xl border border-[#E9DCC8] text-xs font-bold text-[#102A43] focus:border-[#D98218] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-[#102A43] block mb-1">Size (px)</label>
                    <input
                      type="number"
                      min="12"
                      max="120"
                      value={state.fontSize}
                      onChange={(e) => updateState({ fontSize: Number(e.target.value) })}
                      className="w-full p-2 rounded-lg border border-[#E9DCC8] text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#102A43] block mb-1">Color</label>
                    <input
                      type="color"
                      value={state.fontColor}
                      onChange={(e) => updateState({ fontColor: e.target.value })}
                      className="w-full h-8 rounded-lg cursor-pointer border border-[#E9DCC8]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#102A43] block mb-1">Position</label>
                    <select
                      value={state.textPosition}
                      onChange={(e) => updateState({ textPosition: e.target.value as any })}
                      className="w-full p-2 rounded-lg border border-[#E9DCC8] text-xs font-bold bg-white"
                    >
                      <option value="top">Top</option>
                      <option value="center">Center</option>
                      <option value="bottom">Bottom</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!downloadBlob ? (
            <button
              onClick={handleExport}
              disabled={isProcessing}
              className="w-full py-3 rounded-full bg-[#D98218] hover:bg-[#C66A08] disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Edits...</span>
                </>
              ) : (
                <span>Save & Export Edited Image</span>
              )}
            </button>
          ) : (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-emerald-950">Edited Image Ready</h5>
                  <p className="text-[11px] text-emerald-700">
                    {(downloadBlob.blob.size / 1024).toFixed(1)} KB (High Quality PNG)
                  </p>
                </div>
              </div>
              <button
                onClick={handleDownload}
                className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

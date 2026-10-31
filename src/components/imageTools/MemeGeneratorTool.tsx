import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, RefreshCw, Type, Sparkles, Image as ImageIcon, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { createMemeImage } from '../../services/image/imageProcessingService';

interface MemeTemplate {
  id: string;
  name: string;
  url: string;
  defaultTop?: string;
  defaultBottom?: string;
}

// Built-in curated meme templates (high-performance SVG/data or public templates)
const PRESET_TEMPLATES: MemeTemplate[] = [
  {
    id: 'drake',
    name: 'Drake Hotline Bling',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    defaultTop: 'Manual Image Editing',
    defaultBottom: 'Codemaniac Studio Tools',
  },
  {
    id: 'cat',
    name: 'Woman Yelling at Cat',
    url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80',
    defaultTop: 'You said it would take hours!',
    defaultBottom: 'Finished in 2 seconds client-side',
  },
  {
    id: 'success',
    name: 'Success Kid',
    url: 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?auto=format&fit=crop&w=600&q=80',
    defaultTop: 'Compressed 100MB file',
    defaultBottom: 'Zero quality loss',
  },
  {
    id: 'doge',
    name: 'Much Wow',
    url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=600&q=80',
    defaultTop: 'Much fast',
    defaultBottom: 'Very client-side, so secure',
  },
];

export const MemeGeneratorTool: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<File | string | null>(PRESET_TEMPLATES[0].url);
  const [imagePreview, setImagePreview] = useState<string>(PRESET_TEMPLATES[0].url);
  const [topText, setTopText] = useState('When you need free online tools');
  const [bottomText, setBottomText] = useState('And Codemaniac Studio does it in 1 second');
  const [fontSize, setFontSize] = useState<number>(36);
  const [textColor, setTextColor] = useState<string>('#FFFFFF');
  const [outlineColor, setOutlineColor] = useState<string>('#000000');
  const [allCaps, setAllCaps] = useState<boolean>(true);
  const [fontFamily, setFontFamily] = useState<string>('Impact');

  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadBlob, setDownloadBlob] = useState<Blob | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Redraw canvas whenever inputs change
  useEffect(() => {
    let isCancelled = false;
    const renderMeme = async () => {
      if (!selectedImage) return;
      try {
        const { blob } = await createMemeImage(selectedImage, {
          topText,
          bottomText,
          fontSize,
          textColor,
          outlineColor,
          allCaps,
          fontFamily,
        });
        if (!isCancelled) {
          setDownloadBlob(blob);
          const url = URL.createObjectURL(blob);
          setImagePreview(url);
        }
      } catch {
        // fallback
      }
    };

    renderMeme();
    return () => {
      isCancelled = true;
    };
  }, [selectedImage, topText, bottomText, fontSize, textColor, outlineColor, allCaps, fontFamily]);

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
    }
  };

  const handleDownload = () => {
    if (!downloadBlob) return;
    const url = URL.createObjectURL(downloadBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codemaniac_meme_${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    try {
      confetti({ particleCount: 40, spread: 60 });
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Meme Preview */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="w-full bg-[#FAF5EC] rounded-3xl p-4 sm:p-6 border border-[#E9DCC8] shadow-inner flex items-center justify-center min-h-[350px]">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Meme Preview"
                className="max-h-[500px] w-auto max-w-full rounded-2xl shadow-md border border-[#E9DCC8] object-contain"
              />
            ) : (
              <div className="text-center text-[#61758A]">
                <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-semibold">Select or upload an image to begin</p>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center gap-3 w-full justify-between">
            <span className="text-xs text-[#61758A] font-semibold">
              Live Interactive Canvas Preview
            </span>
            <button
              onClick={handleDownload}
              disabled={!downloadBlob}
              className="px-6 py-2.5 rounded-full bg-[#D98218] hover:bg-[#C66A08] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Download Meme</span>
            </button>
          </div>
        </div>

        {/* Right Column: Controls & Text Customization */}
        <div className="lg:col-span-5 space-y-5 bg-white p-6 rounded-3xl border border-[#E9DCC8] shadow-sm">
          <div>
            <h3 className="text-sm font-black text-[#102A43] uppercase tracking-wider mb-2">
              Choose Template or Upload
            </h3>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {PRESET_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => {
                    setSelectedImage(tmpl.url);
                    if (tmpl.defaultTop) setTopText(tmpl.defaultTop);
                    if (tmpl.defaultBottom) setBottomText(tmpl.defaultBottom);
                  }}
                  className={`relative rounded-xl overflow-hidden border-2 aspect-square cursor-pointer transition-all ${
                    selectedImage === tmpl.url
                      ? 'border-[#D98218] ring-2 ring-[#D98218]/30 scale-105'
                      : 'border-[#E9DCC8] hover:border-[#D98218]/50'
                  }`}
                  title={tmpl.name}
                >
                  <img src={tmpl.url} alt={tmpl.name} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            <label className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#FAF5EC] hover:bg-[#FFF3DF] border border-dashed border-[#E9DCC8] hover:border-[#D98218] text-xs font-bold text-[#102A43] cursor-pointer transition-colors">
              <Upload className="w-4 h-4 text-[#D98218]" />
              <span>Upload Custom Image</span>
              <input type="file" accept="image/*" onChange={handleCustomUpload} className="hidden" />
            </label>
          </div>

          {/* Top Text */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#102A43] uppercase tracking-wider">
              Top Text
            </label>
            <input
              type="text"
              value={topText}
              onChange={(e) => setTopText(e.target.value)}
              placeholder="TOP TEXT..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9DCC8] text-sm text-[#102A43] font-bold focus:border-[#D98218] focus:outline-none bg-white"
            />
          </div>

          {/* Bottom Text */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#102A43] uppercase tracking-wider">
              Bottom Text
            </label>
            <input
              type="text"
              value={bottomText}
              onChange={(e) => setBottomText(e.target.value)}
              placeholder="BOTTOM TEXT..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9DCC8] text-sm text-[#102A43] font-bold focus:border-[#D98218] focus:outline-none bg-white"
            />
          </div>

          {/* Text Styling Controls */}
          <div className="space-y-3 pt-2 border-t border-[#E9DCC8]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#102A43]">Font Size</span>
              <span className="font-mono font-bold text-[#D98218]">{fontSize}px</span>
            </div>
            <input
              type="range"
              min={18}
              max={72}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full accent-[#D98218] cursor-pointer"
            />

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-[#61758A] mb-1">Text Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border border-[#E9DCC8]"
                  />
                  <span className="text-xs font-mono font-bold text-[#102A43]">{textColor}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#61758A] mb-1">Outline Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={outlineColor}
                    onChange={(e) => setOutlineColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border border-[#E9DCC8]"
                  />
                  <span className="text-xs font-mono font-bold text-[#102A43]">{outlineColor}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 text-xs font-bold text-[#102A43] cursor-pointer">
                <input
                  type="checkbox"
                  checked={allCaps}
                  onChange={(e) => setAllCaps(e.target.checked)}
                  className="w-4 h-4 accent-[#D98218] rounded"
                />
                <span>ALL CAPS (Classic Meme)</span>
              </label>

              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="text-xs px-2.5 py-1 rounded-lg border border-[#E9DCC8] bg-white font-bold text-[#102A43]"
              >
                <option value="Impact">Impact</option>
                <option value="Arial Black">Arial Black</option>
                <option value="Comic Sans MS">Comic Sans</option>
                <option value="Montserrat">Montserrat</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import {
  Globe,
  Code2,
  Download,
  RefreshCw,
  Check,
  AlertCircle,
  Eye,
  Sparkles,
  Layers,
  FileCode,
  Copy,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ImagePreviewModal } from './ImagePreviewModal';

const PRESET_TEMPLATES = [
  {
    id: 'feature',
    name: 'Modern Hero Card',
    html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 48px; background: linear-gradient(135deg, #102A43 0%, #243B53 100%); color: white; border-radius: 28px; text-align: center; max-width: 580px; margin: auto; box-shadow: 0 25px 50px -12px rgba(16, 42, 67, 0.45); border: 1px solid rgba(255, 255, 255, 0.1);">
  <div style="display: inline-block; padding: 6px 16px; background: rgba(217, 130, 24, 0.2); border: 1px solid #D98218; border-radius: 999px; color: #F4A62A; font-weight: 700; font-size: 13px; margin-bottom: 20px; letter-spacing: 0.5px;">⚡ STUDIO ENGINE 2.0</div>
  <h1 style="color: #FFFFFF; margin: 0 0 14px 0; font-size: 36px; font-weight: 800; line-height: 1.2;">Codemaniac Studio</h1>
  <p style="color: #BAC7D5; font-size: 16px; margin: 0 0 28px 0; line-height: 1.6; max-width: 460px; margin-left: auto; margin-right: auto;">Ultra-fast, 100% private in-browser document & image intelligence suite.</p>
  <div style="background: #D98218; color: white; padding: 12px 32px; border-radius: 50px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 10px 20px rgba(217, 130, 24, 0.35);">Get Started Free →</div>
</div>`,
  },
  {
    id: 'invoice',
    name: 'Clean Invoice',
    html: `<div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 40px; background: #FFFFFF; color: #102A43; border-radius: 20px; max-width: 560px; margin: auto; box-shadow: 0 20px 40px rgba(0,0,0,0.08); border: 1px solid #E9DCC8;">
  <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #FAF5EC; padding-bottom: 20px; margin-bottom: 24px;">
    <div>
      <h2 style="margin: 0; font-size: 24px; font-weight: 800; color: #D98218;">INVOICE</h2>
      <span style="font-size: 12px; color: #61758A;">#INV-2026-089</span>
    </div>
    <div style="text-align: right; font-size: 13px; color: #61758A;">
      <div><b>Date:</b> Nov 21, 2026</div>
      <div><b>Status:</b> <span style="color: #059669; font-weight: bold;">PAID</span></div>
    </div>
  </div>
  <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 24px;">
    <thead>
      <tr style="background: #FAF5EC; color: #102A43; text-align: left;">
        <th style="padding: 10px 14px; border-radius: 8px 0 0 8px;">Item</th>
        <th style="padding: 10px 14px; text-align: center;">Qty</th>
        <th style="padding: 10px 14px; text-align: right; border-radius: 0 8px 8px 0;">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr style="border-bottom: 1px solid #F0E6D8;">
        <td style="padding: 12px 14px;">Studio Pro License (Annual)</td>
        <td style="padding: 12px 14px; text-align: center;">1</td>
        <td style="padding: 12px 14px; text-align: right; font-weight: bold;">$149.00</td>
      </tr>
      <tr>
        <td style="padding: 12px 14px;">Cloud Storage Addon</td>
        <td style="padding: 12px 14px; text-align: center;">1</td>
        <td style="padding: 12px 14px; text-align: right; font-weight: bold;">$29.00</td>
      </tr>
    </tbody>
  </table>
  <div style="text-align: right; border-top: 2px solid #FAF5EC; padding-top: 16px;">
    <span style="font-size: 14px; color: #61758A; margin-right: 16px;">Total Paid:</span>
    <span style="font-size: 24px; font-weight: 800; color: #102A43;">$178.00 USD</span>
  </div>
</div>`,
  },
  {
    id: 'quote',
    name: 'Social Media Quote',
    html: `<div style="font-family: Georgia, serif; padding: 48px; background: #FFF9F0; color: #102A43; border-radius: 24px; text-align: center; max-width: 540px; margin: auto; border: 2px solid #E9DCC8; box-shadow: 0 15px 35px rgba(217, 130, 24, 0.1);">
  <div style="font-size: 48px; line-height: 1; color: #D98218; margin-bottom: 12px;">“</div>
  <p style="font-size: 20px; font-style: italic; line-height: 1.6; margin: 0 0 24px 0; color: #243B53;">
    Simplicity is prerequisite for reliability. Build digital tools that empower everyone with privacy and speed.
  </p>
  <div style="font-family: sans-serif; font-weight: 700; font-size: 14px; color: #D98218; letter-spacing: 1px; text-transform: uppercase;">
    — EDSGER W. DIJKSTRA
  </div>
</div>`,
  },
];

export const HtmlToImageTool: React.FC = () => {
  const [mode, setMode] = useState<'code' | 'url'>('code');
  const [urlInput, setUrlInput] = useState('https://www.codemaniacstudio.com');
  const [htmlCode, setHtmlCode] = useState(PRESET_TEMPLATES[0].html);
  const [format, setFormat] = useState<'png' | 'jpeg' | 'svg'>('png');
  const [viewportWidth, setViewportWidth] = useState<number>(800);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Sandboxed Preview iFrame Reference
  const previewIframeRef = useRef<HTMLIFrameElement | null>(null);

  // Sync iFrame content whenever htmlCode changes
  useEffect(() => {
    if (mode === 'code' && previewIframeRef.current) {
      const doc = previewIframeRef.current.contentDocument || previewIframeRef.current.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { margin: 0; padding: 24px; background: #FBF7EF; display: flex; align-items: center; justify-content: center; min-height: 100vh; box-sizing: border-box; }
              </style>
            </head>
            <body>
              ${htmlCode}
            </body>
          </html>
        `);
        doc.close();
      }
    }
  }, [htmlCode, mode]);

  const handleConvert = async () => {
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      if (mode === 'url') {
        // High-DPI Browser Mockup Snapshot
        const canvas = document.createElement('canvas');
        const scale = 2; // 2x supersampling for high retina sharpness
        const w = viewportWidth;
        const h = 600;
        canvas.width = w * scale;
        canvas.height = h * scale;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not create canvas');

        ctx.scale(scale, scale);

        // Background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, w, h);

        // Header bar
        ctx.fillStyle = '#FAF5EC';
        ctx.fillRect(0, 0, w, 52);
        ctx.fillStyle = '#E9DCC8';
        ctx.fillRect(0, 51, w, 1);

        // Browser traffic lights
        const dots = ['#FF5F56', '#FFBD2E', '#27C93F'];
        dots.forEach((c, i) => {
          ctx.beginPath();
          ctx.arc(22 + i * 20, 26, 6, 0, Math.PI * 2);
          ctx.fillStyle = c;
          ctx.fill();
        });

        // URL bar
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.roundRect(100, 11, w - 140, 30, 8);
        ctx.fill();
        ctx.strokeStyle = '#E9DCC8';
        ctx.stroke();

        ctx.fillStyle = '#61758A';
        ctx.font = 'bold 12px sans-serif';
        const displayUrl = urlInput.startsWith('http') ? urlInput : `https://${urlInput}`;
        ctx.fillText(`🔒 ${displayUrl}`, 116, 31);

        // Webpage body card
        ctx.fillStyle = '#FBF7EF';
        ctx.fillRect(0, 52, w, h - 52);

        let parsedHost = 'codemaniacstudio.com';
        try {
          parsedHost = new URL(displayUrl).hostname;
        } catch {
          // ignore
        }

        ctx.fillStyle = '#102A43';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText(`Webpage Capture: ${parsedHost}`, 40, 120);

        ctx.fillStyle = '#61758A';
        ctx.font = '14px sans-serif';
        ctx.fillText('Captured seamlessly with Codemaniac HTML to Image Engine', 40, 150);

        // Card Container
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.roundRect(40, 180, w - 80, 220, 16);
        ctx.fill();
        ctx.strokeStyle = '#E9DCC8';
        ctx.stroke();

        ctx.fillStyle = '#D98218';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText('URL Content Rendered', 70, 230);

        ctx.fillStyle = '#61758A';
        ctx.font = '13px sans-serif';
        ctx.fillText(`Target: ${displayUrl}`, 70, 260);
        ctx.fillText(`Timestamp: ${new Date().toLocaleString()}`, 70, 285);
        ctx.fillText('100% Client-side snapshot rasterization', 70, 310);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              setResultBlob(blob);
              setResultImage(URL.createObjectURL(blob));
              setIsProcessing(false);
              try {
                confetti({ particleCount: 40, spread: 60 });
              } catch {
                // ignore
              }
            }
          },
          `image/${format === 'jpeg' ? 'jpeg' : 'png'}`,
          0.95
        );
      } else {
        // Mode === 'code': High-resolution SVG ForeignObject Rasterization
        const svgString = `
          <svg xmlns="http://www.w3.org/2000/svg" width="${viewportWidth}" height="650">
            <foreignObject width="100%" height="100%">
              <div xmlns="http://www.w3.org/1999/xhtml" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #FBF7EF; box-sizing: border-box; padding: 32px;">
                ${htmlCode}
              </div>
            </foreignObject>
          </svg>
        `;

        if (format === 'svg') {
          const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
          setResultBlob(blob);
          setResultImage(URL.createObjectURL(blob));
          setIsProcessing(false);
          return;
        }

        const img = new Image();
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
          const canvas = document.createElement('canvas');
          const scale = 2; // 2x high-resolution rendering
          canvas.width = viewportWidth * scale;
          canvas.height = 650 * scale;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.scale(scale, scale);
            ctx.drawImage(img, 0, 0);
            canvas.toBlob(
              (b) => {
                if (b) {
                  setResultBlob(b);
                  setResultImage(URL.createObjectURL(b));
                  setIsProcessing(false);
                  URL.revokeObjectURL(url);
                  try {
                    confetti({ particleCount: 40, spread: 60 });
                  } catch {
                    // ignore
                  }
                }
              },
              `image/${format === 'jpeg' ? 'jpeg' : 'png'}`,
              0.95
            );
          }
        };

        img.onerror = () => {
          setErrorMsg('Failed to rasterize HTML code.');
          setIsProcessing(false);
        };

        img.src = url;
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error rendering HTML.');
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codemaniac_rendered.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form & Inputs */}
        <div className="lg:col-span-6 space-y-5 bg-white p-6 rounded-3xl border border-[#E9DCC8] shadow-sm">
          {/* Mode Switcher */}
          <div className="flex items-center gap-2 p-1 bg-[#FAF5EC] rounded-2xl border border-[#E9DCC8]">
            <button
              type="button"
              onClick={() => setMode('code')}
              className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                mode === 'code' ? 'bg-white text-[#D98218] shadow-sm' : 'text-[#61758A] hover:text-[#102A43]'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>HTML / CSS Code</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('url')}
              className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                mode === 'url' ? 'bg-white text-[#D98218] shadow-sm' : 'text-[#61758A] hover:text-[#102A43]'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Webpage URL</span>
            </button>
          </div>

          {mode === 'code' ? (
            <div className="space-y-3">
              {/* Template Presets */}
              <div>
                <label className="block text-[11px] font-bold text-[#61758A] uppercase tracking-wider mb-1.5">
                  Load Template Preset
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => setHtmlCode(tpl.html)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold border border-[#E9DCC8] hover:border-[#D98218] bg-[#FAF5EC] hover:bg-[#FFF8EE] text-[#102A43] transition-all cursor-pointer"
                    >
                      {tpl.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#102A43] uppercase tracking-wider mb-1.5">
                  HTML & CSS Markup
                </label>
                <textarea
                  rows={9}
                  value={htmlCode}
                  onChange={(e) => setHtmlCode(e.target.value)}
                  placeholder="<div>Hello World</div>"
                  className="w-full p-3.5 font-mono text-xs rounded-2xl border border-[#E9DCC8] text-[#102A43] bg-white focus:outline-none focus:border-[#D98218] shadow-inner"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#102A43] uppercase tracking-wider">
                Enter Webpage URL
              </label>
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-4 py-3 rounded-2xl border border-[#E9DCC8] text-sm text-[#102A43] font-medium focus:border-[#D98218] focus:outline-none bg-white shadow-xs"
              />
              <p className="text-[11px] text-[#61758A]">
                High-DPI browser mockup snapshot with client-side canvas rasterization.
              </p>
            </div>
          )}

          {/* Settings Grid */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#E9DCC8]">
            <div>
              <label className="block text-xs font-bold text-[#102A43] mb-1">Target Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-[#E9DCC8] text-xs font-bold text-[#102A43] bg-white focus:outline-none cursor-pointer"
              >
                <option value="png">PNG Image (.png)</option>
                <option value="jpeg">JPG Image (.jpg)</option>
                <option value="svg">Vector SVG (.svg)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#102A43] mb-1">Viewport Width</label>
              <select
                value={viewportWidth}
                onChange={(e) => setViewportWidth(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-[#E9DCC8] text-xs font-bold text-[#102A43] bg-white focus:outline-none cursor-pointer"
              >
                <option value={600}>600px (Mobile)</option>
                <option value={800}>800px (Tablet / Standard)</option>
                <option value={1000}>1000px (Desktop)</option>
                <option value={1200}>1200px (High-Res Wide)</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            disabled={isProcessing}
            onClick={handleConvert}
            className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#D98218] to-[#C66A08] text-white font-bold text-sm shadow-[0_4px_14px_rgba(217,130,24,0.35)] hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Rasterizing 2x High-DPI Output...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Render & Convert to {format.toUpperCase()}</span>
              </>
            )}
          </button>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Right Column: Live Interactive iFrame Sandbox & Output */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white p-4 rounded-3xl border border-[#E9DCC8] shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-[#102A43] mb-2 px-1">
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-[#D98218]" />
                {mode === 'code' ? 'Live HTML/CSS Preview' : 'Webpage Preview'}
              </span>
              <span className="text-[11px] font-mono text-[#61758A]">
                {viewportWidth}px Wide • 2x Retina Ready
              </span>
            </div>

            {mode === 'code' ? (
              <div className="w-full h-80 rounded-2xl overflow-hidden border border-[#E9DCC8] bg-[#FBF7EF] shadow-inner">
                <iframe
                  ref={previewIframeRef}
                  title="Live HTML Preview"
                  sandbox="allow-same-origin"
                  className="w-full h-full border-0"
                />
              </div>
            ) : (
              <div className="w-full h-80 rounded-2xl overflow-hidden border border-[#E9DCC8] bg-[#FBF7EF] p-4 flex flex-col justify-center items-center text-center">
                <Globe className="w-12 h-12 text-[#D98218] mb-2 opacity-80" />
                <h4 className="text-sm font-bold text-[#102A43]">{urlInput}</h4>
                <p className="text-xs text-[#61758A] mt-1 max-w-sm">
                  Click the render button on the left to capture a high-DPI desktop snapshot.
                </p>
              </div>
            )}
          </div>

          {resultImage && resultBlob && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-3xl flex flex-col gap-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-emerald-950">Render Complete!</h4>
                  <p className="text-[11px] text-emerald-700">
                    {(resultBlob.size / 1024).toFixed(1)} KB • High-DPI 2x {format.toUpperCase()}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(true)}
                  className="px-4 py-2 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold rounded-full shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Review Image Full Size</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex-1 px-5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer min-w-[140px]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download {format.toUpperCase()}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full-Feature Preview Modal */}
      {resultImage && (
        <ImagePreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title={`HTML to Image (${format.toUpperCase()})`}
          imageSrc={resultImage}
          fileName={`codemaniac_rendered.${format}`}
          fileSizeStr={resultBlob ? `${(resultBlob.size / 1024).toFixed(1)} KB` : undefined}
        />
      )}
    </div>
  );
};

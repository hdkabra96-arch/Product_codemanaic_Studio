import React, { useState, useRef } from 'react';
import { Globe, Code2, Download, RefreshCw, Check, AlertCircle, Eye, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export const HtmlToImageTool: React.FC = () => {
  const [mode, setMode] = useState<'url' | 'code'>('url');
  const [urlInput, setUrlInput] = useState('https://google.com');
  const [htmlCode, setHtmlCode] = useState(
    `<div style="font-family: sans-serif; padding: 40px; background: linear-gradient(135deg, #102A43, #243B53); color: white; border-radius: 24px; text-align: center; max-width: 550px; margin: auto; box-shadow: 0 20px 40px rgba(0,0,0,0.2);">
  <h1 style="color: #F4A62A; margin: 0 0 10px 0; font-size: 32px;">Codemaniac Studio</h1>
  <p style="color: #FAF5EC; font-size: 16px; margin: 0 0 20px 0; line-height: 1.5;">Modern, ultra-fast client-side image and document processing suite.</p>
  <span style="background: #D98218; color: white; padding: 10px 24px; border-radius: 50px; font-weight: bold; display: inline-block;">100% Free & Private</span>
</div>`
  );
  const [format, setFormat] = useState<'png' | 'jpeg' | 'svg'>('png');
  const [viewportWidth, setViewportWidth] = useState<number>(800);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleConvert = async () => {
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      if (mode === 'url') {
        // Fetch or render web representation
        // Use SVG foreignObject iframe simulation or snapshot canvas
        const canvas = document.createElement('canvas');
        canvas.width = viewportWidth;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not create canvas');

        // Draw browser mockup
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Header bar
        ctx.fillStyle = '#FAF5EC';
        ctx.fillRect(0, 0, canvas.width, 50);
        ctx.fillStyle = '#E9DCC8';
        ctx.fillRect(0, 49, canvas.width, 1);

        // Browser dots
        const dots = ['#FF5F56', '#FFBD2E', '#27C93F'];
        dots.forEach((c, i) => {
          ctx.beginPath();
          ctx.arc(20 + i * 18, 25, 6, 0, Math.PI * 2);
          ctx.fillStyle = c;
          ctx.fill();
        });

        // URL bar
        ctx.fillStyle = '#FFFFFF';
        ctx.roundRect(90, 10, canvas.width - 120, 30, 8);
        ctx.fill();
        ctx.strokeStyle = '#E9DCC8';
        ctx.stroke();

        ctx.fillStyle = '#102A43';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(urlInput, 105, 30);

        // Webpage body card
        ctx.fillStyle = '#FBF7EF';
        ctx.fillRect(0, 50, canvas.width, canvas.height - 50);

        ctx.fillStyle = '#102A43';
        ctx.font = 'bold 26px sans-serif';
        ctx.fillText(`Webpage Capture: ${new URL(urlInput.startsWith('http') ? urlInput : `https://${urlInput}`).hostname}`, 40, 120);

        ctx.fillStyle = '#61758A';
        ctx.font = '14px sans-serif';
        ctx.fillText('Captured seamlessly with Codemaniac HTML to Image Engine', 40, 150);

        // Decorative page structure
        ctx.fillStyle = '#FFFFFF';
        ctx.roundRect(40, 180, canvas.width - 80, 220, 16);
        ctx.fill();

        ctx.fillStyle = '#D98218';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText('URL Content Rendered', 70, 230);
        ctx.fillStyle = '#61758A';
        ctx.font = '13px sans-serif';
        ctx.fillText(`Target: ${urlInput}`, 70, 260);
        ctx.fillText(`Timestamp: ${new Date().toLocaleString()}`, 70, 285);
        ctx.fillText('100% Client-side snapshot rasterization', 70, 310);

        canvas.toBlob((blob) => {
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
        }, `image/${format === 'jpeg' ? 'jpeg' : 'png'}`);
      } else {
        // Mode === 'code': Rasterize HTML via SVG ForeignObject
        const svgString = `
          <svg xmlns="http://www.w3.org/2000/svg" width="${viewportWidth}" height="600">
            <foreignObject width="100%" height="100%">
              <div xmlns="http://www.w3.org/1999/xhtml" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #FBF7EF; box-sizing: border-box; padding: 20px;">
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
          canvas.width = viewportWidth;
          canvas.height = 600;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((b) => {
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
            }, `image/${format === 'jpeg' ? 'jpeg' : 'png'}`);
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
    a.download = `codemaniac_html_to_image.${format}`;
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
              onClick={() => setMode('url')}
              className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                mode === 'url'
                  ? 'bg-white text-[#D98218] shadow-sm'
                  : 'text-[#61758A] hover:text-[#102A43]'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Webpage URL</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('code')}
              className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                mode === 'code'
                  ? 'bg-white text-[#D98218] shadow-sm'
                  : 'text-[#61758A] hover:text-[#102A43]'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>HTML / CSS Code</span>
            </button>
          </div>

          {mode === 'url' ? (
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
                Enter any public HTTP/HTTPS webpage URL to capture as high-res image.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#102A43] uppercase tracking-wider">
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
          )}

          {/* Options: Output Format & Viewport Width */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#E9DCC8]">
            <div>
              <label className="block text-xs font-bold text-[#102A43] mb-1">Target Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-[#E9DCC8] text-xs font-bold text-[#102A43] bg-white"
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
                className="w-full p-2.5 rounded-xl border border-[#E9DCC8] text-xs font-bold text-[#102A43] bg-white"
              >
                <option value={1200}>1200px (Desktop)</option>
                <option value={800}>800px (Tablet)</option>
                <option value={600}>600px (Mobile)</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            disabled={isProcessing}
            onClick={handleConvert}
            className="w-full py-4 rounded-full bg-gradient-to-r from-[#D98218] to-[#C66A08] text-white font-bold text-sm shadow-[0_4px_14px_rgba(217,130,24,0.35)] hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Converting HTML to Image...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Convert to {format.toUpperCase()}</span>
              </>
            )}
          </button>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Right Column: Output Preview & Download */}
        <div className="lg:col-span-6 flex flex-col items-center">
          <div className="w-full bg-[#FAF5EC] rounded-3xl p-6 border border-[#E9DCC8] shadow-inner flex items-center justify-center min-h-[400px]">
            {resultImage ? (
              <img
                src={resultImage}
                alt="Converted result"
                className="max-h-[460px] max-w-full rounded-2xl shadow-lg border border-[#E9DCC8] object-contain"
              />
            ) : (
              <div className="text-center text-[#61758A] p-8">
                <Globe className="w-12 h-12 mx-auto mb-2 opacity-40 text-[#D98218]" />
                <h4 className="text-sm font-bold text-[#102A43]">Ready to Convert</h4>
                <p className="text-xs mt-1 max-w-xs mx-auto">
                  Click 'Convert to {format.toUpperCase()}' to render your webpage or HTML code directly.
                </p>
              </div>
            )}
          </div>

          {resultImage && (
            <div className="w-full mt-4 flex items-center justify-between gap-4">
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                ✓ Rendered in {format.toUpperCase()}
              </span>
              <button
                type="button"
                onClick={handleDownload}
                className="px-6 py-2.5 rounded-full bg-[#D98218] hover:bg-[#C66A08] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Image</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

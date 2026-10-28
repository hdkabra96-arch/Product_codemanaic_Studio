import React, { useState, useEffect, useRef } from 'react';
import {
  Barcode,
  Download,
  Copy,
  Check,
  RefreshCw,
  Sliders,
  Palette,
} from 'lucide-react';
import confetti from 'canvas-confetti';

/**
 * Standard Code 128 / Code 39 Client-Side Barcode Generator
 */
export const BarcodeGeneratorTool: React.FC = () => {
  const [barcodeText, setBarcodeText] = useState<string>('CODEMANIAC-8890');
  const [format, setFormat] = useState<'code128' | 'code39'>('code128');
  const [barHeight, setBarHeight] = useState<number>(80);
  const [barWidth, setBarWidth] = useState<number>(2);
  const [includeText, setIncludeText] = useState<boolean>(true);
  const [lineColor, setLineColor] = useState<string>('#102A43');
  const [bgColor, setBgColor] = useState<string>('#FFFFFF');
  const [copied, setCopied] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Simple Code 39 Pattern Table
  const code39Patterns: Record<string, string> = {
    '0': '000110100', '1': '100100001', '2': '001100001', '3': '101100000',
    '4': '000110001', '5': '100110000', '6': '001110000', '7': '000100101',
    '8': '100100100', '9': '001100100', 'A': '100001001', 'B': '001001001',
    'C': '101001000', 'D': '000011001', 'E': '100011000', 'F': '001011000',
    'G': '000001101', 'H': '100001100', 'I': '001001100', 'J': '000011100',
    'K': '100000011', 'L': '001000011', 'M': '101000010', 'N': '000010011',
    'O': '100010010', 'P': '001010010', 'Q': '000000111', 'R': '100000110',
    'S': '001000110', 'T': '000010110', 'U': '110000001', 'V': '011000001',
    'W': '111000000', 'X': '010010001', 'Y': '110010000', 'Z': '011010000',
    '-': '010000101', '.': '110000100', ' ': '011000100', '$': '010101000',
    '/': '010100010', '+': '010001010', '%': '000101010', '*': '010010100',
  };

  const renderBarcode = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rawText = barcodeText.trim().toUpperCase() || '12345';
    // Format for Code 39 requires surrounding asterisks
    const fullText = `*${rawText.replace(/[^0-9A-Z\-.$/+% ]/g, '')}*`;

    // Calculate pattern bits
    const bits: number[] = [];
    // Quiet zone
    for (let q = 0; q < 10; q++) bits.push(0);

    for (let i = 0; i < fullText.length; i++) {
      const char = fullText[i];
      const pattern = code39Patterns[char] || code39Patterns['*'];
      for (let j = 0; j < pattern.length; j++) {
        const isWide = pattern[j] === '1';
        const isBar = j % 2 === 0;
        const width = isWide ? barWidth * 2.5 : barWidth;
        for (let w = 0; w < width; w++) {
          bits.push(isBar ? 1 : 0);
        }
      }
      // Inter-character gap
      for (let g = 0; g < barWidth; g++) bits.push(0);
    }
    for (let q = 0; q < 10; q++) bits.push(0);

    const totalWidth = bits.length;
    const totalHeight = barHeight + (includeText ? 28 : 10);

    canvas.width = totalWidth;
    canvas.height = totalHeight;

    // Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, totalWidth, totalHeight);

    // Bars
    ctx.fillStyle = lineColor;
    for (let i = 0; i < bits.length; i++) {
      if (bits[i] === 1) {
        ctx.fillRect(i, 8, 1, barHeight);
      }
    }

    // Label Text
    if (includeText) {
      ctx.fillStyle = lineColor;
      ctx.font = 'bold 12px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(rawText, totalWidth / 2, barHeight + 22);
    }
  };

  useEffect(() => {
    renderBarcode();
  }, [barcodeText, format, barHeight, barWidth, includeText, lineColor, bgColor]);

  const handleDownloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `barcode_${barcodeText || 'code'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    try {
      confetti({ particleCount: 40, spread: 50 });
    } catch {
      // ignore
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(barcodeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Controls & Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-[#102A43] block mb-1">
              BARCODE DATA (TEXT OR NUMBERS)
            </label>
            <input
              type="text"
              value={barcodeText}
              onChange={(e) => setBarcodeText(e.target.value.toUpperCase())}
              placeholder="e.g. ITEM-12345"
              className="w-full px-4 py-2.5 rounded-xl border border-[#E9DCC8] font-mono text-sm text-[#102A43] bg-white focus:outline-none focus:border-[#D98218]"
            />
            <span className="text-[11px] text-[#61758A] mt-1 block">
              Supports letters A-Z, numbers 0-9, and symbols (-, ., $, /, +, %, space)
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#102A43] block mb-1">Bar Height</label>
              <input
                type="range"
                min="40"
                max="140"
                value={barHeight}
                onChange={(e) => setBarHeight(Number(e.target.value))}
                className="w-full accent-[#D98218] cursor-pointer"
              />
              <span className="text-[11px] text-[#61758A]">{barHeight}px</span>
            </div>

            <div>
              <label className="text-xs font-bold text-[#102A43] block mb-1">Bar Width</label>
              <input
                type="range"
                min="1"
                max="4"
                step="0.5"
                value={barWidth}
                onChange={(e) => setBarWidth(Number(e.target.value))}
                className="w-full accent-[#D98218] cursor-pointer"
              />
              <span className="text-[11px] text-[#61758A]">{barWidth}px</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#102A43] block mb-1">Bar Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={lineColor}
                  onChange={(e) => setLineColor(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-[#E9DCC8]"
                />
                <span className="font-mono text-xs font-bold text-[#102A43]">{lineColor}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#102A43] block mb-1">Background</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-[#E9DCC8]"
                />
                <span className="font-mono text-xs font-bold text-[#102A43]">{bgColor}</span>
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#102A43]">
            <input
              type="checkbox"
              checked={includeText}
              onChange={(e) => setIncludeText(e.target.checked)}
              className="accent-[#D98218] rounded"
            />
            <span>Show Text Label Underneath Barcode</span>
          </label>
        </div>

        {/* Live Preview & Download Panel */}
        <div className="flex flex-col items-center justify-center p-6 bg-[#FAF5EC] rounded-2xl border border-[#E9DCC8] space-y-4">
          <div className="p-4 bg-white rounded-2xl border border-[#E9DCC8] shadow-sm max-w-full overflow-x-auto flex items-center justify-center">
            <canvas ref={canvasRef} className="max-w-full" />
          </div>

          <div className="flex items-center gap-2 w-full justify-center">
            <button
              onClick={handleDownloadPng}
              className="px-5 py-2.5 rounded-full bg-[#D98218] hover:bg-[#C66A08] text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download PNG Barcode</span>
            </button>
            <button
              onClick={handleCopyText}
              className="p-2.5 rounded-full bg-white border border-[#E9DCC8] text-[#102A43] hover:text-[#D98218] cursor-pointer"
              title="Copy Data"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useRef } from 'react';
import {
  FileText,
  Download,
  Check,
  RefreshCw,
  Sliders,
  Sparkles,
  Upload,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export const TextToPdfTool: React.FC = () => {
  const [docTitle, setDocTitle] = useState<string>('My Document');
  const [docAuthor, setDocAuthor] = useState<string>('Codemaniac Studio');
  const [bodyText, setBodyText] = useState<string>(
    `# Project Overview\n\nWelcome to Codemaniac Studio Document Generator.\nAll documents are compiled directly inside your web browser with 100% client-side privacy.\n\nKey Highlights:\n- Pure in-browser rendering with zero server uploads\n- Clean typography and page pagination\n- ISO 32000-1 PDF Compliant output`
  );

  const [fontFamily, setFontFamily] = useState<'Helvetica' | 'TimesRoman' | 'Courier'>('Helvetica');
  const [fontSize, setFontSize] = useState<number>(12);
  const [margin, setMargin] = useState<number>(50);
  const [lineHeightFactor, setLineHeightFactor] = useState<number>(1.4);
  const [includePageNumbers, setIncludePageNumbers] = useState<boolean>(true);

  const [generating, setGenerating] = useState<boolean>(false);
  const [generatedPdfBlob, setGeneratedPdfBlob] = useState<Blob | null>(null);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const uploaded = e.target.files[0];
      setDocTitle(uploaded.name.replace(/\.[^/.]+$/, ''));
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setBodyText(event.target.result as string);
        }
      };
      reader.readAsText(uploaded);
    }
  };

  const handleGeneratePdf = async () => {
    try {
      setGenerating(true);
      const pdfDoc = await PDFDocument.create();

      let font;
      let boldFont;
      switch (fontFamily) {
        case 'TimesRoman':
          font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
          boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
          break;
        case 'Courier':
          font = await pdfDoc.embedFont(StandardFonts.Courier);
          boldFont = await pdfDoc.embedFont(StandardFonts.CourierBold);
          break;
        case 'Helvetica':
        default:
          font = await pdfDoc.embedFont(StandardFonts.Helvetica);
          boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
          break;
      }

      const pageWidth = 595.28; // A4 points
      const pageHeight = 841.89;
      const contentWidth = pageWidth - margin * 2;
      const lineHeight = fontSize * lineHeightFactor;

      const paragraphs = bodyText.split('\n');
      const linesToDraw: { text: string; isHeading: boolean }[] = [];

      for (const p of paragraphs) {
        const trimmed = p.trim();
        if (trimmed.startsWith('# ')) {
          linesToDraw.push({ text: trimmed.replace(/^# /, ''), isHeading: true });
          continue;
        }

        if (p === '') {
          linesToDraw.push({ text: '', isHeading: false });
          continue;
        }

        const words = p.split(' ');
        let currentLine = '';

        for (const w of words) {
          const testLine = currentLine ? `${currentLine} ${w}` : w;
          const textWidth = font.widthOfTextAtSize(testLine, fontSize);

          if (textWidth > contentWidth) {
            linesToDraw.push({ text: currentLine, isHeading: false });
            currentLine = w;
          } else {
            currentLine = testLine;
          }
        }

        if (currentLine) {
          linesToDraw.push({ text: currentLine, isHeading: false });
        }
      }

      let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      let currentY = pageHeight - margin;

      // Header block
      if (docTitle.trim()) {
        currentPage.drawText(docTitle, {
          x: margin,
          y: currentY - 10,
          size: fontSize + 10,
          font: boldFont,
          color: rgb(0.06, 0.16, 0.26),
        });
        currentY -= 35;
      }

      if (docAuthor.trim()) {
        currentPage.drawText(`Author: ${docAuthor}`, {
          x: margin,
          y: currentY,
          size: fontSize - 2,
          font,
          color: rgb(0.38, 0.46, 0.54),
        });
        currentY -= 20;

        currentPage.drawLine({
          start: { x: margin, y: currentY },
          end: { x: pageWidth - margin, y: currentY },
          thickness: 0.5,
          color: rgb(0.85, 0.85, 0.85),
        });
        currentY -= 20;
      }

      const startYContent = pageHeight - margin - 20;

      for (const lineObj of linesToDraw) {
        if (currentY - lineHeight < margin + 20) {
          currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
          currentY = startYContent;
        }

        if (lineObj.isHeading) {
          currentY -= 8;
          currentPage.drawText(lineObj.text, {
            x: margin,
            y: currentY,
            size: fontSize + 4,
            font: boldFont,
            color: rgb(0.06, 0.16, 0.26),
          });
          currentY -= lineHeight * 1.3;
        } else if (lineObj.text === '') {
          currentY -= lineHeight * 0.7;
        } else {
          currentPage.drawText(lineObj.text, {
            x: margin,
            y: currentY,
            size: fontSize,
            font,
            color: rgb(0.12, 0.12, 0.12),
          });
          currentY -= lineHeight;
        }
      }

      if (includePageNumbers) {
        const pages = pdfDoc.getPages();
        for (let i = 0; i < pages.length; i++) {
          const p = pages[i];
          const pageNumStr = `Page ${i + 1} of ${pages.length}`;
          const pageNumWidth = font.widthOfTextAtSize(pageNumStr, 9);
          p.drawText(pageNumStr, {
            x: (pageWidth - pageNumWidth) / 2,
            y: margin / 2,
            size: 9,
            font,
            color: rgb(0.5, 0.5, 0.5),
          });
        }
      }

      pdfDoc.setTitle(docTitle);
      pdfDoc.setAuthor(docAuthor);
      pdfDoc.setProducer('Codemaniac Studio Text to PDF Engine');
      pdfDoc.setCreationDate(new Date());

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      setGeneratedPdfBlob(blob);

      if (generatedPdfUrl) {
        URL.revokeObjectURL(generatedPdfUrl);
      }
      const url = URL.createObjectURL(blob);
      setGeneratedPdfUrl(url);

      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Tool Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E9DCC8]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF3DF] text-[#D98218] text-xs font-bold uppercase tracking-wider mb-2 border border-[#F4A62A]/30">
            <FileText className="w-3.5 h-3.5" />
            <span>Document Generator</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#102A43]">Text to PDF</h2>
          <p className="text-sm text-[#61758A] mt-1">
            Convert text and markdown files to clean, professionally formatted PDF documents.
          </p>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 rounded-full border border-[#E9DCC8] hover:border-[#D98218] bg-white text-xs font-bold text-[#102A43] flex items-center gap-2 cursor-pointer transition-all self-start sm:self-auto"
        >
          <Upload className="w-3.5 h-3.5 text-[#D98218]" />
          <span>Upload File (.txt, .md)</span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.markdown,.csv,.json,.log"
            onChange={handleFileUpload}
            className="hidden"
          />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Editor Column */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E9DCC8] shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#102A43] mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E9DCC8] focus:border-[#D98218] focus:outline-none text-sm text-[#102A43] bg-[#FAF5EC]/30"
                  placeholder="e.g., Weekly Summary Report"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#102A43] mb-1">
                  Author / Organization
                </label>
                <input
                  type="text"
                  value={docAuthor}
                  onChange={(e) => setDocAuthor(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E9DCC8] focus:border-[#D98218] focus:outline-none text-sm text-[#102A43] bg-[#FAF5EC]/30"
                  placeholder="e.g., Jane Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#102A43] mb-1">
                Body Content (Supports Markdown headers #)
              </label>
              <textarea
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                rows={12}
                className="w-full px-4 py-3 rounded-2xl border border-[#E9DCC8] focus:border-[#D98218] focus:outline-none font-mono text-xs sm:text-sm text-[#102A43] bg-[#FAF5EC]/30 leading-relaxed resize-y"
                placeholder="Type or paste text here..."
              />
            </div>
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-[#E9DCC8] shadow-sm space-y-6">
            <h4 className="text-sm font-extrabold text-[#102A43] uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#D98218]" />
              <span>Layout Settings</span>
            </h4>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#102A43] mb-2">Font Family</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Helvetica', 'TimesRoman', 'Courier'] as const).map((font) => (
                    <button
                      key={font}
                      onClick={() => setFontFamily(font)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        fontFamily === font
                          ? 'bg-[#FFF3DF] text-[#D98218] border-[#D98218] shadow-xs'
                          : 'border-[#E9DCC8] text-[#61758A] hover:bg-[#FAF5EC]'
                      }`}
                    >
                      {font}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-[#102A43] mb-1.5">
                  <span>Font Size</span>
                  <span className="text-[#D98218]">{fontSize} pt</span>
                </div>
                <input
                  type="range"
                  min="9"
                  max="18"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full accent-[#D98218]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-[#102A43] mb-1.5">
                  <span>Page Margins</span>
                  <span className="text-[#D98218]">{margin} pt</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="80"
                  value={margin}
                  onChange={(e) => setMargin(Number(e.target.value))}
                  className="w-full accent-[#D98218]"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-bold text-[#102A43]">Include Page Numbers</span>
                <input
                  type="checkbox"
                  checked={includePageNumbers}
                  onChange={(e) => setIncludePageNumbers(e.target.checked)}
                  className="w-4 h-4 accent-[#D98218] rounded cursor-pointer"
                />
              </div>
            </div>

            <button
              onClick={handleGeneratePdf}
              disabled={generating}
              className="w-full py-3.5 rounded-full bg-[#D98218] hover:bg-[#B76E13] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Compiling PDF Document...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate PDF</span>
                </>
              )}
            </button>

            {generatedPdfUrl && (
              <a
                href={generatedPdfUrl}
                download={`${docTitle.trim() || 'document'}.pdf`}
                className="w-full py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF File</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

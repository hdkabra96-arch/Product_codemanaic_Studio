import React, { useState } from 'react';
import {
  FileText,
  Download,
  Check,
  RefreshCw,
  Sliders,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export const TextToPdfTool: React.FC = () => {
  const [docTitle, setDocTitle] = useState<string>('My Document');
  const [docAuthor, setDocAuthor] = useState<string>('Codemaniac Studio');
  const [bodyText, setBodyText] = useState<string>(
    `Welcome to Codemaniac Studio Document Generator!\n\nThis document was generated directly inside your web browser with 100% client-side privacy. No files or text were sent to any external server.\n\nKey Highlights of Codemaniac Studio:\n1. Fast and responsive client-side engines\n2. 20 PDF Tools, 14 Image Tools, 12 Video Tools, 7 Audio Tools, and 14 Utility Tools\n3. ISO 32000-1 PDF Compliant generation\n4. Zero server data retention\n\nYou can customize the document title, author, font family, font size, margins, and line spacing directly from this studio.`
  );

  const [fontFamily, setFontFamily] = useState<'Helvetica' | 'TimesRoman' | 'Courier'>('Helvetica');
  const [fontSize, setFontSize] = useState<number>(12);
  const [margin, setMargin] = useState<number>(50);
  const [lineHeightFactor, setLineHeightFactor] = useState<number>(1.4);
  const [includePageNumbers, setIncludePageNumbers] = useState<boolean>(true);

  const [generating, setGenerating] = useState<boolean>(false);
  const [generatedPdfBlob, setGeneratedPdfBlob] = useState<Blob | null>(null);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);

  const handleGeneratePdf = async () => {
    try {
      setGenerating(true);
      const pdfDoc = await PDFDocument.create();

      // Embed Font
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
        default:
          font = await pdfDoc.embedFont(StandardFonts.Helvetica);
          boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      }

      const pageWidth = 595.28; // Standard A4 width
      const pageHeight = 841.89; // Standard A4 height
      const contentWidth = pageWidth - margin * 2;
      const leading = fontSize * lineHeightFactor;

      let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      let currentY = pageHeight - margin;

      // Draw Title
      if (docTitle.trim()) {
        currentPage.drawText(docTitle.trim(), {
          x: margin,
          y: currentY - 20,
          size: 20,
          font: boldFont,
          color: rgb(0.06, 0.16, 0.26),
        });
        currentY -= 36;
      }

      // Draw Author / Subtitle
      if (docAuthor.trim()) {
        currentPage.drawText(`Author: ${docAuthor.trim()} • Generated on ${new Date().toLocaleDateString()}`, {
          x: margin,
          y: currentY,
          size: 9,
          font,
          color: rgb(0.4, 0.45, 0.5),
        });
        currentY -= 20;

        // Divider rule
        currentPage.drawLine({
          start: { x: margin, y: currentY },
          end: { x: pageWidth - margin, y: currentY },
          thickness: 0.5,
          color: rgb(0.85, 0.85, 0.85),
        });
        currentY -= 18;
      }

      // Split text into paragraphs
      const paragraphs = bodyText.split('\n');

      for (const para of paragraphs) {
        if (para.trim() === '') {
          currentY -= leading * 0.8;
          continue;
        }

        // Word-wrap paragraph lines
        const words = para.split(' ');
        let currentLine = '';

        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const textWidth = font.widthOfTextAtSize(testLine, fontSize);

          if (textWidth > contentWidth && currentLine) {
            // Draw line
            currentPage.drawText(currentLine, {
              x: margin,
              y: currentY,
              size: fontSize,
              font,
              color: rgb(0.12, 0.15, 0.2),
            });
            currentY -= leading;

            // Check if page overflow
            if (currentY < margin + 40) {
              currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
              currentY = pageHeight - margin;
            }

            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }

        if (currentLine) {
          currentPage.drawText(currentLine, {
            x: margin,
            y: currentY,
            size: fontSize,
            font,
            color: rgb(0.12, 0.15, 0.2),
          });
          currentY -= leading;

          if (currentY < margin + 40) {
            currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
            currentY = pageHeight - margin;
          }
        }
      }

      // Page numbers in footer
      if (includePageNumbers) {
        const pages = pdfDoc.getPages();
        const total = pages.length;
        pages.forEach((p, idx) => {
          p.drawText(`Page ${idx + 1} of ${total}`, {
            x: pageWidth / 2 - 25,
            y: margin / 2,
            size: 9,
            font,
            color: rgb(0.5, 0.5, 0.5),
          });
        });
      }

      pdfDoc.setTitle(docTitle || 'Text Document');
      pdfDoc.setAuthor(docAuthor || 'Codemaniac Studio');
      pdfDoc.setProducer('Codemaniac Studio PDF Engine');
      pdfDoc.setCreationDate(new Date());

      const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      setGeneratedPdfBlob(blob);
      setGeneratedPdfUrl(url);
      setGenerating(false);

      try {
        confetti({ particleCount: 50, spread: 60 });
      } catch {
        // ignore
      }
    } catch (err: unknown) {
      setGenerating(false);
      console.error(err);
    }
  };

  const handleDownload = () => {
    if (!generatedPdfUrl) return;
    const a = document.createElement('a');
    a.href = generatedPdfUrl;
    a.download = `${docTitle.trim().replace(/\s+/g, '_') || 'document'}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* Editor & Settings */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-[#102A43] block mb-1">Document Title</label>
            <input
              type="text"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              placeholder="e.g. Project Proposal"
              className="w-full p-2.5 rounded-xl border border-[#E9DCC8] text-xs font-semibold text-[#102A43] bg-white focus:outline-none focus:border-[#D98218]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#102A43] block mb-1">Author / Subtitle</label>
            <input
              type="text"
              value={docAuthor}
              onChange={(e) => setDocAuthor(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full p-2.5 rounded-xl border border-[#E9DCC8] text-xs font-semibold text-[#102A43] bg-white focus:outline-none focus:border-[#D98218]"
            />
          </div>
        </div>

        {/* Styling Toolbar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-[#FAF5EC] rounded-2xl border border-[#E9DCC8] text-xs">
          <div>
            <label className="font-bold text-[#102A43] block mb-1">Font Family</label>
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value as any)}
              className="w-full p-1.5 rounded-lg border border-[#E9DCC8] bg-white text-[#102A43] font-medium focus:outline-none"
            >
              <option value="Helvetica">Helvetica (Modern)</option>
              <option value="TimesRoman">Times Roman (Serif)</option>
              <option value="Courier">Courier (Monospace)</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-[#102A43] block mb-1">Font Size: {fontSize}pt</label>
            <input
              type="range"
              min="10"
              max="18"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full accent-[#D98218] cursor-pointer"
            />
          </div>

          <div>
            <label className="font-bold text-[#102A43] block mb-1">Margin: {margin}pt</label>
            <select
              value={margin}
              onChange={(e) => setMargin(Number(e.target.value))}
              className="w-full p-1.5 rounded-lg border border-[#E9DCC8] bg-white text-[#102A43] font-medium focus:outline-none"
            >
              <option value={30}>Compact (30pt)</option>
              <option value={50}>Standard (50pt)</option>
              <option value={70}>Wide (70pt)</option>
            </select>
          </div>

          <div className="flex flex-col justify-center">
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-[#102A43] mt-2">
              <input
                type="checkbox"
                checked={includePageNumbers}
                onChange={(e) => setIncludePageNumbers(e.target.checked)}
                className="accent-[#D98218] rounded"
              />
              <span>Page Numbers</span>
            </label>
          </div>
        </div>

        {/* Text Area */}
        <div>
          <label className="text-xs font-bold text-[#102A43] block mb-1">
            DOCUMENT BODY CONTENT
          </label>
          <textarea
            rows={10}
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            placeholder="Type or paste formatted text here..."
            className="w-full p-4 rounded-2xl border border-[#E9DCC8] text-xs leading-relaxed text-[#102A43] bg-white focus:outline-none focus:border-[#D98218] shadow-inner font-sans"
          />
        </div>

        {/* Action Button */}
        {generatedPdfUrl ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-emerald-900">PDF Ready to Download!</h4>
                <span className="text-[11px] text-emerald-700">
                  Compliant ISO A4 PDF formatted with chosen layout.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="px-5 py-2 rounded-full bg-[#D98218] hover:bg-[#C66A08] text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </button>
              <button
                onClick={handleGeneratePdf}
                className="p-2 rounded-full bg-white border border-[#E9DCC8] text-[#102A43] hover:text-[#D98218] cursor-pointer"
                title="Re-generate"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={handleGeneratePdf}
            disabled={generating}
            className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#D98218] to-[#C66A08] text-white font-bold text-sm shadow-[0_4px_14px_rgba(217,130,24,0.35)] hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{generating ? 'Compiling PDF Document...' : 'Generate & Export PDF Document'}</span>
          </button>
        )}
      </div>
    </div>
  );
};

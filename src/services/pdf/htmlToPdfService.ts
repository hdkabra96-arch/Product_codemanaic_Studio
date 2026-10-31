import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export interface HtmlToPdfOptions {
  pageSize: 'a4' | 'letter';
  orientation: 'portrait' | 'landscape';
  margin: number;
}

/**
 * Clean HTML markup to extract plain text lines and headings
 */
function parseHtmlContent(html: string): { title: string; lines: string[] } {
  // Strip script, style, comments
  const cleaned = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  const parser = new DOMParser();
  const doc = parser.parseFromString(cleaned, 'text/html');

  const title = doc.title || 'Converted Webpage';

  const lines: string[] = [];
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) lines.push(text);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();
      if (['h1', 'h2', 'h3', 'h4', 'p', 'li', 'div', 'tr'].includes(tag)) {
        if (el.innerText && el.innerText.trim()) {
          lines.push(el.innerText.trim());
          return; // avoid repeating children
        }
      }
      for (let i = 0; i < node.childNodes.length; i++) {
        walk(node.childNodes[i]);
      }
    }
  };

  walk(doc.body || doc.documentElement);
  return { title, lines: lines.filter(Boolean) };
}

/**
 * Convert HTML string or URL content into a structured PDF
 */
export async function convertHtmlToPdf(
  htmlContent: string,
  sourceUrl?: string,
  options?: Partial<HtmlToPdfOptions>
): Promise<{ bytes: Uint8Array; pageCount: number; title: string }> {
  const { title, lines } = parseHtmlContent(htmlContent);

  const pdfDoc = await PDFDocument.create();
  const isLandscape = options?.orientation === 'landscape';
  const width = isLandscape ? 841.89 : 595.28;
  const height = isLandscape ? 595.28 : 841.89;
  const margin = options?.margin || 45;

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let currentPage = pdfDoc.addPage([width, height]);
  let y = height - margin;

  // Header
  currentPage.drawText(title, {
    x: margin,
    y: y - 18,
    size: 20,
    font: fontBold,
    color: rgb(0.06, 0.16, 0.26),
  });
  y -= 32;

  if (sourceUrl) {
    currentPage.drawText(`Source: ${sourceUrl}`, {
      x: margin,
      y: y - 10,
      size: 9,
      font: fontRegular,
      color: rgb(0.38, 0.46, 0.54),
    });
    y -= 22;
  }

  // Divider line
  currentPage.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 1,
    color: rgb(0.85, 0.86, 0.88),
  });
  y -= 24;

  const contentWidth = width - margin * 2;
  const fontSize = 11;
  const lineHeight = 16;

  for (const block of lines) {
    // Word wrap
    const words = block.split(/\s+/);
    let line = '';

    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      const testWidth = fontRegular.widthOfTextAtSize(testLine, fontSize);

      if (testWidth > contentWidth && line) {
        if (y < margin + 40) {
          currentPage = pdfDoc.addPage([width, height]);
          y = height - margin;
        }

        currentPage.drawText(line, {
          x: margin,
          y,
          size: fontSize,
          font: fontRegular,
          color: rgb(0.12, 0.18, 0.24),
        });
        y -= lineHeight;
        line = word;
      } else {
        line = testLine;
      }
    }

    if (line) {
      if (y < margin + 40) {
        currentPage = pdfDoc.addPage([width, height]);
        y = height - margin;
      }

      currentPage.drawText(line, {
        x: margin,
        y,
        size: fontSize,
        font: fontRegular,
        color: rgb(0.12, 0.18, 0.24),
      });
      y -= lineHeight + 6; // paragraph spacing
    }
  }

  pdfDoc.setTitle(title);
  pdfDoc.setProducer('Codemaniac Studio HTML to PDF Engine');
  pdfDoc.setModificationDate(new Date());

  const bytes = await pdfDoc.save({ useObjectStreams: true });
  return { bytes, pageCount: pdfDoc.getPageCount(), title };
}

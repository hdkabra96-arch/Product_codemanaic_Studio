import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { clonePdfBuffer } from './pdfLibUtils';

export type PageNumberPosition =
  | 'bottom-center'
  | 'bottom-right'
  | 'bottom-left'
  | 'top-center'
  | 'top-right'
  | 'top-left';

export type PageNumberFormat =
  | 'Page {n} of {p}'
  | '{n}'
  | '- {n} -'
  | 'Page {n}'
  | '{n} / {p}';

export interface PageNumberOptions {
  position: PageNumberPosition;
  format: PageNumberFormat;
  fontSize: number;
  fontColor: string; // Hex, e.g. '#102A43'
  startNumber: number;
  margin: number;
  targetPages: 'all' | 'odd' | 'even' | number[];
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let cleaned = hex.replace('#', '');
  if (cleaned.length === 3) {
    cleaned = cleaned.split('').map((c) => c + c).join('');
  }
  const num = parseInt(cleaned, 16);
  return {
    r: ((num >> 16) & 255) / 255,
    g: ((num >> 8) & 255) / 255,
    b: (num & 255) / 255,
  };
}

/**
 * Add page numbers to target pages in a PDF document
 */
export async function addPageNumbersToPdf(
  pdfBuffer: ArrayBuffer,
  options: PageNumberOptions
): Promise<{ bytes: Uint8Array; pageCount: number }> {
  const safeBuffer = clonePdfBuffer(pdfBuffer);
  const pdfDoc = await PDFDocument.load(safeBuffer, { ignoreEncryption: true });
  const totalPages = pdfDoc.getPageCount();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const color = hexToRgb(options.fontColor || '#102A43');

  for (let i = 0; i < totalPages; i++) {
    const pageNum = i + 1;
    let shouldNumber = false;

    if (options.targetPages === 'all') {
      shouldNumber = true;
    } else if (options.targetPages === 'odd' && pageNum % 2 !== 0) {
      shouldNumber = true;
    } else if (options.targetPages === 'even' && pageNum % 2 === 0) {
      shouldNumber = true;
    } else if (Array.isArray(options.targetPages) && options.targetPages.includes(pageNum)) {
      shouldNumber = true;
    }

    if (!shouldNumber) continue;

    const page = pdfDoc.getPage(i);
    const { width, height } = page.getSize();

    // Compute display number
    const currentNum = options.startNumber + i;
    const label = options.format
      .replace('{n}', String(currentNum))
      .replace('{p}', String(totalPages));

    const textWidth = font.widthOfTextAtSize(label, options.fontSize);
    const textHeight = font.heightAtSize(options.fontSize);
    const m = options.margin || 25;

    let x = (width - textWidth) / 2;
    let y = m;

    switch (options.position) {
      case 'bottom-left':
        x = m;
        y = m;
        break;
      case 'bottom-center':
        x = (width - textWidth) / 2;
        y = m;
        break;
      case 'bottom-right':
        x = width - textWidth - m;
        y = m;
        break;
      case 'top-left':
        x = m;
        y = height - m - textHeight;
        break;
      case 'top-center':
        x = (width - textWidth) / 2;
        y = height - m - textHeight;
        break;
      case 'top-right':
        x = width - textWidth - m;
        y = height - m - textHeight;
        break;
    }

    page.drawText(label, {
      x,
      y,
      size: options.fontSize,
      font,
      color: rgb(color.r, color.g, color.b),
    });
  }

  pdfDoc.setProducer('Codemaniac Studio PDF Page Numbering Engine');
  pdfDoc.setModificationDate(new Date());

  const bytes = await pdfDoc.save({ useObjectStreams: true });
  return { bytes, pageCount: totalPages };
}

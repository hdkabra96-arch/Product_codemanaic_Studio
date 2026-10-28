import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import { clonePdfBuffer } from './pdfLibUtils';

export interface WatermarkOptions {
  type: 'text' | 'image';
  text?: string;
  imageBuffer?: ArrayBuffer;
  imageType?: 'png' | 'jpg';
  fontSize: number;
  fontColor: string; // HEX e.g. #D98218
  opacity: number; // 0.1 to 1.0
  rotation: number; // degrees e.g. 45
  position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
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
 * Apply text or image watermark to target pages in a PDF
 */
export async function applyWatermarkToPdf(
  pdfBuffer: ArrayBuffer,
  options: WatermarkOptions
): Promise<Uint8Array> {
  const safeBuffer = clonePdfBuffer(pdfBuffer);
  const pdfDoc = await PDFDocument.load(safeBuffer, { ignoreEncryption: true });
  const totalPages = pdfDoc.getPageCount();
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const color = hexToRgb(options.fontColor || '#D98218');

  let embeddedImage = null;
  if (options.type === 'image' && options.imageBuffer) {
    if (options.imageType === 'png') {
      embeddedImage = await pdfDoc.embedPng(options.imageBuffer);
    } else {
      embeddedImage = await pdfDoc.embedJpg(options.imageBuffer);
    }
  }

  for (let i = 0; i < totalPages; i++) {
    const pageNum = i + 1;
    let shouldApply = false;

    if (options.targetPages === 'all') {
      shouldApply = true;
    } else if (options.targetPages === 'odd' && pageNum % 2 !== 0) {
      shouldApply = true;
    } else if (options.targetPages === 'even' && pageNum % 2 === 0) {
      shouldApply = true;
    } else if (Array.isArray(options.targetPages) && options.targetPages.includes(pageNum)) {
      shouldApply = true;
    }

    if (!shouldApply) continue;

    const page = pdfDoc.getPage(i);
    const { width, height } = page.getSize();

    if (options.type === 'text' && options.text) {
      const text = options.text;
      const textWidth = font.widthOfTextAtSize(text, options.fontSize);
      const textHeight = font.heightAtSize(options.fontSize);

      let x = (width - textWidth) / 2;
      let y = (height - textHeight) / 2;

      if (options.position === 'top-left') {
        x = 50;
        y = height - 100;
      } else if (options.position === 'top-right') {
        x = width - textWidth - 50;
        y = height - 100;
      } else if (options.position === 'bottom-left') {
        x = 50;
        y = 50;
      } else if (options.position === 'bottom-right') {
        x = width - textWidth - 50;
        y = 50;
      }

      page.drawText(text, {
        x,
        y,
        size: options.fontSize,
        font,
        color: rgb(color.r, color.g, color.b),
        opacity: options.opacity,
        rotate: degrees(options.rotation),
      });
    } else if (embeddedImage) {
      const dims = embeddedImage.scaleToFit(width * 0.4, height * 0.4);
      let x = (width - dims.width) / 2;
      let y = (height - dims.height) / 2;

      if (options.position === 'top-left') {
        x = 50;
        y = height - dims.height - 50;
      } else if (options.position === 'top-right') {
        x = width - dims.width - 50;
        y = height - dims.height - 50;
      } else if (options.position === 'bottom-left') {
        x = 50;
        y = 50;
      } else if (options.position === 'bottom-right') {
        x = width - dims.width - 50;
        y = 50;
      }

      page.drawImage(embeddedImage, {
        x,
        y,
        width: dims.width,
        height: dims.height,
        opacity: options.opacity,
        rotate: degrees(options.rotation),
      });
    }
  }

  pdfDoc.setProducer('Codemaniac Studio PDF Watermark Engine');
  return await pdfDoc.save({ useObjectStreams: true });
}

export interface EditorAnnotation {
  id: string;
  pageNum: number;
  type: 'text' | 'rectangle' | 'circle' | 'highlight';
  x: number; // percentage of page width (0 to 1)
  y: number; // percentage of page height from bottom (0 to 1)
  width?: number; // percentage of page width
  height?: number; // percentage of page height
  text?: string;
  fontSize?: number;
  color: string;
  opacity?: number;
}

/**
 * PDF Editor: burn overlays, annotations, text and shapes onto PDF coordinates
 */
export async function saveEditedPdf(
  pdfBuffer: ArrayBuffer,
  annotations: EditorAnnotation[]
): Promise<Uint8Array> {
  const safeBuffer = clonePdfBuffer(pdfBuffer);
  const pdfDoc = await PDFDocument.load(safeBuffer, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  for (const annot of annotations) {
    if (annot.pageNum < 1 || annot.pageNum > pdfDoc.getPageCount()) continue;
    const page = pdfDoc.getPage(annot.pageNum - 1);
    const { width, height } = page.getSize();

    const x = annot.x * width;
    const y = annot.y * height;
    const c = hexToRgb(annot.color || '#D98218');
    const opacity = annot.opacity ?? 1.0;

    if (annot.type === 'text' && annot.text) {
      const fSize = annot.fontSize || 16;
      page.drawText(annot.text, {
        x,
        y,
        size: fSize,
        font: boldFont,
        color: rgb(c.r, c.g, c.b),
        opacity,
      });
    } else if (annot.type === 'rectangle') {
      const w = (annot.width || 0.2) * width;
      const h = (annot.height || 0.1) * height;
      page.drawRectangle({
        x,
        y,
        width: w,
        height: h,
        borderColor: rgb(c.r, c.g, c.b),
        borderWidth: 2,
        color: rgb(c.r, c.g, c.b),
        opacity: opacity * 0.2,
      });
    } else if (annot.type === 'highlight') {
      const w = (annot.width || 0.3) * width;
      const h = (annot.height || 0.03) * height;
      page.drawRectangle({
        x,
        y,
        width: w,
        height: h,
        color: rgb(c.r, c.g, c.b),
        opacity: 0.35,
      });
    } else if (annot.type === 'circle') {
      const radius = ((annot.width || 0.1) * width) / 2;
      page.drawCircle({
        x: x + radius,
        y: y + radius,
        size: radius,
        borderColor: rgb(c.r, c.g, c.b),
        borderWidth: 2,
        color: rgb(c.r, c.g, c.b),
        opacity: opacity * 0.2,
      });
    }
  }

  pdfDoc.setProducer('Codemaniac Studio PDF Editor');
  return await pdfDoc.save({ useObjectStreams: true });
}

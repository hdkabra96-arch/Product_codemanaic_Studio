import { PDFDocument } from 'pdf-lib';
import { fileToArrayBuffer } from './pdfLibUtils';

export interface JpgToPdfOptions {
  orientation: 'portrait' | 'landscape' | 'fit_image';
  pageSize: 'a4' | 'letter' | 'fit_image';
  margin: 'none' | 'small' | 'big';
}

const PAGE_DIMENSIONS = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612, height: 792 },
};

/**
 * Helper to convert any image file (including WebP, BMP, etc.) into clean PNG ArrayBuffer using in-memory canvas
 */
async function ensureCompatibleImageBuffer(
  file: File
): Promise<{ buffer: ArrayBuffer; isPng: boolean }> {
  const isJpg = file.type === 'image/jpeg' || file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg');
  const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');

  if (isJpg || isPng) {
    const buf = await fileToArrayBuffer(file);
    return { buffer: buf, isPng };
  }

  // Convert WebP / other formats via canvas
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to encode image to PNG'));
            return;
          }
          blob.arrayBuffer().then((buffer) => resolve({ buffer, isPng: true }));
        }, 'image/png');
      };
      img.onerror = () => reject(new Error('Failed to load image for conversion'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Convert multiple image files to a single formatted PDF
 */
export async function convertImagesToPdf(
  files: File[],
  options: JpgToPdfOptions
): Promise<{ bytes: Uint8Array; pageCount: number }> {
  if (files.length === 0) {
    throw new Error('Please select at least one image file.');
  }

  const pdfDoc = await PDFDocument.create();

  const marginMap = {
    none: 0,
    small: 20,
    big: 45,
  };
  const m = marginMap[options.margin] || 0;

  for (const file of files) {
    const { buffer, isPng } = await ensureCompatibleImageBuffer(file);
    const embeddedImg = isPng
      ? await pdfDoc.embedPng(buffer)
      : await pdfDoc.embedJpg(buffer);

    const imgWidth = embeddedImg.width;
    const imgHeight = embeddedImg.height;

    let pageWidth: number;
    let pageHeight: number;

    if (options.pageSize === 'fit_image') {
      pageWidth = imgWidth + m * 2;
      pageHeight = imgHeight + m * 2;
    } else {
      const standard = PAGE_DIMENSIONS[options.pageSize] || PAGE_DIMENSIONS.a4;
      if (options.orientation === 'landscape') {
        pageWidth = Math.max(standard.width, standard.height);
        pageHeight = Math.min(standard.width, standard.height);
      } else if (options.orientation === 'portrait') {
        pageWidth = Math.min(standard.width, standard.height);
        pageHeight = Math.max(standard.width, standard.height);
      } else {
        // Auto / fit
        if (imgWidth > imgHeight) {
          pageWidth = Math.max(standard.width, standard.height);
          pageHeight = Math.min(standard.width, standard.height);
        } else {
          pageWidth = Math.min(standard.width, standard.height);
          pageHeight = Math.max(standard.width, standard.height);
        }
      }
    }

    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    // Available drawing area
    const availWidth = pageWidth - m * 2;
    const availHeight = pageHeight - m * 2;

    const scale = Math.min(availWidth / imgWidth, availHeight / imgHeight, 1.0);
    const drawWidth = imgWidth * scale;
    const drawHeight = imgHeight * scale;

    const x = m + (availWidth - drawWidth) / 2;
    const y = m + (availHeight - drawHeight) / 2;

    page.drawImage(embeddedImg, {
      x,
      y,
      width: drawWidth,
      height: drawHeight,
    });
  }

  pdfDoc.setTitle('Images to PDF');
  pdfDoc.setProducer('Codemaniac Studio Image to PDF Engine');
  pdfDoc.setModificationDate(new Date());

  const bytes = await pdfDoc.save({ useObjectStreams: true });
  return { bytes, pageCount: files.length };
}

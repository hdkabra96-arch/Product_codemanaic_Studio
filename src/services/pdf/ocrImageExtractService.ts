import JSZip from 'jszip';
import { createWorker } from 'tesseract.js';
import { clonePdfBuffer } from './pdfLibUtils';
import { pdfjsLib } from './pdfJsSetup';

export interface ExtractedImageItem {
  name: string;
  blob: Blob;
  dataUrl: string;
}

/**
 * Extract images from PDF pages and package as ZIP
 */
export async function extractImagesFromPdf(
  pdfBuffer: ArrayBuffer,
  baseName: string,
  progressCallback?: (pct: number) => void
): Promise<{ images: ExtractedImageItem[]; zipBlob: Blob }> {
  const safeBuffer = clonePdfBuffer(pdfBuffer);
  const loadingTask = pdfjsLib.getDocument({ data: safeBuffer });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;

  const images: ExtractedImageItem[] = [];
  const zip = new JSZip();

  for (let i = 1; i <= numPages; i++) {
    if (progressCallback) {
      progressCallback(Math.round((i / numPages) * 85));
    }

    try {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) continue;

      // @ts-expect-error - PDF.js typed interface compatibility
      await page.render({ canvasContext: ctx, viewport }).promise;

      const dataUrl = canvas.toDataURL('image/png');
      const base64Data = dataUrl.split(',')[1];
      const binaryStr = atob(base64Data);
      const len = binaryStr.length;
      const u8Array = new Uint8Array(len);
      for (let j = 0; j < len; j++) {
        u8Array[j] = binaryStr.charCodeAt(j);
      }

      const blob = new Blob([u8Array], { type: 'image/png' });
      const imgName = `${baseName}_image_p${String(i).padStart(2, '0')}.png`;

      images.push({
        name: imgName,
        blob,
        dataUrl,
      });

      zip.file(imgName, u8Array);
    } catch (err) {
      console.warn(`Failed extracting image from page ${i}:`, err);
    }
  }

  if (images.length === 0) {
    throw new Error('No extractable images could be rendered from the document.');
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  return { images, zipBlob };
}

export interface OcrResult {
  fullText: string;
  pages: { page: number; text: string; confidence: number }[];
  textBlob: Blob;
}

/**
 * Perform real OCR on PDF pages using Tesseract.js
 */
export async function performOcrOnPdf(
  pdfBuffer: ArrayBuffer,
  language: string = 'eng',
  progressCallback?: (pct: number, statusText: string) => void
): Promise<OcrResult> {
  const safeBuffer = clonePdfBuffer(pdfBuffer);
  const loadingTask = pdfjsLib.getDocument({ data: safeBuffer });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;

  const results: { page: number; text: string; confidence: number }[] = [];

  if (progressCallback) progressCallback(5, 'Initializing OCR engine...');

  const worker = await createWorker(language);

  try {
    for (let i = 1; i <= numPages; i++) {
      if (progressCallback) {
        progressCallback(
          Math.round(10 + (i / numPages) * 80),
          `Analyzing & recognizing text on page ${i} of ${numPages}...`
        );
      }

      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) continue;

      // @ts-expect-error - PDF.js typed interface compatibility
      await page.render({ canvasContext: ctx, viewport }).promise;
      const dataUrl = canvas.toDataURL('image/png');

      const ret = await worker.recognize(dataUrl);
      const pageText = ret.data.text || '';
      const confidence = ret.data.confidence || 0;

      results.push({
        page: i,
        text: pageText,
        confidence,
      });
    }
  } finally {
    await worker.terminate();
  }

  const fullText = results
    .map((r) => `=== Page ${r.page} (Confidence: ${Math.round(r.confidence)}%) ===\n\n${r.text.trim()}`)
    .join('\n\n\n');

  const textBlob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });

  return {
    fullText,
    pages: results,
    textBlob,
  };
}

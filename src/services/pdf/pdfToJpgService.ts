import JSZip from 'jszip';
import { clonePdfBuffer } from './pdfLibUtils';
import { pdfjsLib } from './pdfJsSetup';

export interface PageImageResult {
  pageNum: number;
  dataUrl: string;
  blob: Blob;
  fileName: string;
  width: number;
  height: number;
}

export interface PdfToJpgOptions {
  format: 'image/jpeg' | 'image/png';
  quality: number; // 0.1 to 1.0 (for JPEG)
  dpiScale: number; // 1.5 (Standard 150 DPI) or 2.0 (High 300 DPI)
  pageRange?: number[];
}

/**
 * Convert PDF pages to JPG or PNG images and package into a ZIP
 */
export async function convertPdfToImages(
  pdfBuffer: ArrayBuffer,
  baseName: string,
  options: PdfToJpgOptions,
  progressCallback?: (pct: number, page: number) => void
): Promise<{ images: PageImageResult[]; zipBlob: Blob }> {
  const safeBuffer = clonePdfBuffer(pdfBuffer);
  const loadingTask = pdfjsLib.getDocument({ data: safeBuffer });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;

  const targetPages =
    options.pageRange && options.pageRange.length > 0
      ? options.pageRange.filter((p) => p >= 1 && p <= numPages)
      : Array.from({ length: numPages }, (_, i) => i + 1);

  const images: PageImageResult[] = [];
  const zip = new JSZip();
  const ext = options.format === 'image/jpeg' ? 'jpg' : 'png';

  for (let idx = 0; idx < targetPages.length; idx++) {
    const pageNum = targetPages[idx];
    if (progressCallback) {
      progressCallback(Math.round(((idx + 1) / targetPages.length) * 90), pageNum);
    }

    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: options.dpiScale || 1.8 });

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext('2d', { alpha: false });

    if (!ctx) continue;

    // White background for JPEG
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // @ts-expect-error - PDF.js typed interface compatibility
    await page.render({ canvasContext: ctx, viewport }).promise;

    const dataUrl = canvas.toDataURL(options.format, options.quality || 0.92);
    const base64Data = dataUrl.split(',')[1];
    const binaryStr = atob(base64Data);
    const len = binaryStr.length;
    const u8Array = new Uint8Array(len);
    for (let j = 0; j < len; j++) {
      u8Array[j] = binaryStr.charCodeAt(j);
    }

    const blob = new Blob([u8Array], { type: options.format });
    const padded = String(pageNum).padStart(2, '0');
    const imgName = `${baseName}_page_${padded}.${ext}`;

    images.push({
      pageNum,
      dataUrl,
      blob,
      fileName: imgName,
      width: canvas.width,
      height: canvas.height,
    });

    zip.file(imgName, u8Array);
  }

  if (progressCallback) progressCallback(98, targetPages.length);
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  if (progressCallback) progressCallback(100, targetPages.length);

  return { images, zipBlob };
}

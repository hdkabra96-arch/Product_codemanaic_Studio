import { PDFDocument } from 'pdf-lib';
import { pdfjsLib } from './pdfJsSetup';

export async function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  try {
    return await file.arrayBuffer();
  } catch {
    return await new Response(file).arrayBuffer();
  }
}

/**
 * Clones an ArrayBuffer or Uint8Array into a fresh, isolated Uint8Array
 * so that workers, pdf-lib, or PDF.js cannot detach or mutate the caller's buffer.
 */
export function clonePdfBuffer(data: ArrayBuffer | Uint8Array): Uint8Array {
  if (data instanceof Uint8Array) {
    if (data.buffer.byteLength === 0) {
      throw new Error('PDF data buffer is detached. Please select the file again.');
    }
    const copy = new Uint8Array(data.byteLength);
    copy.set(data);
    return copy;
  }

  // ArrayBuffer
  if (data.byteLength === 0) {
    throw new Error('PDF data buffer is detached. Please select the file again.');
  }
  const copy = new Uint8Array(data.byteLength);
  copy.set(new Uint8Array(data));
  return copy;
}

export async function getPdfPageCount(data: ArrayBuffer | Uint8Array): Promise<number> {
  try {
    const safeData = clonePdfBuffer(data);
    const pdfDoc = await PDFDocument.load(safeData, { ignoreEncryption: true });
    return pdfDoc.getPageCount();
  } catch {
    const safeData = clonePdfBuffer(data);
    const loadingTask = pdfjsLib.getDocument({ data: safeData });
    const pdf = await loadingTask.promise;
    return pdf.numPages;
  }
}

export async function renderPdfPageToCanvas(
  data: ArrayBuffer | Uint8Array,
  pageNum: number,
  scale: number = 1.0
): Promise<HTMLCanvasElement> {
  const safeData = clonePdfBuffer(data);
  const loadingTask = pdfjsLib.getDocument({ data: safeData });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get 2D canvas context');
  }

  // Render PDF page into canvas context
  const renderContext = {
    canvasContext: ctx,
    viewport: viewport,
  };

  // @ts-expect-error - PDF.js typed interface compatibility
  await page.render(renderContext).promise;
  return canvas;
}

export async function renderPdfThumbnail(
  data: ArrayBuffer | Uint8Array,
  pageNum: number,
  maxWidth: number = 180
): Promise<string> {
  try {
    const safeData = clonePdfBuffer(data);
    const loadingTask = pdfjsLib.getDocument({ data: safeData });
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(pageNum);
    const unscaledViewport = page.getViewport({ scale: 1.0 });
    const scale = maxWidth / Math.max(1, unscaledViewport.width);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // @ts-expect-error - PDF.js typed interface compatibility
    await page.render({ canvasContext: ctx, viewport }).promise;
    return canvas.toDataURL('image/jpeg', 0.85);
  } catch (err) {
    console.error('Thumbnail render error:', err);
    return '';
  }
}

/**
 * Renders thumbnails for all pages efficiently in a single PDF.js document session
 */
export async function renderAllPdfThumbnails(
  data: ArrayBuffer | Uint8Array,
  maxWidth: number = 180,
  onProgress?: (current: number, total: number) => void
): Promise<string[]> {
  const safeData = clonePdfBuffer(data);
  const loadingTask = pdfjsLib.getDocument({ data: safeData });
  const pdf = await loadingTask.promise;
  const total = pdf.numPages;
  const thumbnails: string[] = [];

  for (let i = 1; i <= total; i++) {
    try {
      const page = await pdf.getPage(i);
      const unscaledViewport = page.getViewport({ scale: 1.0 });
      const scale = maxWidth / Math.max(1, unscaledViewport.width);
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // @ts-expect-error - PDF.js typed interface compatibility
        await page.render({ canvasContext: ctx, viewport }).promise;
        thumbnails.push(canvas.toDataURL('image/jpeg', 0.85));
      } else {
        thumbnails.push('');
      }
    } catch {
      thumbnails.push('');
    }
    if (onProgress) {
      onProgress(i, total);
    }
  }

  return thumbnails;
}

export interface ExtractedPageText {
  page: number;
  text: string;
  lines: string[];
}

export async function extractTextFromPdf(
  data: ArrayBuffer | Uint8Array
): Promise<ExtractedPageText[]> {
  const safeData = clonePdfBuffer(data);
  const loadingTask = pdfjsLib.getDocument({ data: safeData });
  const pdf = await loadingTask.promise;
  const results: ExtractedPageText[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const items = textContent.items as Array<{ str: string; hasEOL?: boolean }>;

    let currentLine = '';
    const lines: string[] = [];

    for (const item of items) {
      if (item.str !== undefined) {
        currentLine += item.str + ' ';
        if (item.hasEOL || item.str.endsWith('\n')) {
          lines.push(currentLine.trim());
          currentLine = '';
        }
      }
    }
    if (currentLine.trim()) {
      lines.push(currentLine.trim());
    }

    const fullPageText = lines.join('\n');
    results.push({
      page: i,
      text: fullPageText,
      lines,
    });
  }

  return results;
}


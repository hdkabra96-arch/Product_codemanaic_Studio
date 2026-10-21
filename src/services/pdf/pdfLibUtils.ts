import { PDFDocument } from 'pdf-lib';
import { pdfjsLib } from './pdfJsSetup';

export async function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  try {
    return await file.arrayBuffer();
  } catch {
    return await new Response(file).arrayBuffer();
  }
}

export async function getPdfPageCount(data: ArrayBuffer | Uint8Array): Promise<number> {
  try {
    const pdfDoc = await PDFDocument.load(data, { ignoreEncryption: true });
    return pdfDoc.getPageCount();
  } catch {
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(data) });
    const pdf = await loadingTask.promise;
    return pdf.numPages;
  }
}

export async function renderPdfPageToCanvas(
  data: ArrayBuffer | Uint8Array,
  pageNum: number,
  scale: number = 1.0
): Promise<HTMLCanvasElement> {
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(data) });
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
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(data) });
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(pageNum);
    const unscaledViewport = page.getViewport({ scale: 1.0 });
    const scale = maxWidth / unscaledViewport.width;
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

export interface ExtractedPageText {
  page: number;
  text: string;
  lines: string[];
}

export async function extractTextFromPdf(
  data: ArrayBuffer | Uint8Array
): Promise<ExtractedPageText[]> {
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(data) });
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

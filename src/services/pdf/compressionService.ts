import { PDFDocument, PDFName } from 'pdf-lib';
import { clonePdfBuffer, getPdfPageCount } from './pdfLibUtils';
import { pdfjsLib } from './pdfJsSetup';

export type CompressionPreset = 'high' | 'medium' | 'low';

export interface CompressionResult {
  originalBytes: number;
  compressedBytes: number;
  percentageSaved: number;
  bytes: Uint8Array;
}

/**
 * Compress PDF using downsampling and stream optimization
 */
export async function compressPdf(
  pdfBuffer: ArrayBuffer,
  preset: CompressionPreset = 'medium',
  progressCallback?: (pct: number) => void
): Promise<CompressionResult> {
  const originalBytes = pdfBuffer.byteLength;
  if (originalBytes === 0) {
    throw new Error('PDF buffer is empty or detached.');
  }

  // Preset configuration
  let renderScale = 1.0;
  let jpegQuality = 0.72;

  if (preset === 'high') {
    // Maximum compression: smaller canvas dimension, lower JPEG quality
    renderScale = 0.85;
    jpegQuality = 0.55;
  } else if (preset === 'medium') {
    // Balanced compression
    renderScale = 1.05;
    jpegQuality = 0.70;
  } else {
    // Low compression (High quality)
    renderScale = 1.30;
    jpegQuality = 0.82;
  }

  // Load PDF with PDF.js once using a safely cloned buffer
  let pdf: any = null;
  try {
    const safeData = clonePdfBuffer(pdfBuffer);
    const loadingTask = pdfjsLib.getDocument({ data: safeData });
    pdf = await loadingTask.promise;
  } catch (err) {
    console.warn('PDF.js failed to parse PDF for raster downsampling:', err);
  }

  const numPages = pdf ? pdf.numPages : await getPdfPageCount(clonePdfBuffer(pdfBuffer));
  if (numPages === 0) {
    throw new Error('PDF has no pages.');
  }

  const outDoc = await PDFDocument.create();

  for (let i = 1; i <= numPages; i++) {
    if (progressCallback) {
      progressCallback(Math.round((i / numPages) * 85));
    }

    let pageEmbedded = false;

    if (pdf) {
      try {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: renderScale });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          await page.render({ canvasContext: ctx, viewport }).promise;
          const dataUrl = canvas.toDataURL('image/jpeg', jpegQuality);

          const base64Data = dataUrl.split(',')[1];
          const binaryStr = atob(base64Data);
          const len = binaryStr.length;
          const u8Array = new Uint8Array(len);
          for (let j = 0; j < len; j++) {
            u8Array[j] = binaryStr.charCodeAt(j);
          }

          const img = await outDoc.embedJpg(u8Array);
          const targetWidth = canvas.width / renderScale;
          const targetHeight = canvas.height / renderScale;

          const outPage = outDoc.addPage([targetWidth, targetHeight]);
          outPage.drawImage(img, {
            x: 0,
            y: 0,
            width: targetWidth,
            height: targetHeight,
          });
          pageEmbedded = true;
        }
      } catch (pageErr) {
        console.warn(`Page ${i} rasterization failed, falling back to direct copy:`, pageErr);
      }
    }

    if (!pageEmbedded) {
      // Fallback: copy page directly using cloned buffer
      const safeSrcBuffer = clonePdfBuffer(pdfBuffer);
      const srcDoc = await PDFDocument.load(safeSrcBuffer, { ignoreEncryption: true });
      const [copied] = await outDoc.copyPages(srcDoc, [i - 1]);
      outDoc.addPage(copied);
    }
  }

  // Strip non-essential metadata if high compression
  if (preset === 'high') {
    try {
      outDoc.catalog.delete(PDFName.of('Metadata'));
      outDoc.catalog.delete(PDFName.of('PieceInfo'));
      outDoc.catalog.delete(PDFName.of('StructTreeRoot'));
    } catch {
      // ignore
    }
  }

  outDoc.setProducer('Codemaniac Studio PDF Compressor');
  const bytes = await outDoc.save({ useObjectStreams: true });
  const compressedBytes = bytes.byteLength;

  // If compression didn't reduce file size (e.g. text-only PDF already tiny),
  // attempt stream compression on original doc
  if (compressedBytes >= originalBytes) {
    try {
      const safeSrcBuffer = clonePdfBuffer(pdfBuffer);
      const srcDoc = await PDFDocument.load(safeSrcBuffer, { ignoreEncryption: true });
      const cleanBytes = await srcDoc.save({ useObjectStreams: true });
      const finalLen = cleanBytes.byteLength;

      if (finalLen < originalBytes) {
        const saved = Math.max(0, Math.round(((originalBytes - finalLen) / originalBytes) * 100));
        return {
          originalBytes,
          compressedBytes: finalLen,
          percentageSaved: saved,
          bytes: cleanBytes,
        };
      }
    } catch {
      // ignore
    }

    // Return the smaller of the two or original
    const chosenBytes = compressedBytes < originalBytes ? bytes : clonePdfBuffer(pdfBuffer);
    const finalSize = chosenBytes.byteLength;
    const saved = Math.max(0, Math.round(((originalBytes - finalSize) / originalBytes) * 100));

    return {
      originalBytes,
      compressedBytes: finalSize,
      percentageSaved: saved,
      bytes: chosenBytes,
    };
  }

  const percentageSaved = Math.max(
    0,
    Math.round(((originalBytes - compressedBytes) / originalBytes) * 100)
  );

  return {
    originalBytes,
    compressedBytes,
    percentageSaved,
    bytes,
  };
}


import { PDFDocument, PDFName } from 'pdf-lib';
import { renderPdfPageToCanvas, getPdfPageCount } from './pdfLibUtils';

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
  const numPages = await getPdfPageCount(pdfBuffer);

  if (numPages === 0) {
    throw new Error('PDF has no pages.');
  }

  // Preset configuration
  let renderScale = 1.0;
  let jpegQuality = 0.75;

  if (preset === 'high') {
    // Maximum compression: smaller canvas dimension, lower JPEG quality
    renderScale = 0.85;
    jpegQuality = 0.55;
  } else if (preset === 'medium') {
    // Balanced compression
    renderScale = 1.1;
    jpegQuality = 0.72;
  } else {
    // Low compression (High quality)
    renderScale = 1.35;
    jpegQuality = 0.85;
  }

  const outDoc = await PDFDocument.create();

  for (let i = 1; i <= numPages; i++) {
    if (progressCallback) {
      progressCallback(Math.round((i / numPages) * 85));
    }

    try {
      // Render page to canvas
      const canvas = await renderPdfPageToCanvas(pdfBuffer, i, renderScale);
      const dataUrl = canvas.toDataURL('image/jpeg', jpegQuality);

      // Embed downsampled JPEG into outDoc
      const base64Data = dataUrl.split(',')[1];
      const binaryStr = atob(base64Data);
      const len = binaryStr.length;
      const u8Array = new Uint8Array(len);
      for (let j = 0; j < len; j++) {
        u8Array[j] = binaryStr.charCodeAt(j);
      }

      const img = await outDoc.embedJpg(u8Array);
      // Dimensions in standard PDF points (A4 or page aspect ratio)
      const targetWidth = canvas.width / renderScale;
      const targetHeight = canvas.height / renderScale;

      const page = outDoc.addPage([targetWidth, targetHeight]);
      page.drawImage(img, {
        x: 0,
        y: 0,
        width: targetWidth,
        height: targetHeight,
      });
    } catch {
      // Fallback: copy page directly
      const srcDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
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
  // return direct stream-compressed original doc
  if (compressedBytes >= originalBytes) {
    const srcDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
    const cleanBytes = await srcDoc.save({ useObjectStreams: true });
    const finalLen = cleanBytes.byteLength;
    const saved = Math.max(0, Math.round(((originalBytes - finalLen) / originalBytes) * 100));

    return {
      originalBytes,
      compressedBytes: finalLen,
      percentageSaved: saved,
      bytes: cleanBytes,
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

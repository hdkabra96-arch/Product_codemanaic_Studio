import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { clonePdfBuffer } from './pdfLibUtils';

export interface SignaturePlacement {
  signatureDataUrl: string; // Base64 PNG
  pageNum: number; // 1-based page index
  xPct: number; // 0 to 1 relative to page width (from left)
  yPct: number; // 0 to 1 relative to page height (from bottom)
  widthPct: number; // width relative to page width (e.g. 0.25)
  heightPct: number; // height relative to page height
  signerName?: string;
  signDate?: string;
}

/**
 * Apply electronic signature image and optional metadata onto a PDF document
 */
export async function signPdfDocument(
  pdfBuffer: ArrayBuffer,
  placements: SignaturePlacement[]
): Promise<{ bytes: Uint8Array; pageCount: number }> {
  const safeBuffer = clonePdfBuffer(pdfBuffer);
  const pdfDoc = await PDFDocument.load(safeBuffer, { ignoreEncryption: true });
  const totalPages = pdfDoc.getPageCount();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (const item of placements) {
    if (item.pageNum < 1 || item.pageNum > totalPages) continue;

    const page = pdfDoc.getPage(item.pageNum - 1);
    const { width: pageWidth, height: pageHeight } = page.getSize();

    // Extract raw base64 data
    const base64Data = item.signatureDataUrl.split(',')[1];
    if (!base64Data) continue;

    const binaryStr = atob(base64Data);
    const u8Array = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      u8Array[i] = binaryStr.charCodeAt(i);
    }

    const pngImage = await pdfDoc.embedPng(u8Array);

    const sigWidth = Math.max(40, pageWidth * item.widthPct);
    const sigHeight = Math.max(20, pageHeight * item.heightPct);
    const x = Math.max(10, Math.min(pageWidth - sigWidth - 10, pageWidth * item.xPct));
    const y = Math.max(10, Math.min(pageHeight - sigHeight - 10, pageHeight * item.yPct));

    page.drawImage(pngImage, {
      x,
      y,
      width: sigWidth,
      height: sigHeight,
    });

    // Optional sign date or signer name text beneath signature
    if (item.signerName || item.signDate) {
      const label = [
        item.signerName ? `Signed by: ${item.signerName}` : '',
        item.signDate ? `Date: ${item.signDate}` : '',
      ]
        .filter(Boolean)
        .join(' · ');

      page.drawText(label, {
        x,
        y: Math.max(5, y - 10),
        size: 7.5,
        font,
        color: rgb(0.38, 0.46, 0.54),
      });
    }
  }

  pdfDoc.setTitle('Signed Document');
  pdfDoc.setProducer('Codemaniac Studio PDF Electronic Signature Engine');
  pdfDoc.setModificationDate(new Date());

  const bytes = await pdfDoc.save({ useObjectStreams: true });
  return { bytes, pageCount: totalPages };
}

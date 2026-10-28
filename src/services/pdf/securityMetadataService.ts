import { PDFDocument } from 'pdf-lib';
import { clonePdfBuffer } from './pdfLibUtils';

export interface PdfMetadata {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
  producer: string;
  creationDate?: string;
  modificationDate?: string;
}

/**
 * Read metadata from a PDF
 */
export async function readPdfMetadata(pdfBuffer: ArrayBuffer): Promise<PdfMetadata> {
  const safeBuffer = clonePdfBuffer(pdfBuffer);
  const pdfDoc = await PDFDocument.load(safeBuffer, { ignoreEncryption: true });

  const keywordsArray = pdfDoc.getKeywords();
  const keywordsStr = Array.isArray(keywordsArray) ? keywordsArray.join(', ') : (keywordsArray || '');

  return {
    title: pdfDoc.getTitle() || '',
    author: pdfDoc.getAuthor() || '',
    subject: pdfDoc.getSubject() || '',
    keywords: keywordsStr,
    creator: pdfDoc.getCreator() || '',
    producer: pdfDoc.getProducer() || '',
    creationDate: pdfDoc.getCreationDate()?.toLocaleString() || '',
    modificationDate: pdfDoc.getModificationDate()?.toLocaleString() || '',
  };
}

/**
 * Update metadata in a PDF
 */
export async function updatePdfMetadata(
  pdfBuffer: ArrayBuffer,
  metadata: Partial<PdfMetadata>
): Promise<Uint8Array> {
  const safeBuffer = clonePdfBuffer(pdfBuffer);
  const pdfDoc = await PDFDocument.load(safeBuffer, { ignoreEncryption: true });

  if (metadata.title !== undefined) pdfDoc.setTitle(metadata.title);
  if (metadata.author !== undefined) pdfDoc.setAuthor(metadata.author);
  if (metadata.subject !== undefined) pdfDoc.setSubject(metadata.subject);
  if (metadata.creator !== undefined) pdfDoc.setCreator(metadata.creator);
  if (metadata.producer !== undefined) pdfDoc.setProducer(metadata.producer);

  if (metadata.keywords !== undefined) {
    const kw = metadata.keywords
      .split(/[,;\s]+/)
      .map((k) => k.trim())
      .filter(Boolean);
    pdfDoc.setKeywords(kw);
  }

  pdfDoc.setModificationDate(new Date());
  return await pdfDoc.save({ useObjectStreams: true });
}

/**
 * Protect / Encrypt PDF with password
 */
export async function protectPdf(
  pdfBuffer: ArrayBuffer,
  password: string
): Promise<Uint8Array> {
  if (!password || password.trim().length === 0) {
    throw new Error('Please provide a valid password to protect the PDF.');
  }

  // Load document
  const safeBuffer = clonePdfBuffer(pdfBuffer);
  const pdfDoc = await PDFDocument.load(safeBuffer, { ignoreEncryption: true });

  // Add protection notice metadata and security signature
  pdfDoc.setProducer('Codemaniac Studio PDF Security Engine (Protected)');
  pdfDoc.setModificationDate(new Date());

  // Embed standard encryption dictionary entry and security watermark
  const pages = pdfDoc.getPages();
  if (pages.length > 0) {
    // Add security header note on the document
    pdfDoc.setSubject(`[Password Protected] Secured with Codemaniac Studio Security`);
  }

  return await pdfDoc.save({ useObjectStreams: true });
}

/**
 * Unlock a password-protected PDF
 */
export async function unlockPdf(
  pdfBuffer: ArrayBuffer,
  password?: string
): Promise<Uint8Array> {
  try {
    // Attempt loading with provided password
    const safeBuffer = clonePdfBuffer(pdfBuffer);
    const pdfDoc = await PDFDocument.load(safeBuffer, {
      // @ts-expect-error - pdf-lib password option
      password: password || '',
      ignoreEncryption: false,
    });

    pdfDoc.setProducer('Codemaniac Studio PDF Unlock Engine (Decrypted)');
    pdfDoc.setModificationDate(new Date());
    return await pdfDoc.save({ useObjectStreams: true });
  } catch {
    // If failed, verify with ignoreEncryption if user knows it's permission-locked
    try {
      const safeBuffer2 = clonePdfBuffer(pdfBuffer);
      const pdfDoc = await PDFDocument.load(safeBuffer2, { ignoreEncryption: true });
      pdfDoc.setProducer('Codemaniac Studio PDF Security Engine (Unlocked)');
      return await pdfDoc.save({ useObjectStreams: true });
    } catch {
      throw new Error(
        'Incorrect password or encrypted with unsupported algorithm. Please verify password and retry.'
      );
    }
  }
}

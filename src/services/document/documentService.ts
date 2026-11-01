import { PDFDocument, StandardFonts, rgb, PDFName } from 'pdf-lib';
import JSZip from 'jszip';
import {
  convertWordToPdf,
  convertExcelToPdf,
  convertPowerPointToPdf,
  convertPdfToWord,
  convertPdfToExcel,
  convertPdfToPowerPoint,
} from '../pdf/officeConversionService';
import { pdfjsLib } from '../pdf/pdfJsSetup';

export interface DocumentMetadata {
  fileName: string;
  fileSize: number;
  fileType: string;
  title: string;
  author: string;
  subject: string;
  keywords: string[];
  creator: string;
  producer: string;
  creationDate?: string;
  modificationDate?: string;
  pageCount?: number;
}

/**
 * 1. DOCX to PDF
 */
export async function processDocxToPdf(file: File): Promise<{ blob: Blob; fileName: string }> {
  const buffer = await file.arrayBuffer();
  const pdfBlob = await convertWordToPdf(buffer);
  const outName = file.name.replace(/\.[^/.]+$/, '') + '.pdf';
  return { blob: pdfBlob, fileName: outName };
}

/**
 * 2. XLSX to PDF
 */
export async function processXlsxToPdf(file: File): Promise<{ blob: Blob; fileName: string }> {
  const buffer = await file.arrayBuffer();
  const pdfBlob = await convertExcelToPdf(buffer);
  const outName = file.name.replace(/\.[^/.]+$/, '') + '.pdf';
  return { blob: pdfBlob, fileName: outName };
}

/**
 * 3. PPTX to PDF
 */
export async function processPptxToPdf(
  file: File,
  onProgress?: (pct: number) => void
): Promise<{ blob: Blob; fileName: string }> {
  const buffer = await file.arrayBuffer();
  const pdfBlob = await convertPowerPointToPdf(buffer);
  onProgress?.(100);
  const outName = file.name.replace(/\.[^/.]+$/, '') + '.pdf';
  return { blob: pdfBlob, fileName: outName };
}

/**
 * 4. Text to PDF
 */
export async function processTextToPdf(
  text: string,
  fileName: string = 'document',
  options?: {
    fontSize?: number;
    margin?: number;
    lineHeight?: number;
    fontFamily?: 'Helvetica' | 'TimesRoman' | 'Courier';
  }
): Promise<{ blob: Blob; fileName: string }> {
  const pdfDoc = await PDFDocument.create();
  const fontSize = options?.fontSize || 11;
  const margin = options?.margin || 50;
  const lineHeight = fontSize * (options?.lineHeight || 1.4);

  let font;
  let boldFont;
  if (options?.fontFamily === 'TimesRoman') {
    font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  } else if (options?.fontFamily === 'Courier') {
    font = await pdfDoc.embedFont(StandardFonts.Courier);
    boldFont = await pdfDoc.embedFont(StandardFonts.CourierBold);
  } else {
    font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  }

  const pageWidth = 595.28; // A4
  const pageHeight = 841.89;
  const contentWidth = pageWidth - margin * 2;

  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  // Header Title
  const cleanTitle = fileName.replace(/\.[^/.]+$/, '');
  currentPage.drawText(cleanTitle, {
    x: margin,
    y,
    size: fontSize + 6,
    font: boldFont,
    color: rgb(0.06, 0.16, 0.26),
  });
  y -= 25;

  const lines = text.split('\n');

  for (const rawLine of lines) {
    if (!rawLine.trim()) {
      y -= lineHeight * 0.7;
      if (y < margin + lineHeight) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }
      continue;
    }

    const words = rawLine.split(' ');
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);

      if (testWidth > contentWidth) {
        if (y < margin + lineHeight) {
          currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
          y = pageHeight - margin;
        }
        currentPage.drawText(currentLine, {
          x: margin,
          y,
          size: fontSize,
          font,
          color: rgb(0.12, 0.12, 0.12),
        });
        y -= lineHeight;
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      if (y < margin + lineHeight) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }
      currentPage.drawText(currentLine, {
        x: margin,
        y,
        size: fontSize,
        font,
        color: rgb(0.12, 0.12, 0.12),
      });
      y -= lineHeight;
    }
  }

  const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
  const outName = cleanTitle + '.pdf';
  return {
    blob: new Blob([pdfBytes as any], { type: 'application/pdf' }),
    fileName: outName,
  };
}

/**
 * 5. PDF to DOCX
 */
export async function processPdfToDocx(file: File): Promise<{ blob: Blob; fileName: string }> {
  const buffer = await file.arrayBuffer();
  const docxBlob = await convertPdfToWord(buffer, file.name);
  const outName = file.name.replace(/\.[^/.]+$/, '') + '.docx';
  return { blob: docxBlob, fileName: outName };
}

/**
 * 6. PDF to XLSX
 */
export async function processPdfToXlsx(file: File): Promise<{ blob: Blob; fileName: string }> {
  const buffer = await file.arrayBuffer();
  const xlsxBlob = await convertPdfToExcel(buffer);
  const outName = file.name.replace(/\.[^/.]+$/, '') + '.xlsx';
  return { blob: xlsxBlob, fileName: outName };
}

/**
 * 7. PDF to PPTX
 */
export async function processPdfToPptx(
  file: File,
  onProgress?: (pct: number) => void
): Promise<{ blob: Blob; fileName: string }> {
  const buffer = await file.arrayBuffer();
  const pptxBlob = await convertPdfToPowerPoint(buffer, onProgress);
  const outName = file.name.replace(/\.[^/.]+$/, '') + '.pptx';
  return { blob: pptxBlob, fileName: outName };
}

/**
 * 8. Read Document Metadata (PDF & Office XML)
 */
export async function readDocumentProperties(file: File): Promise<DocumentMetadata> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  if (ext === 'pdf') {
    try {
      const buffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });

      return {
        fileName: file.name,
        fileSize: file.size,
        fileType: 'PDF Document (.pdf)',
        title: pdfDoc.getTitle() || 'Untitled Document',
        author: pdfDoc.getAuthor() || 'Unknown Author',
        subject: pdfDoc.getSubject() || '',
        keywords: pdfDoc.getKeywords()?.split(';') || [],
        creator: pdfDoc.getCreator() || 'Codemaniac Studio',
        producer: pdfDoc.getProducer() || 'Codemaniac Engine',
        creationDate: pdfDoc.getCreationDate()?.toLocaleString() || new Date().toLocaleString(),
        modificationDate: pdfDoc.getModificationDate()?.toLocaleString() || new Date().toLocaleString(),
        pageCount: pdfDoc.getPageCount(),
      };
    } catch {
      // fallback
    }
  }

  // Office OpenXML formats (DOCX, XLSX, PPTX)
  if (['docx', 'xlsx', 'pptx'].includes(ext)) {
    try {
      const buffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(buffer);
      const coreXmlFile = zip.file('docProps/core.xml');

      if (coreXmlFile) {
        const xmlText = await coreXmlFile.async('string');
        const extractTag = (tag: string) => {
          const match = xmlText.match(new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`));
          return match ? match[1] : '';
        };

        return {
          fileName: file.name,
          fileSize: file.size,
          fileType: ext.toUpperCase() + ' OpenXML Document',
          title: extractTag('dc:title') || file.name.replace(/\.[^/.]+$/, ''),
          author: extractTag('dc:creator') || 'Unknown Author',
          subject: extractTag('dc:subject') || '',
          keywords: extractTag('cp:keywords')?.split(';') || [],
          creator: extractTag('cp:lastModifiedBy') || 'Microsoft Office / OpenXML',
          producer: 'OpenXML Document Engine',
          creationDate: extractTag('dcterms:created') || '',
          modificationDate: extractTag('dcterms:modified') || '',
        };
      }
    } catch {
      // fallback
    }
  }

  // Generic fallback
  return {
    fileName: file.name,
    fileSize: file.size,
    fileType: ext.toUpperCase() + ' Document',
    title: file.name.replace(/\.[^/.]+$/, ''),
    author: 'Unknown Author',
    subject: '',
    keywords: [],
    creator: 'Codemaniac Studio',
    producer: 'In-Browser Document Engine',
    creationDate: new Date(file.lastModified).toLocaleString(),
    modificationDate: new Date(file.lastModified).toLocaleString(),
  };
}

/**
 * 9. Update Document Metadata
 */
export async function updateDocumentProperties(
  file: File,
  updated: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string[];
    creator?: string;
  }
): Promise<{ blob: Blob; fileName: string }> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  if (ext === 'pdf') {
    const buffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });

    if (updated.title !== undefined) pdfDoc.setTitle(updated.title);
    if (updated.author !== undefined) pdfDoc.setAuthor(updated.author);
    if (updated.subject !== undefined) pdfDoc.setSubject(updated.subject);
    if (updated.keywords !== undefined) pdfDoc.setKeywords(updated.keywords);
    if (updated.creator !== undefined) pdfDoc.setCreator(updated.creator);
    pdfDoc.setProducer('Codemaniac Studio Document Suite');
    pdfDoc.setModificationDate(new Date());

    const bytes = await pdfDoc.save({ useObjectStreams: true });
    return {
      blob: new Blob([bytes as any], { type: 'application/pdf' }),
      fileName: file.name.replace(/\.[^/.]+$/, '') + '_metadata_updated.pdf',
    };
  }

  // For office files (DOCX, PPTX, XLSX), update docProps/core.xml in ZIP
  if (['docx', 'xlsx', 'pptx'].includes(ext)) {
    const buffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(buffer);
    let coreXml = await zip.file('docProps/core.xml')?.async('string');

    if (coreXml) {
      if (updated.title !== undefined) {
        coreXml = coreXml.replace(/<dc:title[^>]*>.*?<\/dc:title>/g, `<dc:title>${updated.title}</dc:title>`);
      }
      if (updated.author !== undefined) {
        coreXml = coreXml.replace(/<dc:creator[^>]*>.*?<\/dc:creator>/g, `<dc:creator>${updated.author}</dc:creator>`);
      }
      if (updated.subject !== undefined) {
        coreXml = coreXml.replace(/<dc:subject[^>]*>.*?<\/dc:subject>/g, `<dc:subject>${updated.subject}</dc:subject>`);
      }
      zip.file('docProps/core.xml', coreXml);
    }

    const newBuffer = await zip.generateAsync({ type: 'blob' });
    return {
      blob: newBuffer,
      fileName: file.name.replace(/\.[^/.]+$/, '') + '_metadata_updated.' + ext,
    };
  }

  throw new Error('Unsupported format for metadata editing. Only PDF, DOCX, XLSX, and PPTX are supported.');
}

/**
 * 10. Document Compressor
 */
export async function compressDocumentFile(
  file: File,
  preset: 'recommended' | 'extreme' | 'low' = 'recommended'
): Promise<{ blob: Blob; fileName: string; originalSize: number; compressedSize: number }> {
  const originalSize = file.size;
  const buffer = await file.arrayBuffer();

  // Load PDF
  const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });

  if (preset === 'extreme') {
    // Strip metadata, outlines, and thumbnails for maximum compression
    try {
      pdfDoc.setTitle('');
      pdfDoc.setAuthor('');
      pdfDoc.setSubject('');
      pdfDoc.setKeywords([]);
      pdfDoc.catalog.delete(PDFName.of('Metadata'));
      pdfDoc.catalog.delete(PDFName.of('PieceInfo'));
      pdfDoc.catalog.delete(PDFName.of('StructTreeRoot'));
      pdfDoc.catalog.delete(PDFName.of('MarkInfo'));
      pdfDoc.catalog.delete(PDFName.of('Outlines'));

      const pages = pdfDoc.getPages();
      for (const p of pages) {
        p.node.delete(PDFName.of('Annots'));
        p.node.delete(PDFName.of('Thumb'));
        p.node.delete(PDFName.of('PieceInfo'));
      }
    } catch {
      // Continue safely
    }
  } else if (preset === 'recommended') {
    pdfDoc.setProducer('Codemaniac Studio Document Compressor');
    pdfDoc.setModificationDate(new Date());
  }

  const bytes = await pdfDoc.save({
    useObjectStreams: true,
    updateFieldAppearances: false,
  });

  const blob = new Blob([bytes as any], { type: 'application/pdf' });
  const outName = file.name.replace(/\.[^/.]+$/, '') + '_compressed.pdf';

  return {
    blob,
    fileName: outName,
    originalSize,
    compressedSize: blob.size,
  };
}

/**
 * 11. Render Document Pages for In-Browser Viewer
 */
export async function renderDocumentPages(
  file: File,
  maxPages: number = 25
): Promise<{ pages: string[]; totalPages: number; textSnippet: string }> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  if (ext === 'pdf') {
    const buffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: buffer });
    const pdf = await loadingTask.promise;
    const totalPages = pdf.numPages;
    const pagesToRender = Math.min(totalPages, maxPages);
    const pages: string[] = [];
    let textSnippet = '';

    for (let i = 1; i <= pagesToRender; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        await (page.render as any)({ canvasContext: ctx, viewport, canvas }).promise;
        pages.push(canvas.toDataURL('image/jpeg', 0.85));
      }

      if (i === 1) {
        const textContent = await page.getTextContent();
        textSnippet = textContent.items
          .map((item: any) => item.str)
          .join(' ')
          .slice(0, 300);
      }
    }

    return { pages, totalPages, textSnippet };
  }

  // If text file
  if (['txt', 'md', 'json', 'csv', 'log', 'xml'].includes(ext)) {
    const text = await file.text();
    const pdfRes = await processTextToPdf(text, file.name);
    const pdfBuffer = await pdfRes.blob.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: pdfBuffer });
    const pdf = await loadingTask.promise;
    const totalPages = pdf.numPages;
    const pages: string[] = [];

    for (let i = 1; i <= Math.min(totalPages, maxPages); i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        await (page.render as any)({ canvasContext: ctx, viewport, canvas }).promise;
        pages.push(canvas.toDataURL('image/jpeg', 0.85));
      }
    }

    return { pages, totalPages, textSnippet: text.slice(0, 300) };
  }

  // If Word docx
  if (ext === 'docx') {
    const pdfRes = await processDocxToPdf(file);
    const pdfBuffer = await pdfRes.blob.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: pdfBuffer });
    const pdf = await loadingTask.promise;
    const totalPages = pdf.numPages;
    const pages: string[] = [];

    for (let i = 1; i <= Math.min(totalPages, maxPages); i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        await (page.render as any)({ canvasContext: ctx, viewport, canvas }).promise;
        pages.push(canvas.toDataURL('image/jpeg', 0.85));
      }
    }

    return { pages, totalPages, textSnippet: 'Word document preview rendered.' };
  }

  return { pages: [], totalPages: 0, textSnippet: '' };
}

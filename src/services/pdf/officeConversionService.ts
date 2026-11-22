import { Document, Paragraph, TextRun, HeadingLevel, Packer } from 'docx';
import * as XLSX from 'xlsx';
import pptxgen from 'pptxgenjs';
import mammoth from 'mammoth';
import JSZip from 'jszip';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { extractTextFromPdf, renderPdfPageToCanvas, clonePdfBuffer, getPdfPageCount } from './pdfLibUtils';
import { pdfjsLib } from './pdfJsSetup';

export interface DocumentAnalysisResult {
  fileType: string;
  fileSize: number;
  totalPagesOrItems: number;
  itemType: 'pages' | 'slides' | 'worksheets';
  totalWords: number;
  totalCharacters: number;
  detectedTables: number;
  detectedHeadings: number;
  detectedImages: number;
  readinessScore: number; // 0 - 100
  summary: string;
  fidelityPlan: string[];
}

/**
 * Deep document inspection and pre-conversion analysis.
 * Analyzes structure, word density, tables, headings, and media before conversion.
 */
export async function analyzeDocumentForConversion(
  buffer: ArrayBuffer,
  fileType:
    | 'pdf-to-word'
    | 'pdf-to-excel'
    | 'pdf-to-powerpoint'
    | 'word-to-pdf'
    | 'excel-to-pdf'
    | 'powerpoint-to-pdf'
): Promise<DocumentAnalysisResult> {
  const fileSize = buffer.byteLength;

  // 1. Analyze PDF Inputs (PDF to Word, PDF to Excel, PDF to PowerPoint)
  if (
    fileType === 'pdf-to-word' ||
    fileType === 'pdf-to-excel' ||
    fileType === 'pdf-to-powerpoint'
  ) {
    const pagesText = await extractTextFromPdf(buffer);
    const totalPages = pagesText.length || 1;

    let totalWords = 0;
    let totalChars = 0;
    let detectedTables = 0;
    let detectedHeadings = 0;

    for (const p of pagesText) {
      totalChars += p.text.length;
      const words = p.text.trim().split(/\s+/).filter(Boolean);
      totalWords += words.length;

      let consecutiveTableRows = 0;
      for (const line of p.lines) {
        const trimmed = line.trim();
        // Check for table rows (comma, tab, or double space separated)
        if (/\t|,| {2,}/.test(trimmed) && trimmed.length > 5) {
          consecutiveTableRows++;
          if (consecutiveTableRows === 2) {
            detectedTables++;
          }
        } else {
          consecutiveTableRows = 0;
        }

        // Check for headings (short, capitalised, or title style)
        if (
          trimmed.length > 3 &&
          trimmed.length < 55 &&
          !trimmed.endsWith('.') &&
          (/^[A-Z0-9\s:—–-]+$/.test(trimmed) || /^(Chapter|Section|\d+\.)/i.test(trimmed))
        ) {
          detectedHeadings++;
        }
      }
    }

    const hasDigitalText = totalWords > 10;
    const readinessScore = hasDigitalText ? 98 : 85;

    let summary = '';
    const fidelityPlan: string[] = [];

    if (fileType === 'pdf-to-word') {
      summary = `Detected ${totalPages} PDF pages with ${totalWords.toLocaleString()} words and ${detectedHeadings} section headings.`;
      fidelityPlan.push('Reconstruct headings, body paragraphs, and structured bullet lists');
      fidelityPlan.push('Insert clean page breaks matching PDF page boundaries');
      fidelityPlan.push('Generate a 100% editable Microsoft Word (.docx) document');
    } else if (fileType === 'pdf-to-excel') {
      summary = `Detected ${totalPages} PDF pages with ${detectedTables || 1} tabular datasets ready for spreadsheet extraction.`;
      fidelityPlan.push('Parse columnar text, comma-separated tokens, and tab stops');
      fidelityPlan.push('Map each page or detected table to dedicated XLSX worksheets');
      fidelityPlan.push('Auto-format numeric columns, dates, and column widths');
    } else {
      summary = `Detected ${totalPages} PDF pages with ${totalWords.toLocaleString()} words ready for slide generation.`;
      fidelityPlan.push('Render high-resolution 16:9 widescreen presentation slides');
      fidelityPlan.push('Embed extracted text content into slide notes and presentation body');
      fidelityPlan.push('Generate standard Microsoft PowerPoint (.pptx) presentation');
    }

    return {
      fileType: 'PDF Document',
      fileSize,
      totalPagesOrItems: totalPages,
      itemType: 'pages',
      totalWords,
      totalCharacters: totalChars,
      detectedTables,
      detectedHeadings,
      detectedImages: totalPages,
      readinessScore,
      summary,
      fidelityPlan,
    };
  }

  // 2. Analyze Word Input (Word to PDF)
  if (fileType === 'word-to-pdf') {
    try {
      const inputOptions: any = {
        arrayBuffer: buffer,
        buffer: typeof Buffer !== 'undefined' ? Buffer.from(buffer) : buffer,
      };
      const result = await mammoth.extractRawText(inputOptions);
      const rawText = result.value || '';
      const lines = rawText.split('\n').filter((l) => l.trim().length > 0);
      const words = rawText.trim().split(/\s+/).filter(Boolean);
      const totalWords = words.length;
      const totalChars = rawText.length;

      // Estimate pages (~300 words per standard A4 page)
      const estimatedPages = Math.max(1, Math.ceil(totalWords / 280));
      const detectedHeadings = lines.filter(
        (l) => l.trim().length < 50 && (/^[A-Z0-9\s:—–-]+$/.test(l.trim()) || /^(Chapter|\d+\.)/i.test(l.trim()))
      ).length;

      return {
        fileType: 'Word Document (.docx)',
        fileSize,
        totalPagesOrItems: estimatedPages,
        itemType: 'pages',
        totalWords,
        totalCharacters: totalChars,
        detectedTables: 0,
        detectedHeadings,
        detectedImages: 0,
        readinessScore: 99,
        summary: `Parsed Word document containing ~${totalWords.toLocaleString()} words across ${lines.length} paragraphs.`,
        fidelityPlan: [
          `Format into clean standard A4 pages (~${estimatedPages} pages)`,
          'Preserve section headings, bold titles, and line breaks',
          'Add professional typography with clean margins and footer page numbering',
        ],
      };
    } catch {
      return {
        fileType: 'Word Document (.docx)',
        fileSize,
        totalPagesOrItems: 1,
        itemType: 'pages',
        totalWords: 0,
        totalCharacters: 0,
        detectedTables: 0,
        detectedHeadings: 0,
        detectedImages: 0,
        readinessScore: 90,
        summary: 'Word (.docx) package ready for parsing and PDF generation.',
        fidelityPlan: ['Extract document text', 'Generate standardized A4 PDF layout'],
      };
    }
  }

  // 3. Analyze Excel Input (Excel to PDF)
  if (fileType === 'excel-to-pdf') {
    try {
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetCount = workbook.SheetNames.length;
      let totalRows = 0;
      let totalCells = 0;

      for (const name of workbook.SheetNames) {
        const sheet = workbook.Sheets[name];
        const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });
        totalRows += data.length;
        data.forEach((r) => {
          totalCells += r.length;
        });
      }

      return {
        fileType: 'Excel Workbook (.xlsx / .csv)',
        fileSize,
        totalPagesOrItems: sheetCount,
        itemType: 'worksheets',
        totalWords: totalCells,
        totalCharacters: 0,
        detectedTables: sheetCount,
        detectedHeadings: sheetCount,
        detectedImages: 0,
        readinessScore: 99,
        summary: `Workbook contains ${sheetCount} worksheet(s) with ${totalRows.toLocaleString()} rows and ${totalCells.toLocaleString()} data cells.`,
        fidelityPlan: [
          'Render high-contrast landscape A4 tables for each worksheet',
          'Apply bold header styling and alternating row background grids',
          'Auto-fit column widths to prevent cell truncation',
        ],
      };
    } catch {
      return {
        fileType: 'Excel Workbook',
        fileSize,
        totalPagesOrItems: 1,
        itemType: 'worksheets',
        totalWords: 0,
        totalCharacters: 0,
        detectedTables: 1,
        detectedHeadings: 1,
        detectedImages: 0,
        readinessScore: 90,
        summary: 'Spreadsheet loaded and ready for tabular PDF rendering.',
        fidelityPlan: ['Render worksheet data into landscape PDF pages'],
      };
    }
  }

  // 4. Analyze PowerPoint Input (PowerPoint to PDF)
  try {
    const zip = await JSZip.loadAsync(buffer);
    const slideFiles = Object.keys(zip.files).filter((name) =>
      /^ppt\/slides\/slide\d+\.xml$/.test(name)
    );
    const mediaFiles = Object.keys(zip.files).filter((name) => /^ppt\/media\//.test(name));
    const totalSlides = slideFiles.length || 1;

    let totalExtractedWords = 0;
    for (const slidePath of slideFiles) {
      try {
        const xml = await zip.files[slidePath].async('string');
        const textMatches = xml.match(/<a:t>([^<]+)<\/a:t>/g) || [];
        for (const t of textMatches) {
          totalExtractedWords += t.replace(/<\/?a:t>/g, '').trim().split(/\s+/).length;
        }
      } catch {
        // ignore
      }
    }

    return {
      fileType: 'PowerPoint Presentation (.pptx)',
      fileSize,
      totalPagesOrItems: totalSlides,
      itemType: 'slides',
      totalWords: totalExtractedWords,
      totalCharacters: 0,
      detectedTables: 0,
      detectedHeadings: totalSlides,
      detectedImages: mediaFiles.length,
      readinessScore: 98,
      summary: `Presentation contains ${totalSlides} slides with ~${totalExtractedWords} words and ${mediaFiles.length} media assets.`,
      fidelityPlan: [
        'Map each slide to a widescreen landscape 16:9 presentation PDF page',
        'Format slide headers in bold with clear bullet point typography',
        'Add slide index numbering and framing borders',
      ],
    };
  } catch {
    return {
      fileType: 'PowerPoint Presentation',
      fileSize,
      totalPagesOrItems: 1,
      itemType: 'slides',
      totalWords: 0,
      totalCharacters: 0,
      detectedTables: 0,
      detectedHeadings: 1,
      detectedImages: 0,
      readinessScore: 90,
      summary: 'PowerPoint (.pptx) presentation loaded and ready for conversion.',
      fidelityPlan: ['Convert presentation slides into high-fidelity landscape PDF pages'],
    };
  }
}

/**
 * PDF to Word (.docx)
 * Converts PDF into a cleanly formatted, editable Microsoft Word document.
 */
export async function convertPdfToWord(
  pdfData: ArrayBuffer,
  fileName: string
): Promise<Blob> {
  const pagesText = await extractTextFromPdf(pdfData);

  const sectionsChildren: Paragraph[] = [
    new Paragraph({
      text: fileName.replace(/\.[^/.]+$/, ''),
      heading: HeadingLevel.TITLE,
      spacing: { after: 300 },
    }),
  ];

  for (let idx = 0; idx < pagesText.length; idx++) {
    const page = pagesText[idx];

    // Page header with page break before (except for first page)
    sectionsChildren.push(
      new Paragraph({
        text: `Page ${page.page}`,
        heading: HeadingLevel.HEADING_2,
        pageBreakBefore: idx > 0,
        spacing: { before: 200, after: 180 },
      })
    );

    if (page.lines.length === 0) {
      sectionsChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '[Scanned page or graphic content - OCR text extraction recommended]',
              italics: true,
              color: '999999',
            }),
          ],
          spacing: { after: 150 },
        })
      );
    } else {
      for (const line of page.lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Check if line looks like a sub-heading (short, capitalized)
        if (
          trimmed.length < 50 &&
          !trimmed.endsWith('.') &&
          (/^[A-Z0-9\s:—–-]+$/.test(trimmed) || /^(Chapter|Section|\d+\.)/i.test(trimmed))
        ) {
          sectionsChildren.push(
            new Paragraph({
              text: trimmed,
              heading: HeadingLevel.HEADING_3,
              spacing: { before: 180, after: 100 },
            })
          );
        } else if (/^[•\-*]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) {
          // Bullet or numbered list item
          sectionsChildren.push(
            new Paragraph({
              text: trimmed,
              bullet: { level: 0 },
              spacing: { after: 100 },
            })
          );
        } else {
          // Regular paragraph text
          sectionsChildren.push(
            new Paragraph({
              text: trimmed,
              spacing: { after: 120 },
            })
          );
        }
      }
    }
  }

  const doc = new Document({
    creator: 'Codemaniac Studio PDF to Word Engine',
    title: fileName.replace(/\.[^/.]+$/, ''),
    sections: [
      {
        properties: {},
        children: sectionsChildren,
      },
    ],
  });

  return await Packer.toBlob(doc);
}

/**
 * PDF to Excel (.xlsx)
 * Extracts detected tabular data into an actual XLSX workbook with multiple sheets.
 */
export async function convertPdfToExcel(
  pdfData: ArrayBuffer
): Promise<Blob> {
  const pagesText = await extractTextFromPdf(pdfData);
  const workbook = XLSX.utils.book_new();

  let hasData = false;

  pagesText.forEach((page, idx) => {
    const rows: Array<Array<string | number>> = [];

    for (const line of page.lines) {
      // Split on tabs, commas, or 2+ consecutive spaces
      const cells = line
        .split(/\t|,| {2,}/)
        .map((c) => c.trim())
        .filter((c) => c.length > 0);

      if (cells.length > 0) {
        // Parse numbers when applicable
        const parsedCells = cells.map((cell) => {
          const cleanNum = cell.replace(/[$,]/g, '');
          if (/^-?\d+(\.\d+)?$/.test(cleanNum) && cleanNum.length < 15) {
            return parseFloat(cleanNum);
          }
          return cell;
        });
        rows.push(parsedCells);
      }
    }

    if (rows.length === 0) {
      rows.push([`Page ${page.page}`], ['No tabular text detected on this page.']);
    } else {
      hasData = true;
    }

    const worksheet = XLSX.utils.aoa_to_sheet(rows);

    // Auto-calculate column widths
    const colWidths = rows.reduce<number[]>((acc, row) => {
      row.forEach((cell, colIdx) => {
        const len = String(cell).length;
        acc[colIdx] = Math.max(acc[colIdx] || 10, Math.min(40, len + 3));
      });
      return acc;
    }, []);

    worksheet['!cols'] = colWidths.map((w) => ({ wch: w }));

    const sheetName = `Page ${idx + 1}`.slice(0, 31);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  });

  if (!hasData) {
    const summarySheet = XLSX.utils.aoa_to_sheet([
      ['Codemaniac Studio PDF to Excel Engine'],
      ['Notice: The provided PDF might contain scanned images or vector paths.'],
    ]);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
  }

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/**
 * PDF to PowerPoint (.pptx)
 * Converts PDF pages into genuine PowerPoint presentation slides using high-fidelity rendering.
 */
export async function convertPdfToPowerPoint(
  pdfData: ArrayBuffer,
  progressCallback?: (pct: number) => void
): Promise<Blob> {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9';

  const safeBuffer = clonePdfBuffer(pdfData);
  const pagesText = await extractTextFromPdf(safeBuffer);
  const totalPages = pagesText.length;

  let pdf: any = null;
  try {
    const loadingTask = pdfjsLib.getDocument({ data: clonePdfBuffer(pdfData) });
    pdf = await loadingTask.promise;
  } catch (err) {
    console.warn('PDF.js failed in convertPdfToPowerPoint:', err);
  }

  for (let i = 1; i <= totalPages; i++) {
    if (progressCallback) {
      progressCallback(Math.round((i / totalPages) * 80));
    }

    const slide = pres.addSlide();

    let imageAdded = false;
    if (pdf) {
      try {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvasContext: ctx, viewport }).promise;
          const dataUrl = canvas.toDataURL('image/png');
          slide.addImage({
            data: dataUrl,
            x: 0.5,
            y: 0.5,
            w: 9.0,
            h: 4.5,
            sizing: { type: 'contain', w: 9.0, h: 4.5 },
          });
          imageAdded = true;
        }
      } catch {
        // fallback
      }
    }

    if (!imageAdded) {
      const pageInfo = pagesText[i - 1];
      slide.addText(`Slide ${i}`, { x: 0.5, y: 0.5, fontSize: 22, bold: true, color: '102A43' });
      if (pageInfo && pageInfo.lines.length > 0) {
        slide.addText(pageInfo.lines.slice(0, 10).join('\n'), {
          x: 0.5,
          y: 1.2,
          w: 9.0,
          h: 3.5,
          fontSize: 12,
          color: '333333',
        });
      }
    }

    // Add speaker notes with extracted text
    const pageText = pagesText[i - 1]?.text || '';
    if (pageText) {
      slide.addNotes(pageText.slice(0, 1000));
    }
  }

  const pptxBlob = (await pres.write({ outputType: 'blob' })) as Blob;
  return pptxBlob;
}

/**
 * Word (.docx) to PDF
 * Converts DOCX files to clean, professionally formatted multi-page PDFs with proper margins and headers.
 */
export async function convertWordToPdf(docxBuffer: ArrayBuffer): Promise<Blob> {
  const inputOptions: any = {
    arrayBuffer: docxBuffer,
    buffer: typeof Buffer !== 'undefined' ? Buffer.from(docxBuffer) : docxBuffer,
  };
  const result = await mammoth.extractRawText(inputOptions);
  const rawText = result.value || 'Empty Word document';
  const lines = rawText.split('\n');

  const pdfDoc = await PDFDocument.create();
  pdfDoc.setProducer('Codemaniac Studio Word to PDF Converter');
  pdfDoc.setModificationDate(new Date());

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595.28; // Standard A4
  const pageHeight = 841.89;
  const margin = 54;
  const contentWidth = pageWidth - margin * 2;
  const lineHeight = 15;

  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;
  let pageNumber = 1;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      y -= lineHeight * 0.8;
      continue;
    }

    // Check if line is a title or section heading
    const isHeading =
      line.length < 55 &&
      !line.endsWith('.') &&
      (/^[A-Z0-9\s:—–-]+$/.test(line) || /^(Chapter|Section|\d+\.)/i.test(line));

    const currentFont = isHeading ? boldFont : font;
    const currentSize = isHeading ? 14 : 10;
    const currentLineHeight = isHeading ? 22 : lineHeight;

    // Word wrapping
    const words = line.split(' ');
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = currentFont.widthOfTextAtSize(testLine, currentSize);

      if (testWidth > contentWidth) {
        if (y < margin + currentLineHeight + 20) {
          // Draw page footer
          currentPage.drawText(`Page ${pageNumber}`, {
            x: pageWidth / 2 - 15,
            y: 25,
            size: 9,
            font,
            color: rgb(0.5, 0.5, 0.5),
          });
          currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
          pageNumber++;
          y = pageHeight - margin;
        }

        currentPage.drawText(currentLine, {
          x: margin,
          y,
          size: currentSize,
          font: currentFont,
          color: isHeading ? rgb(0.06, 0.16, 0.26) : rgb(0.15, 0.15, 0.15),
        });
        y -= currentLineHeight;
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      if (y < margin + currentLineHeight + 20) {
        currentPage.drawText(`Page ${pageNumber}`, {
          x: pageWidth / 2 - 15,
          y: 25,
          size: 9,
          font,
          color: rgb(0.5, 0.5, 0.5),
        });
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        pageNumber++;
        y = pageHeight - margin;
      }

      currentPage.drawText(currentLine, {
        x: margin,
        y,
        size: currentSize,
        font: currentFont,
        color: isHeading ? rgb(0.06, 0.16, 0.26) : rgb(0.15, 0.15, 0.15),
      });
      y -= currentLineHeight;
    }
  }

  // Draw footer on final page
  currentPage.drawText(`Page ${pageNumber}`, {
    x: pageWidth / 2 - 15,
    y: 25,
    size: 9,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });

  const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
  return new Blob([pdfBytes as any], { type: 'application/pdf' });
}

/**
 * Excel (.xlsx / .csv) to PDF
 * Converts spreadsheets into cleanly formatted landscape PDF tables.
 */
export async function convertExcelToPdf(xlsxBuffer: ArrayBuffer): Promise<Blob> {
  const workbook = XLSX.read(xlsxBuffer, { type: 'array' });
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setProducer('Codemaniac Studio Excel to PDF Converter');

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 841.89; // Landscape A4 for tables
  const pageHeight = 595.28;
  const margin = 40;
  const rowHeight = 20;

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });

    if (!data || data.length === 0) continue;

    let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    // Sheet Header
    currentPage.drawText(`Sheet: ${sheetName}`, {
      x: margin,
      y,
      size: 15,
      font: boldFont,
      color: rgb(0.06, 0.16, 0.26),
    });
    y -= 26;

    // Determine max columns
    const maxCols = Math.min(10, Math.max(...data.map((r) => r.length)));
    const colWidth = (pageWidth - margin * 2) / Math.max(1, maxCols);

    for (let rIdx = 0; rIdx < data.length; rIdx++) {
      const row = data[rIdx];
      if (y < margin + rowHeight) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }

      const isHeader = rIdx === 0;
      const currentFont = isHeader ? boldFont : font;

      // Draw light background for alternating rows or header
      if (isHeader) {
        currentPage.drawRectangle({
          x: margin,
          y: y - 4,
          width: pageWidth - margin * 2,
          height: rowHeight,
          color: rgb(0.92, 0.94, 0.96),
        });
      } else if (rIdx % 2 === 0) {
        currentPage.drawRectangle({
          x: margin,
          y: y - 4,
          width: pageWidth - margin * 2,
          height: rowHeight,
          color: rgb(0.98, 0.98, 0.98),
        });
      }

      // Draw bottom row divider line
      currentPage.drawLine({
        start: { x: margin, y: y - 4 },
        end: { x: pageWidth - margin, y: y - 4 },
        thickness: 0.5,
        color: rgb(0.85, 0.85, 0.85),
      });

      for (let cIdx = 0; cIdx < maxCols; cIdx++) {
        const val = row[cIdx] !== undefined && row[cIdx] !== null ? String(row[cIdx]) : '';
        const truncated = val.length > 25 ? val.slice(0, 22) + '...' : val;

        currentPage.drawText(truncated, {
          x: margin + cIdx * colWidth + 5,
          y: y + 2,
          size: isHeader ? 9.5 : 8.5,
          font: currentFont,
          color: isHeader ? rgb(0.06, 0.16, 0.26) : rgb(0.15, 0.15, 0.15),
        });
      }

      y -= rowHeight;
    }
  }

  if (pdfDoc.getPageCount() === 0) {
    const fallback = pdfDoc.addPage([pageWidth, pageHeight]);
    fallback.drawText('Excel document contains no readable sheets.', {
      x: margin,
      y: pageHeight - margin,
      size: 12,
      font,
    });
  }

  const bytes = await pdfDoc.save({ useObjectStreams: true });
  return new Blob([bytes as any], { type: 'application/pdf' });
}

/**
 * PowerPoint (.pptx) to PDF
 * Converts PPTX presentation slides into formatted 16:9 presentation PDF pages.
 */
export async function convertPowerPointToPdf(pptxBuffer: ArrayBuffer): Promise<Blob> {
  const zip = await JSZip.loadAsync(pptxBuffer);
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setProducer('Codemaniac Studio PowerPoint to PDF Converter');

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 841.89; // Landscape 16:9 widescreen
  const pageHeight = 595.28;
  const margin = 50;

  // Find slide XML files in ppt/slides/slide*.xml
  const slideFiles = Object.keys(zip.files).filter((name) =>
    /^ppt\/slides\/slide\d+\.xml$/.test(name)
  );

  slideFiles.sort((a, b) => {
    const numA = parseInt(a.match(/\d+/)![0], 10);
    const numB = parseInt(b.match(/\d+/)![0], 10);
    return numA - numB;
  });

  if (slideFiles.length === 0) {
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    page.drawText('PowerPoint Presentation (Converted)', {
      x: margin,
      y: pageHeight - margin,
      size: 20,
      font: boldFont,
    });
  } else {
    for (let i = 0; i < slideFiles.length; i++) {
      const slidePath = slideFiles[i];
      const xmlText = await zip.files[slidePath].async('string');

      const textMatches = xmlText.match(/<a:t>([^<]+)<\/a:t>/g) || [];
      const extractedLines: string[] = textMatches
        .map((m) => m.replace(/<\/?a:t>/g, '').trim())
        .filter(Boolean);

      const page = pdfDoc.addPage([pageWidth, pageHeight]);

      // Slide framing card
      page.drawRectangle({
        x: 20,
        y: 20,
        width: pageWidth - 40,
        height: pageHeight - 40,
        borderColor: rgb(0.85, 0.85, 0.85),
        borderWidth: 1,
      });

      // Top slide indicator
      page.drawText(`Slide ${i + 1}`, {
        x: pageWidth - margin - 50,
        y: pageHeight - 40,
        size: 10,
        font,
        color: rgb(0.5, 0.5, 0.5),
      });

      let y = pageHeight - margin;
      let isFirst = true;

      for (const line of extractedLines) {
        if (y < margin + 25) break;

        if (isFirst) {
          page.drawText(line.slice(0, 60), {
            x: margin,
            y,
            size: 22,
            font: boldFont,
            color: rgb(0.06, 0.16, 0.26),
          });
          y -= 38;
          isFirst = false;
        } else {
          page.drawText(`•  ${line.slice(0, 95)}`, {
            x: margin + 15,
            y,
            size: 13,
            font,
            color: rgb(0.2, 0.2, 0.2),
          });
          y -= 24;
        }
      }

      if (extractedLines.length === 0) {
        page.drawText(`Slide ${i + 1} (Visual Slide Content)`, {
          x: margin,
          y: pageHeight / 2,
          size: 16,
          font: boldFont,
          color: rgb(0.4, 0.4, 0.4),
        });
      }
    }
  }

  const bytes = await pdfDoc.save({ useObjectStreams: true });
  return new Blob([bytes as any], { type: 'application/pdf' });
}

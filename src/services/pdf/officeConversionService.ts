import { Document, Paragraph, TextRun, HeadingLevel, Packer } from 'docx';
import * as XLSX from 'xlsx';
import pptxgen from 'pptxgenjs';
import mammoth from 'mammoth';
import JSZip from 'jszip';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { extractTextFromPdf, renderPdfPageToCanvas, clonePdfBuffer } from './pdfLibUtils';
import { pdfjsLib } from './pdfJsSetup';

/**
 * PDF to Word (.docx)
 * Extracts structured text and paragraphs and creates a genuine editable DOCX file.
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
    new Paragraph({
      children: [
        new TextRun({
          text: 'Converted by Codemaniac Studio PDF to Word Engine',
          italics: true,
          color: '888888',
        }),
      ],
      spacing: { after: 400 },
    }),
  ];

  for (const page of pagesText) {
    sectionsChildren.push(
      new Paragraph({
        text: `--- Page ${page.page} ---`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 150 },
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
        if (line.trim()) {
          sectionsChildren.push(
            new Paragraph({
              text: line,
              spacing: { after: 120 },
            })
          );
        }
      }
    }
  }

  const doc = new Document({
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
    const rows: string[][] = [];

    for (const line of page.lines) {
      // Split on tabs, commas, or 2+ consecutive spaces
      const cells = line
        .split(/\t|,| {2,}/)
        .map((c) => c.trim())
        .filter((c) => c.length > 0);

      if (cells.length > 0) {
        rows.push(cells);
      }
    }

    if (rows.length === 0) {
      rows.push([`Page ${page.page}`], ['No tabular text detected on this page.']);
    } else {
      hasData = true;
    }

    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    const sheetName = `Page ${idx + 1}`.slice(0, 31);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  });

  if (!hasData) {
    const summarySheet = XLSX.utils.aoa_to_sheet([
      ['Codemaniac Studio PDF to Excel'],
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
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
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
      // Fallback: place extracted text on slide
      const pageInfo = pagesText[i - 1];
      slide.addText(`Slide ${i}`, { x: 0.5, y: 0.5, fontSize: 20, bold: true });
      if (pageInfo && pageInfo.lines.length > 0) {
        slide.addText(pageInfo.lines.slice(0, 10).join('\n'), {
          x: 0.5,
          y: 1.2,
          w: 9.0,
          h: 3.5,
          fontSize: 12,
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
 * Converts DOCX files to valid multi-page PDFs with text formatting.
 */
export async function convertWordToPdf(docxBuffer: ArrayBuffer): Promise<Blob> {
  const result = await mammoth.extractRawText({ arrayBuffer: docxBuffer });
  const rawText = result.value || 'Empty Word document';
  const lines = rawText.split('\n');

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595.28; // A4
  const pageHeight = 841.89;
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;
  const lineHeight = 14;

  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  // Header
  currentPage.drawText('Document Converted from Word (.docx)', {
    x: margin,
    y: y,
    size: 14,
    font: boldFont,
    color: rgb(0.06, 0.16, 0.26),
  });
  y -= 25;

  for (const line of lines) {
    if (!line.trim()) {
      y -= lineHeight * 0.8;
      continue;
    }

    // Wrap long lines
    const words = line.split(' ');
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, 10);

      if (testWidth > contentWidth) {
        if (y < margin + lineHeight) {
          currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
          y = pageHeight - margin;
        }
        currentPage.drawText(currentLine, {
          x: margin,
          y,
          size: 10,
          font,
          color: rgb(0.15, 0.15, 0.15),
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
        size: 10,
        font,
        color: rgb(0.15, 0.15, 0.15),
      });
      y -= lineHeight;
    }
  }

  const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
  return new Blob([pdfBytes as any], { type: 'application/pdf' });
}

/**
 * Excel (.xlsx) to PDF
 * Converts spreadsheets into formatted PDF tables.
 */
export async function convertExcelToPdf(xlsxBuffer: ArrayBuffer): Promise<Blob> {
  const workbook = XLSX.read(xlsxBuffer, { type: 'array' });
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 841.89; // Landscape A4 for tables
  const pageHeight = 595.28;
  const margin = 40;
  const rowHeight = 18;

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });

    if (!data || data.length === 0) continue;

    let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    // Sheet Title
    currentPage.drawText(`Sheet: ${sheetName}`, {
      x: margin,
      y,
      size: 14,
      font: boldFont,
      color: rgb(0.06, 0.16, 0.26),
    });
    y -= 25;

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

      // Draw light background for alternating rows
      if (rIdx % 2 === 0) {
        currentPage.drawRectangle({
          x: margin,
          y: y - 3,
          width: pageWidth - margin * 2,
          height: rowHeight,
          color: rgb(0.96, 0.96, 0.96),
        });
      }

      for (let cIdx = 0; cIdx < maxCols; cIdx++) {
        const val = row[cIdx] !== undefined && row[cIdx] !== null ? String(row[cIdx]) : '';
        const truncated = val.length > 25 ? val.slice(0, 22) + '...' : val;

        currentPage.drawText(truncated, {
          x: margin + cIdx * colWidth + 4,
          y: y + 2,
          size: 9,
          font: currentFont,
          color: rgb(0.1, 0.1, 0.1),
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
 * Converts PPTX slides into a genuine PDF presentation.
 */
export async function convertPowerPointToPdf(pptxBuffer: ArrayBuffer): Promise<Blob> {
  const zip = await JSZip.loadAsync(pptxBuffer);
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 841.89; // Landscape 16:9 / A4
  const pageHeight = 595.28;
  const margin = 50;

  // Find slide XML files in ppt/slides/slide*.xml
  const slideFiles = Object.keys(zip.files).filter((name) =>
    /^ppt\/slides\/slide\d+\.xml$/.test(name)
  );

  // Sort slides numerically: slide1.xml, slide2.xml...
  slideFiles.sort((a, b) => {
    const numA = parseInt(a.match(/\d+/)![0], 10);
    const numB = parseInt(b.match(/\d+/)![0], 10);
    return numA - numB;
  });

  if (slideFiles.length === 0) {
    // Fallback: create single page
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

      // Extract text content from <a:t> tags
      const textMatches = xmlText.match(/<a:t>([^<]+)<\/a:t>/g) || [];
      const extractedLines: string[] = textMatches.map((m) =>
        m.replace(/<\/?a:t>/g, '').trim()
      ).filter(Boolean);

      const page = pdfDoc.addPage([pageWidth, pageHeight]);

      // Slide background border
      page.drawRectangle({
        x: 20,
        y: 20,
        width: pageWidth - 40,
        height: pageHeight - 40,
        borderColor: rgb(0.85, 0.85, 0.85),
        borderWidth: 1,
      });

      // Slide number badge
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
        if (y < margin + 20) break;

        if (isFirst) {
          page.drawText(line.slice(0, 60), {
            x: margin,
            y,
            size: 22,
            font: boldFont,
            color: rgb(0.06, 0.16, 0.26),
          });
          y -= 36;
          isFirst = false;
        } else {
          page.drawText(`•  ${line.slice(0, 90)}`, {
            x: margin + 15,
            y,
            size: 13,
            font,
            color: rgb(0.2, 0.2, 0.2),
          });
          y -= 22;
        }
      }

      if (extractedLines.length === 0) {
        page.drawText(`Slide ${i + 1} (Graphic / Visual Content)`, {
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

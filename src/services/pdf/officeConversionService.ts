import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  Packer,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
  AlignmentType,
  Header,
  Footer,
  PageNumber,
} from 'docx';
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
    let totalPages = 1;
    let totalWords = 0;
    let totalChars = 0;
    let detectedTables = 0;
    let detectedHeadings = 0;

    try {
      const structured = await extractStructuredPdfDoc(buffer);
      totalPages = structured.pages.length || 1;

      for (const page of structured.pages) {
        let i = 0;
        while (i < page.lines.length) {
          const line = page.lines[i];
          const text = line.fullText.trim();
          totalChars += text.length;
          totalWords += text.split(/\s+/).filter(Boolean).length;

          if (line.cells.length >= 2) {
            let j = i + 1;
            while (j < page.lines.length && page.lines[j].cells.length >= 2) {
              const dy = page.lines[j - 1].y - page.lines[j].y;
              if (dy >= 9 && dy <= 30) {
                j++;
              } else {
                break;
              }
            }
            if (j - i >= 2) {
              detectedTables++;
              i = j;
              continue;
            }
          }

          if (
            (/^\d+\.\s+[A-Z]/.test(text) && text.length < 80) ||
            (line.fontSize >= 14 && text.length < 60)
          ) {
            detectedHeadings++;
          }

          i++;
        }
      }
    } catch {
      const pagesText = await extractTextFromPdf(buffer);
      totalPages = pagesText.length || 1;
      for (const p of pagesText) {
        totalChars += p.text.length;
        const words = p.text.trim().split(/\s+/).filter(Boolean);
        totalWords += words.length;
        for (const line of p.lines) {
          const trimmed = line.trim();
          if (/^[A-Z0-9\s:—–-]+$/.test(trimmed) && trimmed.length < 50) {
            detectedHeadings++;
          }
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

interface StructuredPdfItem {
  str: string;
  x: number;
  y: number;
  w: number;
  fontSize: number;
}

interface StructuredPdfCell {
  text: string;
  x: number;
  w: number;
  fontSize: number;
}

interface StructuredPdfLine {
  y: number;
  fontSize: number;
  cells: StructuredPdfCell[];
  fullText: string;
}

interface StructuredPdfPage {
  pageNumber: number;
  lines: StructuredPdfLine[];
}

interface StructuredPdfDoc {
  runningHeader: string;
  pages: StructuredPdfPage[];
}

/**
 * Extracts spatially grouped lines and columns from PDF using PDF.js text coordinates.
 * Preserves horizontal positioning to distinguish columns in tables and eliminate footer noise.
 */
async function extractStructuredPdfDoc(pdfData: ArrayBuffer): Promise<StructuredPdfDoc> {
  const safeData = clonePdfBuffer(pdfData);
  const loadingTask = pdfjsLib.getDocument({ data: safeData });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;

  let docRunningHeader = '';
  const pages: StructuredPdfPage[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const rawItems: StructuredPdfItem[] = (content.items as Array<any>)
      .filter((it) => it.str && it.str.trim())
      .map((it) => ({
        str: it.str,
        x: it.transform[4],
        y: it.transform[5],
        w: it.width || 0,
        fontSize: Math.hypot(it.transform[0], it.transform[1]) || it.height || 10,
      }));

    // Group items into horizontal line buckets
    rawItems.sort((a, b) => b.y - a.y);
    const lineBuckets: Array<{ y: number; items: StructuredPdfItem[] }> = [];

    for (const item of rawItems) {
      let bucket = lineBuckets.find((b) => Math.abs(b.y - item.y) <= 3.5);
      if (!bucket) {
        bucket = { y: item.y, items: [] };
        lineBuckets.push(bucket);
      }
      bucket.items.push(item);
    }

    lineBuckets.sort((a, b) => b.y - a.y);

    // Identify running header or footer
    for (const b of lineBuckets) {
      if (b.y < 35) {
        const text = b.items.map((i) => i.str).join(' ');
        if (!docRunningHeader && text.includes('|')) {
          docRunningHeader = text.replace(/Page\s+\d+.*$/i, '').trim();
        }
      }
    }

    // Filter out running footer (y < 35)
    const contentLines = lineBuckets.filter((b) => b.y >= 35);

    // Segment lines into columns based on horizontal spacing
    const structuredLines: StructuredPdfLine[] = contentLines.map((b) => {
      b.items.sort((a, b) => a.x - b.x);
      const cells: StructuredPdfCell[] = [];
      let currentCell: StructuredPdfCell | null = null;

      for (const it of b.items) {
        if (!currentCell) {
          currentCell = { text: it.str, x: it.x, w: it.w, fontSize: it.fontSize };
        } else {
          const gap = it.x - (currentCell.x + currentCell.w);
          if (gap >= 22) {
            cells.push({ ...currentCell, text: currentCell.text.trim() });
            currentCell = { text: it.str, x: it.x, w: it.w, fontSize: it.fontSize };
          } else {
            const needsSpace = !currentCell.text.endsWith(' ') && !it.str.startsWith(' ');
            currentCell.text += (needsSpace ? ' ' : '') + it.str;
            currentCell.w = it.x + it.w - currentCell.x;
          }
        }
      }
      if (currentCell) {
        cells.push({ ...currentCell, text: currentCell.text.trim() });
      }

      const avgFontSize =
        b.items.reduce((acc, it) => acc + it.fontSize, 0) / (b.items.length || 1);

      return {
        y: b.y,
        fontSize: avgFontSize,
        cells,
        fullText: cells.map((c) => c.text).join(' '),
      };
    });

    pages.push({
      pageNumber: pageNum,
      lines: structuredLines,
    });
  }

  return {
    runningHeader: docRunningHeader,
    pages,
  };
}

/**
 * PDF to Word (.docx)
 * High-fidelity layout and table reconstruction engine matching iLovePDF standards.
 * Detects real tables with styled headers, alternating rows, borders, callouts, and clean paragraphs.
 */
export async function convertPdfToWord(
  pdfData: ArrayBuffer,
  fileName: string
): Promise<Blob> {
  const structuredDoc = await extractStructuredPdfDoc(pdfData);
  const sectionsChildren: (Paragraph | Table)[] = [];

  for (let pageIdx = 0; pageIdx < structuredDoc.pages.length; pageIdx++) {
    const page = structuredDoc.pages[pageIdx];
    const pageLines = page.lines;
    const isFirstPage = pageIdx === 0;

    let i = 0;
    let isPageStart = true;

    while (i < pageLines.length) {
      const line = pageLines[i];
      const trimmedText = line.fullText.trim();

      if (!trimmedText) {
        i++;
        continue;
      }

      // 1. Detect Callout / Notice Box (e.g. "Submission note:", "Scope rule:", "Important:")
      const isCallout =
        /^(Submission note|Scope rule|Important|Note|Notice|Warning|Caution):/i.test(trimmedText) ||
        /^This is the correct way to comply/i.test(trimmedText);

      if (isCallout) {
        let calloutText = trimmedText;
        while (
          i + 1 < pageLines.length &&
          pageLines[i + 1].cells.length === 1 &&
          !/^(Submission note|Scope rule|Important|Note|Notice|Warning|Caution|\d+\.)/i.test(
            pageLines[i + 1].fullText
          ) &&
          pageLines[i].y - pageLines[i + 1].y <= 18 &&
          pageLines[i].y - pageLines[i + 1].y > 8
        ) {
          i++;
          calloutText += ' ' + pageLines[i].fullText.trim();
        }

        const colonIdx = calloutText.indexOf(':');
        let prefix = '';
        let body = calloutText;
        if (colonIdx > 0 && colonIdx < 30) {
          prefix = calloutText.slice(0, colonIdx + 1);
          body = calloutText.slice(colonIdx + 1).trim();
        }

        const calloutTable = new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  shading: { fill: 'FEF9E7', type: ShadingType.CLEAR },
                  borders: {
                    top: { style: BorderStyle.NONE },
                    bottom: { style: BorderStyle.NONE },
                    right: { style: BorderStyle.NONE },
                    left: { style: BorderStyle.SINGLE, size: 24, color: 'E67E22' },
                  },
                  margins: { top: 120, bottom: 120, left: 180, right: 180 },
                  children: [
                    new Paragraph({
                      spacing: { line: 276 },
                      children: [
                        ...(prefix
                          ? [
                              new TextRun({
                                text: prefix + ' ',
                                bold: true,
                                color: '793D00',
                                size: 19,
                              }),
                            ]
                          : []),
                        new TextRun({
                          text: body,
                          color: '5A3E1B',
                          size: 19,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        });

        sectionsChildren.push(calloutTable);
        sectionsChildren.push(new Paragraph({ spacing: { after: 120 } }));
        i++;
        isPageStart = false;
        continue;
      }

      // 2. Detect Tables (2 or more consecutive rows with >= 2 cells and consistent row spacing)
      if (line.cells.length >= 2) {
        const tableLines: StructuredPdfLine[] = [line];
        let j = i + 1;
        while (j < pageLines.length && pageLines[j].cells.length >= 2) {
          const dy = pageLines[j - 1].y - pageLines[j].y;
          if (dy >= 9 && dy <= 30) {
            tableLines.push(pageLines[j]);
            j++;
          } else {
            break;
          }
        }

        if (tableLines.length >= 2) {
          const maxCols = Math.max(...tableLines.map((tl) => tl.cells.length));

          // Estimate column widths by inspecting character lengths
          const colLens: number[] = new Array(maxCols).fill(10);
          for (const tl of tableLines) {
            tl.cells.forEach((c, cIdx) => {
              colLens[cIdx] = Math.max(colLens[cIdx], c.text.length);
            });
          }
          const totalLen = colLens.reduce((a, b) => a + b, 0);
          const colWidthsPct = colLens.map((l) => Math.max(10, Math.round((l / totalLen) * 100)));
          const adjustedSum = colWidthsPct.reduce((a, b) => a + b, 0);
          if (adjustedSum !== 100) {
            colWidthsPct[colWidthsPct.length - 1] += 100 - adjustedSum;
          }

          const tableRows: TableRow[] = tableLines.map((tl, rowIdx) => {
            const isHeader = rowIdx === 0;
            const cells: TableCell[] = [];

            for (let c = 0; c < maxCols; c++) {
              const cellData = tl.cells[c];
              const cellText = cellData ? cellData.text : '';

              const isNumeric =
                !isHeader &&
                (/^[\$€£]?\s*-?[\d,]+(\.\d+)?%?$/.test(cellText) ||
                  /^\d{1,2}\.\d{1,2}%$/.test(cellText) ||
                  /^\d+\s*days?$/i.test(cellText));

              cells.push(
                new TableCell({
                  width: { size: colWidthsPct[c], type: WidthType.PERCENTAGE },
                  shading: isHeader
                    ? { fill: '1669AA', type: ShadingType.CLEAR }
                    : rowIdx % 2 === 0
                    ? { fill: 'F2F6FB', type: ShadingType.CLEAR }
                    : { fill: 'FFFFFF', type: ShadingType.CLEAR },
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 4, color: 'D4DFE8' },
                    bottom: { style: BorderStyle.SINGLE, size: 4, color: 'D4DFE8' },
                    left: { style: BorderStyle.SINGLE, size: 4, color: 'D4DFE8' },
                    right: { style: BorderStyle.SINGLE, size: 4, color: 'D4DFE8' },
                  },
                  margins: { top: 90, bottom: 90, left: 140, right: 140 },
                  children: [
                    new Paragraph({
                      alignment: isNumeric
                        ? AlignmentType.RIGHT
                        : isHeader && maxCols > 3 && c > 1
                        ? AlignmentType.RIGHT
                        : AlignmentType.LEFT,
                      children: [
                        new TextRun({
                          text: cellText,
                          bold: isHeader,
                          color: isHeader ? 'FFFFFF' : '222222',
                          size: 17,
                        }),
                      ],
                    }),
                  ],
                })
              );
            }

            return new TableRow({
              tableHeader: isHeader,
              cantSplit: true,
              children: cells,
            });
          });

          const table = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: tableRows,
          });

          sectionsChildren.push(table);
          sectionsChildren.push(new Paragraph({ spacing: { after: 140 } }));

          i = j;
          isPageStart = false;
          continue;
        }
      }

      // 3. Page 1 Title and Subtitles
      if (isFirstPage && line.fontSize >= 18 && i < 3) {
        sectionsChildren.push(
          new Paragraph({
            text: trimmedText,
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { before: isPageStart ? 240 : 160, after: 140 },
          })
        );
        i++;
        isPageStart = false;
        continue;
      }

      if (isFirstPage && line.fontSize >= 12 && i < 5) {
        sectionsChildren.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: trimmedText,
                bold: true,
                color: '44647C',
                size: 22,
              }),
            ],
          })
        );
        i++;
        isPageStart = false;
        continue;
      }

      // 4. Section Headings (e.g. "1. Executive Summary", "2. Dataset Structure")
      const isHeading1 = /^\d+\.\s+[A-Z]/.test(trimmedText) && trimmedText.length < 80;
      if (isHeading1) {
        sectionsChildren.push(
          new Paragraph({
            pageBreakBefore: !isFirstPage && isPageStart,
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 260, after: 120 },
            children: [
              new TextRun({
                text: trimmedText,
                bold: true,
                color: '113B5D',
                size: 26,
              }),
            ],
          })
        );
        i++;
        isPageStart = false;
        continue;
      }

      // 5. Findings with Lead-in Bold ("Finding 1 – ... Evidence: ... Business meaning: ...")
      if (/^Finding\s+\d+/i.test(trimmedText)) {
        let findingFull = trimmedText;
        while (
          i + 1 < pageLines.length &&
          pageLines[i + 1].cells.length === 1 &&
          !/^Finding\s+\d+/i.test(pageLines[i + 1].fullText) &&
          !/^\d+\./i.test(pageLines[i + 1].fullText) &&
          pageLines[i].y - pageLines[i + 1].y <= 18
        ) {
          i++;
          findingFull += ' ' + pageLines[i].fullText.trim();
        }

        const parts = findingFull.split(/(Evidence:|Business meaning:)/g);
        const textRuns: TextRun[] = [];

        for (let pIdx = 0; pIdx < parts.length; pIdx++) {
          const part = parts[pIdx];
          if (part === 'Evidence:' || part === 'Business meaning:') {
            textRuns.push(new TextRun({ text: ' ' + part + ' ', bold: true, color: '113B5D' }));
          } else if (pIdx === 0 && part.includes('.')) {
            const firstDot = part.indexOf('.');
            const titlePart = part.slice(0, firstDot + 1);
            const rest = part.slice(firstDot + 1);
            textRuns.push(new TextRun({ text: titlePart, bold: true, color: '113B5D' }));
            if (rest) textRuns.push(new TextRun({ text: rest, color: '333333' }));
          } else {
            textRuns.push(new TextRun({ text: part, color: '333333' }));
          }
        }

        sectionsChildren.push(
          new Paragraph({
            spacing: { after: 140, line: 260 },
            children: textRuns,
          })
        );
        i++;
        isPageStart = false;
        continue;
      }

      // 6. Numbered Recommendations with Bold Lead-in Sentence
      if (/^\d+\.\s+[A-Z]/.test(trimmedText) && trimmedText.includes('.')) {
        let recFull = trimmedText;
        while (
          i + 1 < pageLines.length &&
          pageLines[i + 1].cells.length === 1 &&
          !/^\d+\./i.test(pageLines[i + 1].fullText) &&
          pageLines[i].y - pageLines[i + 1].y <= 18
        ) {
          i++;
          recFull += ' ' + pageLines[i].fullText.trim();
        }

        const firstDotIdx = recFull.indexOf('.');
        const secondDotIdx = recFull.indexOf('.', firstDotIdx + 1);

        const runs: TextRun[] = [];
        if (secondDotIdx > 0 && secondDotIdx - firstDotIdx < 60) {
          runs.push(
            new TextRun({
              text: recFull.slice(0, secondDotIdx + 1),
              bold: true,
              color: '113B5D',
            })
          );
          runs.push(
            new TextRun({
              text: recFull.slice(secondDotIdx + 1),
              color: '333333',
            })
          );
        } else {
          runs.push(
            new TextRun({
              text: recFull,
              color: '333333',
            })
          );
        }

        sectionsChildren.push(
          new Paragraph({
            spacing: { after: 140, line: 260 },
            children: runs,
          })
        );
        i++;
        isPageStart = false;
        continue;
      }

      // 7. Page 1 Metadata Key-Value pairs
      if (
        isFirstPage &&
        /^(Prepared by|Dataset|Analysis period|SQL platform|Submission companion):/i.test(
          trimmedText
        )
      ) {
        const [label, ...val] = trimmedText.split(':');
        sectionsChildren.push(
          new Paragraph({
            spacing: { after: 80 },
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: label + ': ', bold: true, color: '113B5D', size: 20 }),
              new TextRun({ text: val.join(':').trim(), color: '444444', size: 20 }),
            ],
          })
        );
        i++;
        isPageStart = false;
        continue;
      }

      // 8. Normal flowing text paragraph (accumulate wrapped lines seamlessly)
      let paragraphText = trimmedText;
      let nextLineIdx = i + 1;
      while (
        nextLineIdx < pageLines.length &&
        pageLines[nextLineIdx].cells.length === 1 &&
        !/^(Submission note|Scope rule|Important|Note|Notice|Finding|\d+\.)/i.test(
          pageLines[nextLineIdx].fullText
        )
      ) {
        const dy = pageLines[nextLineIdx - 1].y - pageLines[nextLineIdx].y;
        if (dy >= 9 && dy <= 18) {
          paragraphText += ' ' + pageLines[nextLineIdx].fullText.trim();
          nextLineIdx++;
        } else {
          break;
        }
      }

      sectionsChildren.push(
        new Paragraph({
          pageBreakBefore: !isFirstPage && isPageStart,
          spacing: { after: 140, line: 260 },
          children: [
            new TextRun({
              text: paragraphText,
              color: '222222',
              size: 20,
            }),
          ],
        })
      );

      i = nextLineIdx;
      isPageStart = false;
    }
  }

  const cleanDocTitle = fileName.replace(/\.[^/.]+$/, '');

  const doc = new Document({
    creator: 'Codemaniac Studio PDF to Word Engine',
    title: cleanDocTitle,
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1000,
              bottom: 900,
              left: 1000,
              right: 1000,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { after: 200 },
                children: [
                  new TextRun({
                    text: structuredDoc.runningHeader || cleanDocTitle,
                    color: '888888',
                    size: 16,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { before: 200 },
                children: [
                  new TextRun({
                    text: 'Page ',
                    color: '888888',
                    size: 16,
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    color: '888888',
                    size: 16,
                  }),
                ],
              }),
            ],
          }),
        },
        children: sectionsChildren,
      },
    ],
  });

  return await Packer.toBlob(doc);
}

/**
 * PDF to Excel (.xlsx)
 * Extracts detected tabular data into an actual XLSX workbook with multiple sheets.
 * Preserves structured table columns and numbers.
 */
export async function convertPdfToExcel(
  pdfData: ArrayBuffer
): Promise<Blob> {
  const structuredDoc = await extractStructuredPdfDoc(pdfData);
  const workbook = XLSX.utils.book_new();

  let hasData = false;
  let tableIndex = 1;
  const allTablesData: Array<Array<string | number>> = [];

  for (const page of structuredDoc.pages) {
    const pageLines = page.lines;
    let i = 0;

    while (i < pageLines.length) {
      const line = pageLines[i];

      // Detect table block
      if (line.cells.length >= 2) {
        const tableLines: StructuredPdfLine[] = [line];
        let j = i + 1;
        while (j < pageLines.length && pageLines[j].cells.length >= 2) {
          const dy = pageLines[j - 1].y - pageLines[j].y;
          if (dy >= 9 && dy <= 30) {
            tableLines.push(pageLines[j]);
            j++;
          } else {
            break;
          }
        }

        if (tableLines.length >= 2) {
          hasData = true;
          const maxCols = Math.max(...tableLines.map((tl) => tl.cells.length));
          const rows: Array<Array<string | number>> = [];

          for (const tl of tableLines) {
            const rowCells: Array<string | number> = [];
            for (let c = 0; c < maxCols; c++) {
              const cellData = tl.cells[c];
              const cellText = cellData ? cellData.text.trim() : '';

              // Clean number parsing
              const cleanNum = cellText.replace(/[$,]/g, '');
              if (/^-?\d+(\.\d+)?$/.test(cleanNum) && cleanNum.length < 15) {
                rowCells.push(parseFloat(cleanNum));
              } else {
                rowCells.push(cellText);
              }
            }
            rows.push(rowCells);
          }

          // Use first cell of header for sheet title when readable
          const headerPrefix = String(rows[0]?.[0] || `Table_${tableIndex}`).replace(/[^a-zA-Z0-9]/g, '_');
          const sheetName = `P${page.pageNumber}_${headerPrefix}`.slice(0, 31);

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

          XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

          // Append to combined tables
          allTablesData.push([`=== Page ${page.pageNumber}: Table ${tableIndex} ===`]);
          allTablesData.push(...rows);
          allTablesData.push([]); // blank row separator

          tableIndex++;
          i = j;
          continue;
        }
      }

      i++;
    }
  }

  // If tables were detected, prepend the master combined sheet
  if (hasData && allTablesData.length > 0) {
    const combinedSheet = XLSX.utils.aoa_to_sheet(allTablesData);
    XLSX.utils.book_append_sheet(workbook, combinedSheet, 'All_Tables');
  }

  if (!hasData) {
    // Fallback if no multi-column tables found (e.g. text-only PDF)
    const pagesText = await extractTextFromPdf(pdfData);
    pagesText.forEach((page, idx) => {
      const rows: Array<Array<string | number>> = [];
      for (const line of page.lines) {
        const cells = line.split(/\t|,| {2,}/).map((c) => c.trim()).filter((c) => c.length > 0);
        if (cells.length > 0) {
          rows.push(cells);
        }
      }
      const ws = XLSX.utils.aoa_to_sheet(rows.length > 0 ? rows : [['No tabular data detected']]);
      XLSX.utils.book_append_sheet(workbook, ws, `Page_${idx + 1}`.slice(0, 31));
    });
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

import { PDFDocument, degrees } from 'pdf-lib';
import JSZip from 'jszip';
import { fileToArrayBuffer, clonePdfBuffer } from './pdfLibUtils';

/**
 * Merge multiple PDF files in order into a single PDF
 */
export async function mergePdfFiles(
  files: (File | ArrayBuffer)[]
): Promise<{ bytes: Uint8Array; pageCount: number }> {
  if (files.length === 0) {
    throw new Error('Please select at least one PDF file to merge.');
  }

  const mergedPdf = await PDFDocument.create();
  let totalPages = 0;

  for (const file of files) {
    const rawBuffer = file instanceof File ? await fileToArrayBuffer(file) : file;
    const safeBuffer = clonePdfBuffer(rawBuffer);
    const doc = await PDFDocument.load(safeBuffer, { ignoreEncryption: true });
    const pageIndices = doc.getPageIndices();
    const copiedPages = await mergedPdf.copyPages(doc, pageIndices);
    for (const page of copiedPages) {
      mergedPdf.addPage(page);
      totalPages++;
    }
  }

  mergedPdf.setTitle('Merged Document');
  mergedPdf.setProducer('Codemaniac Studio PDF Merge Engine');
  mergedPdf.setModificationDate(new Date());

  const bytes = await mergedPdf.save({ useObjectStreams: true });
  return { bytes, pageCount: totalPages };
}

/**
 * Parse a page range string like "1-3, 5, 7-9" into an array of 1-based page numbers
 */
export function parsePageRangeString(rangeStr: string, totalPages: number): number[] {
  const pagesSet = new Set<number>();
  const parts = rangeStr.split(/[,;\s]+/).filter(Boolean);

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = parseInt(startStr.trim(), 10);
      const end = parseInt(endStr.trim(), 10);
      if (!isNaN(start) && !isNaN(end)) {
        const from = Math.max(1, Math.min(start, end));
        const to = Math.min(totalPages, Math.max(start, end));
        for (let i = from; i <= to; i++) {
          pagesSet.add(i);
        }
      }
    } else {
      const num = parseInt(part.trim(), 10);
      if (!isNaN(num) && num >= 1 && num <= totalPages) {
        pagesSet.add(num);
      }
    }
  }

  return Array.from(pagesSet).sort((a, b) => a - b);
}

/**
 * Split PDF into individual pages or page ranges
 * Returns a ZIP file if multiple files are generated, or a single PDF if one range is selected.
 */
export async function splitPdf(
  data: ArrayBuffer,
  baseName: string,
  mode: 'each_page' | 'ranges',
  rangesStr?: string
): Promise<{ blob: Blob; fileName: string; filesCount: number }> {
  const safeData = clonePdfBuffer(data);
  const srcDoc = await PDFDocument.load(safeData, { ignoreEncryption: true });
  const totalPages = srcDoc.getPageCount();

  if (totalPages === 0) {
    throw new Error('The PDF document contains no pages.');
  }

  if (mode === 'each_page') {
    const zip = new JSZip();

    for (let i = 0; i < totalPages; i++) {
      const singleDoc = await PDFDocument.create();
      const [copiedPage] = await singleDoc.copyPages(srcDoc, [i]);
      singleDoc.addPage(copiedPage);
      const bytes = await singleDoc.save({ useObjectStreams: true });
      const paddedIndex = String(i + 1).padStart(2, '0');
      zip.file(`${baseName}_page_${paddedIndex}.pdf`, bytes);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    return {
      blob: zipBlob,
      fileName: `${baseName}_split_pages.zip`,
      filesCount: totalPages,
    };
  } else {
    // Custom ranges (e.g. "1-2, 3-5" or separate groups separated by ;)
    const rangeGroups = (rangesStr || '1').split(';').map((s) => s.trim()).filter(Boolean);
    
    if (rangeGroups.length <= 1) {
      // Single output PDF
      const pagesToKeep = parsePageRangeString(rangeGroups[0] || '1', totalPages);
      if (pagesToKeep.length === 0) {
        throw new Error('No valid pages found in the specified range.');
      }

      const outDoc = await PDFDocument.create();
      const zeroBasedIndices = pagesToKeep.map((p) => p - 1);
      const copiedPages = await outDoc.copyPages(srcDoc, zeroBasedIndices);
      for (const p of copiedPages) outDoc.addPage(p);

      const bytes = await outDoc.save({ useObjectStreams: true });
      const blob = new Blob([bytes as any], { type: 'application/pdf' });
      return {
        blob,
        fileName: `${baseName}_range_${rangesStr?.replace(/[^a-zA-Z0-9_-]/g, '_') || 'part'}.pdf`,
        filesCount: 1,
      };
    } else {
      // Multiple range groups -> ZIP
      const zip = new JSZip();
      let createdCount = 0;

      for (let idx = 0; idx < rangeGroups.length; idx++) {
        const group = rangeGroups[idx];
        const pagesToKeep = parsePageRangeString(group, totalPages);
        if (pagesToKeep.length > 0) {
          const outDoc = await PDFDocument.create();
          const zeroBasedIndices = pagesToKeep.map((p) => p - 1);
          const copiedPages = await outDoc.copyPages(srcDoc, zeroBasedIndices);
          for (const p of copiedPages) outDoc.addPage(p);

          const bytes = await outDoc.save({ useObjectStreams: true });
          zip.file(`${baseName}_part_${idx + 1}.pdf`, bytes);
          createdCount++;
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      return {
        blob: zipBlob,
        fileName: `${baseName}_split_ranges.zip`,
        filesCount: createdCount,
      };
    }
  }
}

/**
 * Extract specific pages from a PDF
 */
export async function extractPagesFromPdf(
  data: ArrayBuffer,
  pageNumbers: number[]
): Promise<{ bytes: Uint8Array; pageCount: number }> {
  const safeData = clonePdfBuffer(data);
  const srcDoc = await PDFDocument.load(safeData, { ignoreEncryption: true });
  const totalPages = srcDoc.getPageCount();

  const validPages = pageNumbers.filter((p) => p >= 1 && p <= totalPages);
  if (validPages.length === 0) {
    throw new Error('Please select at least one valid page to extract.');
  }

  const outDoc = await PDFDocument.create();
  const zeroBasedIndices = validPages.map((p) => p - 1);
  const copiedPages = await outDoc.copyPages(srcDoc, zeroBasedIndices);
  for (const page of copiedPages) {
    outDoc.addPage(page);
  }

  outDoc.setTitle('Extracted Pages');
  outDoc.setProducer('Codemaniac Studio PDF Extractor');
  const bytes = await outDoc.save({ useObjectStreams: true });
  return { bytes, pageCount: validPages.length };
}

/**
 * Delete specified pages from a PDF
 */
export async function deletePagesFromPdf(
  data: ArrayBuffer,
  pageNumbersToDelete: number[]
): Promise<{ bytes: Uint8Array; remainingCount: number }> {
  const safeData = clonePdfBuffer(data);
  const doc = await PDFDocument.load(safeData, { ignoreEncryption: true });
  const totalPages = doc.getPageCount();

  const deleteSet = new Set(pageNumbersToDelete.filter((p) => p >= 1 && p <= totalPages));

  if (deleteSet.size >= totalPages) {
    throw new Error('Cannot delete all pages of the document. At least one page must remain.');
  }

  // Remove pages from highest index to lowest so indices don't shift
  const sortedToDelete = Array.from(deleteSet).sort((a, b) => b - a);
  for (const pageNum of sortedToDelete) {
    doc.removePage(pageNum - 1);
  }

  doc.setProducer('Codemaniac Studio PDF Page Deletion Engine');
  const bytes = await doc.save({ useObjectStreams: true });
  return { bytes, remainingCount: doc.getPageCount() };
}

/**
 * Rotate pages in a PDF (90, 180, or 270 degrees)
 */
export async function rotatePagesInPdf(
  data: ArrayBuffer,
  rotateAngle: 90 | 180 | 270,
  targetPages: 'all' | number[] = 'all'
): Promise<{ bytes: Uint8Array; pageCount: number }> {
  const safeData = clonePdfBuffer(data);
  const doc = await PDFDocument.load(safeData, { ignoreEncryption: true });
  const totalPages = doc.getPageCount();

  const pagesToRotate =
    targetPages === 'all'
      ? Array.from({ length: totalPages }, (_, i) => i + 1)
      : targetPages.filter((p) => p >= 1 && p <= totalPages);

  for (const pageNum of pagesToRotate) {
    const page = doc.getPage(pageNum - 1);
    const currentRotation = page.getRotation().angle;
    const newAngle = (currentRotation + rotateAngle) % 360;
    page.setRotation(degrees(newAngle));
  }

  doc.setProducer('Codemaniac Studio PDF Rotation Engine');
  const bytes = await doc.save({ useObjectStreams: true });
  return { bytes, pageCount: totalPages };
}

/**
 * Reorganize PDF pages in a custom order with optional rotation
 */
export async function reorganizePdfPages(
  data: ArrayBuffer,
  pageOrder: { pageNum: number; rotation: number }[]
): Promise<{ bytes: Uint8Array; pageCount: number }> {
  const safeData = clonePdfBuffer(data);
  const srcDoc = await PDFDocument.load(safeData, { ignoreEncryption: true });
  const outDoc = await PDFDocument.create();

  for (const item of pageOrder) {
    const [copiedPage] = await outDoc.copyPages(srcDoc, [item.pageNum - 1]);
    if (item.rotation) {
      const cur = copiedPage.getRotation().angle;
      copiedPage.setRotation(degrees((cur + item.rotation) % 360));
    }
    outDoc.addPage(copiedPage);
  }

  outDoc.setProducer('Codemaniac Studio PDF Organizer');
  const bytes = await outDoc.save({ useObjectStreams: true });
  return { bytes, pageCount: pageOrder.length };
}

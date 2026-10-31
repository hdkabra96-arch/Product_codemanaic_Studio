import { extractTextFromPdf, clonePdfBuffer, getPdfPageCount } from './pdfLibUtils';

export interface DiffWord {
  text: string;
  type: 'same' | 'added' | 'removed';
}

export interface PageDiffComparison {
  pageNum: number;
  doc1Text: string;
  doc2Text: string;
  wordsDiff: DiffWord[];
  additionsCount: number;
  deletionsCount: number;
  isIdentical: boolean;
}

export interface PdfComparisonResult {
  doc1Name: string;
  doc2Name: string;
  doc1Pages: number;
  doc2Pages: number;
  similarityScore: number; // 0 to 100%
  totalAdditions: number;
  totalDeletions: number;
  pageComparisons: PageDiffComparison[];
}

/**
 * Compare two PDF files and return structured diff analysis
 */
export async function compareTwoPdfFiles(
  pdfBuffer1: ArrayBuffer,
  name1: string,
  pdfBuffer2: ArrayBuffer,
  name2: string
): Promise<PdfComparisonResult> {
  const [pagesText1, pagesText2] = await Promise.all([
    extractTextFromPdf(clonePdfBuffer(pdfBuffer1)),
    extractTextFromPdf(clonePdfBuffer(pdfBuffer2)),
  ]);

  const maxPages = Math.max(pagesText1.length, pagesText2.length);
  const pageComparisons: PageDiffComparison[] = [];

  let totalWordsA = 0;
  let totalWordsB = 0;
  let totalMatches = 0;
  let totalAdditions = 0;
  let totalDeletions = 0;

  for (let i = 0; i < maxPages; i++) {
    const pageNum = i + 1;
    const textA = pagesText1[i]?.text || '';
    const textB = pagesText2[i]?.text || '';

    const wordsA = textA.split(/\s+/).filter(Boolean);
    const wordsB = textB.split(/\s+/).filter(Boolean);

    totalWordsA += wordsA.length;
    totalWordsB += wordsB.length;

    // Simple diff computation
    const setA = new Set(wordsA);
    const setB = new Set(wordsB);

    const wordsDiff: DiffWord[] = [];
    let pageAdditions = 0;
    let pageDeletions = 0;

    // Compare words
    const maxWords = Math.max(wordsA.length, wordsB.length);
    for (let w = 0; w < maxWords; w++) {
      const wa = wordsA[w];
      const wb = wordsB[w];

      if (wa && wb && wa.toLowerCase() === wb.toLowerCase()) {
        wordsDiff.push({ text: wa, type: 'same' });
        totalMatches++;
      } else {
        if (wa) {
          wordsDiff.push({ text: wa, type: 'removed' });
          pageDeletions++;
          totalDeletions++;
        }
        if (wb) {
          wordsDiff.push({ text: wb, type: 'added' });
          pageAdditions++;
          totalAdditions++;
        }
      }
    }

    const isIdentical = textA.trim() === textB.trim();

    pageComparisons.push({
      pageNum,
      doc1Text: textA,
      doc2Text: textB,
      wordsDiff,
      additionsCount: pageAdditions,
      deletionsCount: pageDeletions,
      isIdentical,
    });
  }

  const totalWords = Math.max(1, Math.max(totalWordsA, totalWordsB));
  const similarityScore = Math.max(
    0,
    Math.min(100, Math.round((totalMatches / totalWords) * 100))
  );

  return {
    doc1Name: name1,
    doc2Name: name2,
    doc1Pages: pagesText1.length,
    doc2Pages: pagesText2.length,
    similarityScore,
    totalAdditions,
    totalDeletions,
    pageComparisons,
  };
}

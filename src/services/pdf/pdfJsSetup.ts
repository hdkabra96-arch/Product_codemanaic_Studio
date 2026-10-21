import * as pdfjsLib from 'pdfjs-dist';

// Set up worker source safely for Vite/browser environment
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
  } catch {
    // fallback
  }
}

export { pdfjsLib };

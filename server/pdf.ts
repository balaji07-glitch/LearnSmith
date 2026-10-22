import type { SourceChunk } from '../src/types/index.ts';

/**
 * Extracts text from PDF bytes using pdfjs-dist, preserving page numbers and chunks.
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<{
  rawText: string;
  pageCount: number;
  chunks: Omit<SourceChunk, 'id' | 'sourceId' | 'unitId'>[];
}> {
  // Check if buffer actually has a PDF header (%PDF)
  const isPdfHeader = buffer.slice(0, 5).toString('ascii').startsWith('%PDF');
  if (!isPdfHeader) {
    return parsePlainTextAsSource(buffer.toString('utf-8'));
  }

  try {
    // Dynamic import to support both ESM and Node environments
    // @ts-ignore
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

    // Properly specify workerSrc for Node.js / serverless environment
    if (pdfjsLib.GlobalWorkerOptions) {
      try {
        // Resolve worker URL properly in ESM
        // @ts-ignore
        const workerUrl = await import.meta.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs');
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
      } catch {
        // Fallback if import.meta.resolve fails
        pdfjsLib.GlobalWorkerOptions.workerSrc = '';
      }
    }

    const uint8Array = new Uint8Array(buffer);
    const loadingTask = pdfjsLib.getDocument({
      data: uint8Array,
      useSystemFonts: true,
      disableFontFace: true,
    });

    const doc = await loadingTask.promise;
    const pageCount = doc.numPages;
    let fullText = '';
    const chunks: Omit<SourceChunk, 'id' | 'sourceId' | 'unitId'>[] = [];
    let chunkIndex = 0;

    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const page = await doc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageStrings = textContent.items
        .map((item: any) => item.str || '')
        .filter((str: string) => str.trim().length > 0);

      const pageText = pageStrings.join(' ');
      fullText += `--- PAGE ${pageNum} ---\n${pageText}\n\n`;

      // Split page into ~250-400 word chunks
      const paragraphs = pageText.split(/(?<=\.)\s+(?=[A-Z])/);
      let currentChunkText = '';

      for (const para of paragraphs) {
        if ((currentChunkText + ' ' + para).split(/\s+/).length > 300 && currentChunkText.length > 0) {
          chunks.push({
            page: pageNum,
            chunkIndex: chunkIndex++,
            content: currentChunkText.trim(),
            wordCount: currentChunkText.trim().split(/\s+/).length,
          });
          currentChunkText = para;
        } else {
          currentChunkText += (currentChunkText ? ' ' : '') + para;
        }
      }

      if (currentChunkText.trim().length > 0) {
        chunks.push({
          page: pageNum,
          chunkIndex: chunkIndex++,
          content: currentChunkText.trim(),
          wordCount: currentChunkText.trim().split(/\s+/).length,
        });
      }
    }

    return {
      rawText: fullText.trim(),
      pageCount,
      chunks,
    };
  } catch (err: any) {
    console.warn('PDF extraction with pdfjs-dist encountered error, falling back to text parsing:', err?.message);
    // Fallback: If it's plain text or fallback
    return parsePlainTextAsSource(buffer.toString('utf-8'));
  }
}

/**
 * Splits plain text source into chunks with simulated page boundaries.
 */
export function parsePlainTextAsSource(text: string): {
  rawText: string;
  pageCount: number;
  chunks: Omit<SourceChunk, 'id' | 'sourceId' | 'unitId'>[];
} {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const chunks: Omit<SourceChunk, 'id' | 'sourceId' | 'unitId'>[] = [];
  const wordsPerPage = 350;
  let currentPage = 1;
  let currentWordsOnPage = 0;
  let chunkIndex = 0;

  for (const para of paragraphs) {
    const wordCount = para.split(/\s+/).length;
    chunks.push({
      page: currentPage,
      chunkIndex: chunkIndex++,
      content: para,
      wordCount,
    });

    currentWordsOnPage += wordCount;
    if (currentWordsOnPage >= wordsPerPage) {
      currentPage++;
      currentWordsOnPage = 0;
    }
  }

  // If no paragraphs (single block)
  if (chunks.length === 0 && text.trim().length > 0) {
    chunks.push({
      page: 1,
      chunkIndex: 0,
      content: text.trim(),
      wordCount: text.trim().split(/\s+/).length,
    });
  }

  const finalPageCount = Math.max(1, currentPage);

  return {
    rawText: text.trim(),
    pageCount: finalPageCount,
    chunks,
  };
}

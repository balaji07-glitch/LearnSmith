import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import type { SourceChunk } from '../src/types/index.ts';

const require = createRequire(import.meta.url);

/**
 * Extracts text from PDF bytes using pdfjs-dist, preserving page numbers and chunks.
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<{
  rawText: string;
  pageCount: number;
  chunks: Omit<SourceChunk, 'id' | 'sourceId' | 'unitId'>[];
}> {
  // The PDF header is allowed to appear within the first 1024 bytes.
  if (buffer.subarray(0, 1024).indexOf('%PDF-') === -1) {
    throw new Error('The uploaded file is not a valid PDF. Please choose a PDF document and try again.');
  }

  try {
    // Dynamic import to support both ESM and Node environments
    // @ts-ignore
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

    // Use an absolute worker path so serverless runtimes don't resolve it from their cwd.
    pdfjsLib.GlobalWorkerOptions.workerSrc = pathToFileURL(
      require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs')
    ).href;

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

    if (!fullText.replace(/--- PAGE \d+ ---/g, '').trim()) {
      throw new Error(
        'No selectable text was found in this PDF. It may contain scanned pages; scanned-document OCR is not supported yet.'
      );
    }

    return {
      rawText: fullText.trim(),
      pageCount,
      chunks,
    };
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('No selectable text')) {
      throw err;
    }
    console.error('PDF text extraction failed:', err);
    throw new Error(
      'Could not extract text from this PDF. The file may be damaged, password-protected, or use an unsupported PDF feature. Please try another PDF.'
    );
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

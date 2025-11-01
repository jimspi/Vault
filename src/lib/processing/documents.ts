import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import Tesseract from 'tesseract.js';

export interface ExtractedContent {
  text: string;
  metadata: {
    pageCount?: number;
    wordCount: number;
    language?: string;
    author?: string;
    title?: string;
  };
}

export async function extractTextFromPDF(buffer: Buffer): Promise<ExtractedContent> {
  try {
    const data = await pdfParse(buffer);

    return {
      text: data.text,
      metadata: {
        pageCount: data.numpages,
        wordCount: data.text.split(/\s+/).length,
        title: data.info?.Title,
        author: data.info?.Author,
      },
    };
  } catch (error) {
    throw new Error(`Failed to extract PDF: ${error}`);
  }
}

export async function extractTextFromDOCX(buffer: Buffer): Promise<ExtractedContent> {
  try {
    const result = await mammoth.extractRawText({ buffer });

    return {
      text: result.value,
      metadata: {
        wordCount: result.value.split(/\s+/).length,
      },
    };
  } catch (error) {
    throw new Error(`Failed to extract DOCX: ${error}`);
  }
}

export async function extractTextFromImage(buffer: Buffer): Promise<ExtractedContent> {
  try {
    const {
      data: { text },
    } = await Tesseract.recognize(buffer, 'eng');

    return {
      text,
      metadata: {
        wordCount: text.split(/\s+/).length,
        language: 'eng',
      },
    };
  } catch (error) {
    throw new Error(`Failed to extract text from image: ${error}`);
  }
}

export async function extractTextFromPlainText(buffer: Buffer): Promise<ExtractedContent> {
  const text = buffer.toString('utf-8');

  return {
    text,
    metadata: {
      wordCount: text.split(/\s+/).length,
    },
  };
}

export async function extractContent(
  buffer: Buffer,
  mimeType: string
): Promise<ExtractedContent> {
  switch (mimeType) {
    case 'application/pdf':
      return extractTextFromPDF(buffer);

    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return extractTextFromDOCX(buffer);

    case 'image/png':
    case 'image/jpeg':
    case 'image/jpg':
      return extractTextFromImage(buffer);

    case 'text/plain':
    case 'text/markdown':
    case 'text/md':
      return extractTextFromPlainText(buffer);

    default:
      // Try to treat as plain text
      return extractTextFromPlainText(buffer);
  }
}

export function getSupportedMimeTypes(): string[] {
  return [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
    'image/png',
    'image/jpeg',
    'image/jpg',
  ];
}

export function isSupportedFileType(mimeType: string): boolean {
  return getSupportedMimeTypes().includes(mimeType);
}

export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

export function getFileSizeInMB(bytes: number): number {
  return bytes / (1024 * 1024);
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .slice(0, 255);
}

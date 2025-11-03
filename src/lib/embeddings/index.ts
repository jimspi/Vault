import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * Generate embedding using OpenAI's text-embedding-3-small model
 * Configured to output 768 dimensions to match our database schema
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  // Truncate text to avoid token limits (8191 tokens max)
  const truncatedText = text.slice(0, 8000);

  const response = await client.embeddings.create({
    model: 'text-embedding-3-small',
    input: truncatedText,
    dimensions: 768, // Match our database vector(768) schema
  });

  return response.data[0].embedding;
}

/**
 * Generate embeddings for multiple texts in batch
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  // OpenAI supports batch embeddings
  const truncatedTexts = texts.map(text => text.slice(0, 8000));

  const response = await client.embeddings.create({
    model: 'text-embedding-3-small',
    input: truncatedTexts,
    dimensions: 768,
  });

  return response.data.map(item => item.embedding);
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Split text into chunks with overlap
 */
export function chunkText(
  text: string,
  options: {
    chunkSize?: number;
    overlap?: number;
  } = {}
): string[] {
  const { chunkSize = 512, overlap = 50 } = options;

  if (text.length <= chunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    let chunk = text.slice(start, end);

    // Try to break at sentence boundary
    if (end < text.length) {
      const lastPeriod = chunk.lastIndexOf('.');
      const lastNewline = chunk.lastIndexOf('\n');
      const breakPoint = Math.max(lastPeriod, lastNewline);

      if (breakPoint > chunkSize / 2) {
        chunk = chunk.slice(0, breakPoint + 1);
      }
    }

    chunks.push(chunk.trim());
    start = end - overlap;

    // Prevent infinite loop
    if (start >= text.length - overlap) {
      break;
    }
  }

  return chunks;
}

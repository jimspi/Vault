import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export interface ClaudeMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function generateCompletion(
  messages: ClaudeMessage[],
  options?: {
    maxTokens?: number;
    temperature?: number;
    system?: string;
  }
): Promise<string> {
  const formattedMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

  // Add system message if provided
  if (options?.system) {
    formattedMessages.push({
      role: 'system',
      content: options.system,
    });
  }

  // Add other messages
  formattedMessages.push(
    ...messages.map((msg) => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    }))
  );

  const response = await client.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: formattedMessages,
    max_tokens: options?.maxTokens || 4096,
    temperature: options?.temperature || 0.7,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  return content;
}

export async function extractKeyInformation(content: string): Promise<{
  memories: Array<{
    content: string;
    confidence: number;
    metadata: Record<string, any>;
  }>;
  tags: string[];
  summary: string;
  entities: Array<{
    type: string;
    value: string;
  }>;
}> {
  const systemPrompt = `You are an AI assistant specialized in extracting structured information from documents.
Your task is to identify key facts, concepts, entities, and themes from the provided text.

Return a JSON object with:
1. memories: Array of key facts or concepts (each with content, confidence 0-1, and metadata)
2. tags: Array of relevant topic tags (max 10)
3. summary: A brief 2-3 sentence summary
4. entities: Array of named entities (people, organizations, locations, dates, etc.)

Be concise but comprehensive. Focus on actionable and memorable information.`;

  const response = await generateCompletion(
    [
      {
        role: 'user',
        content: `Extract key information from this document:\n\n${content.slice(0, 50000)}`,
      },
    ],
    {
      system: systemPrompt,
      maxTokens: 4096,
      temperature: 0.3,
    }
  );

  try {
    // Extract JSON from response (might be wrapped in markdown code blocks)
    const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) || response.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : response;
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    // Return default structure
    return {
      memories: [],
      tags: [],
      summary: content.slice(0, 200) + '...',
      entities: [],
    };
  }
}

export async function answerQuestion(
  question: string,
  context: Array<{ content: string; source: string }>
): Promise<{
  answer: string;
  sources: string[];
  confidence: number;
}> {
  const contextText = context
    .map((c, i) => `[Source ${i + 1}: ${c.source}]\n${c.content}`)
    .join('\n\n---\n\n');

  const systemPrompt = `You are a helpful AI assistant that answers questions based on provided context.
Always cite your sources using [Source N] notation.
If you cannot answer based on the context, say so clearly.
Provide a confidence score (0-1) for your answer.`;

  const response = await generateCompletion(
    [
      {
        role: 'user',
        content: `Context:\n${contextText}\n\nQuestion: ${question}\n\nProvide your answer in JSON format with: answer, sources (array of source numbers used), confidence (0-1).`,
      },
    ],
    {
      system: systemPrompt,
      maxTokens: 2048,
      temperature: 0.5,
    }
  );

  try {
    const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) || response.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : response;
    return JSON.parse(jsonStr);
  } catch (error) {
    return {
      answer: response,
      sources: [],
      confidence: 0.5,
    };
  }
}

export async function detectPatterns(
  documents: Array<{
    id: string;
    title: string;
    content: string;
    date: string;
  }>
): Promise<{
  patterns: Array<{
    type: string;
    description: string;
    documentIds: string[];
    confidence: number;
  }>;
  insights: Array<{
    type: 'pattern' | 'contradiction' | 'trend' | 'suggestion';
    title: string;
    content: string;
    relatedDocuments: string[];
  }>;
}> {
  const docsText = documents
    .map((d) => `[${d.id}] ${d.title} (${d.date}):\n${d.content.slice(0, 1000)}`)
    .join('\n\n---\n\n');

  const systemPrompt = `You are an AI analyst that identifies patterns, trends, and insights across multiple documents.
Look for:
- Recurring themes or concepts
- Contradictory information
- Temporal trends or changes
- Connections between seemingly unrelated topics
- Gaps in knowledge or missing information

Return JSON with:
1. patterns: Array of identified patterns
2. insights: Array of actionable insights`;

  const response = await generateCompletion(
    [
      {
        role: 'user',
        content: `Analyze these documents and identify patterns:\n\n${docsText}`,
      },
    ],
    {
      system: systemPrompt,
      maxTokens: 4096,
      temperature: 0.6,
    }
  );

  try {
    const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) || response.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : response;
    return JSON.parse(jsonStr);
  } catch (error) {
    return {
      patterns: [],
      insights: [],
    };
  }
}

export async function generateSummary(content: string, maxLength: number = 200): Promise<string> {
  const response = await generateCompletion(
    [
      {
        role: 'user',
        content: `Summarize this text in ${maxLength} characters or less:\n\n${content.slice(0, 10000)}`,
      },
    ],
    {
      maxTokens: 512,
      temperature: 0.5,
    }
  );

  return response.slice(0, maxLength);
}

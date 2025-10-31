import OpenAI from 'openai';
import { ChatResponse } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateChatResponse(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  contextChunks: Array<{ content: string; metadata: any }>
): Promise<ChatResponse> {
  try {
    // Build context from retrieved chunks
    const hasContext = contextChunks.length > 0;
    const context = hasContext
      ? contextChunks
          .map((chunk, index) => `[Source ${index + 1}]: ${chunk.content}`)
          .join('\n\n')
      : 'No relevant information found in the knowledge base for this query.';

    // Create system prompt based on whether we have context
    const systemPrompt = hasContext
      ? `You are KaCey AI, a Knowledge Continuity AI assistant. You have access to an institutional knowledge base containing information from exit interviews, documentation, and processes.

Context from Knowledge Base:
${context}

Instructions:
1. Answer questions based on the provided knowledge base context above
2. Always cite your sources using [Source X] format when referencing knowledge base content
3. If the context doesn't fully answer the question, say so and provide what information you can
4. Be specific and accurate - reference the exact information from the knowledge base
5. If asked about processes, provide step-by-step guidance based on the knowledge base

Remember: You have access to the company's knowledge base and should use it to answer questions. Always cite sources when using knowledge base information.`
      : `You are KaCey AI, a Knowledge Continuity AI assistant designed to help users access institutional knowledge.

IMPORTANT: You have access to a knowledge base, but no relevant information was found for this query. This could mean:
1. The knowledge base hasn't been seeded with data yet
2. The query doesn't match any existing knowledge base content
3. The database needs to be populated with knowledge artifacts

When responding:
- If asked about company-specific information (like licenses, processes, contacts, etc.), explain that you have access to a knowledge base but couldn't find relevant information
- Suggest that the user may need to ensure the knowledge base has been populated
- Be helpful and professional, but make it clear when information isn't available in the knowledge base
- Don't make up company-specific information - only use what's in the knowledge base

Remember: You are designed to answer from the knowledge base. When it's empty or no relevant matches are found, be transparent about this.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 1000,
      stream: false
    });

    const content = response.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';

    // Extract sources from the response
    const sourceMatches = content.match(/\[Source \d+\]/g) || [];
    const sources = sourceMatches.map(match => {
      const sourceNum = parseInt(match.match(/\d+/)?.[0] || '0') - 1;
      return contextChunks[sourceNum]?.metadata || null;
    }).filter(Boolean);

    return {
      message: content,
      sources,
      confidence: 0.9 // Could be enhanced with actual confidence scoring
    };

  } catch (error) {
    console.error('Error generating chat response:', error);
    throw new Error('Failed to generate response');
  }
}

export async function generateStreamingChatResponse(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  contextChunks: Array<{ content: string; metadata: any }>,
  onChunk: (chunk: string) => void
): Promise<ChatResponse> {
  try {
    // Build context from retrieved chunks
    const context = contextChunks
      .map((chunk, index) => `[Source ${index + 1}]: ${chunk.content}`)
      .join('\n\n');

    // Create system prompt
    const systemPrompt = `You are KaCey AI, a Knowledge Continuity AI assistant. Your role is to help users access and understand institutional knowledge captured through exit interviews and documentation.

Context from Knowledge Base:
${context}

Instructions:
1. Answer questions based primarily on the provided context
2. Always cite your sources using [Source X] format
3. If you don't have enough information in the context, say so clearly
4. Be helpful, accurate, and professional
5. Focus on practical, actionable information
6. If asked about processes, provide step-by-step guidance when possible

Remember: You are helping to preserve and transfer institutional knowledge. Accuracy and completeness are crucial.`;

    const stream = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 1000,
      stream: true
    });

    let fullResponse = '';
    const sourceMatches: string[] = [];

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullResponse += content;
        onChunk(content);
      }
    }

    // Extract sources from the full response
    const matches = fullResponse.match(/\[Source \d+\]/g) || [];
    const sources = matches.map(match => {
      const sourceNum = parseInt(match.match(/\d+/)?.[0] || '0') - 1;
      return contextChunks[sourceNum]?.metadata || null;
    }).filter(Boolean);

    return {
      message: fullResponse,
      sources,
      confidence: 0.9
    };

  } catch (error) {
    console.error('Error generating streaming chat response:', error);
    throw new Error('Failed to generate response');
  }
}

import { api } from './api';

export async function chatWithAI(message: string, mode?: string, practiceArea?: string) {
  const data = await api.post('/ai/chat', { message, mode, practiceArea });
  return data.text;
}

export async function summarizeContent(content: string) {
  const data = await api.post('/ai/summarize', { content });
  return data.summary;
}

export async function draftDocument(prompt: string, context?: string, documentType?: string) {
  const data = await api.post('/ai/draft', { prompt, context, documentType });
  return data.text;
}

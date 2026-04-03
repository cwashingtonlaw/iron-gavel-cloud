import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

export const aiRouter = Router();

const staff = [authenticate, authorize('Admin', 'Attorney', 'Paralegal')];

async function getAI() {
  const { GoogleGenAI } = await import('@google/genai');
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
}

aiRouter.post('/chat', ...staff, async (req, res) => {
  const { message, mode, practiceArea } = req.body;
  if (!message) { res.status(400).json({ error: 'message required' }); return; }
  if (!process.env.GEMINI_API_KEY) { res.status(503).json({ error: 'AI service not configured' }); return; }

  try {
    const ai = await getAI();
    const systemPrompt = practiceArea
      ? `You are a legal AI assistant specializing in ${practiceArea}. Mode: ${mode ?? 'general'}.`
      : `You are a legal AI assistant. Mode: ${mode ?? 'general'}.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
      config: { systemInstruction: systemPrompt },
    });

    res.json({ text: response.text });
  } catch (err: any) {
    res.status(500).json({ error: 'AI request failed', details: err.message });
  }
});

aiRouter.post('/summarize', ...staff, async (req, res) => {
  const { content } = req.body;
  if (!content) { res.status(400).json({ error: 'content required' }); return; }
  if (!process.env.GEMINI_API_KEY) { res.status(503).json({ error: 'AI service not configured' }); return; }

  try {
    const ai = await getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Summarize the following legal document or case notes concisely:\n\n${content}`,
    });

    res.json({ summary: response.text });
  } catch (err: any) {
    res.status(500).json({ error: 'AI request failed', details: err.message });
  }
});

aiRouter.post('/draft', ...staff, async (req, res) => {
  const { prompt, context, documentType } = req.body;
  if (!prompt) { res.status(400).json({ error: 'prompt required' }); return; }
  if (!process.env.GEMINI_API_KEY) { res.status(503).json({ error: 'AI service not configured' }); return; }

  try {
    const ai = await getAI();
    const fullPrompt = context
      ? `Draft a ${documentType ?? 'legal document'}.\n\nContext: ${context}\n\nInstructions: ${prompt}`
      : `Draft a ${documentType ?? 'legal document'}.\n\nInstructions: ${prompt}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
    });

    res.json({ text: response.text });
  } catch (err: any) {
    res.status(500).json({ error: 'AI request failed', details: err.message });
  }
});

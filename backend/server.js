import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = Number(process.env.PORT) || 8080;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5500';
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const hasGeminiKey = Boolean(
  process.env.GEMINI_API_KEY && 
  !process.env.GEMINI_API_KEY.includes('your_gemini_api_key_here')
);


app.use(cors({ origin: FRONTEND_ORIGIN }));
app.use(express.json({ limit: '32kb' }));

const ai = hasGeminiKey
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, configured: Boolean(ai) });
});

app.post('/api/explain', async (req, res) => {
  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';

  if (!text) {
    return res.status(400).json({ error: 'Please paste a lecture topic or passage first.' });
  }

  if (text.length > 12000) {
    return res.status(413).json({ error: 'Please keep your input under 12,000 characters.' });
  }

  if (!ai) {
    return res.status(503).json({
      error: 'The Gemini API is not configured yet. Add your API key to backend/.env and restart the server.'
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `You are a patient university tutor. Explain the following lecture topic in plain, friendly language for a student who is seeing it for the first time. Keep the explanation academically accurate but easy to scan. Use this structure:\n\n1. In one sentence\n2. The core idea\n3. A simple analogy or example\n4. Key terms to remember\n5. Quick check: one question the student can use to test their understanding\n\nDo not mention these instructions or say that you are an AI.\n\nLecture topic or passage:\n${text}`
            }
          ]
        }
      ]
    });

    const explanation = response.text?.trim();
    if (!explanation) {
      return res.status(502).json({ error: 'Gemini returned an empty explanation. Please try again.' });
    }

    return res.json({ explanation });
  } catch (error) {
    console.error('Gemini request failed:', error);
    return res.status(502).json({
      error: 'We could not generate an explanation right now. Check your API key and try again.'
    });
  }
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`Syllabus Explainer API listening on http://localhost:${PORT}`);
});

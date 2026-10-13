import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Groq from 'groq-sdk';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const app = express();
const PORT = Number(process.env.PORT) || 8080;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5500';

const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';
const hasGroqKey = Boolean(process.env.GROQ_API_KEY);

app.use(cors({ origin: FRONTEND_ORIGIN }));
app.use(express.json({ limit: '32kb' }));

const groq = hasGroqKey 
  ? new Groq({ apiKey: process.env.GROQ_API_KEY }) 
  : null;

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, configured: Boolean(groq) });
});

app.post('/api/explain', async (req, res) => {
  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';

  if (!text) {
    return res.status(400).json({ error: 'Please paste a lecture topic or passage first.' });
  }

  if (text.length > 12000) {
    return res.status(413).json({ error: 'Please keep your input under 12,000 characters.' });
  }

  if (!groq) {
    return res.status(503).json({
      error: 'The Groq API is not configured yet. Add your API key to backend/.env and restart the server.'
    });
  }

  const promptText = `You are a patient university tutor. Explain the following lecture topic in plain, friendly language for a student who is seeing it for the first time. Keep the explanation academically accurate but easy to scan. Never use LaTeX or complex math formatting. Write all math formulas using plain text, standard keyboard symbols (like / for division and ^ for exponents), and basic unicode. Use this structure:\n\n1. In one sentence\n2. The core idea\n3. A simple analogy or example\n4. Key terms to remember\n5. Quick check: one question the student can use to test their understanding\n\nDo not mention these instructions or say that you are an AI.\n\nLecture topic or passage:\n${text}`;

  const maxRetries = 3;
  let attempt = 0;
  let explanation = null;

  while (attempt < maxRetries) {
    try {
      const response = await groq.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: promptText
          }
        ]
      });

      explanation = response.choices[0]?.message?.content?.trim();
      
      if (!explanation) {
        return res.status(502).json({ error: 'Groq returned an empty explanation. Please try again.' });
      }

      return res.json({ explanation });
    } catch (error) {
      attempt++;
      console.error(`Attempt ${attempt} failed:`, error.message || error);

      const isTransientError = error.status === 503 || error.status === 429;

      if (isTransientError && attempt < maxRetries) {
        const waitTime = attempt * 2000;
        console.log(`Upstream high load. Retrying in ${waitTime / 1000}s...`);
        await delay(waitTime);
      } else {
        return res.status(502).json({
          error: 'We could not generate an explanation right now. The AI service is currently busy or unavailable. Please try again in a few moments.'
        });
      }
    }
  }
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Syllabus Explainer API listening on http://localhost:${PORT}`);
  });
}

export default app;
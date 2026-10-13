import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Groq from 'groq-sdk';
import { Redis } from '@upstash/redis';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const app = express();
const PORT = Number(process.env.PORT) || 8080;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5500';
const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';
const hasGroqKey = Boolean(process.env.GROQ_API_KEY);

app.use(cors({ origin: FRONTEND_ORIGIN }));
app.use(express.json({ limit: '32kb' }));

const groq = hasGroqKey ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

// Initialize the Distributed Cache
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

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
    return res.status(503).json({ error: 'The Groq API is not configured.' });
  }


  const cacheKey = `explain:${text.toLowerCase()}`;

  try {
    const cachedExplanation = await redis.get(cacheKey);
    
    if (cachedExplanation) {
      console.log(`[REDIS HIT] Serving cached response for: ${cacheKey.substring(0, 30)}...`);
      return res.json({ explanation: cachedExplanation });
    }
  } catch (cacheError) {
    console.error('Redis cache read failed, falling back to Groq:', cacheError);
  }

  console.log(`[REDIS MISS] Fetching from Groq for: ${cacheKey.substring(0, 30)}...`);

  const promptText = `You are a patient university tutor. Explain the following lecture topic in plain, friendly language for a student who is seeing it for the first time. Keep the explanation academically accurate but easy to scan. Never use LaTeX or complex math formatting. Write all math formulas using plain text, standard keyboard symbols (like / for division and ^ for exponents), and basic unicode. Use this structure:\n\n1. In one sentence\n2. The core idea\n3. A simple analogy or example\n4. Key terms to remember\n5. Quick check: one question the student can use to test their understanding\n\nDo not mention these instructions or say that you are an AI.\n\nLecture topic or passage:\n${text}`;

  let attempt = 0;
  let explanation = null;

  while (attempt < 3) {
    try {
      const response = await groq.chat.completions.create({
        model: MODEL,
        messages: [{ role: 'user', content: promptText }]
      });

      explanation = response.choices[0]?.message?.content?.trim();
      
      if (!explanation) {
        return res.status(502).json({ error: 'Groq returned an empty explanation.' });
      }

      try {
        await redis.set(cacheKey, explanation, { ex: 2592000 });
      } catch (cacheWriteError) {
        console.error('Failed to write to Redis:', cacheWriteError);
      }

      return res.json({ explanation });
    } catch (error) {
      attempt++;
      if ((error.status === 503 || error.status === 429) && attempt < 3) {
        await delay(attempt * 2000);
      } else {
        return res.status(502).json({ error: 'The AI service is unavailable.' });
      }
    }
  }
});

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
}

export default app;

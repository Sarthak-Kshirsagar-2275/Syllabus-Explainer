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

 
  const cacheKey = `explain-v2:${text.toLowerCase()}`;

  try {
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      console.log(`[REDIS HIT] Serving cached 3D response for: ${cacheKey.substring(0, 20)}...`);
     
      const responseData = typeof cachedData === 'string' ? JSON.parse(cachedData) : cachedData;
      return res.json(responseData);
    }
  } catch (cacheError) {
    console.error('Redis cache read failed:', cacheError);
  }

  console.log(`[REDIS MISS] Fetching from Groq for: ${cacheKey.substring(0, 20)}...`);


    const promptText = `You are a patient university tutor. Explain the following lecture topic. 
  
  You MUST return your response as a valid JSON object with EXACTLY two keys:
  1. "explanation": The text explanation. You MUST strictly use this exact 5-point structure:
     1. In one sentence
     2. The core idea
     3. A simple analogy or example
     4. Key terms to remember
     5. Quick check
     DO NOT use standard textbook formatting. Use basic markdown. NEVER use LaTeX or backslash-escaped math characters. Use plain text symbols (like != for not equal).
  2. "spatial_flag": Output "sphere", "cube", "particles", or "none" based on the topic's physical geometry.
  
  Lecture topic:
  ${text}`;


  let attempt = 0;

  while (attempt < 3) {
    try {
      const response = await groq.chat.completions.create({
        model: MODEL,
        messages: [{ role: 'user', content: promptText }],

        response_format: { type: 'json_object' }
      });

      const responseString = response.choices[0]?.message?.content?.trim();
      
      if (!responseString) {
        return res.status(502).json({ error: 'Groq returned an empty response.' });
      }

      const parsedData = JSON.parse(responseString);

      try {
        await redis.set(cacheKey, parsedData, { ex: 2592000 });
      } catch (cacheWriteError) {
        console.error('Failed to write to Redis:', cacheWriteError);
      }

      return res.json(parsedData);
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

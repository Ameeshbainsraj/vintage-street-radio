import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import Groq from 'groq-sdk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

const VIBES = [
  "late night city", "rainy sunday", "neon tokyo", "3am study session",
  "rooftop summer", "winter café", "midnight commute", "city after rain",
  "empty streets at dawn", "cozy basement studio", "foggy harbour",
  "cherry blossom evening", "subway dreams", "record store afternoon"
];

const MOODS = [
  "melancholic & warm", "dreamy & slow", "upbeat & nostalgic",
  "introspective & jazzy", "hazy & romantic", "lo-key & chill",
  "wistful & distant", "smooth & laid-back", "bittersweet & golden",
  "hypnotic & floating"
];

let trackCount = 0;

// SSE endpoint — streams forever
app.get('/api/stream', async (req, res) => {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const send = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  let alive = true;
  req.on('close', () => { alive = false; });

  while (alive) {
    trackCount++;
    const vibe = VIBES[(trackCount - 1) % VIBES.length];
    const mood = MOODS[Math.floor(Math.random() * MOODS.length)];

    send('track_start', { trackCount, vibe, mood });

    const prompt = `You are the AI DJ for Vintage Street Radio — a lofi/chill beats YouTube channel with a retro anime city night aesthetic.

Track #${trackCount}. Vibe: "${vibe}". Mood: "${mood}".

Return ONLY valid JSON (no markdown, no explanation):
{
  "trackName": "creative fictional lofi track name, evocative and poetic",
  "artist": "fictional artist name, japanese-inspired or chill-sounding",
  "duration": "3:xx or 4:xx",
  "bpm": a number between 65 and 90,
  "tags": ["tag1", "tag2", "tag3"],
  "djLine": "3-4 sentences of late-night radio DJ commentary. Poetic, cinematic, atmospheric. Reference the city at night, vinyl, memory, rain, neon, warmth. Cool and understated voice.",
  "nowPlaying": "a one-line visual scene description for the animation — e.g. rain on a window, neon signs reflected in puddles"
}`;

    try {
      const stream = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 400,
        stream: true,
        messages: [{ role: 'user', content: prompt }]
      });

      let raw = '';
      for await (const chunk of stream) {
        if (!alive) break;
        const delta = chunk.choices[0]?.delta?.content || '';
        raw += delta;
        send('chunk', { delta });
      }

      try {
        const clean = raw.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(clean);
        send('track_ready', parsed);
      } catch {
        send('track_ready', { trackName: 'Unknown', artist: 'VSR', duration: '3:30', bpm: 75, tags: [], djLine: raw, nowPlaying: 'city at night' });
      }

      // hold the track for 3 minutes before next one
      await new Promise(r => setTimeout(r, 180000));

    } catch (err) {
      send('error', { message: err.message });
      await new Promise(r => setTimeout(r, 5000));
    }
  }
});

// current stats endpoint
app.get('/api/stats', (req, res) => {
  res.json({ trackCount, uptime: Math.floor(process.uptime()) });
});

app.listen(PORT, () => {
  console.log(`VSR server running on port ${PORT}`);
});

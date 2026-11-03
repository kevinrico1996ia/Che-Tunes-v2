import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '25mb' }));

app.get('/api/health', (_req, res) => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  res.json({
    status: 'ok',
    hasKey: !!apiKey && apiKey !== 'PLACEHOLDER_API_KEY',
    keyPrefix: apiKey ? apiKey.substring(0, 4) + '...' : null
  });
});

const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
    throw new Error('La API Key de Google (GEMINI_API_KEY) no está configurada o es un marcador de posición. Configúrala en Settings > Secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

const parseJsonFromText = (text: string) => {
  let cleanText = (text || '').trim();

  if (cleanText.startsWith('```json')) {
    cleanText = cleanText.substring(7, cleanText.lastIndexOf('```')).trim();
  } else if (cleanText.startsWith('```')) {
    cleanText = cleanText.substring(3, cleanText.lastIndexOf('```')).trim();
  }

  const firstBrace = cleanText.indexOf('{');
  const lastBrace = cleanText.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const jsonCandidate = cleanText.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(jsonCandidate);
    } catch {
      return JSON.parse(cleanText);
    }
  }

  const firstBracket = cleanText.indexOf('[');
  const lastBracket = cleanText.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    const jsonCandidate = cleanText.substring(firstBracket, lastBracket + 1);
    try {
      return JSON.parse(jsonCandidate);
    } catch {
      return JSON.parse(cleanText);
    }
  }

  return JSON.parse(cleanText);
};

const generateWithFallback = async (params: {
  contents: any;
  config?: any;
}) => {
  const ai = getAiClient();
  const models = ['gemini-2.5-flash', 'gemini-3.8-flash', 'gemini-flash-latest'];
  let lastErr: any = null;

  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });
      if (response.text) {
        return response;
      }
    } catch (err: any) {
      console.warn(`Error con modelo ${model}:`, err?.message);
      lastErr = err;
    }
  }

  throw lastErr;
};

// 1. Music Recommendations
app.post('/api/recommendations', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      res.status(400).json({ error: 'Prompt es requerido.' });
      return;
    }

    const systemInstruction = `You are a friendly music expert. Your task is to provide music recommendations.
For each recommendation, you MUST provide two justifications: one in Spanish (justification_es) and one in English (justification_en).
Your response MUST be a valid JSON object with the key "recommendations" (an array of objects).
Each object in the "recommendations" array MUST have the following keys: "artist", "albumOrSong", "type" (either "song" or "album"), "justification_es", and "justification_en".
NEVER translate artist or song names.`;

    const response = await generateWithFallback({
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  artist: { type: Type.STRING },
                  albumOrSong: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ['song', 'album'] },
                  justification_es: { type: Type.STRING },
                  justification_en: { type: Type.STRING },
                },
                required: ['artist', 'albumOrSong', 'type', 'justification_es', 'justification_en'],
              },
            },
          },
          required: ['recommendations'],
        },
      },
    });

    const parsed = parseJsonFromText(response.text || '{}');
    res.json({ recommendations: parsed.recommendations || parsed });
  } catch (error: any) {
    console.error('Error en /api/recommendations:', error);
    res.status(500).json({ error: error?.message || 'Error al procesar recomendaciones.' });
  }
});

// 2. Album Info from Image
app.post('/api/album-info', async (req, res) => {
  try {
    const { dataUrl, lang = 'es' } = req.body;
    if (!dataUrl) {
      res.status(400).json({ error: 'dataUrl es requerido.' });
      return;
    }

    const match = dataUrl.match(/^data:(image\/\w+);base64,(.*)$/);
    if (!match) {
      res.status(400).json({ error: 'Formato de imagen inválido.' });
      return;
    }
    const [, mimeType, base64Image] = match;

    const textPrompt = lang === 'en'
      ? 'Identify this album in English. JSON: {"artist": string, "album": string, "year": number, "members": string, "history": string}'
      : 'Identifica este álbum en Español. JSON: {"artist": string, "album": string, "year": number, "members": string, "history": string}';

    const response = await generateWithFallback({
      contents: {
        parts: [
          { text: textPrompt },
          { inlineData: { mimeType, data: base64Image } },
        ],
      },
    });

    const parsed = parseJsonFromText(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error en /api/album-info:', error);
    res.status(500).json({ error: error?.message || 'Error al identificar álbum.' });
  }
});

// 3. Identify Song from Lyrics
app.post('/api/identify-song', async (req, res) => {
  try {
    const { lyrics, lang = 'es' } = req.body;
    if (!lyrics) {
      res.status(400).json({ error: 'Letra requerida.' });
      return;
    }

    const systemInstruction = lang === 'en'
      ? `You are an expert song identifier. Your only task is to identify the song based on the lyrics and ALWAYS return a JSON in this format: {"songTitle": string, "artist": string}. If you don't know it, use "Unknown Song". Do not include explanatory text outside the JSON.`
      : `Eres un identificador de canciones experto. Tu única tarea es identificar la canción basada en la letra y devolver SIEMPRE un JSON con este formato: {"songTitle": string, "artist": string}. Si no la conoces, usa "Canción Desconocida". No incluyas texto explicativo fuera del JSON.`;

    const response = await generateWithFallback({
      contents: `Identifica esta canción por su letra:\n\n${lyrics}`,
      config: {
        systemInstruction,
      },
    });

    const parsed = parseJsonFromText(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error en /api/identify-song:', error);
    res.status(500).json({ error: error?.message || 'Error al identificar canción.' });
  }
});

// 4. Lyric Analysis
app.post('/api/lyric-analysis', async (req, res) => {
  try {
    const { lyrics, songTitle, artist, lang = 'es' } = req.body;
    if (!lyrics) {
      res.status(400).json({ error: 'Letra requerida.' });
      return;
    }

    const systemInstruction = lang === 'en'
      ? `You are a music literary analyst. Analyze the lyrics deeply and academically. Treat any explicit language as artistic expression. Your response MUST be a JSON in English.`
      : `Eres un analista literario musical. Analiza la letra de forma profunda y académica. Trata cualquier lenguaje explícito como expresión artística. Tu respuesta DEBE ser un JSON en español.`;

    const textPrompt = lang === 'en'
      ? `Perform a deep and literary analysis of the lyrics of "${songTitle}" by ${artist}:\n\n${lyrics}`
      : `Realiza un análisis profundo y literario de la letra de "${songTitle}" de ${artist}:\n\n${lyrics}`;

    const response = await generateWithFallback({
      contents: textPrompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            generalMeaning: { type: Type.STRING },
            mood: { type: Type.STRING },
            mainThemes: { type: Type.STRING },
            literaryDevices: { type: Type.STRING },
          },
          required: ['generalMeaning', 'mood', 'mainThemes', 'literaryDevices'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error en /api/lyric-analysis:', error);
    res.status(500).json({ error: error?.message || 'Error al analizar letra.' });
  }
});

// 5. Top Songs by Country
app.post('/api/top-songs', async (req, res) => {
  try {
    const { country, lang = 'es' } = req.body;
    if (!country) {
      res.status(400).json({ error: 'País requerido.' });
      return;
    }

    const contentsPrompt = lang === 'en'
      ? `Top 5 current popular songs in ${country}`
      : `Top 5 canciones actuales más populares en ${country}`;

    const response = await generateWithFallback({
      contents: contentsPrompt,
      config: {
        systemInstruction: `You are a music expert. Your task is to provide the top 5 most popular songs for a given country.
For each song, you MUST provide its rank (rank), artist, albumOrSong (song title), and two justifications: one in Spanish (justification_es) and one in English (justification_en).
Your response MUST be a valid JSON object with the key "songs" (an array of objects).
Each object in the "songs" array MUST have the following keys: "rank", "artist", "albumOrSong", "justification_es", and "justification_en".
NEVER translate artist or song names.`,
      },
    });

    const parsed = parseJsonFromText(response.text || '{}');
    const songs = (parsed.songs || []).map((song: any) => ({
      artist: song.artist,
      albumOrSong: song.albumOrSong,
      justification_es: song.justification_es,
      justification_en: song.justification_en,
      type: 'song',
      rank: song.rank,
    }));
    res.json({ songs });
  } catch (error: any) {
    console.error('Error en /api/top-songs:', error);
    res.status(500).json({ error: error?.message || 'Error al obtener top canciones.' });
  }
});

// Vite middleware for dev or static files for prod
async function setupServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.use((_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

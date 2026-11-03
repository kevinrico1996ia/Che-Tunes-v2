export type Language = 'es' | 'en';

// Define the structure for a single recommendation
export interface Recommendation {
  artist: string;
  albumOrSong: string;
  justification_es: string; // Justificación en español
  justification_en: string; // Justificación en inglés
  type: 'song' | 'album';
  rank?: number;
}

// Define the structure for album info from an image
export interface AlbumInfo {
  artist: string;
  album: string;
  year: number;
  members: string;
  history: string;
}

// Define the structure for a lyric analysis
export interface LyricAnalysis {
  songTitle: string;
  artist: string;
  generalMeaning: string;
  mood: string;
  mainThemes: string;
  literaryDevices: string;
}

export interface IdentifiedSong {
  songTitle: string;
  artist: string;
}

const handleApiError = (error: unknown, context: string, lang: Language): Error => {
  console.error(`Error en Gemini (${context}, idioma: ${lang}):`, error);

  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
  const isInAppBrowser = /LinkedInApp|Instagram|FBAN|FBAV/i.test(userAgent);

  const errorMessage = {
    es: {
      safety: "El sistema de seguridad de Google bloqueó el análisis de esta canción por contenido extremadamente sensible. Por favor, intenta con otra canción o un fragmento diferente.",
      browser: "El navegador interno está interfiriendo. Por favor, usa la opción 'Abrir en el navegador' (Safari/Chrome).",
      technical: "Hubo un problema de comunicación técnica con el servidor de música. Por favor, reintenta.",
      general: (ctx: string) => `No se pudo completar la solicitud de ${ctx}. Por favor, intenta de nuevo.`,
      quota: "Se ha alcanzado el límite de solicitudes de la IA. Por favor, espera unos segundos e intenta nuevamente.",
      invalidImage: "Imagen inválida."
    },
    en: {
      safety: "Google's safety system blocked the analysis of this content due to extremely sensitive material. Please try with another song or a different fragment.",
      browser: "The in-app browser is interfering. Please use the 'Open in browser' option (Safari/Chrome).",
      technical: "There was a technical communication issue with the music server. Please try again.",
      general: (ctx: string) => `Could not complete the ${ctx} request. Please try again.`,
      quota: "The AI request limit was temporarily reached. Please wait a few seconds and try again.",
      invalidImage: "Invalid image."
    }
  };

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('safety') || message.includes('blocked') || message.includes('candidate')) {
      return new Error(errorMessage[lang].safety);
    }
    if (message.includes('quota') || message.includes('429') || message.includes('resource_exhausted')) {
      return new Error(errorMessage[lang].quota);
    }
    if (message.includes('400') || message.includes('invalid_argument')) {
      if (isInAppBrowser) {
        return new Error(errorMessage[lang].browser);
      }
      return new Error(errorMessage[lang].technical);
    }
    if (message.includes('invalid image')) {
      return new Error(errorMessage[lang].invalidImage);
    }
  }

  return new Error(errorMessage[lang].general(context));
};

// --- FUNCIONES EXPORTADAS QUE LLAMAN A LA API DEL SERVIDOR ---

export const getMusicRecommendations = async (prompt: string, lang: Language): Promise<Recommendation[] | { clarification: string }> => {
  try {
    const response = await fetch('/api/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, lang }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Error ${response.status}`);
    }

    const data = await response.json();
    return data.recommendations;
  } catch (error) {
    throw handleApiError(error, "recomendaciones musicales", lang);
  }
};

export const getAlbumInfoFromImage = async (dataUrl: string, lang: Language): Promise<AlbumInfo> => {
  try {
    const response = await fetch('/api/album-info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataUrl, lang }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Error ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    throw handleApiError(error, "análisis de imagen", lang);
  }
};

export const identifySongFromLyrics = async (lyrics: string, lang: Language): Promise<IdentifiedSong> => {
  try {
    const response = await fetch('/api/identify-song', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lyrics, lang }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Error ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    throw handleApiError(error, "identificación de canción", lang);
  }
};

export const getLyricAnalysis = async (lyrics: string, songTitle: string, artist: string, lang: Language): Promise<Omit<LyricAnalysis, 'songTitle' | 'artist'>> => {
  try {
    const response = await fetch('/api/lyric-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lyrics, songTitle, artist, lang }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Error ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    throw handleApiError(error, "análisis de letras", lang);
  }
};

export const getTopSongsByCountry = async (country: string, lang: Language): Promise<Recommendation[]> => {
  try {
    const response = await fetch('/api/top-songs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country, lang }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Error ${response.status}`);
    }

    const data = await response.json();
    return data.songs;
  } catch (error) {
    throw handleApiError(error, `top 5 de ${country}`, lang);
  }
};
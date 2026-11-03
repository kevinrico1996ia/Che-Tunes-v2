import React, { useState, useEffect } from 'react';
import { identifySongFromLyrics, getLyricAnalysis, LyricAnalysis, Language } from '../services/geminiService';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { LightBulbIcon } from './icons/LightBulbIcon';
import { BeakerIcon } from './icons/BeakerIcon';
import { TagIcon } from './icons/TagIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { SpotifyIcon } from './icons/SpotifyIcon';
import { YouTubeIcon } from './icons/YouTubeIcon';
import { ShareIcon } from './icons/ShareIcon';

interface LyricAnalyzerProps {
  lang: Language; // Reintroducido
}

const LyricAnalyzer: React.FC<LyricAnalyzerProps> = ({ lang }) => {
    const [lyrics, setLyrics] = useState('');
    const [analysis, setAnalysis] = useState<LyricAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Objeto de traducciones para LyricAnalyzer.tsx
    const translations = {
      es: {
        title: "Analiza una Canción",
        sub: "Descubre el significado oculto entre líneas.",
        pl: "Pega aquí la letra de la canción...",
        btn: "Analizar Letra",
        loading: "Decodificando...",
        errorNoLyrics: "Por favor, introduce la letra de una canción.",
        errorUnkn: "No pudimos identificar la canción a partir de la letra. Intenta con una porción más larga o reconocible.",
        errorAnalyze: "No se pudo analizar la letra. Por favor, intenta de nuevo.", // Added missing translation
        meaning: "Significado General",
        mood: "Tono y Sentimiento",
        themes: "Temas Principales",
        literary: "Figuras Retóricas",
        shareCopy: "¡Información de la canción copiada al portapapeles!",
        shareTitle: (title: string) => `Análisis de CheTunes: ${title}`,
        shareText: (title: string, artist: string) => `¡Descubre el significado de '${title}' de ${artist} con CheTunes!`
      },
      en: {
        title: "Analyze a Song",
        sub: "Uncover the hidden meaning between the lines.",
        pl: "Paste the song lyrics here...",
        btn: "Analyze Lyrics",
        loading: "Decoding...",
        errorNoLyrics: "Please enter song lyrics.",
        errorUnkn: "We couldn't identify the song from the lyrics. Try a longer or more recognizable portion.",
        errorAnalyze: "Could not analyze the lyrics. Please try again.", // Added missing translation
        meaning: "General Meaning",
        mood: "Tone and Feeling",
        themes: "Main Themes",
        literary: "Literary Devices",
        shareCopy: "Song information copied to clipboard!",
        shareTitle: (title: string) => `CheTunes Analysis: ${title}`,
        shareText: (title: string, artist: string) => `Uncover the meaning of '${title}' by ${artist} with CheTunes!`
      }
    };

    const t = translations[lang];

    // Helper to render text with bold markdown support (**bold**)
    const renderFormattedText = (text: string) => {
        if (!text) return null;
        
        // Split by bold pattern **text**
        const parts = text.split(/(\*\*.*?\*\*)/g);
        
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                const boldText = part.slice(2, -2);
                return (
                    <strong key={i} className="text-white font-bold brightness-125">
                        {boldText}
                    </strong>
                );
            }
            return part;
        });
    };

    const handleSubmit = async (e?: React.FormEvent) => { // Make event optional
        e?.preventDefault(); // Only prevent default if event exists
        if (!lyrics.trim()) {
            setError(t.errorNoLyrics);
            return;
        }
        setIsLoading(true);
        setError(null);
        setAnalysis(null);

        try {
            const identifiedSong = await identifySongFromLyrics(lyrics, lang); // Pasa lang

            if (identifiedSong.songTitle === (lang === 'es' ? "Canción Desconocida" : "Unknown Song")) {
                setError(t.errorUnkn);
                setIsLoading(false);
                return;
            }

            const analysisResult = await getLyricAnalysis(lyrics, identifiedSong.songTitle, identifiedSong.artist, lang); // Pasa lang
            
            setAnalysis({
                ...identifiedSong,
                ...analysisResult
            });

        } catch (err) {
            setError(err instanceof Error ? err.message : t.errorAnalyze);
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    // Effect to re-run the query if language changes and results are already displayed
    useEffect(() => {
        if (analysis !== null && lyrics.trim()) { // Check if there's a previous analysis and lyrics exist
            handleSubmit();
        }
    }, [lang]); // Depend on lang

    const AnalysisCard: React.FC<{ result: LyricAnalysis }> = ({ result }) => {
        const spotifyQuery = `track:"${result.songTitle}" artist:"${result.artist}"`;
        const spotifyUrl = `https://open.spotify.com/search/${encodeURIComponent(spotifyQuery)}`;
        const youtubeQuery = `${result.artist} ${result.songTitle} official video`;
        const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(youtubeQuery)}`;

        const handleShare = async () => {
            const shareText = t.shareText(result.songTitle, result.artist) + `\n\nSpotify: ${spotifyUrl}\nYouTube: ${youtubeUrl}`;
            const shareTitle = t.shareTitle(result.songTitle);

            if (navigator.share) {
                try {
                    await navigator.share({ title: shareTitle, text: shareText });
                } catch (error) { console.error('Error al compartir:', error); }
            } else {
                try {
                    await navigator.clipboard.writeText(shareText);
                    alert(t.shareCopy);
                } catch (err) { console.error('Error al copiar texto: ', err); }
            }
        };

        return (
            <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-md transform transition-all duration-300 hover:scale-[1.01] hover:border-pink-500/30 w-full relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/5 rounded-full filter blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative z-10">
                    <div className="text-center mb-8 pb-6 border-b border-white/10">
                        <h3 className="text-4xl font-extrabold font-display text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">{result.songTitle}</h3>
                        <p className="text-xl text-pink-400 mt-2 font-medium font-display">{result.artist}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="flex items-start bg-gray-900/40 p-4 rounded-xl">
                            <LightBulbIcon className="w-8 h-8 mr-4 text-yellow-400 flex-shrink-0 mt-1" />
                            <div>
                                <h4 className="font-bold font-display text-gray-200 text-lg mb-1">{t.meaning}</h4>
                                <div className="text-gray-400 text-sm leading-relaxed">{renderFormattedText(result.generalMeaning)}</div>
                            </div>
                        </div>
                        <div className="flex items-start bg-gray-900/40 p-4 rounded-xl">
                            <BeakerIcon className="w-8 h-8 mr-4 text-purple-400 flex-shrink-0 mt-1" />
                            <div>
                                <h4 className="font-bold font-display text-gray-200 text-lg mb-1">{t.mood}</h4>
                                <div className="text-gray-400 text-sm leading-relaxed">{renderFormattedText(result.mood)}</div>
                            </div>
                        </div>
                        <div className="flex items-start bg-gray-900/40 p-4 rounded-xl">
                            <TagIcon className="w-8 h-8 mr-4 text-blue-400 flex-shrink-0 mt-1" />
                            <div>
                                <h4 className="font-bold font-display text-gray-200 text-lg mb-1">{t.themes}</h4>
                                <div className="text-gray-400 text-sm leading-relaxed">{renderFormattedText(result.mainThemes)}</div>
                            </div>
                        </div>
                        <div className="flex items-start bg-gray-900/40 p-4 rounded-xl">
                            <BookOpenIcon className="w-8 h-8 mr-4 text-green-400 flex-shrink-0 mt-1" />
                            <div>
                                <h4 className="font-bold font-display text-gray-200 text-lg mb-1">{t.literary}</h4>
                                <div className="text-gray-400 text-sm leading-relaxed">{renderFormattedText(result.literaryDevices)}</div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-end space-x-3 mt-8 pt-6 border-t border-white/10">
                        <button onClick={handleShare} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all" aria-label="Compartir análisis">
                            <ShareIcon className="w-6 h-6" />
                        </button>
                        <a href={spotifyUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#1DB954] hover:scale-110 transition-all">
                            <SpotifyIcon className="w-7 h-7" />
                        </a>
                        <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#FF0000] hover:scale-110 transition-all">
                            <YouTubeIcon className="w-7 h-7" />
                        </a>
                    </div>
                </div>
            </div>
        )
    };

    return (
        <div className="w-full max-w-3xl mx-auto flex flex-col items-center pb-12">
            <div className="bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl w-full">
                <h2 className="text-3xl font-bold font-display text-center text-white mb-2 flex items-center justify-center">
                    <DocumentTextIcon className="w-8 h-8 mr-3 text-pink-500" />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">{t.title}</span>
                </h2>
                <p className="text-center text-gray-400 mb-8 font-light">{t.sub}</p>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative">
                        <textarea
                            value={lyrics}
                            onChange={(e) => setLyrics(e.target.value)}
                            className="w-full h-48 bg-gray-900/50 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none font-mono text-sm leading-relaxed transition-all"
                            placeholder={t.pl}
                        />
                        <div className="absolute bottom-3 right-3 text-gray-600"><SparklesIcon className="w-5 h-5" /></div>
                    </div>
                    <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold font-display py-4 px-6 rounded-xl shadow-lg shadow-pink-500/25 disabled:opacity-50 flex items-center justify-center transition-all duration-300 transform hover:-translate-y-1">
                        {isLoading ? t.loading : t.btn}
                    </button>
                </form>
            </div>
            <div className="w-full">
                {error && <p className="text-red-300 text-center bg-red-900/50 border border-red-500/30 p-4 rounded-xl mt-8 backdrop-blur-sm">{error}</p>}
                {analysis && <AnalysisCard result={analysis} />}
            </div>
        </div>
    );
};

export default LyricAnalyzer;
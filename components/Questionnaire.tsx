import React, { useState, useEffect } from 'react';
import { getMusicRecommendations, Recommendation, Language } from '../services/geminiService';
import { MusicIcon } from './icons/MusicIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { HeartIcon } from './icons/HeartIcon';
import { SpotifyIcon } from './icons/SpotifyIcon';
import { YouTubeIcon } from './icons/YouTubeIcon';
import { ShareIcon } from './icons/ShareIcon';
import { ThumbUpIcon } from './icons/ThumbUpIcon';
import { ThumbDownIcon } from './icons/ThumbDownIcon';

interface QuestionnaireProps {
    lang: Language; // Reintroducido
    favorites: Recommendation[];
    onToggleFavorite: (recommendation: Recommendation) => void;
    likedSongs: string[];
    dislikedSongs: string[];
    onLike: (recommendation: Recommendation) => void;
    onDislike: (recommendation: Recommendation) => void;
}

const Questionnaire: React.FC<QuestionnaireProps> = ({ 
    lang, // Reintroducido
    favorites, 
    onToggleFavorite, 
    likedSongs, 
    dislikedSongs, 
    onLike, 
    onDislike 
}) => {
    // Objeto de traducciones para Questionnaire.tsx
    const translations = {
      es: {
        title: "Encuentra tu frecuencia",
        genre: "Género Musical",
        genrePl: "Ej: Rock Alternativo, Lo-fi, Pop",
        artists: "Artistas que te gustan",
        artistsPl: "Ej: Tame Impala, Daft Punk",
        mood: "¿Para qué mood o actividad?",
        moodPl: "Ej: Para concentrarse, roadtrip, noche tranquila",
        type: "¿Canción o Álbum?",
        typeAny: "Cualquiera",
        typeSong: "Canción",
        typeAlbum: "Álbum",
        era: "¿Descubrimiento?",
        eraAny: "Cualquiera",
        eraNew: "Algo nuevo / Joya oculta",
        eraClassic: "Un clásico",
        useFavs: "Usar mis gustos (Favoritos, Likes y Dislikes) para mejorar resultados",
        btn: "Obtener Recomendaciones",
        btnLoading: "Sintonizando frecuencias...",
        results: "Selección Especial para Ti",
        copy: "¡Recomendación copiada al portapapeles!",
        shareText: (rec: any) => `¡CheTunes me recomendó esta joya! Escucha '${rec.albumOrSong}' de '${rec.artist}'.`,
        why: "Justificación",
        recType: "Tipo de Recomendación",
        promptBase: (genre: string, artists: string, mood: string, type: string, era: string) => `
            Basado en las siguientes preferencias, dame hasta 4 recomendaciones musicales. Prioriza la calidad y la existencia real de las canciones/álbumes sobre la cantidad.
            - Género: ${genre || 'Cualquiera'}
            - Artistas Similares: ${artists || 'Cualquiera'}
            - Mood/Vibra: ${mood || 'Cualquiera'}
            - Tipo de recomendación: ${type === 'song' ? 'Canción' : type === 'album' ? 'Álbum' : 'Cualquiera'}
            - Preferencia de época: ${era === 'new' ? 'Música nueva o menos conocida' : era === 'classic' ? 'Clásicos/Iconos' : 'Cualquiera'}
        `,
        favList: (favs: string) => `\n- IMPORTANTE: Toma muy en cuenta los siguientes favoritos guardados del usuario para guiar el estilo de las recomendaciones:\n${favs}`,
        likedList: (likes: string) => `\n- El usuario le ha dado "Manita Arriba" a lo siguiente (busca cosas similares): \n${likes}`,
        dislikedList: (dislikes: string) => `\n- EVITA ESTRICTAMENTE recomendar algo similar a lo que el usuario le dio "Manita Abajo": \n${dislikes}`,
      },
      en: {
        title: "Find Your Frequency",
        genre: "Music Genre",
        genrePl: "Ex: Alternative Rock, Lo-fi, Pop",
        artists: "Artists you like",
        artistsPl: "Ex: Tame Impala, Daft Punk",
        mood: "For what mood or activity?",
        moodPl: "Ex: For focusing, roadtrip, chill evening",
        type: "Song or Album?",
        typeAny: "Any",
        typeSong: "Song",
        typeAlbum: "Album",
        era: "Discovery?",
        eraAny: "Any",
        eraNew: "Something new / Hidden gem",
        eraClassic: "A classic",
        useFavs: "Use my preferences (Favorites, Likes & Dislikes) to improve results",
        btn: "Get Recommendations",
        btnLoading: "Tuning frequencies...",
        results: "Special Selection for You",
        copy: "Recommendation copied to clipboard!",
        shareText: (rec: any) => `CheTunes recommended this gem! Listen to '${rec.albumOrSong}' by '${rec.artist}'.`,
        why: "Justification",
        recType: "Recommendation Type",
        promptBase: (genre: string, artists: string, mood: string, type: string, era: string) => `
            Based on the following preferences, give me up to 4 music recommendations. Prioritize quality and real existence of songs/albums over quantity.
            - Genre: ${genre || 'Any'}
            - Similar Artists: ${artists || 'Any'}
            - Mood/Vibe: ${mood || 'Any'}
            - Recommendation Type: ${type === 'song' ? 'Song' : type === 'album' ? 'Album' : 'Any'}
            - Era preference: ${era === 'new' ? 'New or lesser-known music' : era === 'classic' ? 'Classics/Icons' : 'Any'}
        `,
        favList: (favs: string) => `\n- IMPORTANT: Strongly consider the user's saved favorites to guide the style of recommendations:\n${favs}`,
        likedList: (likes: string) => `\n- The user has 'Liked' the following (look for similar things): \n${likes}`,
        dislikedList: (dislikes: string) => `\n- STRICTLY AVOID recommending anything similar to what the user 'Disliked': \n${dislikes}`,
      }
    };

    const t = translations[lang];

    const [formData, setFormData] = useState({
        genre: '',
        artists: '',
        mood: '',
        type: 'any',
        era: 'any',
    });
    const [useFavorites, setUseFavorites] = useState(true);
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [clarification, setClarification] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const isFavorite = (rec: Recommendation) => {
        return favorites.some(fav => fav.artist === rec.artist && fav.albumOrSong === rec.albumOrSong);
    }
    
    const isLiked = (rec: Recommendation) => likedSongs.includes(`${rec.artist}-${rec.albumOrSong}`);
    const isDisliked = (rec: Recommendation) => dislikedSongs.includes(`${rec.artist}-${rec.albumOrSong}`);

    const handleSubmit = async (e?: React.FormEvent) => { // Make event optional for programmatic calls
        e?.preventDefault(); // Only prevent default if event exists
        setIsLoading(true);
        setError(null);
        setClarification(null);
        setRecommendations([]);
        
        // The prompt still uses the current lang, which influences how Gemini interprets details
        // and structures the prompt, even though the systemInstruction now explicitly asks for both justifications.
        let prompt = t.promptBase(formData.genre, formData.artists, formData.mood, formData.type, formData.era);

        if (useFavorites) {
            if (favorites.length > 0) {
                // Ensure to pass both justifications for favorites to the prompt if needed,
                // but for simplicity, we'll just pass the artist/album name
                const favoriteList = favorites.map(f => `- ${f.albumOrSong} by ${f.artist}`).join('\n');
                prompt += t.favList(favoriteList);
            }
            
            if (likedSongs.length > 0) {
                const likedList = likedSongs.map(s => s.replace('-', ' - ')).join('\n');
                prompt += t.likedList(likedList);
            }

            if (dislikedSongs.length > 0) {
                const dislikedList = dislikedSongs.map(s => s.replace('-', ' - ')).join('\n');
                prompt += t.dislikedList(dislikedList);
            }
        }

        try {
            const result = await getMusicRecommendations(prompt, lang); // Pasa lang, aunque systemInstruction es agnóstica
            if ('clarification' in result) {
                setClarification(result.clarification);
            } else {
                setRecommendations(result);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Hubo un error al obtener las recomendaciones. Por favor, intenta de nuevo.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    // REMOVED: Effect to re-run the query if language changes and results are already displayed
    // The recommendations now contain both justifications, so no re-query is needed.
    
    const RecommendationCard: React.FC<{ rec: Recommendation }> = ({ rec }) => {
        const isFav = isFavorite(rec);
        const liked = isLiked(rec);
        const disliked = isDisliked(rec);

        const spotifyQuery = rec.type === 'album' 
            ? `album:"${rec.albumOrSong}" artist:"${rec.artist}"`
            : `track:"${rec.albumOrSong}" artist:"${rec.artist}"`;
        const spotifyUrl = `https://open.spotify.com/search/${encodeURIComponent(spotifyQuery)}`;
        const youtubeQuery = `${rec.artist} ${rec.albumOrSong} ${rec.type === 'album' ? 'full album' : 'official video'}`;
        const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(youtubeQuery)}`;

        const handleShare = async () => {
            const shareText = t.shareText(rec) + `\n\nSpotify: ${spotifyUrl}\nYouTube: ${youtubeUrl}`;
            const shareTitle = t.shareText(rec); // Simplified for consistency

            if (navigator.share) {
                try {
                    await navigator.share({
                        title: shareTitle,
                        text: shareText,
                    });
                } catch (error) {
                    console.error('Error al compartir:', error);
                }
            } else {
                try {
                    await navigator.clipboard.writeText(shareText);
                    alert(t.copy);
                } catch (err) {
                    console.error('Error al copiar texto: ', err);
                }
            }
        };

        return (
             <div className="group relative bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-sm flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] hover:border-pink-500/30 hover:shadow-pink-500/10 overflow-hidden">
                {/* Decorative Background Icon */}
                <div className="absolute -bottom-8 -right-8 text-white/5 transform rotate-12 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                    <MusicIcon width="150" height="150" />
                </div>

                <div className="relative z-10">
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="inline-block px-2 py-1 text-xs font-display font-semibold tracking-wider text-pink-300 bg-pink-500/10 rounded-md border border-pink-500/20 mb-2">
                                {rec.type === 'song' ? t.typeSong : t.typeAlbum}
                            </span>
                            <h4 className="text-2xl font-bold font-display text-white leading-tight">{rec.albumOrSong}</h4>
                            <p className="text-lg text-gray-400 font-medium font-display">{rec.artist}</p>
                        </div>
                        <button onClick={() => onToggleFavorite(rec)} className={`p-2 rounded-full transition-all duration-300 ${isFav ? 'text-red-500 bg-red-500/10' : 'text-gray-500 hover:text-red-400 hover:bg-white/5'}`} title="Favoritos">
                            <HeartIcon className="w-6 h-6" fill={isFav ? 'currentColor' : 'none'} />
                        </button>
                    </div>
                    <p className="text-gray-300 mt-4 text-sm leading-relaxed border-l-2 border-pink-500/50 pl-4">
                        {lang === 'es' ? rec.justification_es : rec.justification_en} {/* Usar justificación según el idioma */}
                    </p>
                </div>
                
                {/* Feedback Section */}
                <div className="relative z-10 flex items-center justify-between mt-6 pt-4 border-t border-white/10">
                     <div className="flex space-x-2">
                        <button 
                            onClick={() => onLike(rec)} 
                            className={`p-2 rounded-full transition-all ${liked ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'text-gray-500 hover:bg-gray-700 hover:text-green-400'}`}
                        >
                            <ThumbUpIcon className="w-5 h-5" fill={liked ? 'currentColor' : 'none'} />
                        </button>
                        <button 
                            onClick={() => onDislike(rec)} 
                            className={`p-2 rounded-full transition-all ${disliked ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-gray-500 hover:bg-gray-700 hover:text-red-400'}`}
                        >
                            <ThumbDownIcon className="w-5 h-5" fill={disliked ? 'currentColor' : 'none'} />
                        </button>
                    </div>

                    <div className="flex items-center justify-end space-x-3">
                        <button onClick={handleShare} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all">
                            <ShareIcon className="w-5 h-5" />
                        </button>
                        <a href={spotifyUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#1DB954] hover:scale-110 transition-all">
                            <SpotifyIcon className="w-6 h-6" />
                        </a>
                        <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#FF0000] hover:scale-110 transition-all">
                            <YouTubeIcon className="w-6 h-6" />
                        </a>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full max-w-4xl mx-auto">
            <div className="bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                <h2 className="text-3xl font-bold font-display text-center text-white mb-8 flex items-center justify-center">
                    <MusicIcon className="w-8 h-8 mr-3 text-pink-500" />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        {t.title}
                    </span>
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="genre" className="block text-sm font-medium font-display text-gray-300 mb-2 pl-1">{t.genre}</label>
                            <input type="text" name="genre" id="genre" value={formData.genre} onChange={handleChange} className="w-full bg-gray-900/50 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all" placeholder={t.genrePl} />
                        </div>
                        <div>
                            <label htmlFor="artists" className="block text-sm font-medium font-display text-gray-300 mb-2 pl-1">{t.artists}</label>
                            <input type="text" name="artists" id="artists" value={formData.artists} onChange={handleChange} className="w-full bg-gray-900/50 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all" placeholder={t.artistsPl} />
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-2 pl-1">
                            <label htmlFor="mood" className="block text-sm font-medium font-display text-gray-300">{t.mood}</label>
                            <span className="text-xs text-gray-500 font-mono bg-gray-800 px-2 py-0.5 rounded-full">{formData.mood.length}/500</span>
                        </div>
                        <textarea 
                            name="mood" 
                            id="mood" 
                            value={formData.mood} 
                            onChange={handleChange} 
                            rows={5}
                            maxLength={500}
                            className="w-full bg-gray-900/50 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-y transition-all" 
                            placeholder={t.moodPl} 
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="type" className="block text-sm font-medium font-display text-gray-300 mb-2 pl-1">{t.type}</label>
                            <div className="relative">
                                <select name="type" id="type" value={formData.type} onChange={handleChange} className="w-full bg-gray-900/50 border border-gray-700 text-white rounded-xl px-4 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all">
                                    <option value="any" className="bg-gray-900 text-white">{t.typeAny}</option>
                                    <option value="song" className="bg-gray-900 text-white">{t.typeSong}</option>
                                    <option value="album" className="bg-gray-900 text-white">{t.typeAlbum}</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                                    <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="era" className="block text-sm font-medium font-display text-gray-300 mb-2 pl-1">{t.era}</label>
                            <div className="relative">
                                <select name="era" id="era" value={formData.era} onChange={handleChange} className="w-full bg-gray-900/50 border border-gray-700 text-white rounded-xl px-4 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all">
                                    <option value="any" className="bg-gray-900 text-white">{t.eraAny}</option>
                                    <option value="new" className="bg-gray-900 text-white">{t.eraNew}</option>
                                    <option value="classic" className="bg-gray-900 text-white">{t.eraClassic}</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                                    <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-center pt-2">
                        <label className="flex items-center cursor-pointer group">
                            <input
                                id="use-favorites"
                                type="checkbox"
                                checked={useFavorites}
                                onChange={(e) => setUseFavorites(e.target.checked)}
                                className="h-5 w-5 rounded border-gray-600 bg-gray-900 text-pink-600 focus:ring-pink-500 focus:ring-offset-gray-900 transition-all"
                            />
                            <span className="ml-3 block text-sm font-medium text-gray-400 group-hover:text-pink-400 transition-colors">
                                {t.useFavs}
                            </span>
                        </label>
                    </div>
                    
                    <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold font-display py-4 px-6 rounded-xl shadow-lg shadow-pink-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-300 transform hover:-translate-y-1">
                        {isLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                {t.btnLoading}
                            </>
                        ) : (
                            <>
                                <SparklesIcon className="w-5 h-5 mr-2" />
                                {t.btn}
                            </>
                        )}
                    </button>
                </form>
            </div>
            
            <div className="mt-12 pb-12">
                {error && <p className="text-red-300 text-center bg-red-900/50 border border-red-500/30 p-4 rounded-xl backdrop-blur-sm">{error}</p>}
                {clarification && <p className="text-yellow-300 text-center bg-yellow-900/50 border border-yellow-500/30 p-4 rounded-xl backdrop-blur-sm">{clarification}</p>}
                
                {recommendations.length > 0 && (
                    <div className="animate-fadeIn">
                        <h3 className="text-3xl font-bold font-display text-center text-white mb-8">{t.results}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {recommendations.map((rec, index) => (
                               <RecommendationCard key={`${rec.artist}-${rec.albumOrSong}-${index}`} rec={rec} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Questionnaire;
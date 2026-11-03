import React, { useState, useEffect } from 'react';
import { getTopSongsByCountry, Recommendation, Language } from '../services/geminiService';
import { GlobeIcon } from './icons/GlobeIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { HeartIcon } from './icons/HeartIcon';
import { SpotifyIcon } from './icons/SpotifyIcon';
import { YouTubeIcon } from './icons/YouTubeIcon';
import { ShareIcon } from './icons/ShareIcon';

interface TopChartsProps {
  favorites: Recommendation[];
  onToggleFavorite: (recommendation: Recommendation) => void;
  lang: Language; // Reintroducido
}

// Objeto de traducciones para TopCharts.tsx
const translations = {
  es: {
    title: "Top 5 Mundial",
    sub: "¿Qué está sonando en el mundo ahora mismo?",
    selectCountry: "-- Selecciona un país --",
    errorSelectCountry: "Por favor, selecciona un país.",
    errorFetch: "Hubo un error al obtener el top 5. Por favor, intenta de nuevo.",
    searchBtn: "Buscar Top 5",
    loading: "Conectando satélites...",
    topIn: "Top 5 en",
    chartLabel: "Top Chart",
    infoCopied: "¡Información de la canción copiada al portapapeles!",
    shareText: (rec: Recommendation) => `¡Esta canción está en el top de CheTunes! Escucha '${rec.albumOrSong}' de '${rec.artist}'.`,
    shareTitle: (rec: Recommendation) => `Top de CheTunes: ${rec.albumOrSong}`,
    countries: [
      { value: 'Global', label: 'Global' },
      { value: 'United States', label: 'Estados Unidos' },
      { value: 'Spain', label: 'España' },
      { value: 'Mexico', label: 'México' },
      { value: 'Argentina', label: 'Argentina' },
      { value: 'Colombia', label: 'Colombia' },
      { value: 'Brazil', label: 'Brasil' },
      { value: 'United Kingdom', label: 'Reino Unido' },
      { value: 'Germany', label: 'Alemania' },
      { value: 'France', label: 'Francia' },
      { value: 'Japan', label: 'Japón' },
      { value: 'South Korea', label: 'Corea del Sur' },
      { value: 'Australia', label: 'Australia' },
      { value: 'Canada', label: 'Canadá' },
      { value: 'India', label: 'India' },
    ]
  },
  en: {
    title: "Global Top 5",
    sub: "What's trending in the world right now?",
    selectCountry: "-- Select a country --",
    errorSelectCountry: "Please select a country.",
    errorFetch: "There was an error fetching the top 5. Please try again.",
    searchBtn: "Search Top 5",
    loading: "Connecting satellites...",
    topIn: "Top 5 in",
    chartLabel: "Top Chart",
    infoCopied: "Song information copied to clipboard!",
    shareText: (rec: Recommendation) => `This song is in CheTunes' top charts! Listen to '${rec.albumOrSong}' by '${rec.artist}'.`,
    shareTitle: (rec: Recommendation) => `CheTunes Top: ${rec.albumOrSong}`,
    countries: [
      { value: 'Global', label: 'Global' },
      { value: 'United States', label: 'United States' },
      { value: 'Spain', label: 'Spain' },
      { value: 'Mexico', label: 'Mexico' },
      { value: 'Argentina', label: 'Argentina' },
      { value: 'Colombia', label: 'Colombia' },
      { value: 'Brazil', label: 'Brazil' },
      { value: 'United Kingdom', label: 'United Kingdom' },
      { value: 'Germany', label: 'Germany' },
      { value: 'France', label: 'France' },
      { value: 'Japan', label: 'Japan' },
      { value: 'South Korea', label: 'South Korea' },
      { value: 'Australia', label: 'Australia' },
      { value: 'Canada', label: 'Canada' },
      { value: 'India', label: 'India' },
    ]
  }
};

const TopCharts: React.FC<TopChartsProps> = ({ favorites, onToggleFavorite, lang }) => { // Reintroducido lang
  const t = translations[lang]; // Asigna las traducciones según el idioma actual

  const [selectedCountry, setSelectedCountry] = useState('');
  const [topSongs, setTopSongs] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFavorite = (rec: Recommendation) => {
    return favorites.some(fav => fav.artist === rec.artist && fav.albumOrSong === rec.albumOrSong);
  }

  const handleSubmit = async (e?: React.FormEvent) => { // Make event optional
    e?.preventDefault(); // Only prevent default if event exists
    if (!selectedCountry) {
      setError(t.errorSelectCountry);
      return;
    }
    setIsLoading(true);
    setError(null);
    setTopSongs([]);

    try {
      const results = await getTopSongsByCountry(selectedCountry, lang); // Pasa lang
      setTopSongs(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errorFetch);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to re-run the query if language changes and results are already displayed
  useEffect(() => {
    if (topSongs.length > 0 && selectedCountry) { // Check if there are previous results and a country is selected
      handleSubmit();
    }
  }, [lang]); // Depend on lang

  const SongCard: React.FC<{ rec: Recommendation }> = ({ rec }) => {
    const isFav = isFavorite(rec);
    const spotifyQuery = `track:"${rec.albumOrSong}" artist:"${rec.artist}"`;
    const spotifyUrl = `https://open.spotify.com/search/${encodeURIComponent(spotifyQuery)}`;
    const youtubeQuery = `${rec.artist} ${rec.albumOrSong} official video`;
    const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(youtubeQuery)}`;

    const handleShare = async () => {
        const shareText = t.shareText(rec) + `\n\nSpotify: ${spotifyUrl}\nYouTube: ${youtubeUrl}`;
        const shareTitle = t.shareTitle(rec);

        if (navigator.share) {
            try {
                await navigator.share({ title: shareTitle, text: shareText });
            } catch (error) {
                console.error('Error al compartir:', error);
            }
        } else {
            try {
                await navigator.clipboard.writeText(shareText);
                alert(t.infoCopied);
            } catch (err) {
                console.error('Error al copiar texto: ', err);
            }
        }
    };

    return (
        <div className="group bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-sm flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] hover:border-pink-500/30">
            <div>
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <span className="inline-block px-2 py-1 text-xs font-semibold font-display tracking-wider text-pink-300 bg-pink-500/10 rounded-md border border-pink-500/20 mb-2">
                             {t.chartLabel}
                        </span>
                        <h4 className="text-xl font-bold font-display text-white mt-1">{rec.albumOrSong}</h4>
                        <p className="text-gray-400 font-display">{rec.artist}</p>
                    </div>
                    <div className="flex flex-col items-center ml-4">
                        <span className="text-4xl font-black font-display text-transparent bg-clip-text bg-gradient-to-b from-pink-400 to-purple-600 drop-shadow-lg">#{rec.rank}</span>
                    </div>
                </div>
                {/* Use language-specific justification */}
                <p className="text-gray-300 mt-4 text-sm italic border-l-2 border-pink-500/50 pl-3">"{lang === 'es' ? rec.justification_es : rec.justification_en}"</p>
            </div>
            
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
                <button onClick={() => onToggleFavorite(rec)} className={`p-2 rounded-full transition-all ${isFav ? 'text-red-500 bg-red-500/10' : 'text-gray-500 hover:text-red-400 hover:bg-white/5'}`}>
                     <HeartIcon className="w-6 h-6" fill={isFav ? 'currentColor' : 'none'} />
                </button>
                <div className="flex items-center space-x-3">
                    <button onClick={handleShare} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all" aria-label="Compartir recomendación">
                        <ShareIcon className="w-5 h-5" />
                    </button>
                    <a href={spotifyUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#1DB954] hover:scale-110 transition-all" aria-label="Search on Spotify">
                        <SpotifyIcon className="w-6 h-6" />
                    </a>
                    <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#FF0000] hover:scale-110 transition-all" aria-label="Search on YouTube">
                        <YouTubeIcon className="w-6 h-6" />
                    </a>
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto pb-12">
      <div className="bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
        <h2 className="text-3xl font-bold font-display text-center text-white mb-2 flex items-center justify-center">
          <GlobeIcon className="w-8 h-8 mr-3 text-pink-500" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
             {t.title}
          </span>
        </h2>
        <p className="text-center text-gray-400 mb-8 font-light">{t.sub}</p>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-4">
          <div className="w-full sm:w-1/2 relative">
             <select
                name="country"
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full bg-gray-900/50 border border-gray-700 text-white rounded-xl px-4 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
            >
                <option value="">{t.selectCountry}</option>
                {t.countries.map(country => (
                <option key={country.value} value={country.value}>{country.label}</option>
                ))}
            </select>
             <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
            </div>
          </div>
         
          <button type="submit" disabled={isLoading || !selectedCountry} className="w-full sm:w-1/2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold font-display py-3 px-6 rounded-xl shadow-lg shadow-pink-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-300 transform hover:-translate-y-1">
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t.loading}
              </>
            ) : (
              <>
                <SparklesIcon className="w-5 h-5 mr-2" />
                {t.searchBtn}
              </>
            )}
          </button>
        </form>
      </div>

      <div className="mt-12">
        {error && <p className="text-red-300 text-center bg-red-900/50 border border-red-500/30 p-4 rounded-xl backdrop-blur-sm">{error}</p>}
        
        {topSongs.length > 0 && (
            <div className="animate-fadeIn">
                <h3 className="text-3xl font-bold font-display text-center text-white mb-8">
                    {t.topIn} <span className="text-pink-400">{t.countries.find(c => c.value === selectedCountry)?.label || selectedCountry}</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {topSongs.map((song) => (
                       <SongCard key={`${song.artist}-${song.albumOrSong}-${song.rank}`} rec={song} />
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default TopCharts;
import React from 'react';
import { Recommendation, Language } from '../services/geminiService';
import { HeartIcon } from './icons/HeartIcon';
import { SpotifyIcon } from './icons/SpotifyIcon';
import { YouTubeIcon } from './icons/YouTubeIcon';
import { ShareIcon } from './icons/ShareIcon';
import { MusicIcon } from './icons/MusicIcon';

interface FavoritesProps {
  lang: Language; // Reintroducido
  favorites: Recommendation[];
  onRemoveFavorite: (recommendation: Recommendation) => void;
}

export const Favorites: React.FC<FavoritesProps> = ({ lang, favorites, onRemoveFavorite }) => {
  // Objeto de traducciones para Favorites.tsx
  const translations = {
    es: {
      title: "Tu Colección",
      empty: "Tu colección está vacía",
      emptySub: "Usa el ícono de corazón para guardar la música que te inspire.",
      song: "Canción",
      album: "Álbum",
      shareCopy: "¡Recomendación copiada al portapapeles!",
      shareTitle: (fav: Recommendation) => `Recomendación de CheTunes: ${fav.albumOrSong}`,
      shareText: (fav: Recommendation) => `¡CheTunes me recomendó esta joya! Escucha '${fav.albumOrSong}' de '${fav.artist}'.`
    },
    en: {
      title: "Your Collection",
      empty: "Your collection is empty",
      emptySub: "Use the heart icon to save music that inspires you.",
      song: "Song",
      album: "Album",
      shareCopy: "Recommendation copied to clipboard!",
      shareTitle: (fav: Recommendation) => `CheTunes Recommendation: ${fav.albumOrSong}`,
      shareText: (fav: Recommendation) => `CheTunes recommended this gem! Listen to '${fav.albumOrSong}' by '${fav.artist}'.`
    }
  };

  const t = translations[lang];

  if (favorites.length === 0) {
    return (
        <div className="w-full max-w-4xl mx-auto mt-12 text-center">
            <h2 className="text-3xl font-bold font-display text-white mb-4">{t.title}</h2>
            <div className="bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-12">
                <HeartIcon className="w-16 h-16 mx-auto text-gray-600 mb-6" />
                <p className="text-xl text-gray-300 font-medium font-display">{t.empty}</p>
                <p className="text-gray-500 mt-2">{t.emptySub}</p>
            </div>
        </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto mt-12 pb-12">
      <h2 className="text-4xl font-bold font-display text-center text-transparent bg-clip-text bg-gradient-to-r from-white to-pink-200 mb-10">
        {t.title}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {favorites.map((fav, index) => {
          const spotifyQuery = fav.type === 'album' 
              ? `album:"${fav.albumOrSong}" artist:"${fav.artist}"`
              : `track:"${fav.albumOrSong}" artist:"${fav.artist}"`;
          const spotifyUrl = `https://open.spotify.com/search/${encodeURIComponent(spotifyQuery)}`;
          
          const youtubeQuery = `${fav.artist} ${fav.albumOrSong} ${fav.type === 'album' ? 'full album' : 'official video'}`;
          const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(youtubeQuery)}`;

          const handleShare = async () => {
              const shareText = t.shareText(fav) + `\n\nSpotify: ${spotifyUrl}\nYouTube: ${youtubeUrl}`;
              const shareTitle = t.shareTitle(fav);

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
                      alert(t.shareCopy);
                  } catch (err) {
                      console.error('Error al copiar texto: ', err);
                  }
              }
          };

          return (
            <div key={`${fav.artist}-${fav.albumOrSong}-${index}`} className="group relative bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-sm flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] hover:border-pink-500/30 hover:shadow-pink-500/10 overflow-hidden">
               {/* Decorative Background Icon */}
               <div className="absolute -bottom-8 -right-8 text-white/5 transform rotate-12 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                    <MusicIcon width="150" height="150" />
                </div>

              <div className="relative z-10">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="inline-block px-2 py-1 text-xs font-semibold tracking-wider text-pink-300 bg-pink-500/10 rounded-md border border-pink-500/20 mb-2 font-display">
                        {fav.type === 'song' ? t.song : t.album}
                    </span>
                    <h3 className="text-2xl font-bold font-display text-white mt-1 leading-tight">{fav.albumOrSong}</h3>
                    <p className="text-lg text-gray-400 font-medium font-display">{fav.artist}</p>
                  </div>
                  <button onClick={() => onRemoveFavorite(fav)} className="p-2 bg-red-500/10 rounded-full text-red-500 hover:bg-red-500/20 transition-all">
                    <HeartIcon className="w-6 h-6" fill="currentColor" />
                  </button>
                </div>
                <p className="text-gray-300 mt-4 text-sm leading-relaxed border-l-2 border-pink-500/50 pl-4">
                  {lang === 'es' ? fav.justification_es : fav.justification_en} {/* Usar justificación según el idioma */}
                </p>
              </div>
              <div className="relative z-10 flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-white/10">
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
          )
        })}
      </div>
    </div>
  );
};

export default Favorites;
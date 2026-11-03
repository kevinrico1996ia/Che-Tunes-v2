import React, { useState, useEffect } from 'react';
import Questionnaire from './components/Questionnaire';
import ImageAnalyzer from './components/ImageAnalyzer';
import Favorites from './components/Favorites';
import LyricAnalyzer from './components/LyricAnalyzer';
import { Recommendation, Language } from './services/geminiService'; // Importa Language
import { MusicIcon } from './components/icons/MusicIcon';
import { CameraIcon } from './components/icons/CameraIcon';
import { HeartIcon } from './components/icons/HeartIcon';
import { DocumentTextIcon } from './components/icons/DocumentTextIcon';
import { SparklesIcon } from './components/icons/SparklesIcon';

type Tab = 'recommender' | 'analyzer' | 'favorites' | 'lyricAnalyzer';

// Objeto de traducciones global para App.tsx
const translations = {
  es: {
    subtitle: "Tu recomendador de música personal potenciado por IA.",
    tabRec: "Recomiéndame",
    tabImg: "Por Imagen",
    tabLyr: "Analizar Letra",
    tabFav: "Favoritos",
    inApp: "⚠️ Estás en el navegador de LinkedIn. Si algo falla, pulsa los ... y elige 'Abrir en el navegador'.",
    footer: "Powered by Gemini • Diseñado para amantes de la música"
  },
  en: {
    subtitle: "Your personal AI-powered music recommender.",
    tabRec: "Recommend Me",
    tabImg: "By Image",
    tabLyr: "Analyze Lyrics",
    tabFav: "Favorites",
    inApp: "⚠️ You're in the LinkedIn browser. If something goes wrong, tap the ... and choose 'Open in browser'.",
    footer: "Powered by Gemini • Designed for Music Lovers"
  }
};

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('recommender');
  const [showInAppWarning, setShowInAppWarning] = useState(false);
  const [lang, setLang] = useState<Language>(() => {
    try {
      const savedLang = window.localStorage.getItem('cheTunesLang');
      return (savedLang === 'es' || savedLang === 'en') ? savedLang : 'es';
    } catch {
      return 'es';
    }
  });

  const t = translations[lang]; // Asigna las traducciones según el idioma actual

  useEffect(() => {
    window.localStorage.setItem('cheTunesLang', lang);
  }, [lang]);
  
  // Detect LinkedIn/In-App Browsers
  useEffect(() => {
    const ua = navigator.userAgent || "";
    const isInApp = /LinkedInApp|Instagram|FBAN|FBAV/i.test(ua);
    if (isInApp) {
      setShowInAppWarning(true);
    }
  }, []);

  // Favorites State
  const [favorites, setFavorites] = useState<Recommendation[]>(() => {
    try {
      const savedFavorites = window.localStorage.getItem('cheTunesFavorites');
      return savedFavorites ? JSON.parse(savedFavorites) : [];
    } catch (error) {
      return [];
    }
  });

  const [likedSongs, setLikedSongs] = useState<string[]>(() => {
    try {
      const saved = window.localStorage.getItem('cheTunesLikes');
      return saved ? JSON.parse(saved) : [];
    } catch (error) { return []; }
  });

  const [dislikedSongs, setDislikedSongs] = useState<string[]>(() => {
    try {
      const saved = window.localStorage.getItem('cheTunesDislikes');
      return saved ? JSON.parse(saved) : [];
    } catch (error) { return []; }
  });

  useEffect(() => {
    window.localStorage.setItem('cheTunesFavorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    window.localStorage.setItem('cheTunesLikes', JSON.stringify(likedSongs));
  }, [likedSongs]);

  useEffect(() => {
    window.localStorage.setItem('cheTunesDislikes', JSON.stringify(dislikedSongs));
  }, [dislikedSongs]);

  const handleToggleFavorite = (recommendation: Recommendation) => {
    setFavorites(prevFavorites => {
      const isFavorited = prevFavorites.some(
        fav => fav.artist === recommendation.artist && fav.albumOrSong === recommendation.albumOrSong
      );
      if (isFavorited) {
        return prevFavorites.filter(
          fav => !(fav.artist === recommendation.artist && fav.albumOrSong === recommendation.albumOrSong)
        );
      } else {
        return [...prevFavorites, recommendation];
      }
    });
  };

  const getRecId = (rec: Recommendation) => `${rec.artist}-${rec.albumOrSong}`;

  const handleLike = (rec: Recommendation) => {
    const id = getRecId(rec);
    if (dislikedSongs.includes(id)) setDislikedSongs(prev => prev.filter(item => item !== id));
    setLikedSongs(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const handleDislike = (rec: Recommendation) => {
    const id = getRecId(rec);
    if (likedSongs.includes(id)) setLikedSongs(prev => prev.filter(item => item !== id));
    setDislikedSongs(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const TabButton: React.FC<{tabName: Tab; label: string; icon: React.ReactNode}> = ({ tabName, label, icon }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`flex items-center justify-center px-6 py-3 text-sm font-medium rounded-full transition-all duration-300 border font-display ${
        activeTab === tabName
          ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white border-transparent shadow-lg shadow-pink-500/25'
          : 'text-gray-400 border-transparent hover:bg-white/5 hover:text-white'
      }`}
    >
      {icon}
      <span className="ml-2 hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans selection:bg-pink-500 selection:text-white relative">
      {/* Language Selector */}
      <div className="absolute top-4 right-4 z-[101] flex space-x-2">
        <button onClick={() => setLang('es')} className={`rounded-full p-1 transition-all ${lang === 'es' ? 'ring-2 ring-pink-500' : 'opacity-70 hover:opacity-100'}`}>
          <img src="https://flagsapi.com/AR/flat/32.png" alt="Español" className="w-8 h-8 rounded-full shadow-md" />
        </button>
        <button onClick={() => setLang('en')} className={`rounded-full p-1 transition-all ${lang === 'en' ? 'ring-2 ring-pink-500' : 'opacity-70 hover:opacity-100'}`}>
          <img src="https://flagsapi.com/GB/flat/32.png" alt="English" className="w-8 h-8 rounded-full shadow-md" />
        </button>
      </div>

      {/* Compatibility Banner */}
      {showInAppWarning && (
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white text-xs md:text-sm py-2 px-4 flex items-center justify-between sticky top-0 z-[100] shadow-lg">
          <p className="flex-1 text-center font-medium">
            {t.inApp}
          </p>
          <button onClick={() => setShowInAppWarning(false)} className="ml-2 hover:scale-110 transition-transform">✕</button>
        </div>
      )}

      <div className="bg-cover bg-center bg-fixed" style={{backgroundImage: "url('https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=2070&auto=format&fit=crop')"}}>
        <div className="bg-black/80 min-h-screen backdrop-blur-sm">
          <main className="container mx-auto px-4 py-12">
            <header className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <h1 className="text-5xl md:text-7xl font-extrabold font-display tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-pink-200 to-purple-200 drop-shadow-lg">
                  CheTunes
                </h1>
                <SparklesIcon className="w-8 h-8 md:w-12 md:h-12 text-pink-400 animate-pulse" />
              </div>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto font-light">
                {t.subtitle}
              </p>
            </header>

            <nav className="flex flex-wrap justify-center gap-2 mb-12 bg-gray-900/40 backdrop-blur-xl border border-white/10 p-2 rounded-full max-w-3xl mx-auto shadow-2xl">
              <TabButton tabName="recommender" label={t.tabRec} icon={<MusicIcon className="w-5 h-5" />} />
              <TabButton tabName="analyzer" label={t.tabImg} icon={<CameraIcon className="w-5 h-5" />} />
              <TabButton tabName="lyricAnalyzer" label={t.tabLyr} icon={<DocumentTextIcon className="w-5 h-5" />} />
              <TabButton tabName="favorites" label={t.tabFav} icon={<HeartIcon className="w-5 h-5" />} />
            </nav>

            <div className="transition-all duration-500 ease-in-out">
              <div className={activeTab === 'recommender' ? 'animate-fadeIn' : 'hidden'}>
                <Questionnaire lang={lang} favorites={favorites} onToggleFavorite={handleToggleFavorite} likedSongs={likedSongs} dislikedSongs={dislikedSongs} onLike={handleLike} onDislike={handleDislike} />
              </div>
              <div className={activeTab === 'analyzer' ? 'animate-fadeIn' : 'hidden'}>
                <ImageAnalyzer lang={lang} favorites={favorites} onToggleFavorite={handleToggleFavorite} likedSongs={likedSongs} dislikedSongs={dislikedSongs} onLike={handleLike} onDislike={handleDislike} />
              </div>
               <div className={activeTab === 'lyricAnalyzer' ? 'animate-fadeIn' : 'hidden'}>
                <LyricAnalyzer lang={lang} />
              </div>
              <div className={activeTab === 'favorites' ? 'animate-fadeIn' : 'hidden'}>
                <Favorites lang={lang} favorites={favorites} onRemoveFavorite={handleToggleFavorite} />
              </div>
            </div>
          </main>
          <footer className="text-center py-8 text-gray-500 text-sm">
            <p>{t.footer}</p>
          </footer>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export default App;
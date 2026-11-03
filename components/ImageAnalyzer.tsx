import React, { useState, useRef, useEffect } from 'react';
import { getAlbumInfoFromImage, AlbumInfo, Recommendation, Language } from '../services/geminiService';
import { CameraIcon } from './icons/CameraIcon';
import { UploadIcon } from './icons/UploadIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { HeartIcon } from './icons/HeartIcon';
import { SpotifyIcon } from './icons/SpotifyIcon';
import { YouTubeIcon } from './icons/YouTubeIcon';
import { ShareIcon } from './icons/ShareIcon';
import { ThumbUpIcon } from './icons/ThumbUpIcon';
import { ThumbDownIcon } from './icons/ThumbDownIcon';

interface ImageAnalyzerProps {
  lang: Language; // Reintroducido
  favorites: Recommendation[];
  onToggleFavorite: (recommendation: Recommendation) => void;
  likedSongs: string[];
  dislikedSongs: string[];
  onLike: (recommendation: Recommendation) => void;
  onDislike: (recommendation: Recommendation) => void;
}

const ImageAnalyzer: React.FC<ImageAnalyzerProps> = ({ 
    lang, // Reintroducido
    favorites, 
    onToggleFavorite,
    likedSongs,
    dislikedSongs,
    onLike,
    onDislike
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AlbumInfo | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Objeto de traducciones para ImageAnalyzer.tsx
  const translations = {
    es: {
      title: "Escáner de Álbumes",
      sub: "¿Olvidaste el nombre? Sube la portada y te diremos qué es.",
      drop: "Arrastra o selecciona una imagen",
      btnUpload: "Subir Archivo",
      btnCam: "Usar Cámara",
      btnAnalyze: "Obtener Información",
      loading: "Analizando píxeles...",
      history: "Historia",
      members: "Integrantes",
      ident: "Álbum Identificado",
      errorCam: "No se pudo acceder a la cámara. Asegúrate de haber dado permiso.",
      errorBrowserCam: "Tu navegador no soporta el acceso a la cámara.",
      errorUpload: "Por favor, sube o captura una imagen primero.",
      errorAnalyze: "No se pudo analizar la carátula del álbum. Inténtalo de nuevo.",
      capture: "Capturar",
      cancel: "Cancelar",
      infoCopied: "¡Información del álbum copiada al portapapeles!",
      shareTitle: (album: string) => `Descubrimiento de CheTunes: ${album}`,
      shareText: (album: string, artist: string) => `¡CheTunes me ayudó a encontrar este álbum! Es '${album}' de '${artist}'.`
    },
    en: {
      title: "Album Scanner",
      sub: "Forgot the name? Upload the cover and we'll tell you what it is.",
      drop: "Drag or select an image",
      btnUpload: "Upload File",
      btnCam: "Use Camera",
      btnAnalyze: "Get Information",
      loading: "Analyzing pixels...",
      history: "History",
      members: "Members",
      ident: "Album Identified",
      errorCam: "Could not access camera. Please ensure permissions are granted.",
      errorBrowserCam: "Your browser does not support camera access.",
      errorUpload: "Please upload or capture an image first.",
      errorAnalyze: "Could not analyze the album cover. Please try again.",
      capture: "Capture",
      cancel: "Cancel",
      infoCopied: "Album information copied to clipboard!",
      shareTitle: (album: string) => `CheTunes Discovery: ${album}`,
      shareText: (album: string, artist: string) => `CheTunes helped me find this album! It's '${album}' by '${artist}'.`
    }
  };

  const t = translations[lang];

  useEffect(() => {
    const startCamera = async () => {
      if (isCameraOpen && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error("Error accessing camera: ", err);
          setError(t.errorCam);
          setIsCameraOpen(false);
        }
      }
    };

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [isCameraOpen, t.errorCam]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setError(null);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenCamera = () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        setIsCameraOpen(true);
        setImagePreview(null);
        setResult(null);
        setError(null);
    } else {
        setError(t.errorBrowserCam);
    }
  };
  
  const handleCloseCamera = () => {
    setIsCameraOpen(false);
  };

  const handleTakePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setImagePreview(dataUrl);
      }
      handleCloseCamera();
    }
  };

  const handleAnalyzeClick = async () => {
    if (!imagePreview) {
      setError(t.errorUpload);
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const albumInfo = await getAlbumInfoFromImage(imagePreview, lang); // Pasa lang
      setResult(albumInfo);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errorAnalyze);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to re-run the query if language changes and results are already displayed
  useEffect(() => {
    if (result !== null && imagePreview) { // Check if there's a previous result and an image to analyze
      handleAnalyzeClick();
    }
  }, [lang]); // Depend on lang

  const triggerFileSelect = () => fileInputRef.current?.click();

  const ResultCard: React.FC<{ albumInfo: AlbumInfo }> = ({ albumInfo }) => {
    const justificationEs = `Lanzado en ${albumInfo.year}. ${albumInfo.history}`;
    const justificationEn = `Released in ${albumInfo.year}. ${albumInfo.history}`;
    
    const recommendation: Recommendation = {
        artist: albumInfo.artist,
        albumOrSong: albumInfo.album,
        type: 'album',
        justification_es: justificationEs, // Usar justificación en español
        justification_en: justificationEn, // Usar justificación en inglés
    };
    const isFav = favorites.some(fav => fav.artist === recommendation.artist && fav.albumOrSong === recommendation.albumOrSong);
    
    const recId = `${recommendation.artist}-${recommendation.albumOrSong}`;
    const liked = likedSongs.includes(recId);
    const disliked = dislikedSongs.includes(recId);

    const spotifyQuery = `album:"${albumInfo.album}" artist:"${albumInfo.artist}"`;
    const spotifyUrl = `https://open.spotify.com/search/${encodeURIComponent(spotifyQuery)}`;
    const youtubeQuery = `${albumInfo.artist} ${albumInfo.album} full album`;
    const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(youtubeQuery)}`;

    const handleShare = async () => {
        const shareText = t.shareText(albumInfo.album, albumInfo.artist) + `\n\nSpotify: ${spotifyUrl}\nYouTube: ${youtubeUrl}`;
        const shareTitle = t.shareTitle(albumInfo.album);

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
                alert(t.infoCopied);
            } catch (err) {
                console.error('Error al copiar texto: ', err);
            }
        }
    };

    return (
      <div className="mt-8 group relative bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-sm transform transition-all duration-300 hover:scale-[1.02] hover:border-pink-500/30 max-w-md mx-auto overflow-hidden">
        {/* Watermark Icon */}
         <div className="absolute -bottom-10 -right-10 text-white/5 transform -rotate-12 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
            <CameraIcon width="200" height="200" />
        </div>

        <div className="relative z-10">
          <div className="flex justify-between items-start">
            <div>
              <span className="inline-block px-2 py-1 text-xs font-semibold tracking-wider text-pink-300 bg-pink-500/10 rounded-md border border-pink-500/20 mb-2 font-display">
                 {t.ident}
              </span>
              <h4 className="text-3xl font-bold font-display text-white mt-1 leading-tight">{albumInfo.album}</h4>
              <p className="text-gray-400 text-lg mt-1 font-display">{albumInfo.artist} <span className="text-pink-600">•</span> {albumInfo.year}</p>
            </div>
            <button onClick={() => onToggleFavorite(recommendation)} className={`p-2 rounded-full transition-all ${isFav ? 'text-red-500 bg-red-500/10' : 'text-gray-500 hover:text-red-400 hover:bg-white/5'}`}>
              <HeartIcon className="w-8 h-8" fill={isFav ? 'currentColor' : 'none'} />
            </button>
          </div>
           <div className="mt-6 pt-6 border-t border-white/10 space-y-5">
              <div>
                  <h5 className="text-sm uppercase font-bold text-pink-400 mb-2 tracking-wide font-display">{t.history}</h5>
                  <p className="text-gray-300 text-sm leading-relaxed">{albumInfo.history}</p>
              </div>
              <div>
                  <h5 className="text-sm uppercase font-bold text-pink-400 mb-2 tracking-wide font-display">{t.members}</h5>
                  <p className="text-gray-300 text-sm">{albumInfo.members}</p>
              </div>
          </div>
        </div>
        
         {/* Feedback Section */}
         <div className="relative z-10 flex items-center justify-between mt-8 pt-4 border-t border-white/10">
            <div className="flex space-x-2">
                <button 
                    onClick={() => onLike(recommendation)} 
                    className={`p-2 rounded-full transition-all ${liked ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'text-gray-500 hover:bg-gray-700 hover:text-green-400'}`}
                >
                    <ThumbUpIcon className="w-5 h-5" fill={liked ? 'currentColor' : 'none'} />
                </button>
                <button 
                    onClick={() => onDislike(recommendation)} 
                    className={`p-2 rounded-full transition-all ${disliked ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-gray-500 hover:bg-gray-700 hover:text-red-400'}`}
                >
                    <ThumbDownIcon className="w-5 h-5" fill={disliked ? 'currentColor' : 'none'} />
                </button>
            </div>

            <div className="flex items-center justify-end space-x-3">
                <button onClick={handleShare} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all">
                    <ShareIcon className="w-5 h-5" />
                </button>
                <a href={spotifyUrl} target="_blank" rel="noopener noreferrer" className="p-1 text-gray-400 hover:text-[#1DB954] hover:scale-110 transition-all">
                    <SpotifyIcon className="w-6 h-6" />
                </a>
                <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" className="p-1 text-gray-400 hover:text-[#FF0000] hover:scale-110 transition-all">
                    <YouTubeIcon className="w-6 h-6" />
                </a>
            </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-xl mx-auto pb-12">
        <div className="bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-3xl font-bold font-display text-center text-white mb-2 flex items-center justify-center">
            <CameraIcon className="w-8 h-8 mr-3 text-pink-500" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                {t.title}
            </span>
          </h2>
          <p className="text-center text-gray-400 mb-8 font-light">{t.sub}</p>
          
          <input
            type="file"
            accept="image/png, image/jpeg, image/webp"
            ref={fileInputRef}
            onChange={handleImageChange}
            className="hidden"
          />
           <canvas ref={canvasRef} className="hidden" />
          
          <div className="group w-full h-64 border-2 border-dashed border-gray-600 hover:border-pink-500/50 rounded-2xl flex items-center justify-center bg-black/40 overflow-hidden transition-colors duration-300 relative">
            {isCameraOpen ? (
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
            ) : imagePreview ? (
              <img src={imagePreview} alt="Album cover preview" className="w-full h-full object-contain p-2" />
            ) : (
                <div className="text-center text-gray-500 group-hover:text-pink-400 transition-colors">
                    <UploadIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="font-semibold font-display">{t.drop}</p>
                </div>
            )}
          </div>
          
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isCameraOpen ? (
                 <>
                    <button onClick={handleTakePhoto} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-green-900/20 flex items-center justify-center transition-all font-display">
                        <CameraIcon className="w-5 h-5 mr-2" />
                        {t.capture}
                    </button>
                    <button onClick={handleCloseCamera} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-red-900/20 flex items-center justify-center transition-all font-display">
                        {t.cancel}
                    </button>
                </>
            ) : (
                <>
                    <button onClick={triggerFileSelect} className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-xl border border-white/5 transition-all font-display">
                        <UploadIcon className="w-5 h-5 mr-2 inline"/>
                        {t.btnUpload}
                    </button>
                    <button onClick={handleOpenCamera} className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-xl border border-white/5 transition-all font-display">
                        <CameraIcon className="w-5 h-5 mr-2 inline"/>
                        {t.btnCam}
                    </button>
                </>
            )}
          </div>
          
          <button
            onClick={handleAnalyzeClick}
            disabled={isLoading || !imagePreview}
            className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold font-display py-4 px-6 rounded-xl shadow-lg shadow-pink-500/25 mt-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-300 transform hover:-translate-y-1"
          >
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
                {t.btnAnalyze}
              </>
            )}
          </button>
        </div>
        {error && <p className="text-red-300 text-center bg-red-900/50 border border-red-500/30 p-4 rounded-xl mt-8 max-w-md mx-auto backdrop-blur-sm">{error}</p>}
        {result && <ResultCard albumInfo={result} />}
    </div>
  );
};

export default ImageAnalyzer;
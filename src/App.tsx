import React, { useState, useEffect } from "react";
import { Search, Film, Loader2, X, Plus, Check, Eye, Sparkles, Key, LogOut, RefreshCw } from "lucide-react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import type { Movie, MovieDetails } from "./api";
import { getDiscoveryMovies, searchMoviesSemantic, getMovieDetails, generateMoodsAI } from "./api";
import { useLibraryStore } from "./store";
import "./App.css";

const DEFAULT_MOODS = [
  "🍿 Popcorn Fun",
  "🧠 Mind-Bending",
  "😭 Tear-jerkers",
  "💥 80s Action",
  "🌌 Epic Space",
  "🕵️‍♂️ Noir Mystery",
];

const ApiKeyOverlay = () => {
  const [key, setKey] = useState("");
  const { setGeminiApiKey } = useLibraryStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key.trim().startsWith("AIza")) {
      setGeminiApiKey(key.trim());
    } else {
      alert("Please enter a valid Google Gemini API Key (starts with AIza)");
    }
  };

  return (
    <motion.div 
      className="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ zIndex: 1000 }}
    >
      <motion.div 
        className="modal-content"
        style={{ maxWidth: '400px', padding: '2.5rem', textAlign: 'center' }}
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
      >
        <div style={{ marginBottom: '1.5rem', color: 'var(--accent-color)' }}>
          <Key size={48} />
        </div>
        <h2 style={{ marginBottom: '1rem' }}>Enter Gemini API Key</h2>
        <p style={{ opacity: 0.7, fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          To use CineMind's AI features, please provide your Google Gemini API Key. 
          It's stored locally on your device.
        </p>
        <form onSubmit={handleSubmit}>
          <input 
            type="password"
            placeholder="AIza..."
            className="search-input"
            style={{ marginBottom: '1rem', borderRadius: '12px' }}
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            Get Started
          </button>
        </form>
        <p style={{ marginTop: '1.5rem', fontSize: '0.75rem', opacity: 0.5 }}>
          Don't have one? Get it from the <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-color)' }}>Google AI Studio</a>.
        </p>
      </motion.div>
    </motion.div>
  );
};

const MovieModal = ({ movieId, onClose }: { movieId: number; onClose: () => void }) => {
  const [details, setDetails] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToWatchlist, markAsSeen, isInWatchlist, hasSeen, removeFromWatchlist, removeFromSeen } = useLibraryStore();

  useEffect(() => {
    getMovieDetails(movieId).then((data) => {
      setDetails(data);
      setLoading(false);
    });
  }, [movieId]);

  const toggleWatchlist = () => {
    if (!details) return;
    if (isInWatchlist(details.id)) removeFromWatchlist(details.id);
    else addToWatchlist(details);
  };

  const toggleSeen = () => {
    if (!details) return;
    if (hasSeen(details.id)) removeFromSeen(details.id);
    else markAsSeen(details);
  };

  if (loading || !details) {
    return (
      <div className="modal-backdrop">
        <div className="modal-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <Loader2 className="animate-spin" size={48} color="var(--accent-color)" />
        </div>
      </div>
    );
  }

  const trailer = details.videos?.results.find(v => v.type === "Trailer" && v.site === "YouTube");
  const bgImage = details.backdrop_path ? `https://image.tmdb.org/t/p/original${details.backdrop_path}` : '';

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <motion.div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
      >
        <button className="modal-close" onClick={onClose}><X /></button>
        
        <div className="modal-hero" style={{ backgroundImage: `url(${bgImage})` }}>
          <div className="modal-hero-overlay" />
        </div>

        <div className="modal-body">
          <div className="modal-header-info">
            <img 
              src={details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : "https://via.placeholder.com/500x750?text=No+Poster"} 
              alt={details.title} 
              className="modal-poster"
            />
            <div className="modal-title-group">
              <h2 className="modal-title">{details.title}</h2>
              <div className="modal-meta">
                <span>{details.release_date?.split("-")[0]}</span>
                <span>•</span>
                <span>{details.runtime} min</span>
                <span>•</span>
                <span>⭐ {details.vote_average.toFixed(1)}</span>
              </div>
              <div className="modal-genres">
                {details.genres.map(g => (
                  <span key={g.id} className="genre-tag">{g.name}</span>
                ))}
              </div>
              <div className="modal-actions">
                <button 
                  className={`btn ${isInWatchlist(details.id) ? 'active-watch' : 'btn-secondary'}`}
                  onClick={toggleWatchlist}
                >
                  {isInWatchlist(details.id) ? <Check size={18} /> : <Plus size={18} />} Watchlist
                </button>
                <button 
                  className={`btn ${hasSeen(details.id) ? 'active-seen' : 'btn-secondary'}`}
                  onClick={toggleSeen}
                >
                  {hasSeen(details.id) ? <Check size={18} /> : <Eye size={18} />} Seen
                </button>
              </div>
            </div>
          </div>

          <div className="modal-section">
            <h3>Overview</h3>
            <p className="overview-text">{details.overview}</p>
          </div>

          {trailer && (
            <div className="modal-section">
              <h3>Trailer</h3>
              <div className="trailer-container">
                <iframe 
                  src={`https://www.youtube.com/embed/${trailer.key}?autoplay=0`} 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {details.credits?.cast?.length > 0 && (
            <div className="modal-section">
              <h3>Cast</h3>
              <div className="cast-grid">
                {details.credits.cast.slice(0, 6).map((actor) => (
                  <div key={actor.id} className="cast-card">
                    <img 
                      src={actor.profile_path ? `https://image.tmdb.org/t/p/w185${actor.profile_path}` : "https://via.placeholder.com/185x278?text=No+Photo"} 
                      alt={actor.name} 
                      className="cast-photo"
                    />
                    <div className="cast-name">{actor.name}</div>
                    <div className="cast-char">{actor.character}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const MovieCard = ({ movie, index, onClick }: { movie: Movie; index: number; onClick: (id: number) => void }) => {
  const { addToWatchlist, markAsSeen, isInWatchlist, hasSeen } = useLibraryStore();
  const controls = useAnimation();
  const [swipeState, setSwipeState] = useState<'none' | 'left' | 'right'>('none');

  const handleDragEnd = async (_e: any, info: any) => {
    const threshold = 100;
    if (info.offset.x > threshold) {
      addToWatchlist(movie);
      controls.start({ x: 0, opacity: 1 });
    } else if (info.offset.x < -threshold) {
      markAsSeen(movie);
      controls.start({ x: 0, opacity: 1 });
    } else {
      controls.start({ x: 0, opacity: 1 });
    }
    setSwipeState('none');
  };

  const handleDrag = (_e: any, info: any) => {
    if (info.offset.x > 50) setSwipeState('right');
    else if (info.offset.x < -50) setSwipeState('left');
    else setSwipeState('none');
  };

  const isWatch = isInWatchlist(movie.id);
  const isSeen = hasSeen(movie.id);

  return (
    <motion.div
      className="movie-card-wrapper"
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
    >
      <motion.div
        className="movie-card"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={controls}
        whileHover={{ scale: 1.05, zIndex: 10 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onClick(movie.id)}
      >
        <div className="movie-badges">
          {isWatch && <span className="badge watchlist"><Check size={12} /> Watchlist</span>}
          {isSeen && <span className="badge seen"><Check size={12} /> Seen</span>}
        </div>

        <img
          src={
            movie.poster_path
              ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
              : "https://via.placeholder.com/500x750?text=No+Poster"
          }
          alt={movie.title}
          className="movie-poster"
          loading="lazy"
        />
        
        <div className="movie-overlay">
          <h3 className="movie-title">{movie.title}</h3>
          <p className="movie-info">
            {movie.release_date?.split("-")[0]} • ⭐ {movie.vote_average.toFixed(1)}
          </p>
        </div>

        <AnimatePresence>
          {swipeState === 'right' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="swipe-overlay swipe-right">
              <Plus size={48} />
              <span>Watchlist</span>
            </motion.div>
          )}
          {swipeState === 'left' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="swipe-overlay swipe-left">
              <Eye size={48} />
              <span>Seen</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

function App() {
  const [activeTab, setActiveTab] = useState<'discover' | 'watchlist' | 'seen'>('discover');
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [moods, setMoods] = useState<string[]>(DEFAULT_MOODS);
  const [isGeneratingMoods, setIsGeneratingMoods] = useState(false);

  const { watchlist, seenList, geminiApiKey, setGeminiApiKey } = useLibraryStore();

  useEffect(() => {
    if (geminiApiKey) {
      generateDynamicMoods();
      if (activeTab === 'discover' && query === "") {
        loadDiscovery();
      }
    }
  }, [geminiApiKey]);

  useEffect(() => {
    if (geminiApiKey && (seenList.length > 0 || watchlist.length > 0)) {
      generateDynamicMoods();
    }
  }, [seenList.length, watchlist.length]);

  const generateDynamicMoods = async () => {
    if (!geminiApiKey) return;
    setIsGeneratingMoods(true);
    const historyTitles = [...seenList, ...watchlist].map(m => m.title);
    const generatedMoods = await generateMoodsAI(geminiApiKey, historyTitles);
    if (generatedMoods.length > 0) setMoods(generatedMoods);
    setIsGeneratingMoods(false);
  };

  const loadDiscovery = async () => {
    if (!geminiApiKey) return;
    setIsLoading(true);
    const historyTitles = [...seenList, ...watchlist].map(m => m.title);
    const discovery = await getDiscoveryMovies(geminiApiKey, historyTitles);
    setMovies(discovery);
    setIsLoading(false);
  };

  const handleSearch = async (e?: React.FormEvent, presetQuery?: string) => {
    if (e) e.preventDefault();
    const q = presetQuery || query;
    if (!q.trim() || !geminiApiKey) return;

    if (presetQuery) setQuery(presetQuery);

    setActiveTab('discover');
    setIsSearching(true);
    setIsLoading(true);
    
    const seenTitles = seenList.map(m => m.title);
    const results = await searchMoviesSemantic(q, geminiApiKey, seenTitles);
    
    setMovies(results);
    setIsLoading(false);
    setIsSearching(false);
  };

  const displayedMovies = activeTab === 'discover' 
    ? movies 
    : activeTab === 'watchlist' 
      ? watchlist 
      : seenList;

  return (
    <div className="app-container">
      <AnimatePresence>
        {!geminiApiKey && <ApiKeyOverlay key="api-overlay" />}
      </AnimatePresence>

      <header>
        <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
          {geminiApiKey && (
            <button 
              className="btn btn-secondary" 
              style={{ padding: '0.5rem', borderRadius: '50%' }}
              onClick={() => { if(confirm("Remove API Key?")) setGeminiApiKey(null); }}
              title="Logout / Change API Key"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1>CineMind</h1>
          <p style={{ opacity: 0.6, marginTop: '0.5rem' }}>The AI-Powered Film Explorer</p>
        </motion.div>

        <div className="nav-tabs">
          <button className={`nav-tab ${activeTab === 'discover' ? 'active' : ''}`} onClick={() => setActiveTab('discover')}>
            <Search size={18} /> Discover
          </button>
          <button className={`nav-tab ${activeTab === 'watchlist' ? 'active' : ''}`} onClick={() => setActiveTab('watchlist')}>
            <Plus size={18} /> Watchlist ({watchlist.length})
          </button>
          <button className={`nav-tab ${activeTab === 'seen' ? 'active' : ''}`} onClick={() => setActiveTab('seen')}>
            <Eye size={18} /> Seen ({seenList.length})
          </button>
        </div>

        {activeTab === 'discover' && (
          <>
            <form className="search-wrapper" onSubmit={handleSearch}>
              <input
                type="text"
                className="search-input"
                placeholder={geminiApiKey ? "Search films like 'Inception'..." : "Please enter your API key above"}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={!geminiApiKey}
              />
              <div className="search-icon" onClick={() => handleSearch()}>
                {isSearching ? <Loader2 className="animate-spin" /> : <Search />}
              </div>
            </form>
            
            <motion.div 
              className="mood-filters"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <AnimatePresence mode="popLayout">
                {moods.map((mood, i) => (
                  <motion.button 
                    key={mood} 
                    className="mood-chip"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => handleSearch(undefined, mood)}
                    disabled={!geminiApiKey}
                  >
                    {mood}
                  </motion.button>
                ))}
              </AnimatePresence>
              <button 
                className="mood-chip" 
                style={{ borderStyle: 'dashed', opacity: 0.5 }}
                onClick={generateDynamicMoods}
                disabled={isGeneratingMoods || !geminiApiKey}
              >
                {isGeneratingMoods ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
              </button>
              
              {activeTab === 'discover' && query === "" && (
                <button 
                  className="mood-chip" 
                  style={{ borderStyle: 'dashed', opacity: 0.5 }}
                  onClick={loadDiscovery}
                  disabled={isLoading}
                  title="Randomize Homepage"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />}
                </button>
              )}
            </motion.div>
          </>
        )}
      </header>

      <main>
        {isLoading && activeTab === 'discover' ? (
          <div className="loading-spinner">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            >
              <Film size={48} color="var(--accent-color)" />
            </motion.div>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <motion.div className="movie-grid">
              {displayedMovies.map((movie, index) => (
                <MovieCard 
                  key={`${activeTab}-${movie.id}-${index}`} 
                  movie={movie} 
                  index={index} 
                  onClick={setSelectedMovieId}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {!isLoading && displayedMovies.length === 0 && (
          <div style={{ textAlign: "center", marginTop: "4rem", opacity: 0.5 }}>
            {activeTab === 'discover' && <p>No films found. Try a different smart query!</p>}
            {activeTab === 'watchlist' && <p>Your watchlist is empty. Swipe right on a movie to add it!</p>}
            {activeTab === 'seen' && <p>You haven't marked any films as seen yet. Swipe left on a movie to mark it!</p>}
          </div>
        )}
      </main>

      <AnimatePresence>
        {selectedMovieId && (
          <MovieModal 
            movieId={selectedMovieId} 
            onClose={() => setSelectedMovieId(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;

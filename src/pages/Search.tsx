import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Film } from '../types/database';
import { Search as SearchIcon, X, Loader2 } from 'lucide-react';
import FilmCard from '../components/FilmCard';
import { useAuth } from '../contexts/AuthContext';
import { filterFilms } from '../lib/utils';

export default function Search() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [allFilms, setAllFilms] = useState<Film[]>([]);
  const [results, setResults] = useState<Film[]>([]);
  const [watchlistIds, setWatchlistIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFilms();
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [user]);

  useEffect(() => {
    setResults(filterFilms(allFilms, query));
  }, [query, allFilms]);

  async function loadFilms() {
    setLoading(true);
    const [filmsRes, wlRes] = await Promise.all([
      supabase.from('films').select('*').order('title'),
      user ? supabase.from('watchlist').select('film_id').eq('user_id', user.id) : Promise.resolve({ data: [] }),
    ]);
    const films = filmsRes.data ?? [];
    setAllFilms(films);
    setResults(films);
    if (user) {
      setWatchlistIds(new Set((wlRes as { data: { film_id: string }[] | null }).data?.map(w => w.film_id) ?? []));
    }
    setLoading(false);
  }

  async function toggleWatchlist(film: Film) {
    if (!user) return;
    if (watchlistIds.has(film.id)) {
      await supabase.from('watchlist').delete().eq('user_id', user.id).eq('film_id', film.id);
      setWatchlistIds(prev => { const s = new Set(prev); s.delete(film.id); return s; });
    } else {
      await supabase.from('watchlist').insert({ user_id: user.id, film_id: film.id });
      setWatchlistIds(prev => new Set(prev).add(film.id));
    }
  }

  const popularTags = [
    'Action', 'Horror', 'Thriller', 'Dark Comedy', 'Romantic Comedy',
    'Social Drama', 'Family Drama', 'Psychological Thriller',
    'Sci-Fi', 'Cyberpunk', 'Dystopian', 'Period Drama',
    'Documentary', 'Animation', 'Noir', 'Satire',
    'Award Winner', 'International',
  ];

  return (
    <div className="pt-24 pb-20 px-4 sm:px-8 max-w-[1800px] mx-auto">
      {/* Search bar */}
      <div className="max-w-2xl mx-auto mb-12">
        <div className="relative flex items-center">
          <SearchIcon size={20} className="absolute left-5 text-neutral-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search films, directors, genres..."
            className="w-full pl-14 pr-12 py-4 bg-[#1a1a1a] border border-white/10 rounded-2xl text-white text-lg placeholder-neutral-500 focus:outline-none focus:border-[#e8a020]/60 focus:ring-2 focus:ring-[#e8a020]/20 transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-neutral-400 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Tag pills */}
        {!query && (
          <div className="flex flex-wrap gap-2 mt-4 justify-center">
            {popularTags.map(tag => (
              <button
                key={tag}
                onClick={() => setQuery(tag)}
                className="px-4 py-1.5 bg-white/8 hover:bg-[#e8a020]/20 border border-white/10 hover:border-[#e8a020]/40 rounded-full text-sm text-neutral-400 hover:text-[#e8a020] transition-all duration-200"
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-[#e8a020]" size={36} />
        </div>
      ) : query && results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-neutral-500 gap-4">
          <SearchIcon size={48} className="opacity-30" />
          <p className="text-xl font-medium">No results for &ldquo;{query}&rdquo;</p>
          <p className="text-sm">Try searching by title, director, or genre</p>
        </div>
      ) : (
        <>
          {query && (
            <p className="text-neutral-400 text-sm mb-6">
              {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
            </p>
          )}
          {!query && (
            <h2 className="text-xl font-bold text-white mb-6">All Films</h2>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {results.map(film => (
              <FilmCard
                key={film.id}
                film={film}
                size="lg"
                inWatchlist={watchlistIds.has(film.id)}
                onToggleWatchlist={toggleWatchlist}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

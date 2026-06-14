import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Film } from '../types/database';
import FilmCard from '../components/FilmCard';
import { Bookmark, Loader2, Film as FilmIcon } from 'lucide-react';

export default function MyList() {
  const { user } = useAuth();
  const [films, setFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadList();
    else setLoading(false);
  }, [user]);

  async function loadList() {
    setLoading(true);
    const { data } = await supabase
      .from('watchlist')
      .select('film_id, films(*)')
      .eq('user_id', user!.id)
      .order('added_at', { ascending: false });

    setFilms(
      (data ?? [])
        .map((row: unknown) => (row as { films: Film }).films)
        .filter(Boolean)
    );
    setLoading(false);
  }

  async function removeFromList(film: Film) {
    if (!user) return;
    await supabase.from('watchlist').delete().eq('user_id', user.id).eq('film_id', film.id);
    setFilms(prev => prev.filter(f => f.id !== film.id));
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-8 text-center">
        <Bookmark size={56} className="text-neutral-700" />
        <h2 className="text-2xl font-bold text-white">Sign in to view your list</h2>
        <p className="text-neutral-400 max-w-sm">Create an account or sign in to save films to your personal watchlist.</p>
        <Link
          to="/auth"
          className="px-8 py-3.5 bg-[#e8a020] hover:bg-[#d4911a] text-black font-bold rounded-full transition-colors"
        >
          Sign In
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-[#e8a020]" size={36} />
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20 px-4 sm:px-8 max-w-[1800px] mx-auto">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <Bookmark size={24} className="text-[#e8a020]" />
          <h1 className="text-3xl sm:text-4xl font-black text-white">My List</h1>
        </div>
        <p className="text-neutral-400">{films.length} film{films.length !== 1 ? 's' : ''} saved</p>
      </div>

      {films.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
          <FilmIcon size={56} className="text-neutral-700" />
          <h3 className="text-xl font-bold text-white">Your list is empty</h3>
          <p className="text-neutral-400 max-w-sm">Browse short films and tap the + button to save them here.</p>
          <Link
            to="/browse"
            className="px-8 py-3.5 bg-[#e8a020] hover:bg-[#d4911a] text-black font-bold rounded-full transition-colors"
          >
            Browse Films
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
          {films.map(film => (
            <FilmCard
              key={film.id}
              film={film}
              size="lg"
              inWatchlist={true}
              onToggleWatchlist={removeFromList}
            />
          ))}
        </div>
      )}
    </div>
  );
}

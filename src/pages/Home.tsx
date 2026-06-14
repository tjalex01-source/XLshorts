import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import type { Film, Category, Series } from '../types/database';
import HeroSection from '../components/HeroSection';
import FilmRow from '../components/FilmRow';
import { Loader2, Layers, Play } from 'lucide-react';

function HomeSeries({ series }: { series: Series[] }) {
  return (
    <div className="px-6 sm:px-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Layers size={18} className="text-[#e8a020]" /> Series
        </h2>
        <Link to="/browse?filter=series" className="text-[#e8a020] hover:text-[#d4911a] text-sm font-semibold">
          See all
        </Link>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {series.map(s => (
          <Link
            key={s.id}
            to={`/series/${s.id}`}
            className="group shrink-0 w-44 sm:w-56 cursor-pointer"
          >
            <div className="relative overflow-hidden rounded-xl aspect-[2/3] bg-neutral-800 transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-2xl group-hover:shadow-black/60 group-hover:ring-2 group-hover:ring-[#e8a020]/60">
              {s.thumbnail_url
                ? <img src={s.thumbnail_url} alt={s.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                : <div className="w-full h-full flex items-center justify-center"><Layers size={28} className="text-neutral-600" /></div>
              }
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 bg-[#e8a020]/90 rounded text-[10px] font-bold text-black">
                <Layers size={9} /> SERIES
              </div>
              <div className="absolute inset-0 flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 transition-all duration-300">
                <div className="flex items-center justify-center w-9 h-9 bg-white rounded-full mb-2">
                  <Play size={14} fill="black" className="text-black ml-0.5" />
                </div>
                <p className="text-white font-semibold text-xs line-clamp-1">{s.title}</p>
              </div>
            </div>
            <div className="mt-2 px-1">
              <p className="text-neutral-200 text-xs sm:text-sm font-medium line-clamp-1 group-hover:text-white transition-colors">{s.title}</p>
              <p className="text-neutral-500 text-[11px] mt-0.5">Series</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const [featuredFilms, setFeaturedFilms] = useState<Film[]>([]);
  const [categoryFilms, setCategoryFilms] = useState<{ category: Category; films: Film[] }[]>([]);
  const [highestRated, setHighestRated] = useState<Film[]>([]);
  const [recommended, setRecommended] = useState<Film[]>([]);
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [continueWatching, setContinueWatching] = useState<Film[]>([]);
  const [watchAgain, setWatchAgain] = useState<Film[]>([]);
  const [watchlistFilms, setWatchlistFilms] = useState<Film[]>([]);
  const [watchlistIds, setWatchlistIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [user, activeProfile]);

  async function loadData() {
    setLoading(true);
    try {
      const profileId = activeProfile?.id ?? null;
      const preferredGenres: string[] = activeProfile?.preferred_genres ?? [];

      const [filmsRes, categoriesRes, seriesRes] = await Promise.all([
        supabase.from('films').select('*').eq('status', 'published').order('created_at', { ascending: false }),
        supabase.from('categories').select('*, film_categories(film_id)').order('sort_order'),
        supabase.from('series').select('*').eq('status', 'published').order('created_at', { ascending: false }).limit(12),
      ]);

      let films: Film[] = filmsRes.data ?? [];

      // Filter based on profile content settings
      if (activeProfile) {
        const p = activeProfile as any;
        const maxTier = p.max_age_tier ?? 'adult';
        const tierOrder = { family: 0, teen: 1, adult: 2 };

        films = films.filter(f => {
          const ff = f as any;
          // Check age tier
          const filmTierVal = tierOrder[ff.age_tier as keyof typeof tierOrder] ?? 1;
          const maxTierVal = tierOrder[maxTier as keyof typeof tierOrder] ?? 2;
          if (filmTierVal > maxTierVal) return false;
          // Check specific flags
          if (p.block_language_mild && ff.flag_language_mild) return false;
          if (p.block_language_strong && ff.flag_language_strong) return false;
          if (p.block_violence && ff.flag_violence) return false;
          if (p.block_gore && ff.flag_gore) return false;
          if (p.block_sexual_content && ff.flag_sexual_content) return false;
          if (p.block_nudity && ff.flag_nudity) return false;
          if (p.block_drug_use && ff.flag_drug_use) return false;
          if (p.block_alcohol_tobacco && ff.flag_alcohol_tobacco) return false;
          if (p.block_frightening && ff.flag_frightening) return false;
          if (p.block_thematic_complexity && ff.flag_thematic_complexity) return false;
          // Filter out admin-removed films
          if (ff.admin_review_status === 'removed') return false;
          return true;
        });
      } else {
        // No profile — filter out removed films only
        films = films.filter(f => (f as any).admin_review_status !== 'removed');
      }

      setSeriesList((seriesRes.data ?? []) as Series[]);

      const filmMap = new Map(films.map(f => [f.id, f]));

      setFeaturedFilms(
        films.filter(f => f.featured).sort((a, b) => a.featured_order - b.featured_order)
      );

      // Highest rated: at least 1 rating, sorted by avg_rating desc
      const rated = films
        .filter(f => (f.rating_count ?? 0) >= 1)
        .sort((a, b) => (b.avg_rating ?? 0) - (a.avg_rating ?? 0))
        .slice(0, 20);
      setHighestRated(rated);

      // Recommended: films matching preferred genres via film_genres join
      if (preferredGenres.length > 0) {
        const { data: genreRows } = await supabase
          .from('genres')
          .select('id')
          .in('slug', preferredGenres);
        const genreIds = (genreRows ?? []).map(g => g.id);
        if (genreIds.length > 0) {
          const { data: filmGenreRows } = await supabase
            .from('film_genres')
            .select('film_id')
            .in('genre_id', genreIds);
          const matchIds = new Set((filmGenreRows ?? []).map(r => r.film_id));
          const rec = films.filter(f => matchIds.has(f.id)).slice(0, 20);
          setRecommended(rec);
        }
      } else {
        setRecommended([]);
      }

      const cats = (categoriesRes.data ?? []) as (Category & { film_categories: { film_id: string }[] })[];
      const rows = cats
        .filter(c => c.slug !== 'featured')
        .map(c => ({
          category: c as Category,
          films: c.film_categories.map((fc: { film_id: string }) => filmMap.get(fc.film_id)!).filter(Boolean),
        }))
        .filter(r => r.films.length > 0);
      setCategoryFilms(rows);

      if (user) {
        const wlQuery = supabase.from('watchlist').select('film_id').eq('user_id', user.id);
        const histQuery = supabase.from('watch_history').select('film_id, progress_seconds, watched_at').eq('user_id', user.id).eq('completed', false).order('watched_at', { ascending: false }).limit(20);
        const watchedQuery = supabase.from('watch_history').select('film_id, watched_at').eq('user_id', user.id).eq('completed', true).order('watched_at', { ascending: false }).limit(20);

        const [wlRes, histRes, watchedRes] = await Promise.all([
          profileId ? wlQuery.eq('profile_id', profileId) : wlQuery.is('profile_id', null),
          profileId ? histQuery.eq('profile_id', profileId) : histQuery.is('profile_id', null),
          profileId ? watchedQuery.eq('profile_id', profileId) : watchedQuery.is('profile_id', null),
        ]);

        const ids = new Set((wlRes.data ?? []).map(w => w.film_id));
        setWatchlistIds(ids);
        setWatchlistFilms((wlRes.data ?? []).map(w => filmMap.get(w.film_id)!).filter(Boolean));
        setContinueWatching((histRes.data ?? []).map(h => filmMap.get(h.film_id)!).filter(Boolean));
        setWatchAgain((watchedRes.data ?? []).map(h => filmMap.get(h.film_id)!).filter(Boolean));
      }
    } finally {
      setLoading(false);
    }
  }

  async function toggleWatchlist(film: Film) {
    if (!user) return;
    const profileId = activeProfile?.id ?? null;
    if (watchlistIds.has(film.id)) {
      const q = supabase.from('watchlist').delete().eq('user_id', user.id).eq('film_id', film.id);
      await (profileId ? q.eq('profile_id', profileId) : q.is('profile_id', null));
      setWatchlistIds(prev => { const s = new Set(prev); s.delete(film.id); return s; });
      setWatchlistFilms(prev => prev.filter(f => f.id !== film.id));
    } else {
      await supabase.from('watchlist').insert({ user_id: user.id, film_id: film.id, profile_id: profileId });
      setWatchlistIds(prev => new Set(prev).add(film.id));
      setWatchlistFilms(prev => [film, ...prev]);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
        <Loader2 className="animate-spin text-[#e8a020]" size={36} />
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0a]">
      <HeroSection films={featuredFilms} watchlistIds={watchlistIds} onToggleWatchlist={toggleWatchlist} />

      <div className="mt-8 pb-8 space-y-10">
        {user && continueWatching.length > 0 && (
          <FilmRow title="Continue Watching" films={continueWatching} watchlistIds={watchlistIds} onToggleWatchlist={toggleWatchlist} />
        )}
        {user && watchlistFilms.length > 0 && (
          <FilmRow title="My List" films={watchlistFilms} watchlistIds={watchlistIds} onToggleWatchlist={toggleWatchlist} />
        )}
        {user && watchAgain.length > 0 && (
          <FilmRow title="Watch Again" films={watchAgain} watchlistIds={watchlistIds} onToggleWatchlist={toggleWatchlist} />
        )}
        {recommended.length > 0 && (
          <FilmRow title="Recommended for You" films={recommended} watchlistIds={watchlistIds} onToggleWatchlist={toggleWatchlist} />
        )}
        {highestRated.length > 0 && (
          <FilmRow title="Highest Rated" films={highestRated} watchlistIds={watchlistIds} onToggleWatchlist={toggleWatchlist} showRating />
        )}
        {seriesList.length > 0 && (
          <HomeSeries series={seriesList} />
        )}
        {categoryFilms.map(({ category, films }) => (
          <FilmRow key={category.id} title={category.name} films={films} watchlistIds={watchlistIds} onToggleWatchlist={toggleWatchlist} />
        ))}
      </div>
    </div>
  );
}


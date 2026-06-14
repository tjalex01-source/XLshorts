import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Film, Category, Series } from '../types/database';
import FilmCard from '../components/FilmCard';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import { Loader2, Film as FilmIcon, Layers, Play } from 'lucide-react';

function SeriesCard({ series }: { series: Series & { episode_count?: number } }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="shrink-0 group cursor-pointer xl-focusable"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link to={`/series/${series.id}`} className="block">
        <div className={`relative overflow-hidden rounded-xl aspect-[2/3] bg-neutral-800 transition-all duration-300 ${hovered ? 'scale-[1.03] shadow-2xl shadow-black/60 ring-2 ring-[#e8a020]/60' : ''}`}>
          {series.thumbnail_url
            ? <img src={series.thumbnail_url} alt={series.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
            : <div className="w-full h-full flex items-center justify-center bg-[#1a1a1a]"><Layers size={32} className="text-neutral-600" /></div>
          }
          <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent transition-opacity duration-300 ${hovered ? 'opacity-100' : 'opacity-0'}`} />
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 bg-[#e8a020]/90 rounded text-[10px] font-bold text-black">
            <Layers size={9} /> SERIES
          </div>
          <div className={`absolute inset-0 flex flex-col justify-end p-3 transition-all duration-300 ${hovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-9 h-9 bg-white rounded-full">
                <Play size={14} fill="black" className="text-black ml-0.5" />
              </div>
            </div>
            <p className="text-white font-semibold text-xs mt-2 line-clamp-1">{series.title}</p>
            {series.episode_count !== undefined && (
              <p className="text-[10px] text-neutral-400 mt-0.5">{series.episode_count} episodes</p>
            )}
          </div>
        </div>
      </Link>
      <div className="mt-2 px-1">
        <p className="text-neutral-200 text-xs sm:text-sm font-medium line-clamp-1 group-hover:text-white transition-colors">
          {series.title}
        </p>
        <p className="text-neutral-500 text-[11px] mt-0.5">Series · {series.episode_count ?? 0} episodes</p>
      </div>
    </div>
  );
}

type ViewMode = 'all' | 'series' | string;

export default function Browse() {
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const [films, setFilms] = useState<Film[]>([]);
  const [seriesList, setSeriesList] = useState<(Series & { episode_count?: number })[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeSlug, setActiveSlug] = useState<ViewMode>('all');
  const [watchlistIds, setWatchlistIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, [user, activeProfile]);

  async function loadAll() {
    setLoading(true);
    const [filmsRes, catsRes, seriesRes] = await Promise.all([
      supabase.from('films').select('*').eq('status', 'published').order('title'),
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('series').select('*').eq('status', 'published').order('title'),
    ]);

    let films: Film[] = (filmsRes.data ?? []) as Film[];
    // Filter to child-safe only when profile is a child profile
    if (activeProfile?.is_child) {
      films = films.filter(f => f.ok_for_children);
    }

    setFilms(films);
    setCategories(catsRes.data ?? []);

    // Count episodes per series
    const seriesData = (seriesRes.data ?? []) as Series[];
    const episodeCounts = films.reduce<Record<string, number>>((acc, f) => {
      if (f.content_type === 'episode' && f.series_id) {
        acc[f.series_id] = (acc[f.series_id] ?? 0) + 1;
      }
      return acc;
    }, {});
    setSeriesList(seriesData.map(s => ({ ...s, episode_count: episodeCounts[s.id] ?? 0 })));

    if (user) {
      const profileId = activeProfile?.id ?? null;
      const wlQuery = supabase.from('watchlist').select('film_id').eq('user_id', user.id);
      const { data: wlData } = await (profileId ? wlQuery.eq('profile_id', profileId) : wlQuery.is('profile_id', null));
      setWatchlistIds(new Set((wlData ?? []).map(w => w.film_id)));
    }

    setLoading(false);
  }

  async function toggleWatchlist(film: Film) {
    if (!user) return;
    const profileId = activeProfile?.id ?? null;
    if (watchlistIds.has(film.id)) {
      const q = supabase.from('watchlist').delete().eq('user_id', user.id).eq('film_id', film.id);
      await (profileId ? q.eq('profile_id', profileId) : q.is('profile_id', null));
      setWatchlistIds(prev => { const s = new Set(prev); s.delete(film.id); return s; });
    } else {
      await supabase.from('watchlist').insert({ user_id: user.id, film_id: film.id, profile_id: profileId });
      setWatchlistIds(prev => new Set(prev).add(film.id));
    }
  }

  const filterPills = [
    { label: 'All', slug: 'all' },
    { label: 'Series', slug: 'series' },
    ...categories.filter(c => c.slug !== 'featured').map(c => ({ label: c.name, slug: c.slug })),
  ];

  const displayedFilms = activeSlug === 'all'
    ? films.filter(f => f.content_type !== 'episode')
    : activeSlug === 'series'
    ? []
    : films.filter(f => f.content_type !== 'episode' && f.tags.some(t =>
        t.toLowerCase() === (categories.find(c => c.slug === activeSlug)?.name ?? '').toLowerCase() ||
        t.toLowerCase().replace(/\s+/g, '-') === activeSlug
      ));

  const showingSeries = activeSlug === 'series' || activeSlug === 'all';
  const showingFilms = activeSlug !== 'series';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-[#e8a020]" size={36} />
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20 px-4 sm:px-8 max-w-[1800px] mx-auto">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <FilmIcon size={24} className="text-[#e8a020]" />
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Browse</h1>
        </div>
        <p className="text-neutral-400">
          Discover short films and series from around the world
          {activeProfile?.is_child && (
            <span className="ml-2 text-[#e8a020] text-sm">· Filtered for {activeProfile.name} (up to {activeProfile.max_rating})</span>
          )}
        </p>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap mb-10">
        {filterPills.map(opt => (
          <button
            key={opt.slug}
            onClick={() => setActiveSlug(opt.slug)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 xl-focusable flex items-center gap-1.5 ${
              activeSlug === opt.slug
                ? 'bg-[#e8a020] text-black'
                : 'bg-white/8 text-neutral-300 hover:bg-white/15 hover:text-white border border-white/10'
            }`}
          >
            {opt.slug === 'series' && <Layers size={13} />}
            {opt.label}
          </button>
        ))}
      </div>

      {/* Series section */}
      {showingSeries && seriesList.length > 0 && (
        <div className={activeSlug === 'all' ? 'mb-12' : ''}>
          {activeSlug === 'all' && (
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Layers size={18} className="text-[#e8a020]" /> Series
            </h2>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {seriesList.map(s => (
              <SeriesCard key={s.id} series={s} />
            ))}
          </div>
        </div>
      )}

      {/* Films section */}
      {showingFilms && (
        <>
          {activeSlug === 'all' && displayedFilms.length > 0 && (
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <FilmIcon size={18} className="text-[#e8a020]" /> Films
            </h2>
          )}
          {displayedFilms.length === 0 && !showingSeries ? (
            <div className="flex flex-col items-center justify-center py-24 text-neutral-500">
              <FilmIcon size={48} className="mb-4 opacity-30" />
              <p className="text-lg">No films in this category yet.</p>
            </div>
          ) : displayedFilms.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
              {displayedFilms.map(film => (
                <FilmCard
                  key={film.id}
                  film={film}
                  size="lg"
                  inWatchlist={watchlistIds.has(film.id)}
                  onToggleWatchlist={toggleWatchlist}
                />
              ))}
            </div>
          ) : null}
        </>
      )}

      {/* Empty state for series tab with no series */}
      {activeSlug === 'series' && seriesList.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-neutral-500">
          <Layers size={48} className="mb-4 opacity-30" />
          <p className="text-lg">No series published yet.</p>
        </div>
      )}
    </div>
  );
}

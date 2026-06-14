import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Play, Plus, Check, Info, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import type { Film } from '../types/database';
import { formatDuration } from '../lib/utils';

interface HeroSectionProps {
  films: Film[];
  watchlistIds: Set<string>;
  onToggleWatchlist: (film: Film) => void;
}

export default function HeroSection({ films, watchlistIds, onToggleWatchlist }: HeroSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  const goTo = useCallback((index: number) => {
    if (transitioning) return;
    setTransitioning(true);
    setTimeout(() => {
      setActiveIndex(index);
      setTransitioning(false);
    }, 300);
  }, [transitioning]);

  const prev = () => goTo((activeIndex - 1 + films.length) % films.length);
  const next = () => goTo((activeIndex + 1) % films.length);

  useEffect(() => {
    if (films.length <= 1) return;
    const t = setInterval(next, 7000);
    return () => clearInterval(t);
  }, [activeIndex, films.length]);

  if (!films.length) return null;

  const film = films[activeIndex];

  return (
    <div className="relative w-full h-[80vh] min-h-[500px] max-h-[900px] overflow-hidden">
      {/* Backdrop */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${transitioning ? 'opacity-0' : 'opacity-100'}`}>
        <img
          key={film.id}
          src={film.backdrop_url}
          alt={film.title}
          className="w-full h-full object-cover object-center"
        />
        {/* Gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-black/40" />
      </div>

      {/* Content */}
      <div className={`absolute inset-0 flex flex-col justify-end px-8 sm:px-16 pb-16 transition-all duration-500 ${transitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
        <div className="max-w-2xl">
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {film.tags.slice(0, 3).map(tag => (
              <span key={tag} className="px-3 py-1 bg-[#e8a020]/20 border border-[#e8a020]/40 rounded-full text-[11px] font-semibold text-[#e8a020] uppercase tracking-wider">
                {tag}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-6xl font-black text-white leading-tight tracking-tight mb-3">
            {film.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex items-center gap-1">
              <Star size={14} fill="#e8a020" className="text-[#e8a020]" />
              <span className="text-[#e8a020] font-bold text-sm">{film.imdb_score}</span>
            </div>
            <span className="text-neutral-400 text-sm">{film.release_year}</span>
            <span className="px-2 py-0.5 border border-neutral-600 text-neutral-400 text-xs rounded">{film.rating}</span>
            <span className="text-neutral-400 text-sm">{formatDuration(film.duration_seconds)}</span>
            <span className="text-neutral-500 text-sm">Dir. {film.director}</span>
          </div>

          {/* Description */}
          <p className="text-neutral-300 text-sm sm:text-base leading-relaxed line-clamp-3 mb-8 max-w-lg">
            {film.description}
          </p>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to={`/watch/${film.id}`}
              className="flex items-center gap-3 px-8 py-3.5 bg-white hover:bg-[#e8a020] text-black font-bold text-base rounded-full transition-all duration-200 shadow-lg hover:shadow-[#e8a020]/30 hover:shadow-xl xl-focusable"
            >
              <Play size={18} fill="black" />
              Watch Now
            </Link>
            <button
              onClick={() => onToggleWatchlist(film)}
              className="flex items-center gap-2 px-6 py-3.5 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-semibold text-sm rounded-full transition-all duration-200 border border-white/20 xl-focusable"
            >
              {watchlistIds.has(film.id) ? <><Check size={16} className="text-[#e8a020]" /> In My List</> : <><Plus size={16} /> My List</>}
            </button>
            <Link
              to={`/film/${film.id}`}
              className="flex items-center gap-2 px-6 py-3.5 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-semibold text-sm rounded-full transition-all duration-200 border border-white/20 xl-focusable"
            >
              <Info size={16} /> More Info
            </Link>
          </div>
        </div>
      </div>

      {/* Carousel controls */}
      {films.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white transition-all duration-200 border border-white/10 xl-focusable"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white transition-all duration-200 border border-white/10 xl-focusable"
          >
            <ChevronRight size={20} />
          </button>

          {/* Dots */}
          <div className="absolute bottom-6 right-8 flex gap-2">
            {films.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`transition-all duration-300 rounded-full ${
                  i === activeIndex ? 'w-8 h-2 bg-[#e8a020]' : 'w-2 h-2 bg-white/30 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Plus, Check, Star } from 'lucide-react';
import type { Film } from '../types/database';
import { formatDuration } from '../lib/utils';

interface FilmCardProps {
  film: Film;
  inWatchlist?: boolean;
  onToggleWatchlist?: (film: Film) => void;
  size?: 'sm' | 'md' | 'lg';
  showRating?: boolean;
}

export default function FilmCard({ film, inWatchlist, onToggleWatchlist, size = 'md', showRating = false }: FilmCardProps) {
  const [hovered, setHovered] = useState(false);

  const sizeClasses = {
    sm: 'w-36 sm:w-44',
    md: 'w-44 sm:w-56',
    lg: 'w-56 sm:w-72',
  };

  return (
    <div
      className={`${sizeClasses[size]} shrink-0 group cursor-pointer xl-focusable`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link to={`/film/${film.id}`} className="block">
        {/* Thumbnail */}
        <div className={`relative overflow-hidden rounded-xl aspect-[2/3] bg-neutral-800 transition-all duration-300 ${hovered ? 'scale-[1.03] shadow-2xl shadow-black/60 ring-2 ring-[#e8a020]/60' : ''}`}>
          <img
            src={film.thumbnail_url}
            alt={film.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
          {/* Gradient overlay */}
          <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent transition-opacity duration-300 ${hovered ? 'opacity-100' : 'opacity-0'}`} />

          {/* Audience rating badge for Highest Rated row */}
          {showRating && (film.avg_rating ?? 0) > 0 && (
            <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 bg-black/70 backdrop-blur-sm rounded-full border border-[#e8a020]/30">
              <Star size={9} fill="#e8a020" className="text-[#e8a020]" />
              <span className="text-[10px] font-bold text-[#e8a020]">{(film.avg_rating ?? 0).toFixed(1)}</span>
            </div>
          )}

          {/* Hover content */}
          <div className={`absolute inset-0 flex flex-col justify-end p-3 transition-all duration-300 ${hovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
            <div className="flex items-center gap-2">
              <Link
                to={`/watch/${film.id}`}
                onClick={e => e.stopPropagation()}
                className="flex items-center justify-center w-9 h-9 bg-white rounded-full hover:bg-[#e8a020] transition-colors shrink-0"
              >
                <Play size={14} fill="black" className="text-black ml-0.5" />
              </Link>
              {onToggleWatchlist && (
                <button
                  onClick={e => { e.preventDefault(); onToggleWatchlist(film); }}
                  className="flex items-center justify-center w-9 h-9 rounded-full border-2 border-white/70 hover:border-[#e8a020] transition-colors"
                >
                  {inWatchlist
                    ? <Check size={14} className="text-[#e8a020]" />
                    : <Plus size={14} className="text-white" />
                  }
                </button>
              )}
            </div>
            <p className="text-white font-semibold text-xs mt-2 line-clamp-1">{film.title}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <Star size={10} fill="#e8a020" className="text-[#e8a020]" />
              <span className="text-[10px] text-neutral-300">{film.imdb_score}</span>
              <span className="text-[10px] text-neutral-400">&middot;</span>
              <span className="text-[10px] text-neutral-400">{formatDuration(film.duration_seconds)}</span>
            </div>
          </div>

          {/* Play icon always visible on focus (TV nav) */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-focus:opacity-100">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Play size={20} fill="white" className="text-white ml-1" />
            </div>
          </div>
        </div>
      </Link>

      {/* Title below card */}
      <div className="mt-2 px-1">
        <p className="text-neutral-200 text-xs sm:text-sm font-medium line-clamp-1 group-hover:text-white transition-colors">
          {film.title}
        </p>
        <p className="text-neutral-500 text-[11px] mt-0.5">{film.release_year} &middot; {formatDuration(film.duration_seconds)}</p>
      </div>
    </div>
  );
}

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Film } from '../types/database';
import FilmCard from './FilmCard';

interface FilmRowProps {
  title: string;
  films: Film[];
  watchlistIds?: Set<string>;
  onToggleWatchlist?: (film: Film) => void;
  cardSize?: 'sm' | 'md' | 'lg';
  showRating?: boolean;
}

export default function FilmRow({ title, films, watchlistIds, onToggleWatchlist, cardSize = 'md', showRating = false }: FilmRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.7;
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  if (!films.length) return null;

  return (
    <section className="relative group/row">
      <div className="flex items-center justify-between px-4 sm:px-8 mb-4">
        <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">{title}</h2>
        <div className="flex gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
          <button
            onClick={() => scroll('left')}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide px-4 sm:px-8 pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {films.map(film => (
          <FilmCard
            key={film.id}
            film={film}
            size={cardSize}
            inWatchlist={watchlistIds?.has(film.id)}
            onToggleWatchlist={onToggleWatchlist}
            showRating={showRating}
          />
        ))}
      </div>

      {/* Fade edges */}
      <div className="absolute left-0 top-10 bottom-0 w-8 bg-gradient-to-r from-[#0a0a0a] to-transparent pointer-events-none" />
      <div className="absolute right-0 top-10 bottom-0 w-8 bg-gradient-to-l from-[#0a0a0a] to-transparent pointer-events-none" />
    </section>
  );
}

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Film, Series } from '../types/database';
import {
  Play, ChevronLeft, Clock, Star, Loader2, Film as FilmIcon,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { formatDuration } from '../lib/utils';

interface EpisodesBySeasonMap {
  [season: number]: Film[];
}

function groupBySeason(episodes: Film[]): EpisodesBySeasonMap {
  return episodes.reduce<EpisodesBySeasonMap>((acc, ep) => {
    const s = ep.season_number ?? 1;
    if (!acc[s]) acc[s] = [];
    acc[s].push(ep);
    return acc;
  }, {});
}

function EpisodeRow({ episode, seriesTitle }: { episode: Film; seriesTitle: string }) {
  return (
    <Link
      to={`/watch/${episode.id}`}
      className="group flex gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors"
    >
      {/* Thumbnail */}
      <div className="relative shrink-0 w-36 sm:w-44 aspect-video rounded-lg overflow-hidden bg-[#1a1a1a]">
        {episode.thumbnail_url
          ? <img src={episode.thumbnail_url} alt={episode.episode_title ?? episode.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          : <div className="w-full h-full flex items-center justify-center"><FilmIcon size={24} className="text-neutral-600" /></div>
        }
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Play size={18} fill="white" className="text-white ml-0.5" />
          </div>
        </div>
        <div className="absolute bottom-1.5 right-1.5 bg-black/70 rounded px-1.5 py-0.5 text-xs text-white font-medium">
          {formatDuration(episode.duration_seconds)}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 py-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-[#e8a020] bg-[#e8a020]/10 px-2 py-0.5 rounded">
            EP {episode.episode_number ?? '?'}
          </span>
        </div>
        <p className="text-white font-semibold text-sm sm:text-base leading-tight mb-1 truncate">
          {episode.episode_title || episode.title}
        </p>
        {episode.description && (
          <p className="text-neutral-500 text-xs sm:text-sm line-clamp-2 leading-relaxed">
            {episode.description}
          </p>
        )}
        <div className="flex items-center gap-3 mt-2">
          <span className="text-xs text-neutral-600 flex items-center gap-1">
            <Clock size={11} /> {formatDuration(episode.duration_seconds)}
          </span>
          {(episode.avg_rating ?? 0) > 0 && (
            <span className="text-xs text-neutral-600 flex items-center gap-1">
              <Star size={11} /> {episode.avg_rating!.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function SeasonAccordion({ season, episodes, seriesTitle, defaultOpen }: {
  season: number;
  episodes: Film[];
  seriesTitle: string;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mb-2">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#141414] hover:bg-[#1c1c1c] rounded-xl transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-white font-bold text-base">Season {season}</span>
          <span className="text-neutral-500 text-sm">{episodes.length} episode{episodes.length !== 1 ? 's' : ''}</span>
        </div>
        {open ? <ChevronUp size={18} className="text-neutral-400" /> : <ChevronDown size={18} className="text-neutral-400" />}
      </button>
      {open && (
        <div className="mt-1 space-y-1">
          {episodes
            .sort((a, b) => (a.episode_number ?? 0) - (b.episode_number ?? 0))
            .map(ep => (
              <EpisodeRow key={ep.id} episode={ep} seriesTitle={seriesTitle} />
            ))}
        </div>
      )}
    </div>
  );
}

export default function SeriesDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [series, setSeries] = useState<Series | null>(null);
  const [episodes, setEpisodes] = useState<Film[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    loadSeries(id);
  }, [id]);

  async function loadSeries(seriesId: string) {
    setLoading(true);
    const [seriesRes, episodesRes] = await Promise.all([
      supabase.from('series').select('*').eq('id', seriesId).maybeSingle(),
      supabase
        .from('films')
        .select('*')
        .eq('series_id', seriesId)
        .eq('status', 'published')
        .order('season_number', { ascending: true })
        .order('episode_number', { ascending: true }),
    ]);
    setSeries(seriesRes.data as Series | null);
    setEpisodes((episodesRes.data ?? []) as Film[]);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
        <Loader2 className="animate-spin text-[#e8a020]" size={36} />
      </div>
    );
  }

  if (!series) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-[#0a0a0a]">
        <p className="text-neutral-400 text-lg">Series not found.</p>
        <Link to="/" className="text-[#e8a020] hover:underline">Go Home</Link>
      </div>
    );
  }

  const seasonMap = groupBySeason(episodes);
  const seasons = Object.keys(seasonMap).map(Number).sort((a, b) => a - b);
  const firstEpisode = episodes[0];
  const totalEpisodes = episodes.length;
  const totalDuration = episodes.reduce((s, e) => s + (e.duration_seconds ?? 0), 0);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Backdrop */}
      <div className="relative w-full h-[50vh] min-h-[360px] overflow-hidden">
        {series.backdrop_url
          ? <img src={series.backdrop_url} alt={series.title} className="w-full h-full object-cover object-top" />
          : <div className="w-full h-full bg-[#141414]" />
        }
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-black/30" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-24 left-6 sm:left-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white transition-all"
        >
          <ChevronLeft size={20} />
        </button>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 sm:px-10 -mt-28 relative z-10">
        <div className="flex flex-col sm:flex-row gap-8 mb-10">
          {/* Poster */}
          {series.thumbnail_url && (
            <div className="shrink-0 w-36 sm:w-48 mx-auto sm:mx-0">
              <img
                src={series.thumbnail_url}
                alt={series.title}
                className="w-full aspect-[2/3] object-cover rounded-2xl shadow-2xl shadow-black ring-1 ring-white/10"
              />
            </div>
          )}

          {/* Info */}
          <div className="flex-1 pt-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-[#e8a020] bg-[#e8a020]/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                Series
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-3">
              {series.title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-4 text-sm text-neutral-400">
              <span>{seasons.length} season{seasons.length !== 1 ? 's' : ''}</span>
              <span className="text-neutral-700">·</span>
              <span>{totalEpisodes} episode{totalEpisodes !== 1 ? 's' : ''}</span>
              {totalDuration > 0 && (
                <>
                  <span className="text-neutral-700">·</span>
                  <span>{formatDuration(totalDuration)} total</span>
                </>
              )}
              {series.language && series.language !== 'English' && (
                <>
                  <span className="text-neutral-700">·</span>
                  <span>{series.language}</span>
                </>
              )}
            </div>
            {series.description && (
              <p className="text-neutral-300 text-base leading-relaxed max-w-2xl mb-6">
                {series.description}
              </p>
            )}

            {firstEpisode && (
              <div className="flex flex-wrap gap-3">
                <Link
                  to={`/watch/${firstEpisode.id}`}
                  className="flex items-center gap-3 px-7 py-3 bg-white hover:bg-[#e8a020] text-black font-bold rounded-full transition-all duration-200 shadow-lg text-sm"
                >
                  <Play size={16} fill="black" /> Play from Start
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Episodes by season */}
        {seasons.length > 0 ? (
          <div className="pb-16">
            <h2 className="text-xl font-bold text-white mb-4">Episodes</h2>
            {seasons.map((season, i) => (
              <SeasonAccordion
                key={season}
                season={season}
                episodes={seasonMap[season]}
                seriesTitle={series.title}
                defaultOpen={i === 0}
              />
            ))}
          </div>
        ) : (
          <div className="pb-16 text-center py-16">
            <p className="text-neutral-500">No episodes published yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

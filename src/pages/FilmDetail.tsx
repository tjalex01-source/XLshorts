import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Film, Series } from '../types/database';
import {
  Play, Plus, Check, Star, Clock, Calendar, User as UserIcon,
  Loader2, ChevronLeft, Share2, Facebook, Twitter, MessageCircle,
  Users, Globe, Award, Film as FilmIcon, X, ChevronRight, Layers
} from 'lucide-react';
import { formatDuration } from '../lib/utils';
import FilmRow from '../components/FilmRow';

// ── Social share helpers ───────────────────────────────────────────────────

function buildShareUrl(film: Film, rating?: number): { url: string; text: string } {
  const pageUrl = encodeURIComponent(`${window.location.origin}/film/${film.id}`);
  const text = rating
    ? `I rated "${film.title}" ${rating}/5 stars on XLShorts! ${window.location.origin}/film/${film.id}`
    : `Watch "${film.title}" on XLShorts — free short films, no subscription! ${window.location.origin}/film/${film.id}`;
  return { url: pageUrl, text: encodeURIComponent(text) };
}

function shareToFacebook(film: Film, rating?: number) {
  const { url } = buildShareUrl(film, rating);
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=600,height=400');
}

function shareToTwitter(film: Film, rating?: number) {
  const { text } = buildShareUrl(film, rating);
  window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank', 'width=600,height=400');
}

function shareToWhatsApp(film: Film, rating?: number) {
  const { text } = buildShareUrl(film, rating);
  window.open(`https://wa.me/?text=${text}`, '_blank');
}

async function shareNative(film: Film, rating?: number) {
  const text = rating
    ? `I rated "${film.title}" ${rating}/5 stars on XLShorts!`
    : `Watch "${film.title}" on XLShorts — free short films, no subscription!`;
  if (navigator.share) {
    await navigator.share({ title: film.title, text, url: `${window.location.origin}/film/${film.id}` });
  }
}

// ── Star rating widget ────────────────────────────────────────────────────

interface StarRatingProps {
  filmId: string;
  initialScore: number | null;
  avgRating: number;
  ratingCount: number;
  onRated: (score: number) => void;
}

function StarRating({ filmId, initialScore, avgRating, ratingCount, onRated }: StarRatingProps) {
  const { user } = useAuth();
  const [hover, setHover] = useState(0);
  const [selected, setSelected] = useState(initialScore ?? 0);
  const [saving, setSaving] = useState(false);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => { setSelected(initialScore ?? 0); }, [initialScore]);

  async function handleRate(score: number) {
    if (!user) return;
    setSaving(true);
    await supabase.from('film_ratings').upsert(
      { film_id: filmId, user_id: user.id, score, updated_at: new Date().toISOString() },
      { onConflict: 'film_id,user_id' }
    );
    setSaving(false);
    setSelected(score);
    onRated(score);
    setShowShare(true);
  }

  const display = hover || selected;

  return (
    <div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map(i => (
            <button
              key={i}
              disabled={!user || saving}
              onClick={() => handleRate(i)}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(0)}
              className={`transition-all duration-100 ${!user ? 'cursor-default opacity-50' : 'cursor-pointer hover:scale-110'}`}
            >
              <Star
                size={26}
                className={`transition-colors duration-100 ${i <= display ? 'text-[#e8a020]' : 'text-neutral-700'}`}
                fill={i <= display ? '#e8a020' : 'none'}
              />
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm">
          {selected > 0 && (
            <span className="text-[#e8a020] font-semibold">{selected}/5</span>
          )}
          {!user && <span className="text-neutral-500 text-xs">Sign in to rate</span>}
        </div>
      </div>

      {ratingCount > 0 && (
        <p className="text-xs text-neutral-500 mt-1.5">
          Audience score: <span className="text-neutral-300 font-medium">{avgRating.toFixed(1)}/5</span>
          <span className="ml-1">({ratingCount.toLocaleString()} rating{ratingCount !== 1 ? 's' : ''})</span>
        </p>
      )}

      {/* Post-rating share prompt */}
      {showShare && selected > 0 && (
        <div className="mt-3 p-3 bg-[#e8a020]/8 border border-[#e8a020]/20 rounded-xl flex items-center justify-between gap-3">
          <p className="text-xs text-neutral-300">Share your {selected}-star rating?</p>
          <button onClick={() => setShowShare(false)} className="text-neutral-600 hover:text-neutral-400 shrink-0"><X size={14} /></button>
        </div>
      )}
    </div>
  );
}

// ── Share button strip ────────────────────────────────────────────────────

function ShareStrip({ film, rating }: { film: Film; rating?: number }) {
  const hasNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-neutral-500 mr-1 flex items-center gap-1.5">
        <Share2 size={13} /> Share
      </span>
      <button
        onClick={() => shareToFacebook(film, rating)}
        title="Share on Facebook"
        className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1877F2]/15 hover:bg-[#1877F2]/30 text-[#1877F2] transition-all"
      >
        <Facebook size={15} />
      </button>
      <button
        onClick={() => shareToTwitter(film, rating)}
        title="Share on X / Twitter"
        className="w-8 h-8 flex items-center justify-center rounded-full bg-white/8 hover:bg-white/15 text-white transition-all"
      >
        <Twitter size={15} />
      </button>
      <button
        onClick={() => shareToWhatsApp(film, rating)}
        title="Share on WhatsApp"
        className="w-8 h-8 flex items-center justify-center rounded-full bg-[#25D366]/15 hover:bg-[#25D366]/30 text-[#25D366] transition-all"
      >
        <MessageCircle size={15} />
      </button>
      {hasNativeShare && (
        <button
          onClick={() => shareNative(film, rating)}
          title="More sharing options"
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/8 hover:bg-white/15 text-neutral-300 transition-all"
        >
          <Share2 size={14} />
        </button>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────

export default function FilmDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [film, setFilm] = useState<Film | null>(null);
  const [series, setSeries] = useState<Series | null>(null);
  const [moreEpisodes, setMoreEpisodes] = useState<Film[]>([]);
  const [relatedFilms, setRelatedFilms] = useState<Film[]>([]);
  const [directorFilms, setDirectorFilms] = useState<Film[]>([]);
  const [credits, setCredits] = useState<any[]>([]);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [avgRating, setAvgRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    loadFilm(id);
  }, [id, user]);

  async function loadFilm(filmId: string) {
    setLoading(true);
    const [filmRes, wlRes, ratingRes] = await Promise.all([
      supabase.from('films').select('*').eq('id', filmId).maybeSingle(),
      user
        ? supabase.from('watchlist').select('id').eq('user_id', user.id).eq('film_id', filmId).maybeSingle()
        : Promise.resolve({ data: null }),
      user
        ? supabase.from('film_ratings').select('score').eq('user_id', user.id).eq('film_id', filmId).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const f = filmRes.data as Film | null;
    setFilm(f);
    setInWatchlist(!!wlRes.data);
    setUserRating((ratingRes.data as { score: number } | null)?.score ?? null);
    setAvgRating(f?.avg_rating ?? 0);
    setRatingCount(f?.rating_count ?? 0);

    if (f) {
      const [relRes, dirRes] = await Promise.all([
        supabase.from('films').select('*').neq('id', filmId).eq('status', 'published').limit(8),
        f.director
          ? supabase.from('films').select('*').eq('director', f.director).neq('id', filmId).eq('status', 'published').limit(8)
          : Promise.resolve({ data: [] }),
      ]);
      setRelatedFilms(relRes.data ?? []);
      setDirectorFilms((dirRes.data ?? []) as Film[]);

      // Load film credits
      const { data: creditData } = await supabase
        .from('film_credits')
        .select('id, name, role, character_name, profile_id, xlshorts_profiles(slug)')
        .eq('film_id', filmId)
        .order('billing_order');
      setCredits(creditData ?? []);

      // If episode, load series + more episodes
      if (f.content_type === 'episode' && f.series_id) {
        const [seriesRes, episodesRes] = await Promise.all([
          supabase.from('series').select('*').eq('id', f.series_id).maybeSingle(),
          supabase
            .from('films')
            .select('*')
            .eq('series_id', f.series_id)
            .eq('status', 'published')
            .neq('id', filmId)
            .order('season_number', { ascending: true })
            .order('episode_number', { ascending: true })
            .limit(12),
        ]);
        setSeries(seriesRes.data as Series | null);
        setMoreEpisodes((episodesRes.data ?? []) as Film[]);
      }
    }

    setLoading(false);
  }

  async function toggleWatchlist() {
    if (!user || !film) return;
    if (inWatchlist) {
      await supabase.from('watchlist').delete().eq('user_id', user.id).eq('film_id', film.id);
      setInWatchlist(false);
    } else {
      await supabase.from('watchlist').insert({ user_id: user.id, film_id: film.id });
      setInWatchlist(true);
    }
  }

  function handleRated(score: number) {
    setUserRating(score);
    // Optimistically update counts until next load
    setAvgRating(prev => {
      const total = prev * ratingCount + score;
      return (total / (ratingCount + (userRating ? 0 : 1)));
    });
    if (!userRating) setRatingCount(c => c + 1);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-[#e8a020]" size={36} />
      </div>
    );
  }

  if (!film) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-neutral-400 text-lg">Film not found.</p>
        <Link to="/" className="text-[#e8a020] hover:underline">Go Home</Link>
      </div>
    );
  }

  const contentFlags = [
    film.content_has_language && 'Language',
    film.content_has_nudity && 'Nudity',
    film.content_has_violence && 'Violence',
    film.content_has_drug_use && 'Drug Use',
    film.content_has_adult_themes && 'Adult Themes',
    film.content_has_flashing_lights && 'Flashing Lights',
  ].filter(Boolean) as string[];

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Backdrop */}
      <div className="relative w-full h-[55vh] min-h-[400px] overflow-hidden">
        {film.backdrop_url
          ? <img src={film.backdrop_url} alt={film.title} className="w-full h-full object-cover object-top" />
          : <div className="w-full h-full bg-[#141414]" />
        }
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-black/30" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-24 left-6 sm:left-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white transition-all"
        >
          <ChevronLeft size={20} />
        </button>
      </div>

      <div className="max-w-[1800px] mx-auto px-6 sm:px-10 -mt-32 relative z-10">
        <div className="flex flex-col sm:flex-row gap-8">
          {/* Poster */}
          {film.thumbnail_url && (
            <div className="shrink-0 w-40 sm:w-52 mx-auto sm:mx-0">
              <img
                src={film.thumbnail_url}
                alt={film.title}
                className="w-full aspect-[2/3] object-cover rounded-2xl shadow-2xl shadow-black ring-1 ring-white/10"
              />
            </div>
          )}

          {/* Info */}
          <div className="flex-1 pt-2">
            {/* Series breadcrumb */}
            {film.content_type === 'episode' && series && (
              <Link
                to={`/series/${series.id}`}
                className="inline-flex items-center gap-1.5 text-[#e8a020] hover:text-[#d4911a] text-sm font-semibold mb-3 group"
              >
                <Layers size={14} />
                {series.title}
                <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            )}

            {film.content_type === 'episode' && (film.episode_number || film.season_number) && (
              <div className="flex items-center gap-2 mb-2">
                {film.season_number && (
                  <span className="text-xs text-neutral-400 font-medium">Season {film.season_number}</span>
                )}
                {film.season_number && film.episode_number && <span className="text-neutral-700">·</span>}
                {film.episode_number && (
                  <span className="text-xs font-bold text-[#e8a020] bg-[#e8a020]/10 px-2 py-0.5 rounded">
                    Episode {film.episode_number}
                  </span>
                )}
              </div>
            )}

            {film.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {film.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-[#e8a020]/15 border border-[#e8a020]/30 rounded-full text-xs font-semibold text-[#e8a020] uppercase tracking-wider">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-1">
              {film.episode_title || film.title}
            </h1>
            {film.content_type === 'episode' && film.episode_title && film.title !== film.episode_title && (
              <p className="text-neutral-500 text-sm mb-3">{film.title}</p>
            )}

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-4">
              {film.imdb_score > 0 && (
                <div className="flex items-center gap-1.5">
                  <Star size={15} fill="#e8a020" className="text-[#e8a020]" />
                  <span className="text-[#e8a020] font-bold">{film.imdb_score}</span>
                  <span className="text-neutral-500 text-sm">IMDb</span>
                </div>
              )}
              {avgRating > 0 && (
                <div className="flex items-center gap-1.5">
                  <Star size={15} fill="#fff" className="text-white" />
                  <span className="text-white font-bold">{avgRating.toFixed(1)}</span>
                  <span className="text-neutral-500 text-sm">Audience</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-neutral-400 text-sm">
                <Calendar size={14} />{film.release_year}
              </div>
              <div className="flex items-center gap-1.5 text-neutral-400 text-sm">
                <Clock size={14} />{formatDuration(film.duration_seconds)}
              </div>
              {film.director && (
                <div className="flex items-center gap-1.5 text-neutral-400 text-sm">
                  <UserIcon size={14} />Dir. {film.director}
                </div>
              )}
            </div>

            <p className="text-neutral-300 text-base leading-relaxed max-w-2xl mb-6">
              {film.description}
            </p>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 mb-6">
              <Link
                to={`/watch/${film.id}`}
                className="flex items-center gap-3 px-8 py-3.5 bg-white hover:bg-[#e8a020] text-black font-bold rounded-full transition-all duration-200 shadow-lg"
              >
                <Play size={18} fill="black" /> Watch Now
              </Link>
              <button
                onClick={toggleWatchlist}
                className="flex items-center gap-2 px-6 py-3.5 bg-white/10 hover:bg-white/15 text-white font-semibold text-sm rounded-full transition-all border border-white/15"
              >
                {inWatchlist ? <><Check size={16} className="text-[#e8a020]" /> In My List</> : <><Plus size={16} /> Add to My List</>}
              </button>

              {/* Share this film */}
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                <ShareStrip film={film} />
              </div>
            </div>

            {/* Rating */}
            <div className="mb-6">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-2">Rate this film</p>
              <StarRating
                filmId={film.id}
                initialScore={userRating}
                avgRating={avgRating}
                ratingCount={ratingCount}
                onRated={handleRated}
              />
            </div>

            {/* Content flags */}
            {contentFlags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {contentFlags.map(f => (
                  <span key={f} className="px-2 py-0.5 text-xs bg-red-500/10 border border-red-500/20 text-red-400 rounded font-medium">
                    {f}
                  </span>
                ))}
                {film.ok_for_children && (
                  <span className="px-2 py-0.5 text-xs bg-green-500/10 border border-green-500/20 text-green-400 rounded font-medium">
                    Child Friendly
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Cast & Crew */}
        {(credits.length > 0 || film.cast_members?.length > 0 || film.writer || film.producer || film.production_company || film.awards || film.festival_selections?.length > 0) && (
          <div className="mt-12 bg-[#141414] border border-white/8 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
              <FilmIcon size={17} className="text-[#e8a020]" /> Film Details
            </h2>

            {/* Linked credits from film_credits table */}
            {credits.length > 0 && (
              <div className="mb-6">
                {(['director', 'writer', 'producer', 'actor', 'cinematographer', 'editor', 'composer', 'other'] as const).map(role => {
                  const roleCredits = credits.filter((c: any) => c.role === role);
                  if (roleCredits.length === 0) return null;
                  const label = role.charAt(0).toUpperCase() + role.slice(1) + (roleCredits.length > 1 ? 's' : '');
                  return (
                    <div key={role} className="mb-4">
                      <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">{label}</p>
                      <div className="flex flex-wrap gap-2">
                        {roleCredits.map((c: any) => {
                          const slug = c.xlshorts_profiles?.slug;
                          const inner = (
                            <span className="flex items-center gap-1.5">
                              <span className="text-sm font-medium">{c.name}</span>
                              {c.character_name && <span className="text-xs text-neutral-500">as {c.character_name}</span>}
                              {slug && <span className="text-[#e8a020] text-xs">↗</span>}
                            </span>
                          );
                          return slug ? (
                            <Link key={c.id} to={`/people/${slug}`}
                              className="px-3 py-1.5 bg-white/5 hover:bg-[#e8a020]/10 border border-white/8 hover:border-[#e8a020]/30 rounded-lg text-white transition-all">
                              {inner}
                            </Link>
                          ) : (
                            <span key={c.id} className="px-3 py-1.5 bg-white/5 border border-white/8 rounded-lg text-neutral-300">
                              {inner}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Fallback text-based fields */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {credits.filter((c: any) => c.role === 'director').length === 0 && film.director && (
                <div>
                  <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Director</p>
                  <p className="text-white font-medium">{film.director}</p>
                </div>
              )}
              {credits.filter((c: any) => c.role === 'writer').length === 0 && film.writer && (
                <div>
                  <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Writer</p>
                  <p className="text-white font-medium">{film.writer}</p>
                </div>
              )}
              {film.producer && (
                <div>
                  <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Producer</p>
                  <p className="text-white font-medium">{film.producer}</p>
                </div>
              )}
              {film.cinematographer && (
                <div>
                  <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Cinematographer</p>
                  <p className="text-white font-medium">{film.cinematographer}</p>
                </div>
              )}
              {film.production_company && (
                <div>
                  <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Production Company</p>
                  <p className="text-white font-medium">{film.production_company}</p>
                </div>
              )}
              {film.language && film.language !== 'English' && (
                <div>
                  <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Language</p>
                  <p className="text-white font-medium flex items-center gap-1.5"><Globe size={13} />{film.language}</p>
                </div>
              )}
              {credits.filter((c: any) => c.role === 'actor').length === 0 && film.cast_members?.length > 0 && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Users size={12} /> Cast
                  </p>
                  <p className="text-white font-medium">{film.cast_members.join(', ')}</p>
                </div>
              )}
              {film.awards && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Award size={12} /> Awards
                  </p>
                  <p className="text-white font-medium">{film.awards}</p>
                </div>
              )}
              {film.festival_selections?.length > 0 && (
                <div className="sm:col-span-2 lg:col-span-3">
                  <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">Festival Selections</p>
                  <div className="flex flex-wrap gap-2">
                    {film.festival_selections.map(f => (
                      <span key={f} className="px-3 py-1 bg-[#e8a020]/10 border border-[#e8a020]/20 text-[#e8a020] text-xs font-medium rounded-full">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* More episodes from this series */}
        {moreEpisodes.length > 0 && series && (
          <div className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Layers size={17} className="text-[#e8a020]" /> More from {series.title}
              </h2>
              <Link
                to={`/series/${series.id}`}
                className="text-[#e8a020] hover:text-[#d4911a] text-sm font-semibold flex items-center gap-1"
              >
                All episodes <ChevronRight size={14} />
              </Link>
            </div>
            <FilmRow title="" films={moreEpisodes} cardSize="md" />
          </div>
        )}

        {/* More from this director */}
        {directorFilms.length > 0 && (
          <div className="mt-10">
            <FilmRow
              title={`More from ${film.director}`}
              films={directorFilms}
              cardSize="md"
            />
          </div>
        )}

        {/* Related films */}
        {relatedFilms.length > 0 && (
          <div className="mt-6 mb-16">
            <FilmRow title="More Short Films" films={relatedFilms} cardSize="md" />
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Hls from 'hls.js';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import type { Film, Ad, Series } from '../types/database';
import { getAdSchedule, selectAdsForDuration } from '../lib/adUtils';
import AdOverlay from '../components/AdOverlay';
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipForward, SkipBack, ChevronLeft, Settings, Loader2, Layers
} from 'lucide-react';

type Phase = 'loading' | 'pre-roll' | 'film' | 'mid-roll' | 'complete';

export default function Player() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();

  const [film, setFilm] = useState<Film | null>(null);
  const [nextEpisode, setNextEpisode] = useState<Film | null>(null);
  const [series, setSeries] = useState<Series | null>(null);
  const [showNextUp, setShowNextUp] = useState(false);
  const nextUpTimer = useRef<ReturnType<typeof setTimeout>>();
  const [phase, setPhase] = useState<Phase>('loading');
  const [preRollAds, setPreRollAds] = useState<Ad[]>([]);
  const [midRollAds, setMidRollAds] = useState<Ad[]>([]);
  const [midRollTrigger, setMidRollTrigger] = useState<number | null>(null);
  const [midRollTriggered, setMidRollTriggered] = useState(false);
  const [resumePosition, setResumePosition] = useState(0);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [buffering, setBuffering] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase.from('films').select('*').eq('id', id).maybeSingle(),
      supabase.from('ads').select('*').eq('active', true),
    ]).then(async ([filmRes, adsRes]) => {
      const film = filmRes.data as Film | null;
      const allAds: Ad[] = (adsRes.data ?? []) as Ad[];
      if (!film) return;
      setFilm(film);

      const schedule = getAdSchedule(film.duration_seconds);
      const eligibleAds = allAds.filter(a => a.type === 'pre-roll' || a.type === 'both');
      const midEligible = allAds.filter(a => a.type === 'mid-roll' || a.type === 'both');

      const pre = selectAdsForDuration(eligibleAds, schedule.preRollSeconds);
      setPreRollAds(pre);

      if (schedule.midRollTrigger !== null && schedule.midRollSeconds > 0) {
        const mid = selectAdsForDuration(midEligible, schedule.midRollSeconds);
        setMidRollAds(mid);
        setMidRollTrigger(schedule.midRollTrigger);
      }

      setPhase(pre.length > 0 ? 'pre-roll' : 'film');

      // Load next episode if this is a series episode
      if (film.content_type === 'episode' && film.series_id) {
        const [seriesRes, nextRes] = await Promise.all([
          supabase.from('series').select('*').eq('id', film.series_id).maybeSingle(),
          supabase
            .from('films')
            .select('*')
            .eq('series_id', film.series_id)
            .eq('status', 'published')
            .or(
              `season_number.gt.${film.season_number ?? 1},and(season_number.eq.${film.season_number ?? 1},episode_number.gt.${film.episode_number ?? 0})`
            )
            .order('season_number', { ascending: true })
            .order('episode_number', { ascending: true })
            .limit(1)
            .maybeSingle(),
        ]);
        setSeries(seriesRes.data as Series | null);
        setNextEpisode((nextRes.data ?? null) as Film | null);
      }
    });
  }, [id]);

  // Attach the video source. Cloudflare Stream serves adaptive HLS (.m3u8),
  // which needs hls.js on browsers without native HLS (Chrome/Firefox); Safari
  // plays HLS natively. Existing Supabase/external mp4 URLs load directly.
  useEffect(() => {
    const v = videoRef.current;
    const url = film?.video_url;
    if (!v || !url) return;
    const isHls = url.includes('.m3u8');
    const nativeHls = v.canPlayType('application/vnd.apple.mpegurl');
    if (isHls && !nativeHls && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true });
      hls.loadSource(url);
      hls.attachMedia(v);
      return () => hls.destroy();
    }
    v.src = url;
    return () => { v.removeAttribute('src'); v.load(); };
  }, [film?.video_url]);

  useEffect(() => {
    if (phase === 'film') {
      const v = videoRef.current;
      if (!v) return;
      if (resumePosition > 0) {
        v.currentTime = resumePosition;
      }
      v.play().then(() => setPlaying(true)).catch(() => {});
    }
  }, [phase]);

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 3500);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase !== 'film') return;
      if (e.key === 'Escape' || e.key === 'Backspace') { saveProgress(); navigate(-1); }
      if (e.key === ' ' || e.key === 'MediaPlayPause') { e.preventDefault(); togglePlay(); }
      if (e.key === 'ArrowLeft') skip(-10);
      if (e.key === 'ArrowRight') skip(10);
      if (e.key === 'm') setMuted(v => !v);
      if (e.key === 'f') toggleFullscreen();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase]);

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); } else { v.pause(); setPlaying(false); }
    resetHideTimer();
  }

  function skip(secs: number) {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + secs));
    resetHideTimer();
  }

  function toggleFullscreen() {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) { el.requestFullscreen(); setFullscreen(true); }
    else { document.exitFullscreen(); setFullscreen(false); }
  }

  function onTimeUpdate(e: React.SyntheticEvent<HTMLVideoElement>) {
    const t = (e.target as HTMLVideoElement).currentTime;
    setCurrentTime(t);
    if (
      midRollTrigger !== null &&
      !midRollTriggered &&
      midRollAds.length > 0 &&
      t >= midRollTrigger
    ) {
      setMidRollTriggered(true);
      setResumePosition(t);
      videoRef.current?.pause();
      setPlaying(false);
      setPhase('mid-roll');
    }
    // Show "Next Up" banner 30s before end if there's a next episode
    if (nextEpisode && duration > 0 && t >= duration - 30 && !showNextUp) {
      setShowNextUp(true);
    }
  }

  async function saveProgress() {
    if (!user || !id || !videoRef.current) return;
    const progress = Math.floor(videoRef.current.currentTime);
    const completed = duration > 0 && progress >= duration * 0.9;
    const profileId = activeProfile?.id ?? null;
    await supabase.from('watch_history').upsert(
      { user_id: user.id, film_id: id, profile_id: profileId, progress_seconds: progress, completed, watched_at: new Date().toISOString() },
      { onConflict: 'user_id,film_id' }
    );
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const inAd = phase === 'pre-roll' || phase === 'mid-roll';
  const showFilmControls = phase === 'film' && showControls;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black flex items-center justify-center"
      onMouseMove={() => { if (phase === 'film') resetHideTimer(); }}
      onClick={() => { if (phase === 'film' && !showSettings) togglePlay(); }}
    >
      {/* Video element — always mounted, hidden during ads */}
      {film && (
        <video
          ref={videoRef}
          className={`w-full h-full object-contain ${inAd ? 'opacity-0 pointer-events-none' : ''}`}
          onLoadedMetadata={e => setDuration((e.target as HTMLVideoElement).duration)}
          onTimeUpdate={onTimeUpdate}
          onWaiting={() => setBuffering(true)}
          onCanPlay={() => setBuffering(false)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => {
            setPlaying(false);
            saveProgress();
            if (nextEpisode) {
              navigate(`/watch/${nextEpisode.id}`);
            } else {
              navigate(`/film/${id}`);
            }
          }}
          muted={muted}
          playsInline
        />
      )}

      {/* Loading spinner */}
      {phase === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black">
          <div className="text-3xl font-black tracking-tighter text-white">
            XL<span className="text-[#e8a020]">Shorts</span>
          </div>
          <Loader2 size={32} className="animate-spin text-[#e8a020]" />
        </div>
      )}

      {/* Ad overlays */}
      {phase === 'pre-roll' && preRollAds.length > 0 && id && (
        <AdOverlay
          ads={preRollAds}
          filmId={id}
          userId={user?.id ?? null}
          placement="pre-roll"
          onComplete={() => setPhase('film')}
        />
      )}

      {phase === 'mid-roll' && midRollAds.length > 0 && id && (
        <AdOverlay
          ads={midRollAds}
          filmId={id}
          userId={user?.id ?? null}
          placement="mid-roll"
          onComplete={() => setPhase('film')}
        />
      )}

      {/* Next Up banner (series episodes) */}
      {showNextUp && nextEpisode && phase === 'film' && (
        <div className="absolute bottom-32 right-6 z-50 w-72 bg-[#1a1a1a]/95 backdrop-blur-sm border border-white/10 rounded-2xl p-4 shadow-2xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
              <Layers size={12} />
              <span>{series?.title}</span>
            </div>
            <button onClick={() => setShowNextUp(false)} className="text-neutral-600 hover:text-neutral-400 text-xs">✕</button>
          </div>
          <p className="text-neutral-400 text-xs mb-1">Next Episode</p>
          <p className="text-white font-semibold text-sm mb-3 line-clamp-1">
            Ep {nextEpisode.episode_number}: {nextEpisode.episode_title || nextEpisode.title}
          </p>
          <Link
            to={`/watch/${nextEpisode.id}`}
            className="flex items-center justify-center gap-2 w-full py-2 bg-white hover:bg-[#e8a020] text-black text-sm font-bold rounded-xl transition-colors"
          >
            <Play size={14} fill="black" /> Play Now
          </Link>
        </div>
      )}

      {/* Buffering indicator (film phase only) */}
      {buffering && phase === 'film' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Loader2 size={44} className="animate-spin text-[#e8a020]" />
        </div>
      )}

      {/* Film controls */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 ${showFilmControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 px-6 py-4 bg-gradient-to-b from-black/80 to-transparent flex items-center gap-4">
          <button
            onClick={() => { saveProgress(); navigate(-1); }}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white xl-focusable"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <p className="text-white font-bold text-lg leading-tight">{film?.title}</p>
            <p className="text-neutral-400 text-sm">Dir. {film?.director}</p>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            {midRollTrigger !== null && !midRollTriggered && (
              <span className="text-neutral-500 text-xs hidden sm:block">
                Ad break at {formatTime(midRollTrigger)}
              </span>
            )}
            <button
              onClick={e => { e.stopPropagation(); setShowSettings(v => !v); }}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white xl-focusable"
            >
              <Settings size={16} />
            </button>
          </div>
        </div>

        {/* Center play indicator */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={`transition-all duration-200 ${!playing ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Play size={32} fill="white" className="text-white ml-2" />
            </div>
          </div>
        </div>

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-6 pt-16 bg-gradient-to-t from-black/90 to-transparent">
          {/* Progress */}
          <div className="mb-4">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onClick={e => e.stopPropagation()}
              onChange={e => {
                const v = videoRef.current;
                const t = Number(e.target.value);
                if (v) v.currentTime = t;
                resetHideTimer();
              }}
              className="w-full h-1 accent-[#e8a020] cursor-pointer rounded-full"
            />
            <div className="flex justify-between mt-1">
              <span className="text-neutral-400 text-xs">{formatTime(currentTime)}</span>
              <span className="text-neutral-400 text-xs">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Buttons row */}
          <div className="flex items-center gap-4">
            <button
              onClick={e => { e.stopPropagation(); togglePlay(); }}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-white hover:bg-[#e8a020] transition-colors xl-focusable"
            >
              {playing
                ? <Pause size={20} fill="black" className="text-black" />
                : <Play size={20} fill="black" className="text-black ml-0.5" />}
            </button>
            <button onClick={e => { e.stopPropagation(); skip(-10); }} className="text-white/70 hover:text-white transition-colors xl-focusable">
              <SkipBack size={22} />
            </button>
            <button onClick={e => { e.stopPropagation(); skip(10); }} className="text-white/70 hover:text-white transition-colors xl-focusable">
              <SkipForward size={22} />
            </button>

            <div className="flex items-center gap-2 ml-2">
              <button onClick={e => { e.stopPropagation(); setMuted(v => !v); }} className="text-white/70 hover:text-white transition-colors xl-focusable">
                {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <input
                type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume}
                onClick={e => e.stopPropagation()}
                onChange={e => {
                  const val = Number(e.target.value);
                  setVolume(val); setMuted(val === 0);
                  if (videoRef.current) videoRef.current.volume = val;
                }}
                className="w-20 h-1 accent-[#e8a020] cursor-pointer hidden sm:block"
              />
            </div>

            <div className="flex-1" />

            <button
              onClick={e => { e.stopPropagation(); toggleFullscreen(); }}
              className="text-white/70 hover:text-white transition-colors xl-focusable"
            >
              {fullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && phase === 'film' && (
        <div className="absolute top-20 right-6 w-56 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl p-4 z-50" onClick={e => e.stopPropagation()}>
          <p className="text-white font-semibold text-sm mb-3">Playback Settings</p>
          <div className="space-y-3">
            <div>
              <p className="text-neutral-400 text-xs mb-1">Quality</p>
              <select className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                <option>1080p HD</option>
                <option>720p</option>
                <option>480p</option>
              </select>
            </div>
            <div>
              <p className="text-neutral-400 text-xs mb-1">Playback Speed</p>
              <select
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                defaultValue="1"
                onChange={e => { if (videoRef.current) videoRef.current.playbackRate = Number(e.target.value); }}
              >
                <option value="0.5">0.5×</option>
                <option value="0.75">0.75×</option>
                <option value="1">Normal</option>
                <option value="1.25">1.25×</option>
                <option value="1.5">1.5×</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

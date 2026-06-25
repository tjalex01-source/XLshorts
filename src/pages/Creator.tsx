import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Film, Category, Genre } from '../types/database';
import { CONTENT_RATINGS } from '../types/database';
import {
  Film as FilmIcon, Upload, Plus, Edit2, Eye, Trash2, ChevronRight,
  Loader2, AlertCircle, Check, Clock, X, Send, FileSpreadsheet,
  Info, ChevronDown, Layers, List, Users, ChevronLeft, Clapperboard,
  BarChart2
} from 'lucide-react';
import CreatorAnalytics from './CreatorAnalytics';
import * as XLSX from 'xlsx';
import FilmCreditsTagger from '../components/FilmCreditsTagger';

type AccessState = 'loading' | 'has_access' | 'pending_request' | 'rejected_request' | 'no_request';

export interface Series {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  backdrop_url: string;
  rating: string;
  status: 'draft' | 'pending' | 'published' | 'rejected';
  rejection_reason: string;
  language: string;
  country_of_origin: string;
  genres: string[];
  tags: string[];
  created_at: string;
}

type View =
  | 'dashboard'
  | 'upload-film'
  | 'edit-film'
  | 'create-series'
  | 'edit-series'
  | 'series-detail'
  | 'upload-episode'
  | 'edit-episode';

export default function Creator() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [access, setAccess] = useState<AccessState>('loading');
  const [view, setView] = useState<View>('dashboard');
  const [editFilm, setEditFilm] = useState<Film | null>(null);
  const [editSeries, setEditSeries] = useState<Series | null>(null);
  const [activeSeries, setActiveSeries] = useState<Series | null>(null);
  const [episodeContext, setEpisodeContext] = useState<{ seriesId: string; seasonNumber: number } | null>(null);
  const [existingRequest, setExistingRequest] = useState<{ status: string; review_note: string } | null>(null);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    checkAccess();
  }, [user]);

  async function checkAccess() {
    const [{ data: roleRows }, { data: reqData }] = await Promise.all([
      supabase.from('user_roles').select('role').eq('user_id', user!.id).in('role', ['admin', 'creator']),
      supabase.from('creator_requests').select('status, review_note').eq('user_id', user!.id).maybeSingle(),
    ]);
    if (roleRows && roleRows.length > 0) {
      setAccess('has_access');
    } else if (reqData) {
      setExistingRequest(reqData);
      setAccess(reqData.status === 'rejected' ? 'rejected_request' : 'pending_request');
    } else {
      setAccess('no_request');
    }
  }

  if (access === 'loading') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#e8a020]" size={36} />
      </div>
    );
  }

  if (access === 'pending_request') return <RequestPendingScreen />;

  if (access === 'no_request' || access === 'rejected_request') {
    return (
      <CreatorRequestForm
        userId={user!.id}
        rejectedNote={access === 'rejected_request' ? existingRequest?.review_note : undefined}
        onSubmitted={checkAccess}
      />
    );
  }

  function goBack() {
    if (view === 'upload-episode' || view === 'edit-episode') {
      setView('series-detail');
      setEditFilm(null);
      setEpisodeContext(null);
    } else if (view === 'series-detail') {
      setView('dashboard');
      setActiveSeries(null);
    } else {
      setView('dashboard');
      setEditFilm(null);
      setEditSeries(null);
    }
  }

  const breadcrumbs: string[] = ['Creator Studio'];
  if (view === 'upload-film') breadcrumbs.push('Upload Film');
  if (view === 'edit-film') breadcrumbs.push('Edit Film');
  if (view === 'create-series') breadcrumbs.push('New Series');
  if (view === 'edit-series') breadcrumbs.push('Edit Series');
  if (view === 'series-detail' && activeSeries) breadcrumbs.push(activeSeries.title);
  if (view === 'upload-episode') { if (activeSeries) breadcrumbs.push(activeSeries.title); breadcrumbs.push('Upload Episode'); }
  if (view === 'edit-episode') { if (activeSeries) breadcrumbs.push(activeSeries.title); breadcrumbs.push('Edit Episode'); }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="bg-[#141414] border-b border-white/8 px-6 py-4 flex items-center gap-3">
        <Link to="/" className="text-xl font-black tracking-tight text-white">
          XL<span className="text-[#e8a020]">Shorts</span>
        </Link>
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-3">
            <ChevronRight size={14} className="text-neutral-600" />
            <span className={`text-sm font-semibold ${i === breadcrumbs.length - 1 ? 'text-neutral-300' : 'text-neutral-500'} flex items-center gap-1.5`}>
              {i === 0 && <FilmIcon size={14} className="text-[#e8a020]" />}
              {crumb}
            </span>
          </span>
        ))}
        <div className="flex-1" />
        <div className="flex items-center gap-1">
          <Link to="/" className="px-3 py-2 text-sm text-neutral-400 hover:text-white transition-colors">Home</Link>
          <Link to="/browse" className="px-3 py-2 text-sm text-neutral-400 hover:text-white transition-colors">Browse</Link>
          {view !== 'dashboard' && (
            <button
              onClick={goBack}
              className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors"
            >
              {view === 'series-detail' ? <><ChevronLeft size={14} /> Back to Series</> : <><X size={14} /> Cancel</>}
            </button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {view === 'dashboard' && (
          <CreatorDashboard
            userId={user!.id}
            onUploadFilm={() => setView('upload-film')}
            onEditFilm={(film) => { setEditFilm(film); setView('edit-film'); }}
            onCreateSeries={() => setView('create-series')}
            onEditSeries={(s) => { setEditSeries(s); setView('edit-series'); }}
            onManageSeries={(s) => { setActiveSeries(s); setView('series-detail'); }}
          />
        )}
        {(view === 'upload-film' || view === 'edit-film') && (
          <FilmUploadForm
            userId={user!.id}
            film={view === 'edit-film' ? editFilm ?? undefined : undefined}
            contentType="film"
            onSave={goBack}
            onCancel={goBack}
          />
        )}
        {(view === 'upload-episode' || view === 'edit-episode') && (
          <FilmUploadForm
            userId={user!.id}
            film={view === 'edit-episode' ? editFilm ?? undefined : undefined}
            contentType="episode"
            lockedSeriesId={episodeContext?.seriesId}
            lockedSeasonNumber={episodeContext?.seasonNumber}
            onSave={goBack}
            onCancel={goBack}
          />
        )}
        {(view === 'create-series' || view === 'edit-series') && (
          <SeriesForm
            userId={user!.id}
            series={view === 'edit-series' ? editSeries ?? undefined : undefined}
            onSave={goBack}
            onCancel={goBack}
          />
        )}
        {view === 'series-detail' && activeSeries && (
          <SeriesDetailView
            userId={user!.id}
            series={activeSeries}
            onEditSeries={(s) => { setEditSeries(s); setView('edit-series'); }}
            onAddEpisode={(seriesId, seasonNumber) => {
              setEpisodeContext({ seriesId, seasonNumber });
              setView('upload-episode');
            }}
            onEditEpisode={(film) => {
              setEditFilm(film);
              setEpisodeContext({ seriesId: film.series_id ?? activeSeries.id, seasonNumber: film.season_number ?? 1 });
              setView('edit-episode');
            }}
          />
        )}
      </div>
    </div>
  );
}

// =============================================
// REQUEST PENDING SCREEN
// =============================================
function RequestPendingScreen() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 flex items-center justify-center">
        <Clock size={32} className="text-yellow-400" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Request Under Review</h1>
        <p className="text-neutral-400 max-w-sm">
          Your creator access request has been submitted and is being reviewed by our team. We'll get back to you shortly.
        </p>
      </div>
      <Link to="/" className="px-6 py-2.5 bg-white/8 border border-white/15 text-white font-semibold rounded-xl text-sm hover:bg-white/14 transition-all">
        Back to Home
      </Link>
    </div>
  );
}

// =============================================
// CREATOR REQUEST FORM
// =============================================
function CreatorRequestForm({ userId, rejectedNote, onSubmitted }: {
  userId: string; rejectedNote?: string; onSubmitted: () => void;
}) {
  const [name, setName] = useState('');
  const [reason, setReason] = useState('');
  const [agreedToCreatorTerms, setAgreedToCreatorTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!name.trim() || !reason.trim()) { setError('Please fill in both fields.'); return; }
    if (reason.length < 50) { setError('Please write at least 50 characters about your background.'); return; }
    if (!agreedToCreatorTerms) { setError('You must agree to the Creator Terms before applying.'); return; }
    setError('');
    setSubmitting(true);
    const { error: e } = await supabase.from('creator_requests').upsert(
      { user_id: userId, name: name.trim(), reason: reason.trim(), status: 'pending', review_note: '', reviewed_by: null, reviewed_at: null },
      { onConflict: 'user_id' }
    );
    setSubmitting(false);
    if (e) { setError(e.message); return; }
    onSubmitted();
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#e8a020]/10 flex items-center justify-center mx-auto mb-4">
            <FilmIcon size={28} className="text-[#e8a020]" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Apply for Creator Access</h1>
          <p className="text-neutral-400 text-sm">Tell us about yourself and your filmmaking work.</p>
        </div>

        {rejectedNote !== undefined && (
          <div className="mb-5 flex items-start gap-3 px-4 py-3 bg-red-500/10 border border-red-500/25 rounded-xl">
            <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 text-sm font-medium">Previous application declined</p>
              {rejectedNote && <p className="text-red-400/70 text-xs mt-0.5">{rejectedNote}</p>}
              <p className="text-neutral-400 text-xs mt-1">You can reapply below.</p>
            </div>
          </div>
        )}

        <div className="bg-[#141414] border border-white/8 rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">Your name or creator handle</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Alex Martinez"
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-[#e8a020]/60 focus:ring-2 focus:ring-[#e8a020]/10 transition-all" />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">
              Tell us about your films <span className="text-neutral-600">(min. 50 characters)</span>
            </label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={5}
              placeholder="Describe your filmmaking background, what kind of short films you make, and why you want to join XLShorts..."
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-[#e8a020]/60 focus:ring-2 focus:ring-[#e8a020]/10 transition-all resize-none" />
            <p className="text-xs text-neutral-600 mt-1 text-right">{reason.length} chars</p>
          </div>

          <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-4">
            <p className="text-xs font-semibold text-neutral-300 mb-3">Creator Terms Summary</p>
            <ul className="text-xs text-neutral-500 space-y-1.5 mb-4 list-none">
              <li className="flex items-start gap-2"><Check size={11} className="text-[#e8a020] shrink-0 mt-0.5" /> You retain full ownership of your content</li>
              <li className="flex items-start gap-2"><Check size={11} className="text-[#e8a020] shrink-0 mt-0.5" /> Non-exclusive license — you may distribute on other platforms</li>
              <li className="flex items-start gap-2"><Check size={11} className="text-[#e8a020] shrink-0 mt-0.5" /> No upfront payment; you earn 70% of ad revenue on your content</li>
              <li className="flex items-start gap-2"><Check size={11} className="text-[#e8a020] shrink-0 mt-0.5" /> You must accurately complete all content metadata and flag adult content</li>
              <li className="flex items-start gap-2"><AlertCircle size={11} className="text-yellow-400 shrink-0 mt-0.5" /> False content descriptors may result in immediate account termination</li>
            </ul>
            <label className="flex items-start gap-3 cursor-pointer">
              <div onClick={() => setAgreedToCreatorTerms(v => !v)}
                className={`w-5 h-5 shrink-0 mt-0.5 rounded flex items-center justify-center border transition-all cursor-pointer ${agreedToCreatorTerms ? 'bg-[#e8a020] border-[#e8a020]' : 'border-white/30 bg-white/5 hover:border-white/50'}`}>
                {agreedToCreatorTerms && <Check size={12} className="text-black" />}
              </div>
              <span className="text-xs text-neutral-400 leading-relaxed">
                I have read and agree to the{' '}
                <Link to="/terms" target="_blank" className="text-[#e8a020] hover:underline">Creator Terms of Service</Link>
                , including the content licensing, ad revenue sharing (70/30 split), and content accuracy requirements.
              </span>
            </label>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/25 rounded-lg">
              <AlertCircle size={14} className="text-red-400 shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button onClick={handleSubmit} disabled={submitting || !name.trim() || reason.length < 50 || !agreedToCreatorTerms}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#e8a020] hover:bg-[#d4911a] disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-xl transition-all">
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Submit Application
          </button>
        </div>

        <p className="text-center text-neutral-600 text-xs mt-5">
          <Link to="/" className="text-neutral-400 hover:text-white transition-colors">Back to Home</Link>
        </p>
      </div>
    </div>
  );
}

// =============================================
// DASHBOARD VIEW
// =============================================
function CreatorDashboard({ userId, onUploadFilm, onEditFilm, onCreateSeries, onEditSeries, onManageSeries }: {
  userId: string;
  onUploadFilm: () => void;
  onEditFilm: (film: Film) => void;
  onCreateSeries: () => void;
  onEditSeries: (series: Series) => void;
  onManageSeries: (series: Series) => void;
}) {
  const [films, setFilms] = useState<Film[]>([]);
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'films' | 'series' | 'analytics'>('films');
  const [stats, setStats] = useState({ total: 0, published: 0, pending: 0, impressions: 0 });

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const [{ data: filmsData }, { data: seriesData }, { count }] = await Promise.all([
      supabase.from('films').select('*').eq('uploaded_by', userId).eq('content_type', 'film').order('created_at', { ascending: false }),
      supabase.from('series').select('*').eq('creator_id', userId).order('created_at', { ascending: false }),
      supabase.from('ad_impressions').select('id', { count: 'exact', head: true })
        .in('film_id', (await supabase.from('films').select('id').eq('uploaded_by', userId)).data?.map(f => f.id) ?? []),
    ]);
    const list: Film[] = filmsData ?? [];
    setFilms(list);
    setSeriesList((seriesData ?? []) as Series[]);
    setStats({ total: list.length, published: list.filter(f => f.status === 'published').length, pending: list.filter(f => f.status === 'pending').length, impressions: count ?? 0 });
    setLoading(false);
  }

  async function deleteFilm(id: string) {
    if (!confirm('Delete this film? This cannot be undone.')) return;
    await supabase.from('films').delete().eq('id', id).eq('uploaded_by', userId);
    load();
  }

  async function deleteSeries(id: string) {
    if (!confirm('Delete this series? All episodes linked to it will lose their series association.')) return;
    await supabase.from('series').delete().eq('id', id).eq('creator_id', userId);
    load();
  }

  const statusConfig = {
    published: { label: 'Published', color: 'text-green-400 bg-green-400/10', icon: Check },
    pending: { label: 'Pending Review', color: 'text-yellow-400 bg-yellow-400/10', icon: Clock },
    draft: { label: 'Draft', color: 'text-neutral-400 bg-white/5', icon: Edit2 },
    rejected: { label: 'Rejected', color: 'text-red-400 bg-red-400/10', icon: X },
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Creator Studio</h1>
          <p className="text-neutral-400 text-sm mt-1">Manage your films and series</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onUploadFilm}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/8 hover:bg-white/15 border border-white/10 text-white font-semibold text-sm rounded-xl transition-all">
            <FilmIcon size={14} /> Upload Film
          </button>
          <button onClick={onCreateSeries}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#e8a020] hover:bg-[#d4911a] text-black font-bold text-sm rounded-xl transition-all">
            <Layers size={14} /> New Series
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Films', value: stats.total, color: 'text-white' },
          { label: 'Published', value: stats.published, color: 'text-green-400' },
          { label: 'Pending', value: stats.pending, color: 'text-yellow-400' },
          { label: 'Ad Impressions', value: stats.impressions, color: 'text-[#e8a020]' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[#141414] border border-white/8 rounded-2xl p-4">
            <p className="text-neutral-500 text-xs mb-1">{label}</p>
            <p className={`text-2xl font-black ${color}`}>{value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Payouts banner */}
      <div className="flex items-center justify-between gap-4 px-4 py-3 mb-6 bg-[#e8a020]/8 border border-[#e8a020]/20 rounded-xl">
        <div className="flex items-center gap-3">
          <BarChart2 size={16} className="text-[#e8a020] shrink-0" />
          <p className="text-xs text-neutral-300">
            <strong className="text-white">Ad revenue payouts are coming.</strong> Impression data is being recorded now. Payouts will begin once the platform starts receiving ad revenue from Google Ad Manager.
          </p>
        </div>
        <button onClick={() => setActiveTab('analytics')} className="shrink-0 text-xs font-semibold text-[#e8a020] hover:underline">
          View Analytics
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-black/40 p-1 rounded-xl mb-6 w-fit">
        <button onClick={() => setActiveTab('films')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'films' ? 'bg-[#e8a020] text-black' : 'text-neutral-400 hover:text-white'}`}>
          <FilmIcon size={14} /> Films
        </button>
        <button onClick={() => setActiveTab('series')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'series' ? 'bg-[#e8a020] text-black' : 'text-neutral-400 hover:text-white'}`}>
          <Layers size={14} /> Series
        </button>
        <button onClick={() => setActiveTab('analytics')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'analytics' ? 'bg-[#e8a020] text-black' : 'text-neutral-400 hover:text-white'}`}>
          <BarChart2 size={14} /> Analytics
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[#e8a020]" size={28} /></div>
      ) : activeTab === 'analytics' ? (
        <CreatorAnalytics userId={userId} />
      ) : activeTab === 'films' ? (
        films.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FilmIcon size={48} className="text-neutral-700 mb-4" />
            <p className="text-neutral-400 mb-2">No films uploaded yet.</p>
            <button onClick={onUploadFilm} className="flex items-center gap-2 px-5 py-2.5 bg-[#e8a020] hover:bg-[#d4911a] text-black font-bold text-sm rounded-xl transition-all mt-4">
              <Plus size={15} /> Upload Film
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {films.map(film => {
              const cfg = statusConfig[film.status as keyof typeof statusConfig] ?? statusConfig.draft;
              const StatusIcon = cfg.icon;
              return (
                <div key={film.id} className="flex items-center gap-4 p-4 bg-[#141414] border border-white/8 rounded-2xl">
                  {film.thumbnail_url ? (
                    <img src={film.thumbnail_url} alt={film.title} className="w-16 h-11 object-cover rounded-xl shrink-0" />
                  ) : (
                    <div className="w-16 h-11 bg-white/5 rounded-xl flex items-center justify-center shrink-0">
                      <FilmIcon size={16} className="text-neutral-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{film.title}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{film.rating} · {film.release_year} · {Math.floor(film.duration_seconds / 60)}m {film.duration_seconds % 60 > 0 ? `${film.duration_seconds % 60}s` : ''}</p>
                    {film.rejection_reason && (
                      <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle size={11} /> {film.rejection_reason}
                      </p>
                    )}
                  </div>
                  <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
                    <StatusIcon size={11} /> {cfg.label}
                  </span>
                  <div className="flex items-center gap-2">
                    {film.status === 'published' && (
                      <Link to={`/film/${film.id}`} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/15 text-neutral-400 hover:text-white transition-all">
                        <Eye size={14} />
                      </Link>
                    )}
                    {(film.status === 'draft' || film.status === 'rejected' || film.status === 'pending') && (
                      <button onClick={() => onEditFilm(film)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/15 text-neutral-400 hover:text-white transition-all">
                        <Edit2 size={14} />
                      </button>
                    )}
                    {film.status !== 'published' && (
                      <button onClick={() => deleteFilm(film.id)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/8 hover:bg-red-500/20 text-red-400 transition-all">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        seriesList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Layers size={48} className="text-neutral-700 mb-4" />
            <p className="text-neutral-400 mb-2">No series created yet.</p>
            <button onClick={onCreateSeries} className="flex items-center gap-2 px-5 py-2.5 bg-[#e8a020] hover:bg-[#d4911a] text-black font-bold text-sm rounded-xl transition-all mt-4">
              <Plus size={15} /> Create Your First Series
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {seriesList.map(s => {
              const cfg = statusConfig[s.status as keyof typeof statusConfig] ?? statusConfig.draft;
              const StatusIcon = cfg.icon;
              return (
                <div key={s.id} className="flex items-center gap-4 p-4 bg-[#141414] border border-white/8 rounded-2xl">
                  {s.thumbnail_url ? (
                    <img src={s.thumbnail_url} alt={s.title} className="w-16 h-11 object-cover rounded-xl shrink-0" />
                  ) : (
                    <div className="w-16 h-11 bg-white/5 rounded-xl flex items-center justify-center shrink-0">
                      <Layers size={16} className="text-neutral-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{s.title}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{s.rating} · Series</p>
                  </div>
                  <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
                    <StatusIcon size={11} /> {cfg.label}
                  </span>
                  <div className="flex items-center gap-2">
                    {s.status === 'published' && (
                      <Link to={`/series/${s.id}`} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/15 text-neutral-400 hover:text-white transition-all">
                        <Eye size={14} />
                      </Link>
                    )}
                    <button onClick={() => onManageSeries(s)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#e8a020]/10 hover:bg-[#e8a020]/20 text-[#e8a020] text-xs font-semibold transition-all">
                      <Clapperboard size={13} /> Manage
                    </button>
                    <button onClick={() => onEditSeries(s)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/15 text-neutral-400 hover:text-white transition-all">
                      <Edit2 size={14} />
                    </button>
                    {s.status !== 'published' && (
                      <button onClick={() => deleteSeries(s.id)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/8 hover:bg-red-500/20 text-red-400 transition-all">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
// =============================================
// SERIES DETAIL VIEW (seasons + episodes)
// =============================================
interface EpisodeFilm extends Film {
  series_id: string | null;
  season_number: number;
  episode_number: number | null;
  episode_title: string | null;
}

function SeriesDetailView({ userId, series, onEditSeries, onAddEpisode, onEditEpisode }: {
  userId: string;
  series: Series;
  onEditSeries: (s: Series) => void;
  onAddEpisode: (seriesId: string, seasonNumber: number) => void;
  onEditEpisode: (film: EpisodeFilm) => void;
}) {
  const [episodes, setEpisodes] = useState<EpisodeFilm[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSeasons, setExpandedSeasons] = useState<Set<number>>(new Set([1]));

  useEffect(() => { loadEpisodes(); }, [series.id]);

  async function loadEpisodes() {
    setLoading(true);
    const { data } = await supabase
      .from('films')
      .select('*')
      .eq('series_id', series.id)
      .eq('content_type', 'episode')
      .order('season_number')
      .order('episode_number');
    setEpisodes((data ?? []) as EpisodeFilm[]);
    setLoading(false);
  }

  async function deleteEpisode(id: string) {
    if (!confirm('Delete this episode? This cannot be undone.')) return;
    await supabase.from('films').delete().eq('id', id).eq('uploaded_by', userId);
    loadEpisodes();
  }

  const seasonNumbers = Array.from(new Set(episodes.map(e => e.season_number))).sort((a, b) => a - b);
  const maxSeason = seasonNumbers.length > 0 ? Math.max(...seasonNumbers) : 0;

  function toggleSeason(n: number) {
    setExpandedSeasons(prev => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n); else next.add(n);
      return next;
    });
  }

  function addSeason() {
    const newSeason = maxSeason + 1;
    setExpandedSeasons(prev => new Set([...prev, newSeason]));
    onAddEpisode(series.id, newSeason);
  }

  const statusConfig = {
    published: { label: 'Published', color: 'text-green-400 bg-green-400/10', icon: Check },
    pending: { label: 'Pending Review', color: 'text-yellow-400 bg-yellow-400/10', icon: Clock },
    draft: { label: 'Draft', color: 'text-neutral-400 bg-white/5', icon: Edit2 },
    rejected: { label: 'Rejected', color: 'text-red-400 bg-red-400/10', icon: X },
  };

  return (
    <div>
      {/* Series header */}
      <div className="flex items-start gap-4 mb-8">
        {series.thumbnail_url ? (
          <img src={series.thumbnail_url} alt={series.title} className="w-24 h-16 object-cover rounded-xl shrink-0" />
        ) : (
          <div className="w-24 h-16 bg-white/5 rounded-xl flex items-center justify-center shrink-0">
            <Layers size={20} className="text-neutral-600" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-white">{series.title}</h1>
          <p className="text-neutral-500 text-sm mt-0.5">{series.rating} · {series.language || 'English'}</p>
          {series.description && <p className="text-neutral-400 text-sm mt-1 line-clamp-2">{series.description}</p>}
        </div>
        <button onClick={() => onEditSeries(series)}
          className="flex items-center gap-1.5 px-3 py-2 bg-white/8 hover:bg-white/15 border border-white/10 text-neutral-300 hover:text-white text-sm font-medium rounded-xl transition-all shrink-0">
          <Edit2 size={13} /> Edit Series
        </button>
      </div>

      {/* Season summary */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm font-semibold text-neutral-300">
          {seasonNumbers.length} Season{seasonNumbers.length !== 1 ? 's' : ''} · {episodes.length} Episode{episodes.length !== 1 ? 's' : ''}
        </p>
        <button onClick={addSeason}
          className="flex items-center gap-2 px-4 py-2 bg-[#e8a020] hover:bg-[#d4911a] text-black font-bold text-sm rounded-xl transition-all">
          <Plus size={14} /> Add Season {maxSeason + 1}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[#e8a020]" size={28} /></div>
      ) : seasonNumbers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <List size={48} className="text-neutral-700 mb-4" />
          <p className="text-neutral-400 mb-2">No seasons or episodes yet.</p>
          <p className="text-neutral-600 text-sm mb-6">Add Season 1 to start uploading episodes.</p>
          <button onClick={() => onAddEpisode(series.id, 1)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#e8a020] hover:bg-[#d4911a] text-black font-bold text-sm rounded-xl transition-all">
            <Plus size={15} /> Add Season 1 &amp; First Episode
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {seasonNumbers.map(seasonNum => {
            const seasonEpisodes = episodes.filter(e => e.season_number === seasonNum).sort((a, b) => (a.episode_number ?? 0) - (b.episode_number ?? 0));
            const isExpanded = expandedSeasons.has(seasonNum);
            return (
              <div key={seasonNum} className="bg-[#141414] border border-white/8 rounded-2xl overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4">
                  <button onClick={() => toggleSeason(seasonNum)} className="flex items-center gap-2 flex-1 text-left">
                    <ChevronDown size={16} className={`text-neutral-500 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                    <span className="text-sm font-bold text-white">Season {seasonNum}</span>
                    <span className="text-xs text-neutral-500">{seasonEpisodes.length} episode{seasonEpisodes.length !== 1 ? 's' : ''}</span>
                  </button>
                  <button onClick={() => onAddEpisode(series.id, seasonNum)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/8 hover:bg-white/15 border border-white/10 text-neutral-300 hover:text-white text-xs font-semibold rounded-lg transition-all">
                    <Plus size={12} /> Add Episode
                  </button>
                </div>

                {isExpanded && (
                  <div className="border-t border-white/5">
                    {seasonEpisodes.length === 0 ? (
                      <div className="px-5 py-6 text-center">
                        <p className="text-neutral-500 text-sm">No episodes in this season yet.</p>
                        <button onClick={() => onAddEpisode(series.id, seasonNum)}
                          className="inline-flex items-center gap-2 px-4 py-2 mt-3 bg-[#e8a020] hover:bg-[#d4911a] text-black font-bold text-sm rounded-xl transition-all">
                          <Plus size={13} /> Upload First Episode
                        </button>
                      </div>
                    ) : (
                      <div className="divide-y divide-white/5">
                        {seasonEpisodes.map(ep => {
                          const cfg = statusConfig[ep.status as keyof typeof statusConfig] ?? statusConfig.draft;
                          const StatusIcon = cfg.icon;
                          return (
                            <div key={ep.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/3 transition-colors">
                              <span className="text-xs font-bold text-[#e8a020] bg-[#e8a020]/10 px-2 py-1 rounded shrink-0">
                                E{ep.episode_number ?? '?'}
                              </span>
                              {ep.thumbnail_url ? (
                                <img src={ep.thumbnail_url} alt={ep.episode_title ?? ep.title} className="w-14 h-9 object-cover rounded-lg shrink-0" />
                              ) : (
                                <div className="w-14 h-9 bg-white/5 rounded-lg flex items-center justify-center shrink-0">
                                  <List size={12} className="text-neutral-600" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{ep.episode_title || ep.title}</p>
                                <p className="text-xs text-neutral-600 mt-0.5">
                                  {ep.duration_seconds > 0 ? `${Math.floor(ep.duration_seconds / 60)}m${ep.duration_seconds % 60 > 0 ? ` ${ep.duration_seconds % 60}s` : ''}` : 'Duration TBD'}
                                </p>
                              </div>
                              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                                <StatusIcon size={10} /> {cfg.label}
                              </span>
                              <div className="flex items-center gap-1.5">
                                {ep.status === 'published' && (
                                  <Link to={`/film/${ep.id}`} className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/15 text-neutral-400 hover:text-white transition-all">
                                    <Eye size={13} />
                                  </Link>
                                )}
                                <button onClick={() => onEditEpisode(ep)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/15 text-neutral-400 hover:text-white transition-all">
                                  <Edit2 size={13} />
                                </button>
                                {ep.status !== 'published' && (
                                  <button onClick={() => deleteEpisode(ep.id)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-500/8 hover:bg-red-500/20 text-red-400 transition-all">
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// =============================================
// SERIES FORM
// =============================================
interface SeriesFormProps { userId: string; series?: Series; onSave: () => void; onCancel: () => void; }

function SeriesForm({ userId, series, onSave, onCancel }: SeriesFormProps) {
  const [title, setTitle] = useState(series?.title ?? '');
  const [description, setDescription] = useState(series?.description ?? '');
  const [thumbnailUrl, setThumbnailUrl] = useState(series?.thumbnail_url ?? '');
  const [backdropUrl, setBackdropUrl] = useState(series?.backdrop_url ?? '');
  const [rating, setRating] = useState(series?.rating ?? 'PG');
  const [language, setLanguage] = useState(series?.language ?? 'English');
  const [country, setCountry] = useState(series?.country_of_origin ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const inputCls = "w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-[#e8a020]/60 focus:ring-2 focus:ring-[#e8a020]/10 transition-all";
  const labelCls = "block text-xs font-medium text-neutral-400 mb-1.5";

  async function handleSave(asDraft = false) {
    if (!title.trim()) { setError('Title is required.'); return; }
    setError(''); setSaving(true);
    const payload = {
      title: title.trim(), description, thumbnail_url: thumbnailUrl, backdrop_url: backdropUrl,
      rating, language, country_of_origin: country, creator_id: userId,
      status: asDraft ? 'draft' : 'pending',
    };
    let err;
    if (series) {
      ({ error: err } = await supabase.from('series').update(payload).eq('id', series.id));
    } else {
      ({ error: err } = await supabase.from('series').insert(payload));
    }
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSave();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">{series ? 'Edit Series' : 'Create New Series'}</h1>
      <div className="bg-[#141414] border border-white/8 rounded-2xl p-6 space-y-4">
        <div>
          <label className={labelCls}>Series Title *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Series name" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
            placeholder="Overview of the series..." className={`${inputCls} resize-none`} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className={labelCls}>Language</label><input value={language} onChange={e => setLanguage(e.target.value)} placeholder="English" className={inputCls} /></div>
          <div><label className={labelCls}>Country</label><input value={country} onChange={e => setCountry(e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>Thumbnail URL</label><input value={thumbnailUrl} onChange={e => setThumbnailUrl(e.target.value)} placeholder="https://..." className={inputCls} /></div>
          <div><label className={labelCls}>Backdrop URL</label><input value={backdropUrl} onChange={e => setBackdropUrl(e.target.value)} placeholder="https://..." className={inputCls} /></div>
        </div>
        <div>
          <label className={labelCls}>Content Rating</label>
          <div className="flex gap-2 flex-wrap">
            {CONTENT_RATINGS.map(r => (
              <button key={r} type="button" onClick={() => setRating(r)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${rating === r ? 'bg-[#e8a020] text-black' : 'bg-white/8 text-neutral-400 hover:bg-white/15 hover:text-white border border-white/10'}`}>
                {r}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-blue-500/8 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
          <Info size={15} className="text-blue-400 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-300/80 leading-relaxed">
            After creating the series, use the Manage button to add seasons and upload episodes.
          </p>
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <div className="flex gap-3">
          <button type="button" onClick={onCancel} className="px-5 py-3 bg-white/8 hover:bg-white/15 border border-white/10 text-white font-semibold rounded-xl transition-all">Cancel</button>
          <button type="button" onClick={() => handleSave(true)} disabled={saving} className="px-5 py-3 bg-white/8 hover:bg-white/15 border border-white/10 text-neutral-300 hover:text-white font-semibold rounded-xl transition-all">Save Draft</button>
          <button type="button" onClick={() => handleSave(false)} disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#e8a020] hover:bg-[#d4911a] disabled:opacity-50 text-black font-bold rounded-xl transition-all">
            {saving && <Loader2 size={16} className="animate-spin" />}
            {series ? 'Save Changes' : 'Submit for Review'}
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================
// GENRE PICKER
// =============================================
function GenrePicker({ selectedGenres, onChange }: {
  selectedGenres: string[];
  onChange: (ids: string[]) => void;
}) {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [expandedParent, setExpandedParent] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('genres').select('*').order('sort_order').then(({ data }) => setGenres(data ?? []));
  }, []);

  const parents = genres.filter(g => !g.parent_id);

  function toggleGenre(id: string) {
    onChange(selectedGenres.includes(id) ? selectedGenres.filter(g => g !== id) : [...selectedGenres, id]);
  }

  return (
    <div className="space-y-2">
      {parents.map(parent => {
        const children = genres.filter(g => g.parent_id === parent.id);
        const isParentSelected = selectedGenres.includes(parent.id);
        const selectedChildren = children.filter(c => selectedGenres.includes(c.id));
        const isExpanded = expandedParent === parent.id;

        return (
          <div key={parent.id} className="border border-white/8 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-[#141414]">
              <button type="button" onClick={() => toggleGenre(parent.id)}
                className={`w-5 h-5 shrink-0 rounded flex items-center justify-center border transition-all ${isParentSelected ? 'bg-[#e8a020] border-[#e8a020]' : 'border-white/20 bg-white/5 hover:border-white/40'}`}>
                {isParentSelected && <Check size={11} className="text-black" />}
              </button>
              <span className="flex-1 text-sm font-medium text-white">{parent.name}</span>
              {selectedChildren.length > 0 && (
                <span className="text-xs text-[#e8a020] font-medium">{selectedChildren.length} subgenre{selectedChildren.length > 1 ? 's' : ''}</span>
              )}
              {children.length > 0 && (
                <button type="button" onClick={() => setExpandedParent(isExpanded ? null : parent.id)}
                  className="text-neutral-500 hover:text-white transition-colors">
                  <ChevronDown size={15} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>
            {isExpanded && children.length > 0 && (
              <div className="px-4 py-3 bg-[#0f0f0f] border-t border-white/5 flex flex-wrap gap-2">
                {children.map(child => {
                  const isSelected = selectedGenres.includes(child.id);
                  return (
                    <button key={child.id} type="button" onClick={() => toggleGenre(child.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${isSelected ? 'bg-[#e8a020] text-black' : 'bg-white/8 text-neutral-300 hover:bg-white/15 border border-white/10'}`}>
                      {isSelected && <Check size={10} />}
                      {child.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// =============================================
// CSV IMPORT HELPER
// =============================================
function parseCSVRow(row: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
    else { current += ch; }
  }
  result.push(current.trim());
  return result;
}

interface UploadData {
  title: string; description: string; director: string; duration_seconds: number;
  release_year: number; rating: string; thumbnail_url: string; backdrop_url: string;
  video_url: string; imdb_score: number; tags: string; language: string;
  country_of_origin: string; production_company: string; cast_members: string;
  writer: string; producer: string; cinematographer: string; awards: string;
  festival_selections: string; website_url: string; trailer_url: string;
  subtitle_languages: string; aspect_ratio: string; shooting_format: string;
  genre_other: string;
  content_has_language: boolean; content_has_nudity: boolean; content_has_violence: boolean;
  content_has_drug_use: boolean; content_has_adult_themes: boolean; content_has_flashing_lights: boolean;
  ok_for_children: boolean; age_recommendation: Film['age_recommendation'];
  series_id: string; season_number: number; episode_number: number; episode_title: string;
}

function emptyData(contentType: 'film' | 'episode'): UploadData {
  return {
    title: '', description: '', director: '', duration_seconds: 0,
    release_year: new Date().getFullYear(), rating: 'PG', thumbnail_url: '', backdrop_url: '',
    video_url: '', imdb_score: 7.0, tags: '', language: 'English', country_of_origin: '',
    production_company: '', cast_members: '', writer: '', producer: '', cinematographer: '',
    awards: '', festival_selections: '', website_url: '', trailer_url: '',
    subtitle_languages: '', aspect_ratio: '', shooting_format: '', genre_other: '',
    content_has_language: false, content_has_nudity: false, content_has_violence: false,
    content_has_drug_use: false, content_has_adult_themes: false, content_has_flashing_lights: false,
    ok_for_children: false, age_recommendation: '',
    series_id: '', season_number: 1, episode_number: 1, episode_title: '',
  };
}

// =============================================
// CAST & CREW SPREADSHEET PARSER
// =============================================
interface CastCrewRow { name: string; role: string; character?: string; }

interface ParsedCastCrew {
  director: string;
  writer: string;
  producer: string;
  cinematographer: string;
  cast: string[];
  other: CastCrewRow[];
}

function parseCastCrewSheet(rows: CastCrewRow[]): ParsedCastCrew {
  const result: ParsedCastCrew = { director: '', writer: '', producer: '', cinematographer: '', cast: [], other: [] };
  for (const row of rows) {
    if (!row.name?.trim()) continue;
    const role = (row.role ?? '').toLowerCase().trim();
    const name = row.name.trim();
    if (role.includes('director') && !role.includes('art')) {
      result.director = result.director ? `${result.director}, ${name}` : name;
    } else if (role.includes('writer') || role.includes('screenplay') || role.includes('scenarist')) {
      result.writer = result.writer ? `${result.writer}, ${name}` : name;
    } else if (role.includes('producer') && !role.includes('co-producer')) {
      result.producer = result.producer ? `${result.producer}, ${name}` : name;
    } else if (role.includes('cinematograph') || role.includes(' dp') || role === 'dp' || role.includes('director of photography')) {
      result.cinematographer = name;
    } else if (role.includes('actor') || role.includes('actress') || role.includes('cast') || role === '') {
      result.cast.push(row.character ? `${name} (${row.character})` : name);
    } else {
      result.other.push(row);
    }
  }
  return result;
}

function parseCastCrewFile(file: File): Promise<CastCrewRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' });
        const rows: CastCrewRow[] = json.map(row => {
          const keys = Object.keys(row).map(k => k.toLowerCase().trim());
          const get = (candidates: string[]) => {
            for (const c of candidates) {
              const k = keys.find(k => k === c || k.includes(c));
              if (k) return String(row[Object.keys(row)[keys.indexOf(k)]] ?? '').trim();
            }
            return '';
          };
          return {
            name: get(['name', 'full name', 'actor', 'person']),
            role: get(['role', 'position', 'title', 'job']),
            character: get(['character', 'character name', 'role name']) || undefined,
          };
        }).filter(r => r.name);
        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// =============================================
// FILM UPLOAD FORM
// =============================================
interface FilmUploadFormProps {
  userId: string;
  film?: Film;
  contentType: 'film' | 'episode';
  lockedSeriesId?: string;
  lockedSeasonNumber?: number;
  onSave: () => void;
  onCancel: () => void;
}

function FilmUploadForm({ userId, film, contentType, lockedSeriesId, lockedSeasonNumber, onSave, onCancel }: FilmUploadFormProps) {
  const [data, setData] = useState<UploadData>(() => {
    if (film) {
      return {
        title: film.title, description: film.description, director: film.director,
        duration_seconds: film.duration_seconds, release_year: film.release_year,
        rating: film.rating, thumbnail_url: film.thumbnail_url, backdrop_url: film.backdrop_url,
        video_url: film.video_url, imdb_score: film.imdb_score,
        tags: film.tags?.join(', ') ?? '',
        language: film.language ?? 'English', country_of_origin: film.country_of_origin ?? '',
        production_company: film.production_company ?? '', cast_members: film.cast_members?.join(', ') ?? '',
        writer: film.writer ?? '', producer: film.producer ?? '', cinematographer: film.cinematographer ?? '',
        awards: film.awards ?? '', festival_selections: film.festival_selections?.join(', ') ?? '',
        website_url: film.website_url ?? '', trailer_url: film.trailer_url ?? '',
        subtitle_languages: film.subtitle_languages?.join(', ') ?? '',
        aspect_ratio: film.aspect_ratio ?? '', shooting_format: film.shooting_format ?? '',
        genre_other: film.genre_other ?? '',
        content_has_language: film.content_has_language ?? false,
        content_has_nudity: film.content_has_nudity ?? false,
        content_has_violence: film.content_has_violence ?? false,
        content_has_drug_use: film.content_has_drug_use ?? false,
        content_has_adult_themes: film.content_has_adult_themes ?? false,
        content_has_flashing_lights: film.content_has_flashing_lights ?? false,
        ok_for_children: film.ok_for_children ?? false,
        age_recommendation: film.age_recommendation ?? '',
        series_id: lockedSeriesId ?? (film as Film & { series_id?: string }).series_id ?? '',
        season_number: lockedSeasonNumber ?? (film as Film & { season_number?: number }).season_number ?? 1,
        episode_number: (film as Film & { episode_number?: number }).episode_number ?? 1,
        episode_title: (film as Film & { episode_title?: string }).episode_title ?? '',
      };
    }
    const base = emptyData(contentType);
    if (lockedSeriesId) base.series_id = lockedSeriesId;
    if (lockedSeasonNumber) base.season_number = lockedSeasonNumber;
    return base;
  });

  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>(film?.video_url ? 'url' : 'file');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editingFilmId, setEditingFilmId] = useState<string | null>(film?.id ?? null);
  const [activeSection, setActiveSection] = useState<'basic' | 'episode' | 'genre' | 'production' | 'video' | 'content'>(contentType === 'episode' ? 'episode' : 'basic');

  const [castCrewPreview, setCastCrewPreview] = useState<ParsedCastCrew | null>(null);
  const [castCrewFileName, setCastCrewFileName] = useState('');

  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const castCrewInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.from('categories').select('*').order('sort_order').then(({ data: cats }) => setCategories(cats ?? []));
    if (!lockedSeriesId) {
      supabase.from('series').select('id, title').eq('creator_id', userId).order('created_at', { ascending: false })
        .then(({ data: s }) => setSeriesList((s ?? []) as Series[]));
    }
    if (film?.id) {
      supabase.from('film_categories').select('category_id').eq('film_id', film.id)
        .then(({ data: fc }) => setSelectedCategories((fc ?? []).map(c => c.category_id)));
      supabase.from('film_genres').select('genre_id').eq('film_id', film.id)
        .then(({ data: fg }) => setSelectedGenres((fg ?? []).map(g => g.genre_id)));
    }
  }, []);

  function handleCSVImport(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) { setError('CSV file must have a header row and at least one data row.'); return; }
      const headers = parseCSVRow(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''));
      const values = parseCSVRow(lines[1]);
      const row: Record<string, string> = {};
      headers.forEach((h, i) => { row[h] = values[i] ?? ''; });
      setData(prev => ({
        ...prev,
        title: row['title'] || prev.title,
        description: row['description'] || prev.description,
        director: row['director'] || prev.director,
        writer: row['writer'] || prev.writer,
        producer: row['producer'] || prev.producer,
        cinematographer: row['cinematographer'] || prev.cinematographer,
        production_company: row['production_company'] || prev.production_company,
        cast_members: row['cast_members'] || row['cast'] || prev.cast_members,
        duration_seconds: row['duration_seconds'] ? Number(row['duration_seconds']) : prev.duration_seconds,
        release_year: row['release_year'] ? Number(row['release_year']) : prev.release_year,
        rating: row['rating'] || prev.rating,
        language: row['language'] || prev.language,
        country_of_origin: row['country_of_origin'] || row['country'] || prev.country_of_origin,
        imdb_score: row['imdb_score'] ? Number(row['imdb_score']) : prev.imdb_score,
        tags: row['tags'] || prev.tags,
        awards: row['awards'] || prev.awards,
        festival_selections: row['festival_selections'] || row['festivals'] || prev.festival_selections,
        website_url: row['website_url'] || row['website'] || prev.website_url,
        trailer_url: row['trailer_url'] || row['trailer'] || prev.trailer_url,
        aspect_ratio: row['aspect_ratio'] || prev.aspect_ratio,
        shooting_format: row['shooting_format'] || row['format'] || prev.shooting_format,
        subtitle_languages: row['subtitle_languages'] || row['subtitles'] || prev.subtitle_languages,
        genre_other: row['genre_other'] || row['genre'] || prev.genre_other,
        thumbnail_url: row['thumbnail_url'] || row['thumbnail'] || prev.thumbnail_url,
        backdrop_url: row['backdrop_url'] || row['backdrop'] || prev.backdrop_url,
        video_url: row['video_url'] || row['video'] || prev.video_url,
      }));
    };
    reader.readAsText(file);
  }

  async function handleCastCrewImport(file: File) {
    try {
      const rows = await parseCastCrewFile(file);
      const parsed = parseCastCrewSheet(rows);
      setCastCrewPreview(parsed);
      setCastCrewFileName(file.name);
    } catch {
      setError('Failed to parse cast & crew file. Please check the format.');
    }
  }

  function applyCastCrew() {
    if (!castCrewPreview) return;
    setData(prev => ({
      ...prev,
      director: castCrewPreview.director || prev.director,
      writer: castCrewPreview.writer || prev.writer,
      producer: castCrewPreview.producer || prev.producer,
      cinematographer: castCrewPreview.cinematographer || prev.cinematographer,
      cast_members: castCrewPreview.cast.length > 0 ? castCrewPreview.cast.join(', ') : prev.cast_members,
    }));
    setCastCrewPreview(null);
    setCastCrewFileName('');
  }

  function set<K extends keyof UploadData>(key: K, value: UploadData[K]) {
    setData(prev => ({ ...prev, [key]: value }));
  }

  async function handleSave(asDraft = false) {
    if (!data.title.trim()) { setError('Title is required.'); return; }
    if (contentType === 'episode') {
      if (!data.series_id) { setError('Please select a series for this episode.'); return; }
      if (data.duration_seconds > 900) { setError('Episodes must be 15 minutes (900 seconds) or less. Please check your duration.'); return; }
    }
    setError(''); setSaving(true);

    let videoUrl = data.video_url;
    let videoStoragePath = film?.video_storage_path ?? '';
    let thumbnailUrl = data.thumbnail_url;

    if (uploadMode === 'file' && videoFile) {
      setUploading(true);
      const path = `${userId}/${Date.now()}_${videoFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('film-uploads').upload(path, videoFile, { upsert: false });
      setUploading(false);
      if (uploadError) { setError(`Video upload failed: ${uploadError.message}`); setSaving(false); return; }
      videoStoragePath = uploadData.path;
      videoUrl = '';
    }

    if (thumbnailFile) {
      const path = `${userId}/${Date.now()}_${thumbnailFile.name}`;
      const { data: thumbData, error: thumbError } = await supabase.storage
        .from('film-thumbnails').upload(path, thumbnailFile, { upsert: false });
      if (!thumbError && thumbData) {
        const { data: urlData } = supabase.storage.from('film-thumbnails').getPublicUrl(thumbData.path);
        thumbnailUrl = urlData.publicUrl;
      }
    }

    const toArr = (s: string) => s.split(',').map(t => t.trim()).filter(Boolean);

    const payload: Record<string, unknown> = {
      title: data.title.trim(), description: data.description, director: data.director,
      duration_seconds: data.duration_seconds, release_year: data.release_year, rating: data.rating,
      thumbnail_url: thumbnailUrl, backdrop_url: data.backdrop_url, video_url: videoUrl,
      video_storage_path: videoStoragePath, imdb_score: data.imdb_score, tags: toArr(data.tags),
      language: data.language, country_of_origin: data.country_of_origin,
      production_company: data.production_company, cast_members: toArr(data.cast_members),
      writer: data.writer, producer: data.producer, cinematographer: data.cinematographer,
      awards: data.awards, festival_selections: toArr(data.festival_selections),
      website_url: data.website_url, trailer_url: data.trailer_url,
      subtitle_languages: toArr(data.subtitle_languages), aspect_ratio: data.aspect_ratio,
      shooting_format: data.shooting_format, genre_other: data.genre_other,
      content_has_language: data.content_has_language, content_has_nudity: data.content_has_nudity,
      content_has_violence: data.content_has_violence, content_has_drug_use: data.content_has_drug_use,
      content_has_adult_themes: data.content_has_adult_themes, content_has_flashing_lights: data.content_has_flashing_lights,
      ok_for_children: data.ok_for_children, age_recommendation: data.age_recommendation,
      // New content flags mapped to database columns
      age_tier: data.age_recommendation === 'family' ? 'family' : data.age_recommendation === 'teen' ? 'teen' : 'adult',
      flag_language_mild: data.content_has_language,
      flag_language_strong: data.content_has_language,
      flag_violence: data.content_has_violence,
      flag_gore: data.content_has_violence,
      flag_sexual_content: data.content_has_nudity,
      flag_nudity: data.content_has_nudity,
      flag_drug_use: data.content_has_drug_use,
      flag_alcohol_tobacco: data.content_has_drug_use,
      flag_frightening: data.content_has_flashing_lights,
      flag_thematic_complexity: data.content_has_adult_themes,
      admin_review_status: 'pending_review',
      status: asDraft ? 'draft' : 'pending', uploaded_by: userId,
      content_type: contentType,
    };

    if (contentType === 'episode') {
      payload.series_id = data.series_id || null;
      payload.season_number = data.season_number;
      payload.episode_number = data.episode_number;
      payload.episode_title = data.episode_title.trim();
    } else {
      payload.series_id = null;
      payload.episode_number = null;
      payload.episode_title = null;
    }

    let filmId = film?.id;
    if (film) {
      const { error: e } = await supabase.from('films').update(payload).eq('id', film.id);
      if (e) { setError(e.message); setSaving(false); return; }
    } else {
      const { data: created, error: e } = await supabase.from('films').insert(payload).select('id').maybeSingle();
      if (e || !created) { setError(e?.message ?? 'Failed to create.'); setSaving(false); return; }
      filmId = created.id;
    }

    if (filmId) {
      await supabase.from('film_categories').delete().eq('film_id', filmId);
      if (selectedCategories.length > 0)
        await supabase.from('film_categories').insert(selectedCategories.map(cid => ({ film_id: filmId!, category_id: cid })));
      await supabase.from('film_genres').delete().eq('film_id', filmId);
      if (selectedGenres.length > 0)
        await supabase.from('film_genres').insert(selectedGenres.map(gid => ({ film_id: filmId!, genre_id: gid })));
    }

    setSaving(false);
    if (filmId) setEditingFilmId(filmId);
    onSave();
  }

  const sections: { id: typeof activeSection; label: string }[] = contentType === 'episode'
    ? [
        { id: 'episode', label: 'Episode Info' },
        { id: 'basic', label: 'Film Info' },
        { id: 'genre', label: 'Genres' },
        { id: 'production', label: 'Production' },
        { id: 'video', label: 'Video & Images' },
        { id: 'content', label: 'Content Rating' },
      ]
    : [
        { id: 'basic', label: 'Basic Info' },
        { id: 'genre', label: 'Genres' },
        { id: 'production', label: 'Production' },
        { id: 'video', label: 'Video & Images' },
        { id: 'content', label: 'Content Rating' },
      ];

  const inputCls = "w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-[#e8a020]/60 focus:ring-2 focus:ring-[#e8a020]/10 transition-all";
  const labelCls = "block text-xs font-medium text-neutral-400 mb-1.5";

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-white">{film ? (contentType === 'episode' ? 'Edit Episode' : 'Edit Film') : (contentType === 'episode' ? 'Upload Episode' : 'Upload Film')}</h1>
          {contentType === 'episode' && (
            <p className="text-xs text-[#e8a020] mt-1 flex items-center gap-1.5">
              <Info size={11} /> Episodes must be 15 minutes (900 seconds) or less
            </p>
          )}
        </div>
        <button type="button" onClick={() => csvInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 bg-white/8 hover:bg-white/15 border border-white/10 text-neutral-300 hover:text-white text-sm font-medium rounded-xl transition-all">
          <FileSpreadsheet size={15} className="text-[#e8a020]" /> Import CSV
        </button>
      </div>
      <input ref={csvInputRef} type="file" accept=".csv,.txt" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleCSVImport(f); e.target.value = ''; }} />
      <input ref={castCrewInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleCastCrewImport(f); e.target.value = ''; }} />

      <div className="flex gap-2 overflow-x-auto pb-1 mb-6 mt-6 scrollbar-hide">
        {sections.map(s => (
          <button key={s.id} type="button" onClick={() => setActiveSection(s.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeSection === s.id ? 'bg-[#e8a020] text-black' : 'bg-white/5 text-neutral-400 hover:text-white border border-white/8'}`}>
            {s.label}
          </button>
        ))}
      </div>

      <div className="space-y-5">

        {/* ── EPISODE INFO ── */}
        {activeSection === 'episode' && contentType === 'episode' && (
          <section className="bg-[#141414] border border-white/8 rounded-2xl p-6 space-y-4">
            {lockedSeriesId ? (
              <div className="px-4 py-3 bg-[#e8a020]/8 border border-[#e8a020]/20 rounded-xl flex items-center gap-3">
                <Layers size={15} className="text-[#e8a020] shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-[#e8a020]">Series locked</p>
                  <p className="text-xs text-neutral-400 mt-0.5">This episode will be added to the selected series, Season {lockedSeasonNumber ?? data.season_number}.</p>
                </div>
              </div>
            ) : (
              <div>
                <label className={labelCls}>Series *</label>
                {seriesList.length === 0 ? (
                  <div className="px-4 py-3 bg-yellow-500/8 border border-yellow-500/20 rounded-xl">
                    <p className="text-yellow-300 text-sm">You have no series yet. Create a series first from the dashboard, then come back to upload episodes.</p>
                  </div>
                ) : (
                  <select value={data.series_id} onChange={e => set('series_id', e.target.value)}
                    className={`${inputCls} cursor-pointer`}>
                    <option value="">Select a series...</option>
                    {seriesList.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                  </select>
                )}
              </div>
            )}
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Season Number {lockedSeasonNumber && <span className="text-[#e8a020]">(locked)</span>}</label>
                <input type="number" min={1} value={data.season_number}
                  onChange={e => !lockedSeasonNumber && set('season_number', Number(e.target.value))}
                  readOnly={!!lockedSeasonNumber}
                  className={`${inputCls} ${lockedSeasonNumber ? 'opacity-60 cursor-not-allowed' : ''}`} />
              </div>
              <div>
                <label className={labelCls}>Episode Number</label>
                <input type="number" min={1} value={data.episode_number} onChange={e => set('episode_number', Number(e.target.value))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Duration (seconds) <span className="text-yellow-400">max 900</span></label>
                <input type="number" max={900} value={data.duration_seconds} onChange={e => set('duration_seconds', Number(e.target.value))}
                  className={`${inputCls} ${data.duration_seconds > 900 ? 'border-red-500/60 focus:border-red-500/70' : ''}`} />
                {data.duration_seconds > 900 && <p className="text-red-400 text-xs mt-1">Exceeds 15 minute limit</p>}
              </div>
            </div>
            <div>
              <label className={labelCls}>Episode Title</label>
              <input value={data.episode_title} onChange={e => set('episode_title', e.target.value)} placeholder="e.g. The Beginning" className={inputCls} />
            </div>
            <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-4">
              <p className="text-xs text-neutral-500 mb-1 font-medium">Series Title (shown to viewers)</p>
              <input value={data.title} onChange={e => set('title', e.target.value)} placeholder="The name of the series as it appears on the episode" className={inputCls} />
            </div>
          </section>
        )}

        {/* ── BASIC INFO ── */}
        {activeSection === 'basic' && (
          <section className="bg-[#141414] border border-white/8 rounded-2xl p-6 space-y-4">
            {contentType === 'film' && (
              <div>
                <label className={labelCls}>Title *</label>
                <input value={data.title} onChange={e => set('title', e.target.value)} placeholder="Film title" className={inputCls} />
              </div>
            )}
            <div>
              <label className={labelCls}>{contentType === 'episode' ? 'Episode Description' : 'Description'}</label>
              <textarea value={data.description} onChange={e => set('description', e.target.value)} rows={4}
                placeholder="A brief synopsis..." className={`${inputCls} resize-none`} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className={labelCls}>Director</label><input value={data.director} onChange={e => set('director', e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Release Year</label><input type="number" value={data.release_year} onChange={e => set('release_year', Number(e.target.value))} className={inputCls} /></div>
              {contentType === 'film' && (
                <div><label className={labelCls}>Duration (seconds)</label><input type="number" value={data.duration_seconds} onChange={e => set('duration_seconds', Number(e.target.value))} placeholder="e.g. 1200 = 20 min" className={inputCls} /></div>
              )}
              <div><label className={labelCls}>IMDb Score</label><input type="number" step="0.1" min="0" max="10" value={data.imdb_score} onChange={e => set('imdb_score', Number(e.target.value))} className={inputCls} /></div>
              <div><label className={labelCls}>Language</label><input value={data.language} onChange={e => set('language', e.target.value)} placeholder="English" className={inputCls} /></div>
              <div><label className={labelCls}>Country of Origin</label><input value={data.country_of_origin} onChange={e => set('country_of_origin', e.target.value)} className={inputCls} /></div>
            </div>
            <div>
              <label className={labelCls}>Tags <span className="text-neutral-600">(comma separated)</span></label>
              <input value={data.tags} onChange={e => set('tags', e.target.value)} placeholder="horror, indie, short" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Subtitle Languages <span className="text-neutral-600">(comma separated)</span></label>
              <input value={data.subtitle_languages} onChange={e => set('subtitle_languages', e.target.value)} placeholder="French, Spanish" className={inputCls} />
            </div>
          </section>
        )}

        {/* ── GENRES ── */}
        {activeSection === 'genre' && (
          <section className="bg-[#141414] border border-white/8 rounded-2xl p-6">
            <p className="text-sm text-neutral-400 mb-4">
              Select genre(s). Click the arrow to expand subgenres.
              {selectedGenres.length > 0 && <span className="text-[#e8a020] ml-2">{selectedGenres.length} selected</span>}
            </p>
            <GenrePicker selectedGenres={selectedGenres} onChange={setSelectedGenres} />
            <div className="mt-4">
              <label className={labelCls}>Other / Custom Genre</label>
              <input value={data.genre_other} onChange={e => set('genre_other', e.target.value)} placeholder="e.g. Surrealist body horror" className={inputCls} />
            </div>
            <div className="mt-4">
              <label className={labelCls}>Platform Categories</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {categories.filter(c => c.slug !== 'featured').map(cat => (
                  <button key={cat.id} type="button" onClick={() => setSelectedCategories(prev => prev.includes(cat.id) ? prev.filter(c => c !== cat.id) : [...prev, cat.id])}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${selectedCategories.includes(cat.id) ? 'bg-[#e8a020] text-black' : 'bg-white/8 text-neutral-300 hover:bg-white/15 border border-white/10'}`}>
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── PRODUCTION ── */}
        {activeSection === 'production' && (
          <section className="bg-[#141414] border border-white/8 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/8">
              <div>
                <p className="text-sm font-semibold text-neutral-300">Cast &amp; Crew</p>
                <p className="text-xs text-neutral-500 mt-0.5">Import from spreadsheet or enter manually below</p>
              </div>
              <button type="button" onClick={() => castCrewInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-[#e8a020]/10 hover:bg-[#e8a020]/20 border border-[#e8a020]/25 text-[#e8a020] text-sm font-semibold rounded-xl transition-all">
                <Users size={14} /> Import Cast &amp; Crew
              </button>
            </div>

            {castCrewPreview && (
              <div className="bg-[#0a0a0a] border border-[#e8a020]/20 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-[#e8a020] flex items-center gap-2">
                    <FileSpreadsheet size={13} /> {castCrewFileName} — preview
                  </p>
                  <button type="button" onClick={() => { setCastCrewPreview(null); setCastCrewFileName(''); }} className="text-neutral-500 hover:text-white transition-colors">
                    <X size={14} />
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 gap-2 text-xs">
                  {castCrewPreview.director && <div className="flex gap-2"><span className="text-neutral-500 shrink-0">Director</span><span className="text-white truncate">{castCrewPreview.director}</span></div>}
                  {castCrewPreview.writer && <div className="flex gap-2"><span className="text-neutral-500 shrink-0">Writer</span><span className="text-white truncate">{castCrewPreview.writer}</span></div>}
                  {castCrewPreview.producer && <div className="flex gap-2"><span className="text-neutral-500 shrink-0">Producer</span><span className="text-white truncate">{castCrewPreview.producer}</span></div>}
                  {castCrewPreview.cinematographer && <div className="flex gap-2"><span className="text-neutral-500 shrink-0">DP</span><span className="text-white truncate">{castCrewPreview.cinematographer}</span></div>}
                  {castCrewPreview.cast.length > 0 && (
                    <div className="sm:col-span-2 flex gap-2">
                      <span className="text-neutral-500 shrink-0">Cast ({castCrewPreview.cast.length})</span>
                      <span className="text-white truncate">{castCrewPreview.cast.slice(0, 5).join(', ')}{castCrewPreview.cast.length > 5 ? ` +${castCrewPreview.cast.length - 5} more` : ''}</span>
                    </div>
                  )}
                  {castCrewPreview.other.length > 0 && (
                    <div className="sm:col-span-2 text-neutral-500">{castCrewPreview.other.length} other crew member{castCrewPreview.other.length !== 1 ? 's' : ''} (not imported)</div>
                  )}
                </div>
                <button type="button" onClick={applyCastCrew}
                  className="w-full py-2 bg-[#e8a020] hover:bg-[#d4911a] text-black text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2">
                  <Check size={14} /> Apply to Form
                </button>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className={labelCls}>Writer</label><input value={data.writer} onChange={e => set('writer', e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Producer</label><input value={data.producer} onChange={e => set('producer', e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Cinematographer</label><input value={data.cinematographer} onChange={e => set('cinematographer', e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Production Company</label><input value={data.production_company} onChange={e => set('production_company', e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Aspect Ratio</label><input value={data.aspect_ratio} onChange={e => set('aspect_ratio', e.target.value)} placeholder="e.g. 16:9" className={inputCls} /></div>
              <div><label className={labelCls}>Shooting Format</label><input value={data.shooting_format} onChange={e => set('shooting_format', e.target.value)} placeholder="e.g. Digital 4K" className={inputCls} /></div>
            </div>
            <div><label className={labelCls}>Cast Members <span className="text-neutral-600">(comma separated)</span></label><input value={data.cast_members} onChange={e => set('cast_members', e.target.value)} placeholder="Jane Smith, John Doe" className={inputCls} /></div>
            <div><label className={labelCls}>Awards</label><input value={data.awards} onChange={e => set('awards', e.target.value)} placeholder="e.g. Best Short, Sundance 2024" className={inputCls} /></div>
            <div><label className={labelCls}>Festival Selections <span className="text-neutral-600">(comma separated)</span></label><input value={data.festival_selections} onChange={e => set('festival_selections', e.target.value)} placeholder="Sundance, SXSW" className={inputCls} /></div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className={labelCls}>Film Website</label><input type="url" value={data.website_url} onChange={e => set('website_url', e.target.value)} placeholder="https://" className={inputCls} /></div>
              <div><label className={labelCls}>Trailer URL</label><input type="url" value={data.trailer_url} onChange={e => set('trailer_url', e.target.value)} placeholder="https://" className={inputCls} /></div>
            </div>

            {/* Film Credits — link to XLShorts profiles */}
            <div className="pt-4 border-t border-white/8">
              <p className="text-sm font-semibold text-neutral-300 mb-1">Link Credits to XLShorts Profiles</p>
              <p className="text-xs text-neutral-600 mb-3">Tag registered XLShorts members so they appear on their public profile page. Saves after the film is published.</p>
              <FilmCreditsTagger filmId={editingFilmId} />
            </div>
          </section>
        )}

        {/* ── VIDEO & IMAGES ── */}
        {activeSection === 'video' && (
          <section className="bg-[#141414] border border-white/8 rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-neutral-300 mb-4">Video File</h3>
              <div className="flex gap-2 mb-4">
                {(['file', 'url'] as const).map(m => (
                  <button key={m} type="button" onClick={() => setUploadMode(m)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${uploadMode === m ? 'bg-[#e8a020] text-black' : 'bg-white/8 text-neutral-400 hover:text-white border border-white/10'}`}>
                    {m === 'file' ? 'Upload File' : 'External URL'}
                  </button>
                ))}
              </div>
              {uploadMode === 'file' ? (
                <div>
                  <div onClick={() => videoInputRef.current?.click()}
                    className="border-2 border-dashed border-white/15 hover:border-[#e8a020]/40 rounded-2xl p-10 text-center cursor-pointer transition-all">
                    <Upload size={32} className="text-neutral-600 mx-auto mb-3" />
                    {videoFile ? <p className="text-white font-medium">{videoFile.name}</p> : (
                      <><p className="text-neutral-400">Click to select video file</p><p className="text-neutral-600 text-xs mt-1">MP4, WebM, MOV · Max 5GB</p></>
                    )}
                  </div>
                  <input ref={videoInputRef} type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" onChange={e => setVideoFile(e.target.files?.[0] ?? null)} />
                </div>
              ) : (
                <div>
                  <label className={labelCls}>Video URL</label>
                  <input value={data.video_url} onChange={e => set('video_url', e.target.value)} placeholder="https://..." className={inputCls} />
                  <p className="text-xs text-yellow-500/80 mt-2 flex items-start gap-1.5">
                    <AlertCircle size={12} className="shrink-0 mt-0.5" />
                    External URLs bypass ad delivery. Upload directly to ensure ad revenue.
                  </p>
                </div>
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-300 mb-4">Thumbnail &amp; Backdrop</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Thumbnail (Upload)</label>
                  <div onClick={() => thumbInputRef.current?.click()}
                    className="border border-dashed border-white/15 hover:border-[#e8a020]/40 rounded-xl p-5 text-center cursor-pointer transition-all">
                    {thumbnailFile ? <p className="text-white text-sm">{thumbnailFile.name}</p> : <p className="text-neutral-500 text-sm">Click to upload</p>}
                  </div>
                  <input ref={thumbInputRef} type="file" accept="image/*" className="hidden" onChange={e => setThumbnailFile(e.target.files?.[0] ?? null)} />
                </div>
                <div>
                  <label className={labelCls}>Thumbnail URL</label>
                  <input value={data.thumbnail_url} onChange={e => set('thumbnail_url', e.target.value)} placeholder="https://..." className={inputCls} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Backdrop Image URL</label>
                  <input value={data.backdrop_url} onChange={e => set('backdrop_url', e.target.value)} placeholder="https://..." className={inputCls} />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Content Rating */}
        {activeSection === 'content' && (
          <section className="bg-[#141414] border border-white/8 rounded-2xl p-6 space-y-6">

            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-400 mb-1">Content Accuracy Required</p>
                <p className="text-xs text-red-300/90 leading-relaxed">
                  You are required to accurately describe the content of your film. Misrepresenting content — including marking adult material as family-safe — is a violation of our Creator Terms and <strong>may result in your film being immediately removed and your account permanently banned.</strong> XLShorts reviews flagged content and takes these reports seriously.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-neutral-300 mb-3">Age Tier</h3>
              <div className="grid grid-cols-3 gap-2">
                {([
                  ['family', '👶 Family', 'No adult content of any kind'],
                  ['teen', '🧑 Teen', 'Mild content only'],
                  ['adult', '🔞 Adult', 'Contains adult content'],
                ] as const).map(([val, label, desc]) => (
                  <button key={val} type="button"
                    onClick={() => set('age_recommendation', val)}
                    className={`py-3 px-2 rounded-xl text-sm font-bold transition-all border text-center ${data.age_recommendation === val ? 'bg-[#e8a020] text-black border-[#e8a020]' : 'text-neutral-500 border-white/10 bg-white/3 hover:text-white hover:border-white/20'}`}>
                    <div>{label}</div>
                    <div className={`text-xs font-normal mt-1 ${data.age_recommendation === val ? 'text-black/70' : 'text-neutral-600'}`}>{desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-neutral-300 mb-1">Specific Content — check all that apply</h3>
              <p className="text-xs text-neutral-600 mb-3">Check every element your film contains, even if you selected Family or Teen above.</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {([
                  ['content_has_language', 'Mild language'],
                  ['content_has_language', 'Strong / foul language'],
                  ['content_has_violence', 'Violence'],
                  ['content_has_violence', 'Gore / graphic violence'],
                  ['content_has_nudity', 'Sexual content'],
                  ['content_has_nudity', 'Nudity'],
                  ['content_has_drug_use', 'Drug use'],
                  ['content_has_drug_use', 'Alcohol & tobacco'],
                  ['content_has_flashing_lights', 'Frightening / intense scenes'],
                  ['content_has_adult_themes', 'Mature themes (depression, abuse, suicide, etc.)'],
                ] as [keyof UploadData, string][]).map(([key, label]) => (
                  <label key={label} className="flex items-center gap-3 p-3 bg-[#0a0a0a] rounded-xl border border-white/8 cursor-pointer group hover:border-white/15 transition-all">
                    <div onClick={() => set(key, !data[key])}
                      className={`w-5 h-5 shrink-0 rounded flex items-center justify-center border transition-all ${data[key] ? 'bg-[#e8a020] border-[#e8a020]' : 'border-white/20 bg-white/5 group-hover:border-white/40'}`}>
                      {data[key] && <Check size={11} className="text-black" />}
                    </div>
                    <span className="text-sm text-neutral-300">{label}</span>
                  </label>
                ))}
              </div>
            </div>

          </section>
        )}
        {error && (
          <div className="flex items-start gap-2.5 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl">
            <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button type="button" onClick={onCancel} className="px-5 py-3 bg-white/8 hover:bg-white/15 border border-white/10 text-white font-semibold rounded-xl transition-all">Cancel</button>
          <button type="button" onClick={() => handleSave(true)} disabled={saving} className="px-5 py-3 bg-white/8 hover:bg-white/15 border border-white/10 text-neutral-300 hover:text-white font-semibold rounded-xl transition-all">Save as Draft</button>
          <button type="button" onClick={() => handleSave(false)} disabled={saving || uploading}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#e8a020] hover:bg-[#d4911a] disabled:opacity-50 text-black font-bold rounded-xl transition-all">
            {(saving || uploading) && <Loader2 size={16} className="animate-spin" />}
            {uploading ? 'Uploading...' : film ? 'Submit Changes' : 'Submit for Review'}
          </button>
        </div>
      </div>
    </div>
  );
}

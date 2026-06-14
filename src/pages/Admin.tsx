import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Film, Category, UserRole } from '../types/database';
import { CONTENT_RATINGS } from '../types/database';
import {
  LayoutDashboard, Film as FilmIcon, Tag, Megaphone, Users,
  BarChart2, ChevronRight, Loader2, Check, X, AlertCircle,
  Plus, Edit2, Trash2, Eye, EyeOff, Search, ShieldCheck, UserCheck,
  Clock, UserPlus, Star, GripVertical, ArrowUp, ArrowDown
} from 'lucide-react';

type Tab = 'overview' | 'films' | 'featured' | 'categories' | 'creators' | 'users' | 'ads';

interface CreatorRequest {
  id: string;
  user_id: string;
  name: string;
  reason: string;
  status: string;
  review_note: string;
  created_at: string;
}

interface UserWithRoles {
  user_id: string;
  email: string;
  created_at: string;
  roles: string[];
}

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }

    // Always fetch from DB — never read a stale cache for access decisions
    supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .then(({ data }) => {
        const roles = (data ?? []).map((r: { role: string }) => r.role);
        const adminStatus = roles.includes('admin');
        setIsAdmin(adminStatus);
        sessionStorage.setItem('xl_roles_v2', JSON.stringify({ roles, uid: user.id }));
      });
  }, [user]);

  useEffect(() => {
    if (!isAdmin) return;
    supabase.from('creator_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending')
      .then(({ count }) => setPendingCount(count ?? 0));
  }, [isAdmin]);

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#e8a020]" size={36} />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4 px-4">
        <AlertCircle size={48} className="text-red-400" />
        <h1 className="text-2xl font-bold text-white">Access Denied</h1>
        <p className="text-neutral-400 text-center">You don't have admin privileges.</p>
        <Link to="/" className="px-6 py-2.5 bg-[#e8a020] text-black font-bold rounded-full text-sm transition-all hover:bg-[#d4911a]">
          Go Home
        </Link>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: typeof LayoutDashboard; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'films', label: 'Films', icon: FilmIcon },
    { id: 'featured', label: 'Featured', icon: Star },
    { id: 'categories', label: 'Categories', icon: Tag },
    { id: 'creators', label: 'Creators', icon: UserPlus, badge: pendingCount },
    { id: 'users', label: 'Users & Roles', icon: Users },
    { id: 'ads', label: 'Ads', icon: Megaphone },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="bg-[#141414] border-b border-white/8 px-6 py-4 flex items-center gap-4">
        <Link to="/" className="text-xl font-black tracking-tight text-white">
          XL<span className="text-[#e8a020]">Shorts</span>
        </Link>
        <ChevronRight size={14} className="text-neutral-600" />
        <span className="text-sm font-semibold text-neutral-300 flex items-center gap-2">
          <ShieldCheck size={15} className="text-[#e8a020]" /> Admin Dashboard
        </span>
      </div>

      <div className="flex">
        <aside className="w-56 min-h-[calc(100vh-57px)] bg-[#141414] border-r border-white/8 p-4 shrink-0 hidden md:block">
          <nav className="space-y-1">
            {tabs.map(({ id, label, icon: Icon, badge }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  tab === id ? 'bg-[#e8a020]/10 text-[#e8a020]' : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={16} />
                <span className="flex-1 text-left">{label}</span>
                {badge != null && badge > 0 && (
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#e8a020] text-black text-xs font-bold">
                    {badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#141414] border-t border-white/8 flex z-50">
          {tabs.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors relative ${
                tab === id ? 'text-[#e8a020]' : 'text-neutral-500'
              }`}
            >
              <Icon size={16} />
              <span className="hidden xs:block">{label}</span>
              {badge != null && badge > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#e8a020] text-black text-[10px] font-bold flex items-center justify-center">
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>

        <main className="flex-1 p-6 pb-24 md:pb-6 overflow-auto">
          {tab === 'overview' && <OverviewTab />}
          {tab === 'films' && <FilmsTab />}
          {tab === 'featured' && <FeaturedTab />}
          {tab === 'categories' && <CategoriesTab />}
          {tab === 'creators' && <CreatorsTab currentUserId={user.id} onCountChange={setPendingCount} />}
          {tab === 'users' && <UsersTab currentUserId={user.id} />}
          {tab === 'ads' && <AdsTab />}
        </main>
      </div>
    </div>
  );
}

// =============================================
// OVERVIEW TAB
// =============================================
function OverviewTab() {
  const [stats, setStats] = useState({ films: 0, pending: 0, impressions: 0, pendingCreators: 0 });

  useEffect(() => {
    Promise.all([
      supabase.from('films').select('id', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('films').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('ad_impressions').select('id', { count: 'exact', head: true }),
      supabase.from('creator_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    ]).then(([pub, pend, imp, creq]) => {
      setStats({
        films: pub.count ?? 0,
        pending: pend.count ?? 0,
        impressions: imp.count ?? 0,
        pendingCreators: creq.count ?? 0,
      });
    });
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-8">Dashboard Overview</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Published Films', value: stats.films, color: 'text-[#e8a020]' },
          { label: 'Pending Films', value: stats.pending, color: 'text-yellow-400' },
          { label: 'Ad Impressions', value: stats.impressions, color: 'text-green-400' },
          { label: 'Creator Requests', value: stats.pendingCreators, color: 'text-blue-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[#141414] border border-white/8 rounded-2xl p-5">
            <p className="text-neutral-500 text-sm mb-2">{label}</p>
            <p className={`text-3xl font-black ${color}`}>{value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {(stats.pending > 0 || stats.pendingCreators > 0) && (
        <div className="space-y-3">
          {stats.pending > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-5 flex items-start gap-4">
              <AlertCircle size={20} className="text-yellow-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-300 font-semibold">Films Awaiting Review</p>
                <p className="text-yellow-400/80 text-sm mt-1">
                  {stats.pending} film{stats.pending > 1 ? 's' : ''} awaiting review in the Films tab.
                </p>
              </div>
            </div>
          )}
          {stats.pendingCreators > 0 && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-5 flex items-start gap-4">
              <UserPlus size={20} className="text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-blue-300 font-semibold">Creator Requests Pending</p>
                <p className="text-blue-400/80 text-sm mt-1">
                  {stats.pendingCreators} creator application{stats.pendingCreators > 1 ? 's' : ''} awaiting review in the Creators tab.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================
// FEATURED TAB
// =============================================
function FeaturedTab() {
  const [allFilms, setAllFilms] = useState<Film[]>([]);
  const [featured, setFeatured] = useState<Film[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('films').select('*').eq('status', 'published').order('title');
    const films: Film[] = data ?? [];
    setAllFilms(films);
    setFeatured(films.filter(f => f.featured).sort((a, b) => a.featured_order - b.featured_order));
    setLoading(false);
  }

  function addToFeatured(film: Film) {
    if (featured.length >= 10) { setMsg('Maximum 10 featured films allowed.'); return; }
    if (featured.find(f => f.id === film.id)) return;
    setFeatured(prev => [...prev, { ...film, featured: true, featured_order: prev.length + 1 }]);
    setMsg('');
  }

  function removeFromFeatured(id: string) {
    setFeatured(prev => prev.filter(f => f.id !== id).map((f, i) => ({ ...f, featured_order: i + 1 })));
  }

  function moveUp(index: number) {
    if (index === 0) return;
    setFeatured(prev => {
      const arr = [...prev];
      [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
      return arr.map((f, i) => ({ ...f, featured_order: i + 1 }));
    });
  }

  function moveDown(index: number) {
    setFeatured(prev => {
      if (index >= prev.length - 1) return prev;
      const arr = [...prev];
      [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
      return arr.map((f, i) => ({ ...f, featured_order: i + 1 }));
    });
  }

  async function save() {
    setSaving(true);
    const featuredIds = new Set(featured.map(f => f.id));
    // Clear all featured flags, then set new ones
    await supabase.from('films').update({ featured: false, featured_order: 0 }).eq('featured', true);
    for (const film of featured) {
      await supabase.from('films').update({ featured: true, featured_order: film.featured_order }).eq('id', film.id);
    }
    setSaving(false);
    setMsg(`Saved! ${featured.length} film${featured.length !== 1 ? 's' : ''} will appear in the hero carousel.`);
    load();
  }

  const filteredAvailable = allFilms.filter(f =>
    !featured.find(ff => ff.id === f.id) &&
    (f.title.toLowerCase().includes(search.toLowerCase()) || f.director?.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[#e8a020]" size={28} /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-white">Featured Films</h1>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#e8a020] hover:bg-[#d4911a] disabled:opacity-50 text-black font-bold text-sm rounded-xl transition-all">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          Save Changes
        </button>
      </div>
      <p className="text-neutral-500 text-sm mb-6">Choose 3–10 films to display in the hero carousel on the home screen. Use the arrows to set the order.</p>

      {msg && (
        <div className="mb-4 px-4 py-3 bg-[#e8a020]/10 border border-[#e8a020]/20 rounded-xl text-sm text-[#e8a020]">{msg}</div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Current featured list */}
        <div>
          <h2 className="text-sm font-semibold text-neutral-300 mb-3 flex items-center gap-2">
            <Star size={14} className="text-[#e8a020]" />
            Hero Carousel ({featured.length}/10)
          </h2>
          {featured.length === 0 ? (
            <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center text-neutral-600 text-sm">
              No featured films yet. Add films from the right panel.
            </div>
          ) : (
            <div className="space-y-2">
              {featured.map((film, i) => (
                <div key={film.id} className="flex items-center gap-3 p-3 bg-[#141414] border border-white/8 rounded-xl">
                  <GripVertical size={14} className="text-neutral-600 shrink-0" />
                  <span className="w-5 text-xs text-neutral-500 font-bold text-center">{i + 1}</span>
                  {film.thumbnail_url && (
                    <img src={film.thumbnail_url} alt={film.title} className="w-10 h-14 object-cover rounded-lg shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{film.title}</p>
                    <p className="text-xs text-neutral-500">{film.director}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => moveUp(i)} disabled={i === 0}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/15 text-neutral-400 hover:text-white disabled:opacity-30 transition-all">
                      <ArrowUp size={12} />
                    </button>
                    <button onClick={() => moveDown(i)} disabled={i === featured.length - 1}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/15 text-neutral-400 hover:text-white disabled:opacity-30 transition-all">
                      <ArrowDown size={12} />
                    </button>
                    <button onClick={() => removeFromFeatured(film.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all">
                      <X size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available films */}
        <div>
          <h2 className="text-sm font-semibold text-neutral-300 mb-3">Available Published Films</h2>
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search films..."
              className="w-full pl-9 pr-4 py-2.5 bg-[#0a0a0a] border border-white/10 rounded-xl text-white placeholder-neutral-600 text-sm focus:outline-none focus:border-[#e8a020]/50" />
          </div>
          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {filteredAvailable.map(film => (
              <div key={film.id} className="flex items-center gap-3 p-3 bg-[#141414] border border-white/8 rounded-xl hover:border-white/15 transition-all">
                {film.thumbnail_url && (
                  <img src={film.thumbnail_url} alt={film.title} className="w-10 h-14 object-cover rounded-lg shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{film.title}</p>
                  <p className="text-xs text-neutral-500">{film.director} · {film.release_year}</p>
                </div>
                <button onClick={() => addToFeatured(film)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#e8a020]/10 hover:bg-[#e8a020]/20 text-[#e8a020] text-xs font-medium rounded-lg transition-all border border-[#e8a020]/20">
                  <Plus size={11} /> Add
                </button>
              </div>
            ))}
            {filteredAvailable.length === 0 && (
              <p className="text-neutral-600 text-sm text-center py-6">No films found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================
// FILMS TAB
// =============================================
function FilmsTab() {
  const [films, setFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [reviewFilter, setReviewFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editFilm, setEditFilm] = useState<Film | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  useEffect(() => { loadFilms(); }, []);

  async function loadFilms() {
    setLoading(true);
    const { data } = await supabase.from('films').select('*').order('created_at', { ascending: false });
    setFilms(data ?? []);
    setLoading(false);
  }

  async function setStatus(id: string, status: Film['status'], reason?: string) {
    await supabase.from('films').update({ status, rejection_reason: reason ?? '' }).eq('id', id);
    loadFilms();
  }

  async function setReviewStatus(id: string, reviewStatus: string, note?: string) {
    await supabase.from('films').update({
      admin_review_status: reviewStatus,
      admin_review_note: note ?? null,
      reviewed_at: new Date().toISOString(),
    }).eq('id', id);
    if (reviewStatus === 'approved') await supabase.from('films').update({ status: 'published' }).eq('id', id);
    if (reviewStatus === 'removed') await supabase.from('films').update({ status: 'rejected' }).eq('id', id);
    setReviewingId(null);
    setReviewNote('');
    loadFilms();
  }

  async function toggleFeatured(film: Film) {
    await supabase.from('films').update({ featured: !film.featured }).eq('id', film.id);
    loadFilms();
  }

  async function deleteFilm(id: string) {
    if (!confirm('Delete this film permanently?')) return;
    await supabase.from('films').delete().eq('id', id);
    loadFilms();
  }

  const filtered = films.filter(f => {
    const ff = f as any;
    if (statusFilter !== 'all' && f.status !== statusFilter) return false;
    if (reviewFilter !== 'all' && ff.admin_review_status !== reviewFilter) return false;
    if (search && !f.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const pendingReview = films.filter(f => (f as any).admin_review_status === 'pending_review');

  const statusColors: Record<string, string> = {
    published: 'text-green-400 bg-green-400/10',
    pending: 'text-yellow-400 bg-yellow-400/10',
    draft: 'text-neutral-400 bg-white/5',
    rejected: 'text-red-400 bg-red-400/10',
  };

  const reviewColors: Record<string, string> = {
    approved: 'text-green-400 bg-green-400/10',
    pending_review: 'text-yellow-400 bg-yellow-400/10',
    removed: 'text-red-400 bg-red-400/10',
  };

  function getContentFlags(film: any): string[] {
    const flags = [];
    if (film.flag_language_mild) flags.push('Mild Language');
    if (film.flag_language_strong) flags.push('Strong Language');
    if (film.flag_violence) flags.push('Violence');
    if (film.flag_gore) flags.push('Gore');
    if (film.flag_sexual_content) flags.push('Sexual Content');
    if (film.flag_nudity) flags.push('Nudity');
    if (film.flag_drug_use) flags.push('Drug Use');
    if (film.flag_alcohol_tobacco) flags.push('Alcohol/Tobacco');
    if (film.flag_frightening) flags.push('Frightening');
    if (film.flag_thematic_complexity) flags.push('Mature Themes');
    return flags;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-xl font-bold text-white">Films</h2>
        <button
          onClick={() => { setEditFilm(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-[#e8a020] hover:bg-[#d4911a] text-black font-bold text-sm rounded-xl transition-all"
        >
          <Plus size={15} /> Add Film
        </button>
      </div>

      {/* Pending review alert */}
      {pendingReview.length > 0 && (
        <div className="mb-5 p-4 bg-yellow-500/8 border border-yellow-500/20 rounded-xl flex items-center gap-3">
          <AlertCircle size={16} className="text-yellow-400 shrink-0" />
          <p className="text-sm text-yellow-300">
            <strong>{pendingReview.length} film{pendingReview.length > 1 ? 's' : ''} awaiting content review.</strong> Click "Pending Review" below to see them.
          </p>
          <button onClick={() => setReviewFilter('pending_review')} className="ml-auto px-3 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 text-xs font-bold rounded-lg transition-all">
            View Now
          </button>
        </div>
      )}

      {showForm && (
        <FilmForm
          film={editFilm}
          onSave={() => { setShowForm(false); loadFilms(); }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="flex gap-3 mb-3 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search films..."
            className="pl-9 pr-4 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-white text-sm placeholder-neutral-600 focus:outline-none focus:border-[#e8a020]/50 w-48"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'published', 'pending', 'draft', 'rejected'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${statusFilter === s ? 'bg-[#e8a020] text-black' : 'bg-white/5 text-neutral-400 hover:text-white border border-white/8'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2 mb-5 flex-wrap">
        <span className="text-xs text-neutral-600 self-center mr-1">Review:</span>
        {['all', 'pending_review', 'approved', 'removed'].map(s => (
          <button key={s} onClick={() => setReviewFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${reviewFilter === s ? 'bg-[#e8a020] text-black' : 'bg-white/5 text-neutral-400 hover:text-white border border-white/8'}`}>
            {s === 'pending_review' ? '⚠ Pending Review' : s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[#e8a020]" size={28} /></div>
      ) : (
        <div className="space-y-3">
          {filtered.map(film => {
            const ff = film as any;
            const flags = getContentFlags(ff);
            const isReviewing = reviewingId === film.id;
            return (
              <div key={film.id} className={`p-4 bg-[#141414] border rounded-xl ${ff.admin_review_status === 'pending_review' ? 'border-yellow-500/30' : 'border-white/8'}`}>
                <div className="flex items-start gap-4">
                  {film.thumbnail_url && (
                    <img src={film.thumbnail_url} alt={film.title} className="w-16 h-11 object-cover rounded-lg shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-semibold text-white">{film.title}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[film.status] ?? 'text-neutral-400'}`}>{film.status}</span>
                      {ff.admin_review_status && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${reviewColors[ff.admin_review_status] ?? 'text-neutral-400'}`}>
                          {ff.admin_review_status === 'pending_review' ? '⚠ Pending Review' : ff.admin_review_status}
                        </span>
                      )}
                      {ff.age_tier && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium text-blue-400 bg-blue-400/10 capitalize">{ff.age_tier}</span>
                      )}
                      {film.featured && <span className="px-2 py-0.5 rounded-full text-xs font-medium text-[#e8a020] bg-[#e8a020]/10">Featured</span>}
                    </div>
                    <p className="text-xs text-neutral-500">{film.director} · {film.release_year}</p>
                    {flags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {flags.map(flag => (
                          <span key={flag} className="px-1.5 py-0.5 bg-red-500/10 text-red-400 text-xs rounded">{flag}</span>
                        ))}
                      </div>
                    )}
                    {ff.admin_review_note && (
                      <p className="text-xs text-neutral-500 mt-1 italic">Note: {ff.admin_review_note}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                    {ff.admin_review_status === 'pending_review' && !isReviewing && (
                      <>
                        <button onClick={() => setReviewStatus(film.id, 'approved')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs font-medium rounded-lg transition-all">
                          <Check size={12} /> Approve
                        </button>
                        <button onClick={() => setReviewingId(film.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium rounded-lg transition-all">
                          <X size={12} /> Remove
                        </button>
                      </>
                    )}
                    {ff.admin_review_status === 'approved' && (
                      <button onClick={() => setReviewingId(film.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded-lg transition-all">
                        ⚠ Flag for Review
                      </button>
                    )}
                    {film.status === 'pending' && ff.admin_review_status !== 'pending_review' && (
                      <>
                        <button onClick={() => setStatus(film.id, 'published')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs font-medium rounded-lg transition-all">
                          <Check size={12} /> Publish
                        </button>
                        <button onClick={() => { const r = prompt('Rejection reason (optional):'); setStatus(film.id, 'rejected', r ?? ''); }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium rounded-lg transition-all">
                          <X size={12} /> Reject
                        </button>
                      </>
                    )}
                    <button onClick={() => toggleFeatured(film)} title={film.featured ? 'Remove featured' : 'Add to featured'}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${film.featured ? 'bg-[#e8a020]/20 text-[#e8a020]' : 'bg-white/5 text-neutral-500 hover:text-white'}`}>
                      <BarChart2 size={14} />
                    </button>
                    <button onClick={() => { setEditFilm(film); setShowForm(true); }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/15 text-neutral-400 hover:text-white transition-all">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => deleteFilm(film.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/8 hover:bg-red-500/20 text-red-400 transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Review note input */}
                {isReviewing && (
                  <div className="mt-3 pt-3 border-t border-white/8">
                    <p className="text-xs text-neutral-400 mb-2">Add a note (optional — visible to creator):</p>
                    <textarea
                      value={reviewNote}
                      onChange={e => setReviewNote(e.target.value)}
                      placeholder="e.g. Film contains adult content not accurately reflected in your content flags..."
                      rows={2}
                      className="w-full px-3 py-2 bg-[#0a0a0a] border border-white/10 rounded-xl text-white text-xs placeholder-neutral-600 focus:outline-none focus:border-[#e8a020]/50 resize-none mb-2"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => setReviewStatus(film.id, 'removed', reviewNote)}
                        className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-bold rounded-lg transition-all">
                        Remove Film
                      </button>
                      <button onClick={() => setReviewStatus(film.id, 'pending_review', reviewNote)}
                        className="px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 text-xs font-bold rounded-lg transition-all">
                        Flag for Review
                      </button>
                      <button onClick={() => { setReviewingId(null); setReviewNote(''); }}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-neutral-400 text-xs rounded-lg transition-all">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-neutral-500">No films match this filter.</div>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================
// FILM FORM (admin add/edit)
// =============================================
interface FilmFormProps {
  film: Film | null;
  onSave: () => void;
  onCancel: () => void;
}

function FilmForm({ film, onSave, onCancel }: FilmFormProps) {
  const [data, setData] = useState({
    title: film?.title ?? '',
    description: film?.description ?? '',
    director: film?.director ?? '',
    duration_seconds: film?.duration_seconds ?? 0,
    release_year: film?.release_year ?? new Date().getFullYear(),
    rating: film?.rating ?? 'PG',
    thumbnail_url: film?.thumbnail_url ?? '',
    backdrop_url: film?.backdrop_url ?? '',
    video_url: film?.video_url ?? '',
    imdb_score: film?.imdb_score ?? 7.0,
    tags: film?.tags?.join(', ') ?? '',
    featured: film?.featured ?? false,
    featured_order: film?.featured_order ?? 0,
    status: film?.status ?? 'published',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    if (!data.title.trim()) { setError('Title is required.'); return; }
    setSaving(true);
    const payload = { ...data, tags: data.tags.split(',').map(t => t.trim()).filter(Boolean) };
    if (film) {
      const { error: e } = await supabase.from('films').update(payload).eq('id', film.id);
      if (e) { setError(e.message); setSaving(false); return; }
    } else {
      const { error: e } = await supabase.from('films').insert(payload);
      if (e) { setError(e.message); setSaving(false); return; }
    }
    setSaving(false);
    onSave();
  }

  function field(label: string, key: keyof typeof data, type = 'text', extra?: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
      <div>
        <label className="block text-xs font-medium text-neutral-400 mb-1">{label}</label>
        <input
          type={type}
          value={data[key] as string | number}
          onChange={e => setData(d => ({ ...d, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
          className="w-full px-3 py-2 bg-[#0a0a0a] border border-white/10 rounded-xl text-white text-sm placeholder-neutral-600 focus:outline-none focus:border-[#e8a020]/50 transition-all"
          {...extra}
        />
      </div>
    );
  }

  return (
    <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 mb-6">
      <h3 className="text-lg font-bold text-white mb-5">{film ? 'Edit Film' : 'Add Film'}</h3>
      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        {field('Title *', 'title')}
        {field('Director', 'director')}
        {field('Release Year', 'release_year', 'number')}
        {field('Duration (seconds)', 'duration_seconds', 'number')}
        {field('IMDb Score', 'imdb_score', 'number', { step: '0.1', min: '0', max: '10' })}
        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1">Content Rating</label>
          <select value={data.rating} onChange={e => setData(d => ({ ...d, rating: e.target.value }))} className="w-full px-3 py-2 bg-[#0a0a0a] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#e8a020]/50 transition-all">
            {CONTENT_RATINGS.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1">Status</label>
          <select value={data.status} onChange={e => setData(d => ({ ...d, status: e.target.value as Film['status'] }))} className="w-full px-3 py-2 bg-[#0a0a0a] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#e8a020]/50 transition-all">
            {['draft', 'pending', 'published', 'rejected'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        {field('Thumbnail URL', 'thumbnail_url')}
        {field('Backdrop URL', 'backdrop_url')}
        {field('Video URL', 'video_url')}
        {field('Tags (comma separated)', 'tags')}
      </div>
      <div className="mb-4">
        <label className="block text-xs font-medium text-neutral-400 mb-1">Description</label>
        <textarea value={data.description} onChange={e => setData(d => ({ ...d, description: e.target.value }))} rows={3} className="w-full px-3 py-2 bg-[#0a0a0a] border border-white/10 rounded-xl text-white text-sm placeholder-neutral-600 focus:outline-none focus:border-[#e8a020]/50 transition-all resize-none" />
      </div>
      <div className="flex items-center gap-4 mb-4">
        <label className="flex items-center gap-2 cursor-pointer text-sm text-neutral-300">
          <input type="checkbox" checked={data.featured} onChange={e => setData(d => ({ ...d, featured: e.target.checked }))} className="accent-[#e8a020]" />
          Featured (show in hero)
        </label>
        {data.featured && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-neutral-400">Order:</label>
            <input type="number" value={data.featured_order} onChange={e => setData(d => ({ ...d, featured_order: Number(e.target.value) }))} className="w-16 px-2 py-1 bg-[#0a0a0a] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#e8a020]/50" />
          </div>
        )}
      </div>
      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
      <div className="flex gap-3">
        <button onClick={onCancel} className="px-5 py-2.5 bg-white/8 hover:bg-white/15 border border-white/10 text-white text-sm font-semibold rounded-xl transition-all">Cancel</button>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-[#e8a020] hover:bg-[#d4911a] disabled:opacity-50 text-black text-sm font-bold rounded-xl transition-all">
          {saving && <Loader2 size={14} className="animate-spin" />}
          {film ? 'Save Changes' : 'Create Film'}
        </button>
      </div>
    </div>
  );
}

// =============================================
// CATEGORIES TAB
// =============================================
function CategoriesTab() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('categories').select('*').order('sort_order');
    setCategories(data ?? []);
    setLoading(false);
  }

  async function addCategory() {
    if (!newName.trim()) return;
    setSaving(true);
    const slug = newSlug.trim() || newName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const maxOrder = Math.max(0, ...categories.map(c => c.sort_order));
    await supabase.from('categories').insert({ name: newName.trim(), slug, sort_order: maxOrder + 1 });
    setNewName(''); setNewSlug('');
    setSaving(false);
    load();
  }

  async function deleteCategory(id: string) {
    if (!confirm('Delete this category? Films will not be deleted.')) return;
    await supabase.from('categories').delete().eq('id', id);
    load();
  }

  async function updateOrder(id: string, order: number) {
    await supabase.from('categories').update({ sort_order: order }).eq('id', id);
    load();
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-6">Categories</h2>
      <div className="bg-[#141414] border border-white/8 rounded-2xl p-5 mb-6">
        <h3 className="text-sm font-semibold text-neutral-300 mb-4">Add Category</h3>
        <div className="flex gap-3 flex-wrap">
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Category name" className="flex-1 min-w-40 px-3 py-2 bg-[#0a0a0a] border border-white/10 rounded-xl text-white text-sm placeholder-neutral-600 focus:outline-none focus:border-[#e8a020]/50 transition-all" />
          <input value={newSlug} onChange={e => setNewSlug(e.target.value)} placeholder="slug (optional)" className="w-40 px-3 py-2 bg-[#0a0a0a] border border-white/10 rounded-xl text-white text-sm placeholder-neutral-600 focus:outline-none focus:border-[#e8a020]/50 transition-all" />
          <button onClick={addCategory} disabled={saving || !newName.trim()} className="flex items-center gap-2 px-4 py-2 bg-[#e8a020] hover:bg-[#d4911a] disabled:opacity-50 text-black text-sm font-bold rounded-xl transition-all">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[#e8a020]" size={28} /></div>
      ) : (
        <div className="space-y-2">
          {categories.map(cat => (
            <div key={cat.id} className="flex items-center gap-4 p-4 bg-[#141414] border border-white/8 rounded-xl">
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{cat.name}</p>
                <p className="text-xs text-neutral-500 font-mono">{cat.slug}</p>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-neutral-500">Order:</label>
                <input type="number" defaultValue={cat.sort_order} onBlur={e => updateOrder(cat.id, Number(e.target.value))} className="w-16 px-2 py-1 bg-[#0a0a0a] border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-[#e8a020]/50" />
                <button onClick={() => deleteCategory(cat.id)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/8 hover:bg-red-500/20 text-red-400 transition-all">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================
// CREATORS TAB
// =============================================
function CreatorsTab({ currentUserId, onCountChange }: { currentUserId: string; onCountChange: (n: number) => void }) {
  const [requests, setRequests] = useState<CreatorRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('pending');
  const [actionMsg, setActionMsg] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('creator_requests')
      .select('*')
      .order('created_at', { ascending: false });
    setRequests(data ?? []);
    const pending = (data ?? []).filter(r => r.status === 'pending').length;
    onCountChange(pending);
    setLoading(false);
  }

  async function approve(req: CreatorRequest) {
    const { error: roleErr } = await supabase.from('user_roles').insert({
      user_id: req.user_id,
      role: 'creator',
      granted_by: currentUserId,
    });
    if (roleErr && !roleErr.message.includes('duplicate')) {
      setActionMsg(`Error granting role: ${roleErr.message}`);
      return;
    }
    await supabase.from('creator_requests').update({
      status: 'approved',
      reviewed_by: currentUserId,
      reviewed_at: new Date().toISOString(),
    }).eq('id', req.id);
    setActionMsg(`Approved! ${req.name} now has creator access.`);
    load();
  }

  async function decline(req: CreatorRequest) {
    const note = prompt('Optional decline reason (visible to applicant):') ?? '';
    await supabase.from('creator_requests').update({
      status: 'rejected',
      review_note: note,
      reviewed_by: currentUserId,
      reviewed_at: new Date().toISOString(),
    }).eq('id', req.id);
    setActionMsg('Application declined.');
    load();
  }

  const filtered = requests.filter(r => filter === 'all' || r.status === filter);

  const statusColors: Record<string, string> = {
    pending: 'text-yellow-400 bg-yellow-400/10',
    approved: 'text-green-400 bg-green-400/10',
    rejected: 'text-red-400 bg-red-400/10',
  };
  const StatusIcon: Record<string, typeof Clock> = {
    pending: Clock,
    approved: Check,
    rejected: X,
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-6">Creator Applications</h2>

      {actionMsg && (
        <div className="mb-4 px-4 py-3 bg-[#e8a020]/10 border border-[#e8a020]/25 rounded-xl text-[#e8a020] text-sm flex items-center justify-between">
          {actionMsg}
          <button onClick={() => setActionMsg('')}><X size={14} /></button>
        </div>
      )}

      <div className="flex gap-2 mb-5">
        {['pending', 'approved', 'rejected', 'all'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
              filter === f ? 'bg-[#e8a020] text-black' : 'bg-white/5 text-neutral-400 hover:text-white border border-white/8'
            }`}
          >
            {f} {f !== 'all' && `(${requests.filter(r => r.status === f).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[#e8a020]" size={28} /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-neutral-500">No {filter === 'all' ? '' : filter} applications.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(req => {
            const Icon = StatusIcon[req.status] ?? Clock;
            return (
              <div key={req.id} className="bg-[#141414] border border-white/8 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <p className="text-white font-semibold">{req.name}</p>
                      <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[req.status] ?? ''}`}>
                        <Icon size={11} /> {req.status}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 font-mono mb-3">{req.user_id}</p>
                    <p className="text-sm text-neutral-300 leading-relaxed bg-white/3 border border-white/6 rounded-xl p-3">
                      {req.reason}
                    </p>
                    {req.review_note && (
                      <p className="text-xs text-red-400/80 mt-2 italic">Decline note: {req.review_note}</p>
                    )}
                    <p className="text-xs text-neutral-600 mt-2">Applied {new Date(req.created_at).toLocaleDateString()}</p>
                  </div>
                  {req.status === 'pending' && (
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => approve(req)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/25 text-green-400 text-sm font-medium rounded-xl transition-all"
                      >
                        <Check size={14} /> Approve
                      </button>
                      <button
                        onClick={() => decline(req)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-400 text-sm font-medium rounded-xl transition-all"
                      >
                        <X size={14} /> Decline
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// =============================================
// USERS & ROLES TAB
// =============================================
function UsersTab({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [grantRole, setGrantRole] = useState<'admin' | 'creator'>('creator');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const session = (await supabase.auth.getSession()).data.session;
    const [usersRes, { data: rolesData }] = await Promise.all([
      fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-get-users`,
        { headers: { Authorization: `Bearer ${session?.access_token ?? ''}`, 'Content-Type': 'application/json' } }
      ).then(r => r.json()),
      supabase.from('user_roles').select('*').order('granted_at', { ascending: false }),
    ]);
    setUsers((Array.isArray(usersRes) ? usersRes : []) as UserWithRoles[]);
    setRoles(rolesData ?? []);
    setLoading(false);
  }

  async function grantRoleToUser() {
    if (!selectedUserId) return;
    setSaving(true);
    setMessage('');
    const { error } = await supabase.from('user_roles').insert({ user_id: selectedUserId, role: grantRole, granted_by: currentUserId });
    setSaving(false);
    if (error) {
      setMessage(error.message.includes('duplicate') ? 'User already has this role.' : error.message);
    } else {
      setMessage(`Role "${grantRole}" granted.`);
      setSelectedUserId('');
      load();
    }
  }

  async function revokeRole(id: string) {
    await supabase.from('user_roles').delete().eq('id', id);
    load();
  }

  const filteredUsers = users.filter(u =>
    !search || u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-6">Users &amp; Roles</h2>

      {/* Grant role */}
      <div className="bg-[#141414] border border-white/8 rounded-2xl p-5 mb-8">
        <h3 className="text-sm font-semibold text-neutral-300 mb-4 flex items-center gap-2">
          <UserCheck size={15} className="text-[#e8a020]" /> Grant Role to User
        </h3>

        <div className="mb-3 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setSelectedUserId(''); }}
            placeholder="Search by email..."
            className="w-full pl-9 pr-4 py-2.5 bg-[#0a0a0a] border border-white/10 rounded-xl text-white text-sm placeholder-neutral-600 focus:outline-none focus:border-[#e8a020]/50 transition-all"
          />
        </div>

        {search && filteredUsers.length > 0 && (
          <div className="mb-4 max-h-48 overflow-y-auto rounded-xl border border-white/10 divide-y divide-white/5">
            {filteredUsers.map(u => (
              <button
                key={u.user_id}
                onClick={() => { setSelectedUserId(u.user_id); setSearch(u.email); }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-all hover:bg-white/5 ${selectedUserId === u.user_id ? 'bg-[#e8a020]/5' : ''}`}
              >
                <div>
                  <p className="text-sm text-white">{u.email}</p>
                  <p className="text-xs text-neutral-500">Joined {new Date(u.created_at).toLocaleDateString()}</p>
                </div>
                {u.roles.length > 0 && (
                  <div className="flex gap-1">
                    {u.roles.map(r => (
                      <span key={r} className={`px-2 py-0.5 rounded-full text-xs font-medium ${r === 'admin' ? 'text-[#e8a020] bg-[#e8a020]/10' : 'text-blue-400 bg-blue-400/10'}`}>{r}</span>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-3 flex-wrap">
          <select
            value={grantRole}
            onChange={e => setGrantRole(e.target.value as 'admin' | 'creator')}
            className="px-3 py-2.5 bg-[#0a0a0a] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#e8a020]/50"
          >
            <option value="creator">Creator</option>
            <option value="admin">Admin</option>
          </select>
          <button
            onClick={grantRoleToUser}
            disabled={saving || !selectedUserId}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#e8a020] hover:bg-[#d4911a] disabled:opacity-50 text-black text-sm font-bold rounded-xl transition-all"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Grant Role
          </button>
        </div>
        {message && <p className="text-sm text-neutral-400 mt-3">{message}</p>}
      </div>

      {/* Active roles */}
      <h3 className="text-sm font-semibold text-neutral-400 mb-3">Active Role Assignments</h3>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[#e8a020]" size={28} /></div>
      ) : (
        <div className="space-y-2">
          {roles.length === 0 && <p className="text-neutral-500 text-center py-8">No roles assigned yet.</p>}
          {roles.map(role => {
            const userInfo = users.find(u => u.user_id === role.user_id);
            return (
              <div key={role.id} className="flex items-center gap-4 p-4 bg-[#141414] border border-white/8 rounded-xl">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium">{userInfo?.email ?? role.user_id}</p>
                  <p className="text-xs text-neutral-500 mt-0.5 font-mono">{role.user_id}</p>
                  <p className="text-xs text-neutral-600 mt-0.5">Granted {new Date(role.granted_at).toLocaleDateString()}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  role.role === 'admin' ? 'bg-[#e8a020]/10 text-[#e8a020]' : 'bg-blue-500/10 text-blue-400'
                }`}>
                  {role.role}
                </span>
                {role.user_id !== currentUserId && (
                  <button onClick={() => revokeRole(role.id)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/8 hover:bg-red-500/20 text-red-400 transition-all">
                    <Trash2 size={14} />
                  </button>
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
// ADS TAB
// =============================================
function AdsTab() {
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editAd, setEditAd] = useState<any>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('ads').select('*').order('created_at', { ascending: false });
    setAds(data ?? []);
    setLoading(false);
  }

  async function toggleActive(id: string, active: boolean) {
    await supabase.from('ads').update({ active: !active }).eq('id', id);
    load();
  }

  async function deleteAd(id: string) {
    if (!confirm('Delete this ad?')) return;
    await supabase.from('ads').delete().eq('id', id);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Ads</h2>
        <button onClick={() => { setEditAd(null); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 bg-[#e8a020] hover:bg-[#d4911a] text-black font-bold text-sm rounded-xl transition-all">
          <Plus size={15} /> Add Ad
        </button>
      </div>

      {showForm && <AdForm ad={editAd} onSave={() => { setShowForm(false); load(); }} onCancel={() => setShowForm(false)} />}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[#e8a020]" size={28} /></div>
      ) : (
        <div className="space-y-2">
          {ads.map(ad => (
            <div key={ad.id} className="flex items-center gap-4 p-4 bg-[#141414] border border-white/8 rounded-xl">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: ad.accent_color ?? '#e8a020' }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{ad.title}</p>
                <p className="text-xs text-neutral-500">{ad.advertiser} · {ad.type} · {ad.duration_seconds}s</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ad.active ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-neutral-500'}`}>
                {ad.active ? 'Active' : 'Inactive'}
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleActive(ad.id, ad.active)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/15 text-neutral-400 hover:text-white transition-all">
                  {ad.active ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button onClick={() => { setEditAd(ad); setShowForm(true); }} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/15 text-neutral-400 hover:text-white transition-all">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => deleteAd(ad.id)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/8 hover:bg-red-500/20 text-red-400 transition-all">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {ads.length === 0 && <p className="text-center text-neutral-500 py-8">No ads yet.</p>}
        </div>
      )}
    </div>
  );
}

function AdForm({ ad, onSave, onCancel }: { ad: any; onSave: () => void; onCancel: () => void }) {
  const [data, setData] = useState({
    title: ad?.title ?? '',
    advertiser: ad?.advertiser ?? '',
    tagline: ad?.tagline ?? '',
    type: ad?.type ?? 'pre-roll',
    duration_seconds: ad?.duration_seconds ?? 15,
    image_url: ad?.image_url ?? '',
    accent_color: ad?.accent_color ?? '#e8a020',
    active: ad?.active ?? true,
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    if (ad) {
      await supabase.from('ads').update(data).eq('id', ad.id);
    } else {
      await supabase.from('ads').insert(data);
    }
    setSaving(false);
    onSave();
  }

  return (
    <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 mb-6">
      <h3 className="text-lg font-bold text-white mb-5">{ad ? 'Edit Ad' : 'Create Ad'}</h3>
      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        {(['title', 'advertiser', 'tagline', 'image_url', 'accent_color'] as const).map(key => (
          <div key={key}>
            <label className="block text-xs font-medium text-neutral-400 mb-1 capitalize">{key.replace('_', ' ')}</label>
            <input value={data[key]} onChange={e => setData(d => ({ ...d, [key]: e.target.value }))} className="w-full px-3 py-2 bg-[#0a0a0a] border border-white/10 rounded-xl text-white text-sm placeholder-neutral-600 focus:outline-none focus:border-[#e8a020]/50 transition-all" />
          </div>
        ))}
        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1">Type</label>
          <select value={data.type} onChange={e => setData(d => ({ ...d, type: e.target.value }))} className="w-full px-3 py-2 bg-[#0a0a0a] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#e8a020]/50 transition-all">
            <option value="pre-roll">Pre-roll</option>
            <option value="mid-roll">Mid-roll</option>
            <option value="both">Both</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1">Duration (seconds)</label>
          <input type="number" value={data.duration_seconds} onChange={e => setData(d => ({ ...d, duration_seconds: Number(e.target.value) }))} className="w-full px-3 py-2 bg-[#0a0a0a] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#e8a020]/50 transition-all" />
        </div>
      </div>
      <div className="flex items-center gap-3 mb-4">
        <label className="flex items-center gap-2 cursor-pointer text-sm text-neutral-300">
          <input type="checkbox" checked={data.active} onChange={e => setData(d => ({ ...d, active: e.target.checked }))} className="accent-[#e8a020]" /> Active
        </label>
      </div>
      <div className="flex gap-3">
        <button onClick={onCancel} className="px-5 py-2.5 bg-white/8 hover:bg-white/15 border border-white/10 text-white text-sm font-semibold rounded-xl transition-all">Cancel</button>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-[#e8a020] hover:bg-[#d4911a] disabled:opacity-50 text-black text-sm font-bold rounded-xl transition-all">
          {saving && <Loader2 size={14} className="animate-spin" />}
          {ad ? 'Save Changes' : 'Create Ad'}
        </button>
      </div>
    </div>
  );
}

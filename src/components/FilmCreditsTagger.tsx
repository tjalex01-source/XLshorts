import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Plus, X, Link as LinkIcon } from 'lucide-react';

interface Credit {
  id?: string;
  name: string;
  role: string;
  character_name: string;
  profile_id: string | null;
  profile_slug?: string | null;
}

interface Props {
  filmId: string | null;
}

const ROLES = ['director', 'writer', 'producer', 'actor', 'cinematographer', 'editor', 'composer', 'other'];

export default function FilmCreditsTagger({ filmId }: Props) {
  const [credits, setCredits] = useState<Credit[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [addingFor, setAddingFor] = useState<number | null>(null);
  const [newCredit, setNewCredit] = useState<Credit>({ name: '', role: 'director', character_name: '', profile_id: null });

  useEffect(() => {
    if (filmId) loadCredits();
  }, [filmId]);

  async function loadCredits() {
    if (!filmId) return;
    setLoading(true);
    const { data } = await supabase
      .from('film_credits')
      .select('id, name, role, character_name, profile_id, xlshorts_profiles(slug)')
      .eq('film_id', filmId)
      .order('billing_order');
    setCredits((data ?? []).map((c: any) => ({
      ...c,
      profile_slug: c.xlshorts_profiles?.slug ?? null,
    })));
    setLoading(false);
  }

  async function searchProfiles(q: string) {
    if (q.length < 2) { setSearchResults([]); return; }
    const { data } = await supabase
      .from('xlshorts_profiles')
      .select('id, name, avatar_letter, avatar_color, slug')
      .ilike('name', `%${q}%`)
      .limit(5);
    setSearchResults(data ?? []);
  }

  async function addCredit() {
    if (!filmId || !newCredit.name.trim()) return;
    const { data } = await supabase
      .from('film_credits')
      .insert({
        film_id: filmId,
        name: newCredit.name.trim(),
        role: newCredit.role,
        character_name: newCredit.character_name.trim() || null,
        profile_id: newCredit.profile_id,
        billing_order: credits.length,
      })
      .select()
      .single();
    if (data) {
      setCredits(prev => [...prev, { ...newCredit, id: data.id }]);
      setNewCredit({ name: '', role: 'director', character_name: '', profile_id: null });
      setSearch('');
      setSearchResults([]);
      setAddingFor(null);
    }
  }

  async function removeCredit(id: string) {
    await supabase.from('film_credits').delete().eq('id', id);
    setCredits(prev => prev.filter(c => c.id !== id));
  }

  const roleColors: Record<string, string> = {
    director: 'text-[#e8a020] bg-[#e8a020]/10',
    actor: 'text-blue-400 bg-blue-400/10',
    writer: 'text-green-400 bg-green-400/10',
    producer: 'text-purple-400 bg-purple-400/10',
    cinematographer: 'text-teal-400 bg-teal-400/10',
    editor: 'text-pink-400 bg-pink-400/10',
    composer: 'text-orange-400 bg-orange-400/10',
    other: 'text-neutral-400 bg-white/5',
  };

  if (!filmId) return (
    <div className="p-4 bg-[#0a0a0a] rounded-xl border border-white/8 text-sm text-neutral-600 text-center">
      Save your film first to add credits.
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Existing credits */}
      {credits.length > 0 && (
        <div className="space-y-2">
          {credits.map((c, i) => (
            <div key={c.id ?? i} className="flex items-center gap-3 px-3 py-2.5 bg-[#0a0a0a] rounded-xl border border-white/8">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-white">{c.name}</span>
                  {c.profile_id && c.profile_slug && (
                    <a href={`/people/${c.profile_slug}`} target="_blank" rel="noopener noreferrer"
                      className="text-[#e8a020] hover:text-[#d4911a]">
                      <LinkIcon size={11} />
                    </a>
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${roleColors[c.role] ?? roleColors.other}`}>
                    {c.role}
                  </span>
                  {c.character_name && (
                    <span className="text-xs text-neutral-500">as {c.character_name}</span>
                  )}
                </div>
              </div>
              <button onClick={() => c.id && removeCredit(c.id)}
                className="w-6 h-6 flex items-center justify-center text-neutral-600 hover:text-red-400 transition-colors shrink-0">
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add credit form */}
      <div className="p-3 bg-[#0a0a0a] rounded-xl border border-white/8 space-y-3">
        <p className="text-xs text-neutral-500 font-medium">Add a credit</p>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-neutral-600 mb-1">Role</label>
            <select
              value={newCredit.role}
              onChange={e => setNewCredit(p => ({ ...p, role: e.target.value }))}
              className="w-full px-3 py-2 bg-[#141414] border border-white/10 rounded-lg text-white text-sm capitalize focus:outline-none focus:border-[#e8a020]/50"
            >
              {ROLES.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
            </select>
          </div>
          {newCredit.role === 'actor' && (
            <div>
              <label className="block text-xs text-neutral-600 mb-1">Character name</label>
              <input
                type="text"
                value={newCredit.character_name}
                onChange={e => setNewCredit(p => ({ ...p, character_name: e.target.value }))}
                placeholder="optional"
                className="w-full px-3 py-2 bg-[#141414] border border-white/10 rounded-lg text-white text-sm placeholder-neutral-600 focus:outline-none focus:border-[#e8a020]/50"
              />
            </div>
          )}
        </div>

        {/* Name / profile search */}
        <div className="relative">
          <label className="block text-xs text-neutral-600 mb-1">Name — type to search XLShorts profiles or enter manually</label>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" />
            <input
              type="text"
              value={newCredit.profile_id ? newCredit.name : search}
              onChange={e => {
                if (newCredit.profile_id) {
                  setNewCredit(p => ({ ...p, profile_id: null, name: '' }));
                }
                setSearch(e.target.value);
                setNewCredit(p => ({ ...p, name: e.target.value }));
                searchProfiles(e.target.value);
              }}
              placeholder="Search profiles or type name..."
              className="w-full pl-8 pr-4 py-2 bg-[#141414] border border-white/10 rounded-lg text-white text-sm placeholder-neutral-600 focus:outline-none focus:border-[#e8a020]/50"
            />
          </div>

          {/* Search results dropdown */}
          {searchResults.length > 0 && !newCredit.profile_id && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#141414] border border-white/10 rounded-xl overflow-hidden z-10">
              {searchResults.map(p => (
                <button key={p.id} type="button"
                  onClick={() => {
                    setNewCredit(prev => ({ ...prev, name: p.name, profile_id: p.id }));
                    setSearch(p.name);
                    setSearchResults([]);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                    style={{ backgroundColor: p.avatar_color, color: '#000' }}>
                    {p.avatar_letter}
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">{p.name}</p>
                    <p className="text-xs text-neutral-500">XLShorts profile</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {newCredit.profile_id && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#e8a020]/10 border border-[#e8a020]/20 rounded-lg">
            <LinkIcon size={12} className="text-[#e8a020]" />
            <span className="text-xs text-[#e8a020]">Linked to XLShorts profile: {newCredit.name}</span>
            <button onClick={() => { setNewCredit(p => ({ ...p, profile_id: null, name: '' })); setSearch(''); }}
              className="ml-auto text-[#e8a020]/60 hover:text-[#e8a020]"><X size={12} /></button>
          </div>
        )}

        <button
          type="button"
          onClick={addCredit}
          disabled={!newCredit.name.trim()}
          className="w-full flex items-center justify-center gap-2 py-2 bg-white/8 hover:bg-white/15 disabled:opacity-30 text-white text-sm font-medium rounded-lg transition-all border border-white/10"
        >
          <Plus size={14} /> Add Credit
        </button>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User, Edit2, Shield, Lock, Bell, Instagram, Youtube, Twitter, Music2,
  Clapperboard, ChevronRight, Loader2, Check, AlertCircle, Clock,
  Send, LogOut, Plus, X, RefreshCw, Camera
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import { supabase } from '../lib/supabase';
import { ProfileAvatar, PRESET_AVATARS, ProfileForm as ProfileFormFull } from '../components/ProfileSelector';
import type { Profile } from '../types/database';

function buildPinHash(pin: string): string {
  let h = 0;
  for (let i = 0; i < pin.length; i++) {
    h = (Math.imul(31, h) + pin.charCodeAt(i)) | 0;
  }
  return `pin_${Math.abs(h).toString(36)}_${pin.length}`;
}

const GENRES = [
  { slug: 'action', name: 'Action' },
  { slug: 'horror', name: 'Horror' },
  { slug: 'thriller', name: 'Thriller' },
  { slug: 'dark-comedy', name: 'Dark Comedy' },
  { slug: 'romantic-comedy', name: 'Romantic Comedy' },
  { slug: 'social-drama', name: 'Social Drama' },
  { slug: 'family-drama', name: 'Family Drama' },
  { slug: 'psychological-thriller', name: 'Psychological Thriller' },
  { slug: 'sci-fi', name: 'Sci-Fi' },
  { slug: 'cyberpunk', name: 'Cyberpunk' },
  { slug: 'dystopian', name: 'Dystopian' },
  { slug: 'period-drama', name: 'Period Drama' },
  { slug: 'documentary', name: 'Documentary' },
  { slug: 'animation', name: 'Animation' },
  { slug: 'noir', name: 'Noir' },
  { slug: 'satire', name: 'Satire' },
];

// ─────────────────────────────────────────────
// Profile Edit Panel
// ─────────────────────────────────────────────

const AVATAR_COLORS = [
  '#e8a020', '#dc2626', '#16a34a', '#2563eb',
  '#db2777', '#0891b2', '#ea580c', '#65a30d',
  '#0f766e', '#b45309',
];

function ProfileEditPanel({ profile, userId, onClose }: { profile: Profile; userId: string; onClose: () => void }) {
  const { updateProfile } = useProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bio, setBio] = useState(profile.bio ?? '');
  const [avatarIcon, setAvatarIcon] = useState<string | null>(profile.avatar_icon ?? null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url ?? null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [color, setColor] = useState(profile.avatar_color);
  const [instagram, setInstagram] = useState(profile.social_instagram ?? '');
  const [tiktok, setTiktok] = useState(profile.social_tiktok ?? '');
  const [youtube, setYoutube] = useState(profile.social_youtube ?? '');
  const [socialX, setSocialX] = useState(profile.social_x ?? '');
  const [facebook, setFacebook] = useState(profile.social_facebook ?? '');
  const [genres, setGenres] = useState<string[]>(profile.preferred_genres ?? []);
  const [notifyNewFilms, setNotifyNewFilms] = useState(profile.notify_new_films ?? false);
  const [newPin, setNewPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const letter = profile.avatar_letter;
  const previewIcon = PRESET_AVATARS.find(a => a.id === avatarIcon);

  async function handlePhotoUpload(file: File) {
    if (!file.type.startsWith('image/')) return;
    setUploadingPhoto(true);
    try {
      const path = `${userId}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) { console.error(uploadError); return; }
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      setAvatarUrl(data.publicUrl);
    } finally {
      setUploadingPhoto(false);
    }
  }

  function toggleGenre(slug: string) {
    setGenres(prev => prev.includes(slug) ? prev.filter(g => g !== slug) : [...prev, slug]);
  }

  async function handleSave() {
    if (newPin && !/^\d{4}$/.test(newPin)) { setPinError('PIN must be exactly 4 digits.'); return; }
    setPinError('');
    setSaving(true);

    const pinUpdate = newPin ? { pin_hash: buildPinHash(newPin) } : {};

    await updateProfile(profile.id, {
      bio: bio.trim(),
      avatar_color: color,
      avatar_icon: avatarIcon,
      avatar_url: avatarUrl,
      social_instagram: instagram.trim(),
      social_tiktok: tiktok.trim(),
      social_youtube: youtube.trim(),
      social_x: socialX.trim(),
      social_facebook: facebook.trim(),
      preferred_genres: genres,
      notify_new_films: notifyNewFilms,
      ...pinUpdate,
    } as Partial<Profile>);
    setSaving(false);
    setSaved(true);
    setNewPin('');
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#141414] border border-white/10 rounded-2xl w-full max-w-lg p-6 my-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Edit Profile</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/8 hover:bg-white/15 text-neutral-400 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Avatar */}
          <div>
            <p className="text-sm font-medium text-neutral-400 mb-3">Avatar</p>
            <div className="flex items-center gap-4 mb-4">
              {/* Photo upload */}
              <div className="relative shrink-0">
                {avatarUrl ? (
                  <div className="relative w-20 h-20">
                    <img src={avatarUrl} alt="Profile photo" className="w-20 h-20 rounded-2xl object-cover" />
                    <button
                      onClick={() => setAvatarUrl(null)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors"
                    >
                      <X size={11} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="w-20 h-20 rounded-2xl flex flex-col items-center justify-center bg-white/8 hover:bg-white/15 border-2 border-dashed border-white/20 hover:border-white/40 transition-all disabled:opacity-50"
                  >
                    {uploadingPhoto ? <Loader2 size={18} className="animate-spin text-[#e8a020]" /> : <>
                      <Camera size={16} className="text-neutral-400 mb-1" />
                      <span className="text-[10px] text-neutral-500 text-center">Photo</span>
                    </>}
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f); }} className="hidden" />
              </div>

              {/* Emoji/letter preview */}
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-lg relative overflow-hidden shrink-0"
                style={{ backgroundColor: color }}
              >
                {previewIcon ? previewIcon.icon : <span className="text-3xl font-black text-black">{letter}</span>}
              </div>

              <div className="flex-1">
                <p className="text-xs text-neutral-500 mb-1.5">Background color</p>
                <div className="flex gap-1.5 flex-wrap">
                  {AVATAR_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className="w-5 h-5 rounded-full transition-transform hover:scale-110"
                      style={{ backgroundColor: c, outline: color === c ? '2px solid white' : 'none', outlineOffset: 2 }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-9 gap-1.5">
              <button
                onClick={() => setAvatarIcon(null)}
                className={`aspect-square rounded-lg flex items-center justify-center text-sm transition-all ${!avatarIcon ? 'ring-2 ring-[#e8a020] bg-[#e8a020]/10' : 'bg-white/5 hover:bg-white/10'}`}
              >
                <User size={14} className={!avatarIcon ? 'text-[#e8a020]' : 'text-neutral-400'} />
              </button>
              {PRESET_AVATARS.map(a => (
                <button
                  key={a.id}
                  onClick={() => setAvatarIcon(a.id)}
                  className={`aspect-square rounded-lg flex items-center justify-center text-lg transition-all ${avatarIcon === a.id ? 'ring-2 ring-[#e8a020] bg-[#e8a020]/10' : 'bg-white/5 hover:bg-white/10'}`}
                  title={a.label}
                >
                  {a.icon}
                </button>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-1.5">Bio</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              maxLength={160}
              rows={2}
              placeholder="A little about yourself..."
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-[#e8a020]/60 resize-none text-sm transition-all"
            />
          </div>

          {/* Genres */}
          <div>
            <p className="text-sm font-medium text-neutral-400 mb-2">Favorite Genres</p>
            <div className="flex flex-wrap gap-1.5">
              {GENRES.map(g => {
                const active = genres.includes(g.slug);
                return (
                  <button
                    key={g.slug}
                    onClick={() => toggleGenre(g.slug)}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${active ? 'bg-[#e8a020] text-black' : 'bg-white/8 text-neutral-400 hover:bg-white/15 hover:text-white border border-white/10'}`}
                  >
                    {active && '✓ '}{g.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notify */}
          <div
            className={`flex items-center justify-between px-4 py-3 rounded-xl border cursor-pointer transition-all ${notifyNewFilms ? 'border-[#e8a020]/50 bg-[#e8a020]/5' : 'border-white/10 bg-white/3'}`}
            onClick={() => setNotifyNewFilms(v => !v)}
          >
            <div className="flex items-center gap-3">
              <Bell size={16} className={notifyNewFilms ? 'text-[#e8a020]' : 'text-neutral-500'} />
              <span className="text-sm font-medium text-white">Notify on new releases in my genres</span>
            </div>
            <div className={`w-9 h-5 rounded-full transition-colors duration-200 flex items-center ${notifyNewFilms ? 'bg-[#e8a020]' : 'bg-white/15'}`}>
              <div className={`w-3.5 h-3.5 rounded-full bg-white mx-0.5 transition-transform duration-200 ${notifyNewFilms ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          </div>

          {/* Social */}
          <div>
            <p className="text-sm font-medium text-neutral-400 mb-3">Social Links</p>
            <div className="space-y-2.5">
              {[
                { icon: Instagram, label: 'Instagram', value: instagram, set: setInstagram, placeholder: '@username' },
                { icon: Music2, label: 'TikTok', value: tiktok, set: setTiktok, placeholder: '@username' },
                { icon: Youtube, label: 'YouTube', value: youtube, set: setYoutube, placeholder: 'channel name or URL' },
                { icon: Twitter, label: 'X / Twitter', value: socialX, set: setSocialX, placeholder: '@handle' },
              ].map(({ icon: Icon, label, value, set, placeholder }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon size={14} className="text-neutral-500 shrink-0" />
                  <input
                    type="text"
                    value={value}
                    onChange={e => set(e.target.value)}
                    placeholder={placeholder}
                    className="flex-1 px-3 py-2 bg-[#0a0a0a] border border-white/10 rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:border-[#e8a020]/60 text-sm transition-all"
                  />
                </div>
              ))}
              <div className="flex items-center gap-2">
                <div className="w-[14px] h-[14px] rounded text-[10px] font-black text-white bg-[#1877F2] flex items-center justify-center shrink-0">f</div>
                <input
                  type="url"
                  autoComplete="url"
                  value={facebook}
                  onChange={e => setFacebook(e.target.value)}
                  placeholder="https://facebook.com/yourprofile"
                  className="flex-1 px-3 py-2 bg-[#0a0a0a] border border-white/10 rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:border-[#e8a020]/60 text-sm transition-all"
                />
              </div>
            </div>
          </div>

          {/* PIN Management */}
          <div>
            <p className="text-sm font-medium text-neutral-400 mb-1.5 flex items-center gap-2">
              <Lock size={13} /> Profile PIN
              {profile.pin_hash && <span className="text-xs text-emerald-400 font-normal">Set</span>}
            </p>
            <input
              type="password"
              inputMode="numeric"
              value={newPin}
              onChange={e => { setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setPinError(''); }}
              placeholder={profile.pin_hash ? 'Enter new PIN to change' : '4-digit PIN (optional)'}
              maxLength={4}
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-[#e8a020]/60 text-sm transition-all tracking-widest"
            />
            {pinError && <p className="text-red-400 text-xs mt-1">{pinError}</p>}
            <p className="text-xs text-neutral-600 mt-1">
              {profile.pin_hash ? 'Leave blank to keep current PIN' : 'Require this PIN when switching to this profile'}
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 rounded-xl bg-[#e8a020] hover:bg-[#d4911a] disabled:opacity-50 text-black font-bold transition-all flex items-center justify-center gap-2"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saved ? <><Check size={16} /> Saved!</> : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Creator Request Section
// ─────────────────────────────────────────────

function CreatorRequestSection({ userId }: { userId: string }) {
  const [status, setStatus] = useState<'loading' | 'has_access' | 'pending' | 'rejected' | 'none'>('loading');
  const [reviewNote, setReviewNote] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    async function check() {
      const [{ data: roles }, { data: req }] = await Promise.all([
        supabase.from('user_roles').select('role').eq('user_id', userId).in('role', ['admin', 'creator']),
        supabase.from('creator_requests').select('status, review_note').eq('user_id', userId).order('created_at', { ascending: false }).maybeSingle(),
      ]);
      if (roles && roles.length > 0) { setStatus('has_access'); return; }
      if (!req) { setStatus('none'); return; }
      setStatus(req.status as 'pending' | 'rejected');
      setReviewNote(req.review_note ?? '');
    }
    check();
  }, [userId]);

  async function handleSubmit() {
    if (!reason.trim()) { setSubmitError('Please describe why you want to become a creator.'); return; }
    setSubmitError('');
    setSubmitting(true);
    const { error } = await supabase.from('creator_requests').insert({ user_id: userId, reason: reason.trim() });
    setSubmitting(false);
    if (error) { setSubmitError(error.message); return; }
    setStatus('pending');
  }

  if (status === 'loading') return <div className="flex justify-center py-4"><Loader2 size={20} className="animate-spin text-neutral-500" /></div>;

  if (status === 'has_access') {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
        <Check size={18} className="text-emerald-400 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-emerald-400">Creator Access Active</p>
          <p className="text-xs text-neutral-400 mt-0.5">You can upload and manage films in the Creator Studio.</p>
        </div>
        <Link to="/creator" className="ml-auto flex items-center gap-1 text-xs font-semibold text-[#e8a020] hover:underline">
          Open Studio <ChevronRight size={14} />
        </Link>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
        <Clock size={18} className="text-yellow-400 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-yellow-300">Application Under Review</p>
          <p className="text-xs text-neutral-400 mt-0.5">We'll notify you once your application is reviewed.</p>
        </div>
      </div>
    );
  }

  if (status === 'rejected') {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl">
          <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-400">Application Not Approved</p>
            {reviewNote && <p className="text-xs text-neutral-400 mt-0.5">Note: {reviewNote}</p>}
          </div>
        </div>
        <p className="text-xs text-neutral-500">You can re-apply with more detail below.</p>
        <ApplicationForm reason={reason} setReason={setReason} onSubmit={handleSubmit} submitting={submitting} error={submitError} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-400 leading-relaxed">
        Want to upload and share your short films? Apply for creator access and our team will review your application.
      </p>
      <ApplicationForm reason={reason} setReason={setReason} onSubmit={handleSubmit} submitting={submitting} error={submitError} />
    </div>
  );
}

function ApplicationForm({ reason, setReason, onSubmit, submitting, error }: {
  reason: string; setReason: (v: string) => void;
  onSubmit: () => void; submitting: boolean; error: string;
}) {
  return (
    <div className="space-y-3">
      <textarea
        value={reason}
        onChange={e => setReason(e.target.value)}
        placeholder="Tell us about yourself — your experience, what kind of films you make, and why you want to share them on XLShorts..."
        rows={4}
        className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-[#e8a020]/60 resize-none text-sm transition-all"
      />
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <button
        onClick={onSubmit}
        disabled={submitting}
        className="w-full py-3 rounded-xl bg-[#e8a020] hover:bg-[#d4911a] disabled:opacity-50 text-black font-bold transition-all flex items-center justify-center gap-2"
      >
        {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        Submit Application
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// Create Profile Modal
// ─────────────────────────────────────────────


function CreateProfileModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const { createProfile } = useProfile();

  async function handleSave(data: Parameters<typeof createProfile>[0]) {
    await createProfile(data);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 overflow-y-auto py-8">
      <div className="w-full max-w-sm">
        <ProfileFormFull
          userId={user?.id ?? ''}
          profileId={null}
          onSave={handleSave}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────
// Main Profile Page
// ─────────────────────────────────────────────

export default function AccountProfile() {
  const { user, signOut } = useAuth();
  const { profiles, activeProfile, setActiveProfile, deleteProfile, loadingProfiles } = useProfile();
  const navigate = useNavigate();
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [showCreateProfile, setShowCreateProfile] = useState(false);
  const [tab, setTab] = useState<'profiles' | 'creator' | 'account'>('profiles');

  useEffect(() => {
    if (!user) navigate('/auth');
  }, [user]);

  useEffect(() => {
    const pending = sessionStorage.getItem('xl_open_tab');
    if (pending === 'creator') {
      setTab('creator');
      sessionStorage.removeItem('xl_open_tab');
    }
  }, []);

  if (!user) return null;

  function handleSwitchProfile() {
    sessionStorage.removeItem('xl_active_profile');
    setActiveProfile(null as unknown as Profile);
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">Account</h1>
          <p className="text-neutral-500 text-sm">{user.email}</p>
        </div>

        {/* Active profile banner */}
        {activeProfile && (
          <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/8 rounded-2xl mb-6">
            <ProfileAvatar profile={activeProfile} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">{activeProfile.name}</p>
              <p className="text-xs text-neutral-500">Active profile</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditingProfile(activeProfile)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/8 hover:bg-white/15 text-neutral-300 hover:text-white text-xs font-medium transition-all"
              >
                <Edit2 size={12} /> Edit
              </button>
              <button
                onClick={handleSwitchProfile}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/8 hover:bg-white/15 text-neutral-300 hover:text-white text-xs font-medium transition-all"
              >
                <RefreshCw size={12} /> Switch
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-black/40 p-1 rounded-xl mb-6">
          {([['profiles', 'Profiles'], ['creator', 'Creator'], ['account', 'Account']] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${tab === id ? 'bg-[#e8a020] text-black' : 'text-neutral-400 hover:text-white'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Profiles tab */}
        {tab === 'profiles' && (
          <div className="space-y-4">
            {loadingProfiles ? (
              <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-neutral-500" /></div>
            ) : (
              <>
                <div className="space-y-3">
                  {profiles.map(profile => {
                    const icon = PRESET_AVATARS.find(a => a.id === profile.avatar_icon);
                    return (
                      <div key={profile.id} className="flex items-center gap-4 p-4 bg-white/5 border border-white/8 rounded-2xl">
                        <ProfileAvatar profile={profile} size="sm" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-white">{profile.name}</p>
                            {profile.is_child && (
                              <span className="flex items-center gap-1 text-xs text-[#e8a020] bg-[#e8a020]/10 px-2 py-0.5 rounded-full">
                                <Shield size={9} /> Child
                              </span>
                            )}
                          </div>
                          {profile.bio && <p className="text-xs text-neutral-500 truncate mt-0.5">{profile.bio}</p>}
                          {profile.preferred_genres?.length > 0 && (
                            <div className="flex gap-1 mt-1.5 flex-wrap">
                              {profile.preferred_genres.slice(0, 4).map(g => (
                                <span key={g} className="text-xs bg-white/8 text-neutral-400 px-2 py-0.5 rounded-full">{g}</span>
                              ))}
                              {profile.preferred_genres.length > 4 && (
                                <span className="text-xs text-neutral-500">+{profile.preferred_genres.length - 4}</span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingProfile(profile)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/8 hover:bg-white/15 text-neutral-400 hover:text-white transition-colors"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => deleteProfile(profile.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {profiles.length < 5 && (
                  <button
                    onClick={() => setShowCreateProfile(true)}
                    className="w-full py-3 rounded-xl border-2 border-dashed border-white/15 hover:border-[#e8a020]/50 text-neutral-400 hover:text-[#e8a020] text-sm font-medium transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={16} /> Add Profile (up to 5)
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* Creator tab */}
        {tab === 'creator' && (
          <div className="space-y-4">
            <div className="p-5 bg-white/5 border border-white/8 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#e8a020]/15 flex items-center justify-center">
                  <Clapperboard size={20} className="text-[#e8a020]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Creator Studio</h3>
                  <p className="text-xs text-neutral-500">Upload and manage your short films</p>
                </div>
              </div>
              <CreatorRequestSection userId={user.id} />
            </div>
          </div>
        )}

        {/* Account tab */}
        {tab === 'account' && (
          <div className="space-y-4">
            <div className="p-5 bg-white/5 border border-white/8 rounded-2xl space-y-4">
              <h3 className="text-base font-bold text-white">Account Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-sm text-neutral-400">Name</span>
                  <span className="text-sm text-white">{user.user_metadata?.full_name || '—'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-sm text-neutral-400">Email</span>
                  <span className="text-sm text-white">{user.email}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-neutral-400">Member since</span>
                  <span className="text-sm text-white">{new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
            </div>

            <button
              onClick={signOut}
              className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 text-neutral-300 hover:text-white text-sm font-medium transition-all flex items-center justify-center gap-2"
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        )}
      </div>

      {/* Edit profile drawer */}
      {editingProfile && (
        <ProfileEditPanel
          profile={editingProfile}
          userId={user.id}
          onClose={() => setEditingProfile(null)}
        />
      )}

      {/* Create profile modal */}
      {showCreateProfile && (
        <CreateProfileModal onClose={() => setShowCreateProfile(false)} />
      )}
    </div>
  );
}

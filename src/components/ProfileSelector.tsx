import { useState, useRef } from 'react';
import {
  Plus, Edit2, Trash2, Lock, Shield, X, Check, Loader2, AlertTriangle,
  Instagram, Youtube, Twitter, Music2, Bell, BellOff, User, Camera
} from 'lucide-react';
import { useProfile, type CreateProfileData } from '../contexts/ProfileContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types/database';
import { CONTENT_RATINGS } from '../types/database';

const AVATAR_COLORS = [
  '#e8a020', '#dc2626', '#16a34a', '#2563eb',
  '#db2777', '#0891b2', '#ea580c', '#65a30d',
  '#0f766e', '#b45309',
];

// Preset avatar icons using emoji-like text symbols rendered large
const PRESET_AVATARS = [
  { id: 'film', label: 'Film', icon: '🎬' },
  { id: 'star', label: 'Star', icon: '⭐' },
  { id: 'clap', label: 'Director', icon: '🎥' },
  { id: 'popcorn', label: 'Popcorn', icon: '🍿' },
  { id: 'mask', label: 'Drama', icon: '🎭' },
  { id: 'rocket', label: 'Sci-Fi', icon: '🚀' },
  { id: 'ghost', label: 'Horror', icon: '👻' },
  { id: 'heart', label: 'Romance', icon: '❤️' },
  { id: 'lion', label: 'Lion', icon: '🦁' },
  { id: 'fox', label: 'Fox', icon: '🦊' },
  { id: 'wolf', label: 'Wolf', icon: '🐺' },
  { id: 'owl', label: 'Owl', icon: '🦉' },
  { id: 'panda', label: 'Panda', icon: '🐼' },
  { id: 'cat', label: 'Cat', icon: '🐱' },
  { id: 'robot', label: 'Robot', icon: '🤖' },
  { id: 'alien', label: 'Alien', icon: '👾' },
];

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
// PIN Entry
// ─────────────────────────────────────────────

interface PinEntryProps {
  profile: Profile;
  onSuccess: () => void;
  onCancel: () => void;
}

function PinEntry({ profile, onSuccess, onCancel }: PinEntryProps) {
  const { verifyPin } = useProfile();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  function handleDigit(d: string) {
    if (pin.length >= 4) return;
    const next = pin + d;
    setError(false);
    setPin(next);
    if (next.length === 4) {
      if (verifyPin(profile, next)) {
        onSuccess();
      } else {
        setError(true);
        setTimeout(() => setPin(''), 600);
      }
    }
  }

  const icon = PRESET_AVATARS.find(a => a.id === profile.avatar_icon);

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-center">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-4xl relative overflow-hidden"
          style={{ backgroundColor: profile.avatar_color }}
        >
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.name}
              className="w-full h-full object-cover"
            />
          ) : icon ? (
            icon.icon
          ) : (
            <span className="text-3xl font-black text-black">{profile.avatar_letter}</span>
          )}
        </div>
        <h2 className="text-2xl font-bold text-white">{profile.name}</h2>
        <p className="text-neutral-400 mt-1 text-sm">Enter your PIN to continue</p>
      </div>

      <div className="flex gap-4">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-all duration-150 ${
              i < pin.length ? (error ? 'bg-red-500' : 'bg-[#e8a020]') : 'bg-white/20'
            }`}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((d, i) => (
          <button
            key={i}
            onClick={() => {
              if (d === '⌫') { setPin(p => p.slice(0, -1)); setError(false); }
              else if (d) handleDigit(d);
            }}
            disabled={!d}
            className={`w-16 h-16 rounded-2xl text-xl font-bold transition-all duration-150 ${
              d ? 'bg-white/10 hover:bg-white/20 text-white active:scale-95' : 'opacity-0 pointer-events-none'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {error && <p className="text-red-400 text-sm">Incorrect PIN. Try again.</p>}

      <button onClick={onCancel} className="text-neutral-500 hover:text-neutral-300 text-sm transition-colors">
        Back to profiles
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// Avatar Picker
// ─────────────────────────────────────────────

interface AvatarPickerProps {
  selectedIcon: string | null;
  selectedColor: string;
  profileLetter: string;
  onIconChange: (id: string | null) => void;
  onColorChange: (color: string) => void;
  currentPhotoUrl: string | null;
  onPhotoChange: (url: string | null) => void;
  userId: string;
  profileId: string | null;
}

function AvatarPicker({
  selectedIcon,
  selectedColor,
  profileLetter,
  onIconChange,
  onColorChange,
  currentPhotoUrl,
  onPhotoChange,
  userId,
  profileId,
}: AvatarPickerProps) {
  const icon = PRESET_AVATARS.find(a => a.id === selectedIcon);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handlePhotoUpload(file: File) {
    if (!file.type.startsWith('image/')) return;

    setUploading(true);
    try {
      const timestamp = Date.now();
      const path = `${userId}/${timestamp}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        setUploading(false);
        return;
      }

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(path);

      onPhotoChange(data.publicUrl);
    } catch (err) {
      console.error('Photo upload failed:', err);
    } finally {
      setUploading(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      handlePhotoUpload(file);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 mb-6">
      {/* Photo Upload Zone and Preview - Side by side or stacked */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        {/* Photo Upload Zone */}
        <div className="relative">
          {currentPhotoUrl ? (
            <div className="relative w-24 h-24">
              <img
                src={currentPhotoUrl}
                alt="Uploaded photo"
                className="w-full h-full rounded-2xl object-cover"
              />
              <button
                onClick={() => onPhotoChange(null)}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-24 h-24 rounded-2xl flex flex-col items-center justify-center bg-white/8 hover:bg-white/15 border-2 border-dashed border-white/20 hover:border-white/40 transition-all disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 size={20} className="text-[#e8a020] animate-spin" />
              ) : (
                <>
                  <Camera size={18} className="text-neutral-400 mb-1" />
                  <span className="text-xs text-neutral-500 text-center px-1">Upload</span>
                </>
              )}
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />
        </div>

        {/* Preview */}
        <div
          className="w-24 h-24 rounded-2xl flex items-center justify-center text-5xl transition-colors duration-200 shadow-lg relative overflow-hidden"
          style={{ backgroundColor: selectedColor }}
        >
          {icon ? icon.icon : <span className="text-4xl font-black text-black">{profileLetter || '?'}</span>}
        </div>
      </div>

      {/* Icon grid */}
      <div className="w-full">
        <p className="text-xs text-neutral-500 mb-2 text-center">Choose an avatar (optional)</p>
        <div className="grid grid-cols-8 gap-1.5">
          <button
            onClick={() => onIconChange(null)}
            className={`aspect-square rounded-xl flex items-center justify-center text-lg transition-all ${
              !selectedIcon ? 'ring-2 ring-[#e8a020] bg-[#e8a020]/10' : 'bg-white/5 hover:bg-white/10'
            }`}
            title="Use initial"
          >
            <User size={16} className={!selectedIcon ? 'text-[#e8a020]' : 'text-neutral-400'} />
          </button>
          {PRESET_AVATARS.map(a => (
            <button
              key={a.id}
              onClick={() => onIconChange(a.id)}
              className={`aspect-square rounded-xl flex items-center justify-center text-xl transition-all ${
                selectedIcon === a.id ? 'ring-2 ring-[#e8a020] bg-[#e8a020]/10' : 'bg-white/5 hover:bg-white/10'
              }`}
              title={a.label}
            >
              {a.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Color picker */}
      <div>
        <p className="text-xs text-neutral-500 mb-2 text-center">Background color</p>
        <div className="flex gap-2 justify-center flex-wrap">
          {AVATAR_COLORS.map(c => (
            <button
              key={c}
              onClick={() => onColorChange(c)}
              className="w-7 h-7 rounded-full transition-transform hover:scale-110 active:scale-95"
              style={{ backgroundColor: c, outline: selectedColor === c ? '3px solid white' : 'none', outlineOffset: 2 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Profile Form (multi-step)
// ─────────────────────────────────────────────

type FormStep = 'basics' | 'controls' | 'interests' | 'social';

interface ProfileFormProps {
  existing?: Profile;
  userId: string;
  profileId: string | null;
  onSave: (data: CreateProfileData & { id?: string; avatar_icon?: string | null; bio?: string; social_instagram?: string; social_tiktok?: string; social_youtube?: string; social_x?: string; social_facebook?: string; preferred_genres?: string[]; notify_new_films?: boolean; avatar_url?: string | null }) => Promise<void>;
  onCancel: () => void;
}

function ProfileForm({ existing, userId, profileId, onSave, onCancel }: ProfileFormProps) {
  const [step, setStep] = useState<FormStep>('basics');
  const [name, setName] = useState(existing?.name ?? '');
  const [color, setColor] = useState(existing?.avatar_color ?? AVATAR_COLORS[0]);
  const [avatarIcon, setAvatarIcon] = useState<string | null>(existing?.avatar_icon ?? null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(existing?.avatar_url ?? null);
  const [bio, setBio] = useState(existing?.bio ?? '');
  const [isChild, setIsChild] = useState(existing?.is_child ?? false);
  const [maxRating, setMaxRating] = useState(existing?.max_rating ?? 'R');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [enablePin, setEnablePin] = useState(!!existing?.pin_hash);
  const [pinDisclaimer, setPinDisclaimer] = useState(false);
  const [genres, setGenres] = useState<string[]>(existing?.preferred_genres ?? []);
  const [notifyNewFilms, setNotifyNewFilms] = useState(existing?.notify_new_films ?? false);
  const [instagram, setInstagram] = useState(existing?.social_instagram ?? '');
  const [tiktok, setTiktok] = useState(existing?.social_tiktok ?? '');
  const [youtube, setYoutube] = useState(existing?.social_youtube ?? '');
  const [socialX, setSocialX] = useState(existing?.social_x ?? '');
  const [facebook, setFacebook] = useState(existing?.social_facebook ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const letter = name.trim()[0]?.toUpperCase() ?? '?';

  function toggleGenre(slug: string) {
    setGenres(prev => prev.includes(slug) ? prev.filter(g => g !== slug) : [...prev, slug]);
  }

  async function handleSave() {
    if (!name.trim()) { setError('Enter a profile name.'); setStep('basics'); return; }
    if (enablePin && pin.length > 0) {
      if (pin.length !== 4 || !/^\d{4}$/.test(pin)) { setError('PIN must be exactly 4 digits.'); setStep('controls'); return; }
      if (pin !== confirmPin) { setError('PINs do not match.'); setStep('controls'); return; }
      if (!pinDisclaimer) { setError('Please acknowledge the content disclaimer before setting a PIN.'); setStep('controls'); return; }
    }
    setError('');
    setSaving(true);
    await onSave({
      id: existing?.id,
      name: name.trim(),
      avatar_color: color,
      avatar_letter: letter,
      avatar_icon: avatarIcon,
      avatar_url: avatarUrl,
      is_child: isChild,
      max_rating: isChild ? (['R', 'NC-17'].includes(maxRating) ? 'PG-13' : maxRating) : maxRating,
      pin: enablePin && pin.length === 4 ? pin : undefined,
      bio: bio.trim(),
      social_instagram: instagram.trim(),
      social_tiktok: tiktok.trim(),
      social_youtube: youtube.trim(),
      social_x: socialX.trim(),
      social_facebook: facebook.trim(),
      preferred_genres: genres,
      notify_new_films: notifyNewFilms,
    });
    setSaving(false);
  }

  const steps: { id: FormStep; label: string }[] = [
    { id: 'basics', label: 'Profile' },
    { id: 'controls', label: 'Controls' },
    { id: 'interests', label: 'Interests' },
    { id: 'social', label: 'Social' },
  ];

  const stepIndex = steps.findIndex(s => s.id === step);

  return (
    <div className="w-full max-w-sm">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onCancel}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/8 hover:bg-white/15 text-white transition-colors"
        >
          <X size={16} />
        </button>
        <h2 className="text-xl font-bold text-white flex-1">
          {existing ? 'Edit Profile' : 'Create Profile'}
        </h2>
      </div>

      {/* Step tabs */}
      <div className="flex gap-1 mb-6 bg-black/40 p-1 rounded-xl">
        {steps.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setStep(s.id)}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              step === s.id ? 'bg-[#e8a020] text-black' : i < stepIndex ? 'text-[#e8a020]/70 hover:text-[#e8a020]' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Step: Basics */}
      {step === 'basics' && (
        <div className="space-y-4">
          <AvatarPicker
            selectedIcon={avatarIcon}
            selectedColor={color}
            profileLetter={letter}
            onIconChange={setAvatarIcon}
            onColorChange={setColor}
            currentPhotoUrl={avatarUrl}
            onPhotoChange={setAvatarUrl}
            userId={userId}
            profileId={profileId}
          />

          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-1.5">Profile Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Dad, Mom, Alex..."
              maxLength={20}
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-[#e8a020]/60 focus:ring-2 focus:ring-[#e8a020]/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-1.5">Bio <span className="text-neutral-600">(optional)</span></label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="A little about this profile..."
              maxLength={160}
              rows={2}
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-[#e8a020]/60 focus:ring-2 focus:ring-[#e8a020]/20 transition-all resize-none text-sm"
            />
          </div>
        </div>
      )}

      {/* Step: Parental Controls */}
      {step === 'controls' && (
        <div className="space-y-4">
          {/* Child toggle */}
          <div
            className={`flex items-center justify-between px-4 py-3 rounded-xl border cursor-pointer transition-all ${isChild ? 'border-[#e8a020]/50 bg-[#e8a020]/5' : 'border-white/10 bg-white/3'}`}
            onClick={() => setIsChild(v => !v)}
          >
            <div className="flex items-center gap-3">
              <Shield size={18} className={isChild ? 'text-[#e8a020]' : 'text-neutral-500'} />
              <div>
                <p className="text-sm font-medium text-white">Child Profile</p>
                <p className="text-xs text-neutral-500">Restricts content by rating</p>
              </div>
            </div>
            <div className={`w-10 h-6 rounded-full transition-colors duration-200 flex items-center ${isChild ? 'bg-[#e8a020]' : 'bg-white/15'}`}>
              <div className={`w-4 h-4 rounded-full bg-white mx-1 transition-transform duration-200 ${isChild ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          </div>

          {/* Max rating */}
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-1.5">
              Max Content Rating {isChild && <span className="text-[#e8a020] text-xs">(child limited to PG-13)</span>}
            </label>
            <div className="flex gap-2">
              {CONTENT_RATINGS.filter(r => !isChild || !['R', 'NC-17'].includes(r)).map(r => (
                <button
                  key={r}
                  onClick={() => setMaxRating(r)}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                    maxRating === r
                      ? 'bg-[#e8a020] text-black'
                      : 'bg-white/8 text-neutral-400 hover:bg-white/15 hover:text-white border border-white/10'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* PIN */}
          <div>
            <div
              className={`flex items-center justify-between px-4 py-3 rounded-xl border cursor-pointer transition-all ${enablePin ? 'border-[#e8a020]/50 bg-[#e8a020]/5' : 'border-white/10 bg-white/3'}`}
              onClick={() => setEnablePin(v => !v)}
            >
              <div className="flex items-center gap-3">
                <Lock size={18} className={enablePin ? 'text-[#e8a020]' : 'text-neutral-500'} />
                <div>
                  <p className="text-sm font-medium text-white">Require PIN</p>
                  <p className="text-xs text-neutral-500">4-digit lock for this profile</p>
                </div>
              </div>
              <div className={`w-10 h-6 rounded-full transition-colors duration-200 flex items-center ${enablePin ? 'bg-[#e8a020]' : 'bg-white/15'}`}>
                <div className={`w-4 h-4 rounded-full bg-white mx-1 transition-transform duration-200 ${enablePin ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
            </div>

            {enablePin && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">PIN</label>
                  <input
                    type="password"
                    value={pin}
                    onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="4 digits"
                    maxLength={4}
                    inputMode="numeric"
                    className="w-full px-3 py-2.5 bg-[#0a0a0a] border border-white/10 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-[#e8a020]/60 text-center text-lg tracking-widest transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Confirm PIN</label>
                  <input
                    type="password"
                    value={confirmPin}
                    onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="4 digits"
                    maxLength={4}
                    inputMode="numeric"
                    className="w-full px-3 py-2.5 bg-[#0a0a0a] border border-white/10 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-[#e8a020]/60 text-center text-lg tracking-widest transition-all"
                  />
                </div>
              </div>
            )}

            {enablePin && pin.length === 4 && (
              <div className="mt-3 bg-yellow-500/8 border border-yellow-500/20 rounded-xl p-4">
                <div className="flex items-start gap-2.5 mb-3">
                  <AlertTriangle size={15} className="text-yellow-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-300/90 leading-relaxed">
                    XLShorts does its best to separate content based on adult and child suitability. However, we rely on creators to be truthful when uploading their films. We cannot be held responsible if inaccurately labeled content slips through.
                  </p>
                </div>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <div
                    onClick={() => setPinDisclaimer(v => !v)}
                    className={`w-4 h-4 shrink-0 mt-0.5 rounded flex items-center justify-center border transition-all cursor-pointer ${pinDisclaimer ? 'bg-[#e8a020] border-[#e8a020]' : 'border-white/30 bg-white/5 hover:border-white/50'}`}
                  >
                    {pinDisclaimer && <Check size={10} className="text-black" />}
                  </div>
                  <span className="text-xs text-neutral-400 leading-relaxed">
                    I understand that XLShorts cannot guarantee all content is accurately categorized and accept responsibility for supervising viewing on this profile.
                  </span>
                </label>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step: Interests */}
      {step === 'interests' && (
        <div className="space-y-5">
          <div>
            <p className="text-sm font-medium text-white mb-1">Favorite Genres</p>
            <p className="text-xs text-neutral-500 mb-3">We'll recommend films and notify you about new releases in these genres.</p>
            <div className="flex flex-wrap gap-2">
              {GENRES.map(g => {
                const active = genres.includes(g.slug);
                return (
                  <button
                    key={g.slug}
                    onClick={() => toggleGenre(g.slug)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      active
                        ? 'bg-[#e8a020] text-black'
                        : 'bg-white/8 text-neutral-400 hover:bg-white/15 hover:text-white border border-white/10'
                    }`}
                  >
                    {active && <span className="mr-1">✓</span>}{g.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div
            className={`flex items-center justify-between px-4 py-3 rounded-xl border cursor-pointer transition-all ${notifyNewFilms ? 'border-[#e8a020]/50 bg-[#e8a020]/5' : 'border-white/10 bg-white/3'}`}
            onClick={() => setNotifyNewFilms(v => !v)}
          >
            <div className="flex items-center gap-3">
              {notifyNewFilms ? <Bell size={18} className="text-[#e8a020]" /> : <BellOff size={18} className="text-neutral-500" />}
              <div>
                <p className="text-sm font-medium text-white">Notify on New Releases</p>
                <p className="text-xs text-neutral-500">Highlighted when new films match your genres</p>
              </div>
            </div>
            <div className={`w-10 h-6 rounded-full transition-colors duration-200 flex items-center ${notifyNewFilms ? 'bg-[#e8a020]' : 'bg-white/15'}`}>
              <div className={`w-4 h-4 rounded-full bg-white mx-1 transition-transform duration-200 ${notifyNewFilms ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          </div>
        </div>
      )}

      {/* Step: Social */}
      {step === 'social' && (
        <div className="space-y-4">
          <p className="text-xs text-neutral-500">Optional — shown on your public profile if you share it.</p>

          {[
            { icon: Instagram, label: 'Instagram', value: instagram, set: setInstagram, placeholder: '@username' },
            { icon: Music2, label: 'TikTok', value: tiktok, set: setTiktok, placeholder: '@username' },
            { icon: Youtube, label: 'YouTube', value: youtube, set: setYoutube, placeholder: 'channel name or URL' },
            { icon: Twitter, label: 'X / Twitter', value: socialX, set: setSocialX, placeholder: '@handle' },
          ].map(({ icon: Icon, label, value, set, placeholder }) => (
            <div key={label}>
              <label className="block text-sm font-medium text-neutral-400 mb-1.5 flex items-center gap-1.5">
                <Icon size={14} /> {label}
              </label>
              <input
                type="text"
                value={value}
                onChange={e => set(e.target.value)}
                placeholder={placeholder}
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-[#e8a020]/60 focus:ring-2 focus:ring-[#e8a020]/20 transition-all text-sm"
              />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-1.5 flex items-center gap-1.5">
              <div className="text-sm font-bold text-white bg-[#1877F2] rounded w-4 h-4 flex items-center justify-center">f</div> Facebook
            </label>
            <input
              type="text"
              value={facebook}
              onChange={e => setFacebook(e.target.value)}
              placeholder="profile URL or username"
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-[#e8a020]/60 focus:ring-2 focus:ring-[#e8a020]/20 transition-all text-sm"
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && <p className="text-red-400 text-sm mt-4">{error}</p>}

      {/* Navigation */}
      <div className="flex gap-3 mt-6">
        {stepIndex > 0 && (
          <button
            onClick={() => setStep(steps[stepIndex - 1].id)}
            className="flex-1 py-3 rounded-xl bg-white/8 hover:bg-white/15 text-white font-semibold transition-all border border-white/10"
          >
            Back
          </button>
        )}
        {stepIndex < steps.length - 1 ? (
          <button
            onClick={() => setStep(steps[stepIndex + 1].id)}
            className="flex-1 py-3 rounded-xl bg-[#e8a020] hover:bg-[#d4911a] text-black font-bold transition-all"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 rounded-xl bg-[#e8a020] hover:bg-[#d4911a] disabled:opacity-50 text-black font-bold transition-all flex items-center justify-center gap-2"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            {existing ? 'Save Changes' : 'Create Profile'}
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Profile Avatar display helper
// ─────────────────────────────────────────────

function ProfileAvatar({ profile, size = 'md' }: { profile: Profile; size?: 'sm' | 'md' | 'lg' }) {
  const icon = PRESET_AVATARS.find(a => a.id === profile.avatar_icon);
  const sizeClass = size === 'lg' ? 'w-24 h-24 rounded-2xl text-5xl' : size === 'sm' ? 'w-12 h-12 rounded-xl text-2xl' : 'w-16 h-16 rounded-2xl text-3xl';
  return (
    <div
      className={`${sizeClass} flex items-center justify-center shrink-0 relative overflow-hidden`}
      style={{ backgroundColor: profile.avatar_color }}
    >
      {profile.avatar_url ? (
        <img
          src={profile.avatar_url}
          alt={profile.name}
          className="w-full h-full object-cover"
        />
      ) : icon ? (
        icon.icon
      ) : (
        <span className={`font-black text-black ${size === 'lg' ? 'text-4xl' : size === 'sm' ? 'text-xl' : 'text-2xl'}`}>{profile.avatar_letter}</span>
      )}
    </div>
  );
}

export { ProfileAvatar, PRESET_AVATARS };

// ─────────────────────────────────────────────
// Main ProfileSelector
// ─────────────────────────────────────────────

type Mode = 'select' | 'pin' | 'create' | 'edit' | 'manage';

interface ProfileSelectorProps {
  onComplete: () => void;
}

export default function ProfileSelector({ onComplete }: ProfileSelectorProps) {
  const { user, signOut } = useAuth();
  const { profiles, setActiveProfile, createProfile, updateProfile, deleteProfile, loadingProfiles } = useProfile();
  const [mode, setMode] = useState<Mode>('select');
  const [pendingProfile, setPendingProfile] = useState<Profile | null>(null);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);

  if (loadingProfiles) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#e8a020]" size={36} />
      </div>
    );
  }

  function handleSelectProfile(profile: Profile) {
    if (profile.pin_hash) {
      setPendingProfile(profile);
      setMode('pin');
    } else {
      setActiveProfile(profile);
      onComplete();
    }
  }

  function handlePinSuccess() {
    if (pendingProfile) {
      setActiveProfile(pendingProfile);
      onComplete();
    }
  }

  async function handleCreate(data: Parameters<typeof onSaveProfile>[0]) {
    await onSaveProfile(data);
    setMode('select');
  }

  async function handleEdit(data: Parameters<typeof onSaveProfile>[0]) {
    if (!data.id) return;
    await onSaveProfile(data);
    setMode('manage');
    setEditingProfile(null);
  }

  async function onSaveProfile(data: CreateProfileData & { id?: string; avatar_icon?: string | null; bio?: string; social_instagram?: string; social_tiktok?: string; social_youtube?: string; social_x?: string; social_facebook?: string; preferred_genres?: string[]; notify_new_films?: boolean; avatar_url?: string | null }) {
    const update: Record<string, unknown> = {
      name: data.name,
      avatar_color: data.avatar_color,
      avatar_letter: data.avatar_letter,
      avatar_icon: data.avatar_icon ?? null,
      avatar_url: data.avatar_url ?? null,
      is_child: data.is_child,
      max_rating: data.max_rating,
      bio: data.bio ?? '',
      social_instagram: data.social_instagram ?? '',
      social_tiktok: data.social_tiktok ?? '',
      social_youtube: data.social_youtube ?? '',
      social_x: data.social_x ?? '',
      social_facebook: data.social_facebook ?? '',
      preferred_genres: data.preferred_genres ?? [],
      notify_new_films: data.notify_new_films ?? false,
    };

    if (data.pin !== undefined) {
      let h = 0;
      for (let i = 0; i < data.pin.length; i++) {
        h = (Math.imul(31, h) + data.pin.charCodeAt(i)) | 0;
      }
      update.pin_hash = `pin_${Math.abs(h).toString(36)}_${data.pin.length}`;
    }

    if (data.id) {
      await updateProfile(data.id, update as Partial<Profile>);
    } else {
      await createProfile({
        name: data.name,
        avatar_color: data.avatar_color,
        avatar_letter: data.avatar_letter,
        avatar_icon: data.avatar_icon ?? null,
        avatar_url: data.avatar_url ?? null,
        is_child: data.is_child,
        max_rating: data.max_rating,
        pin: data.pin,
      });
      // Update extended fields after creation
      const { data: profiles } = await supabase
        .from('xlshorts_profiles')
        .select('id')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1);
      if (profiles?.[0]?.id) {
        await supabase.from('xlshorts_profiles').update({
          bio: data.bio ?? '',
          social_instagram: data.social_instagram ?? '',
          social_tiktok: data.social_tiktok ?? '',
          social_youtube: data.social_youtube ?? '',
          social_x: data.social_x ?? '',
          social_facebook: data.social_facebook ?? '',
          preferred_genres: data.preferred_genres ?? [],
          notify_new_films: data.notify_new_films ?? false,
        }).eq('id', profiles[0].id);
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4 py-12">
      <div className="mb-12 text-center">
        <span className="text-3xl font-black tracking-tight text-white">
          XL<span className="text-[#e8a020]">Shorts</span>
        </span>
      </div>

      {mode === 'select' && (
        <div className="w-full max-w-2xl">
          <h1 className="text-3xl sm:text-4xl font-bold text-white text-center mb-2">Who's watching?</h1>
          <p className="text-neutral-400 text-center mb-10">Select your profile to continue</p>

          <div className="flex flex-wrap justify-center gap-6 mb-10">
            {profiles.map(profile => (
              <button
                key={profile.id}
                onClick={() => handleSelectProfile(profile)}
                className="flex flex-col items-center gap-3 group"
              >
                <div className="transition-all duration-200 group-hover:scale-105 group-hover:ring-4 ring-white/40 rounded-2xl">
                  <ProfileAvatar profile={profile} size="lg" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-neutral-300 group-hover:text-white transition-colors">{profile.name}</p>
                  <div className="flex items-center justify-center gap-1 mt-0.5">
                    {profile.pin_hash && <Lock size={10} className="text-neutral-500" />}
                    {profile.is_child && <Shield size={10} className="text-[#e8a020]" />}
                    {profile.is_child && <span className="text-xs text-neutral-500">{profile.max_rating}</span>}
                  </div>
                </div>
              </button>
            ))}

            {profiles.length < 5 && (
              <button
                onClick={() => setMode('create')}
                className="flex flex-col items-center gap-3 group"
              >
                <div className="w-24 h-24 rounded-2xl flex items-center justify-center bg-white/8 hover:bg-white/15 border-2 border-dashed border-white/20 hover:border-white/40 transition-all duration-200 group-hover:scale-105">
                  <Plus size={28} className="text-neutral-400 group-hover:text-white transition-colors" />
                </div>
                <p className="text-sm font-semibold text-neutral-500 group-hover:text-white transition-colors">Add Profile</p>
              </button>
            )}
          </div>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setMode('manage')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/8 hover:bg-white/15 border border-white/10 text-neutral-300 hover:text-white text-sm font-medium transition-all"
            >
              <Edit2 size={14} /> Manage Profiles
            </button>
            <button
              onClick={signOut}
              className="text-neutral-500 hover:text-neutral-300 text-sm transition-colors"
            >
              Sign out ({user?.email})
            </button>
          </div>
        </div>
      )}

      {mode === 'pin' && pendingProfile && (
        <PinEntry
          profile={pendingProfile}
          onSuccess={handlePinSuccess}
          onCancel={() => { setPendingProfile(null); setMode('select'); }}
        />
      )}

      {mode === 'create' && (
        <ProfileForm
          userId={user?.id ?? ''}
          profileId={null}
          onSave={handleCreate}
          onCancel={() => setMode('select')}
        />
      )}

      {mode === 'edit' && editingProfile && (
        <ProfileForm
          existing={editingProfile}
          userId={user?.id ?? ''}
          profileId={editingProfile.id ?? null}
          onSave={handleEdit}
          onCancel={() => { setMode('manage'); setEditingProfile(null); }}
        />
      )}

      {mode === 'manage' && (
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => setMode('select')}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/8 hover:bg-white/15 text-white transition-colors"
            >
              <X size={18} />
            </button>
            <h2 className="text-2xl font-bold text-white">Manage Profiles</h2>
          </div>

          <div className="space-y-3 mb-6">
            {profiles.map(profile => (
              <div
                key={profile.id}
                className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/8"
              >
                <ProfileAvatar profile={profile} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{profile.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {profile.is_child && <span className="text-xs text-[#e8a020] flex items-center gap-1"><Shield size={10} /> Child · {profile.max_rating}</span>}
                    {profile.pin_hash && <span className="text-xs text-neutral-500 flex items-center gap-1"><Lock size={10} /> PIN</span>}
                    {profile.preferred_genres?.length > 0 && <span className="text-xs text-neutral-500">{profile.preferred_genres.length} genres</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setEditingProfile(profile); setMode('edit'); }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/8 hover:bg-white/15 text-neutral-400 hover:text-white transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => deleteProfile(profile.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {profiles.length < 5 && (
            <button
              onClick={() => setMode('create')}
              className="w-full py-3 rounded-xl bg-[#e8a020] hover:bg-[#d4911a] text-black font-bold transition-all flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Add New Profile
            </button>
          )}
        </div>
      )}
    </div>
  );
}

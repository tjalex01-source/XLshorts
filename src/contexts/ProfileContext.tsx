import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import type { Profile } from '../types/database';

interface ProfileContextType {
  profiles: Profile[];
  activeProfile: Profile | null;
  loadingProfiles: boolean;
  setActiveProfile: (profile: Profile) => void;
  createProfile: (data: CreateProfileData) => Promise<{ error: Error | null; profile: Profile | null }>;
  updateProfile: (id: string, data: Partial<Profile>) => Promise<{ error: Error | null }>;
  deleteProfile: (id: string) => Promise<{ error: Error | null }>;
  verifyPin: (profile: Profile, pin: string) => boolean;
  refreshProfiles: () => Promise<void>;
}

export interface CreateProfileData {
  name: string;
  avatar_color: string;
  avatar_letter: string;
  avatar_icon?: string | null;
  avatar_url?: string | null;
  is_child: boolean;
  max_rating: string;
  pin?: string;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

function hashPin(pin: string): string {
  // Simple deterministic hash for PIN — not cryptographic, but avoids storing plaintext
  let h = 0;
  for (let i = 0; i < pin.length; i++) {
    h = (Math.imul(31, h) + pin.charCodeAt(i)) | 0;
  }
  return `pin_${Math.abs(h).toString(36)}_${pin.length}`;
}

export function verifyPinHash(pin: string, hash: string): boolean {
  return hashPin(pin) === hash;
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfileState] = useState<Profile | null>(() => {
    try {
      const saved = sessionStorage.getItem('xl_active_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loadingProfiles, setLoadingProfiles] = useState(true);

  useEffect(() => {
    if (user) {
      refreshProfiles();
    } else {
      setProfiles([]);
      setActiveProfileState(null);
      sessionStorage.removeItem('xl_active_profile');
      setLoadingProfiles(false);
    }
  }, [user]);

  async function refreshProfiles() {
    if (!user) return;
    setLoadingProfiles(true);
    const { data } = await supabase
      .from('xlshorts_profiles')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at');
    const list: Profile[] = data ?? [];
    setProfiles(list);

    // Restore active profile from session, validate it still exists
    const saved = sessionStorage.getItem('xl_active_profile');
    if (saved) {
      try {
        const parsed: Profile = JSON.parse(saved);
        const still = list.find(p => p.id === parsed.id);
        if (still) {
          setActiveProfileState(still);
          setLoadingProfiles(false);
          return;
        }
      } catch { /* ignore */ }
    }

    // No valid session profile — clear it so the selector shows
    setActiveProfileState(null);
    sessionStorage.removeItem('xl_active_profile');
    setLoadingProfiles(false);
  }

  function setActiveProfile(profile: Profile) {
    setActiveProfileState(profile);
    sessionStorage.setItem('xl_active_profile', JSON.stringify(profile));
  }

  async function createProfile(data: CreateProfileData & {
    bio?: string;
    social_instagram?: string;
    social_tiktok?: string;
    social_youtube?: string;
    social_x?: string;
    social_facebook?: string;
    preferred_genres?: string[];
    notify_new_films?: boolean;
  }): Promise<{ error: Error | null; profile: Profile | null }> {
    if (!user) return { error: new Error('Not authenticated'), profile: null };
    const pin_hash = data.pin ? hashPin(data.pin) : null;
    const { data: created, error } = await supabase
      .from('xlshorts_profiles')
      .insert({
        user_id: user.id,
        name: data.name,
        avatar_color: data.avatar_color,
        avatar_letter: data.avatar_letter,
        avatar_icon: data.avatar_icon ?? null,
        avatar_url: data.avatar_url ?? null,
        is_child: data.is_child,
        max_rating: data.max_rating,
        pin_hash,
        bio: data.bio ?? '',
        social_instagram: data.social_instagram ?? '',
        social_tiktok: data.social_tiktok ?? '',
        social_youtube: data.social_youtube ?? '',
        social_x: data.social_x ?? '',
        social_facebook: data.social_facebook ?? '',
        preferred_genres: data.preferred_genres ?? [],
        notify_new_films: data.notify_new_films ?? false,
      })
      .select()
      .maybeSingle();
    if (error) return { error: error as Error, profile: null };
    await refreshProfiles();
    return { error: null, profile: created };
  }

  async function updateProfile(id: string, data: Partial<Profile>): Promise<{ error: Error | null }> {
    const { error } = await supabase.from('xlshorts_profiles').update(data).eq('id', id);
    if (!error) await refreshProfiles();
    return { error: error as Error | null };
  }

  async function deleteProfile(id: string): Promise<{ error: Error | null }> {
    const { error } = await supabase.from('xlshorts_profiles').delete().eq('id', id);
    if (!error) {
      if (activeProfile?.id === id) {
        setActiveProfileState(null);
        sessionStorage.removeItem('xl_active_profile');
      }
      await refreshProfiles();
    }
    return { error: error as Error | null };
  }

  function verifyPin(profile: Profile, pin: string): boolean {
    if (!profile.pin_hash) return true;
    return verifyPinHash(pin, profile.pin_hash);
  }

  return (
    <ProfileContext.Provider value={{
      profiles,
      activeProfile,
      loadingProfiles,
      setActiveProfile,
      createProfile,
      updateProfile,
      deleteProfile,
      verifyPin,
      refreshProfiles,
    }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}

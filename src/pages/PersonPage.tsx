import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Film, ExternalLink, Instagram, Youtube, Twitter, Globe } from 'lucide-react';
import { Loader2 } from 'lucide-react';

interface PersonProfile {
  id: string;
  name: string;
  bio: string | null;
  avatar_url: string | null;
  avatar_color: string;
  avatar_letter: string;
  social_instagram: string | null;
  social_youtube: string | null;
  social_x: string | null;
  social_tiktok: string | null;
  website: string | null;
  preferred_genres: string[];
  public_bio: boolean;
  public_avatar: boolean;
  public_social_instagram: boolean;
  public_social_youtube: boolean;
  public_social_x: boolean;
  public_social_tiktok: boolean;
  public_website: boolean;
  public_genres: boolean;
}

interface Credit {
  id: string;
  role: string;
  character_name: string | null;
  film: {
    id: string;
    title: string;
    thumbnail_url: string;
    release_year: number;
    age_tier: string;
  };
}

const ROLE_LABELS: Record<string, string> = {
  director: 'Director',
  writer: 'Writer',
  producer: 'Producer',
  actor: 'Actor',
  cinematographer: 'Cinematographer',
  editor: 'Editor',
  composer: 'Composer',
  other: 'Other',
};

export default function PersonPage() {
  const { slug } = useParams<{ slug: string }>();
  const [person, setPerson] = useState<PersonProfile | null>(null);
  const [credits, setCredits] = useState<Credit[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      if (!slug) return;

      const { data: profile } = await supabase
        .from('xlshorts_profiles')
        .select('*')
        .eq('slug', slug)
        .single();

      if (!profile) { setNotFound(true); setLoading(false); return; }
      setPerson(profile);

      const { data: creditData } = await supabase
        .from('film_credits')
        .select(`
          id, role, character_name,
          film:films(id, title, thumbnail_url, release_year, age_tier, status)
        `)
        .eq('profile_id', profile.id)
        .order('billing_order');

      const published = (creditData ?? []).filter((c: any) => c.film?.status === 'published');
      setCredits(published as Credit[]);
      setLoading(false);
    }
    load();
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <Loader2 className="animate-spin text-[#e8a020]" size={32} />
    </div>
  );

  if (notFound || !person) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-center">
        <p className="text-2xl font-bold text-white mb-3">Person Not Found</p>
        <Link to="/" className="text-[#e8a020] text-sm">← Back to Home</Link>
      </div>
    </div>
  );

  // Group credits by role
  const byRole = credits.reduce<Record<string, Credit[]>>((acc, c) => {
    if (!acc[c.role]) acc[c.role] = [];
    acc[c.role].push(c);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-4xl mx-auto px-4 py-12">

        {/* Back */}
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-white mb-8 transition-colors">
          ← Back
        </Link>

        {/* Header */}
        <div className="flex items-start gap-6 mb-10 flex-wrap">
          {/* Avatar */}
          <div
            className="w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-black shrink-0 border-2 border-white/10"
            style={{ backgroundColor: person.avatar_color }}
          >
            {person.avatar_url?.startsWith('http') ? (
              <img src={person.avatar_url} alt={person.name} className="w-full h-full object-cover rounded-2xl" />
            ) : (
              <span style={{ color: '#000' }}>{person.avatar_letter}</span>
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-3xl font-black text-white mb-1">{person.name}</h1>

            {/* Genres */}
            {person.public_genres && person.preferred_genres?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {person.preferred_genres.map(g => (
                  <span key={g} className="px-2 py-0.5 bg-[#e8a020]/10 text-[#e8a020] text-xs rounded-full border border-[#e8a020]/20">{g}</span>
                ))}
              </div>
            )}

            {/* Social links */}
            <div className="flex flex-wrap gap-3">
              {person.public_website && person.website && (
                <a href={person.website} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white transition-colors">
                  <Globe size={14} /> Website
                </a>
              )}
              {person.public_social_instagram && person.social_instagram && (
                <a href={`https://instagram.com/${person.social_instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white transition-colors">
                  <Instagram size={14} /> {person.social_instagram}
                </a>
              )}
              {person.public_social_youtube && person.social_youtube && (
                <a href={person.social_youtube} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white transition-colors">
                  <Youtube size={14} /> YouTube
                </a>
              )}
              {person.public_social_x && person.social_x && (
                <a href={`https://x.com/${person.social_x.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white transition-colors">
                  <Twitter size={14} /> {person.social_x}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        {person.public_bio && person.bio && (
          <div className="mb-10 p-5 bg-[#141414] border border-white/8 rounded-2xl">
            <p className="text-neutral-300 leading-relaxed">{person.bio}</p>
          </div>
        )}

        {/* Credits */}
        {credits.length === 0 ? (
          <div className="text-center py-16 text-neutral-600">
            <Film size={40} className="mx-auto mb-3 opacity-30" />
            <p>No published films on XLShorts yet.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(byRole).map(([role, roleCred]) => (
              <div key={role}>
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <span className="w-1 h-5 bg-[#e8a020] rounded-full inline-block" />
                  {ROLE_LABELS[role] ?? role}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {roleCred.map(c => (
                    <Link key={c.id} to={`/film/${c.film.id}`}
                      className="group bg-[#141414] border border-white/8 rounded-xl overflow-hidden hover:border-[#e8a020]/40 transition-all">
                      {c.film.thumbnail_url ? (
                        <img src={c.film.thumbnail_url} alt={c.film.title}
                          className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full aspect-video bg-[#1a1a1a] flex items-center justify-center">
                          <Film size={24} className="text-neutral-600" />
                        </div>
                      )}
                      <div className="p-3">
                        <p className="text-sm font-semibold text-white leading-tight">{c.film.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-neutral-500">{c.film.release_year}</p>
                          {c.character_name && (
                            <p className="text-xs text-neutral-600">as {c.character_name}</p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

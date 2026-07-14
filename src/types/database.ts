export interface Database {
  public: {
    Tables: {
      films: {
        Row: Film;
        Insert: Partial<Film>;
        Update: Partial<Film>;
      };
      categories: {
        Row: Category;
        Insert: Partial<Category>;
        Update: Partial<Category>;
      };
      genres: {
        Row: Genre;
        Insert: Partial<Genre>;
        Update: Partial<Genre>;
      };
      film_categories: {
        Row: { film_id: string; category_id: string };
        Insert: { film_id: string; category_id: string };
        Update: { film_id?: string; category_id?: string };
      };
      film_genres: {
        Row: { film_id: string; genre_id: string };
        Insert: { film_id: string; genre_id: string };
        Update: { film_id?: string; genre_id?: string };
      };
      watchlist: {
        Row: WatchlistItem;
        Insert: Partial<WatchlistItem>;
        Update: Partial<WatchlistItem>;
      };
      watch_history: {
        Row: WatchHistoryItem;
        Insert: Partial<WatchHistoryItem>;
        Update: Partial<WatchHistoryItem>;
      };
      xlshorts_profiles: {
        Row: Profile;
        Insert: Partial<Profile>;
        Update: Partial<Profile>;
      };
      user_roles: {
        Row: UserRole;
        Insert: Partial<UserRole>;
        Update: Partial<UserRole>;
      };
      series: {
        Row: Series;
        Insert: Partial<Series>;
        Update: Partial<Series>;
      };
    };
  };
}

export interface Film {
  id: string;
  title: string;
  description: string;
  director: string;
  duration_seconds: number;
  release_year: number;
  rating: string;
  thumbnail_url: string;
  backdrop_url: string;
  video_url: string;
  video_storage_path: string;
  featured: boolean;
  featured_order: number;
  imdb_score: number;
  avg_rating: number;
  rating_count: number;
  tags: string[];
  status: 'draft' | 'pending' | 'published' | 'rejected';
  uploaded_by: string | null;
  rejection_reason: string;
  created_at: string;
  // Extended metadata
  language: string;
  country_of_origin: string;
  production_company: string;
  cast_members: string[];
  writer: string;
  producer: string;
  cinematographer: string;
  awards: string;
  festival_selections: string[];
  website_url: string;
  trailer_url: string;
  subtitle_languages: string[];
  aspect_ratio: string;
  shooting_format: string;
  genre_other: string;
  // Series
  content_type: 'film' | 'episode';
  series_id: string | null;
  season_number: number | null;
  episode_number: number | null;
  episode_title: string | null;
  // Content flags
  content_has_language: boolean;
  content_has_nudity: boolean;
  content_has_violence: boolean;
  content_has_drug_use: boolean;
  content_has_adult_themes: boolean;
  content_has_flashing_lights: boolean;
  ok_for_children: boolean;
  age_recommendation: 'all-ages' | 'teen' | 'mature' | 'adult' | '';
}

export interface FilmRating {
  id: string;
  film_id: string;
  user_id: string;
  score: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
}

export interface Genre {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  sort_order: number;
}

export interface WatchlistItem {
  id: string;
  user_id: string;
  film_id: string;
  profile_id: string | null;
  added_at: string;
}

export interface WatchHistoryItem {
  id: string;
  user_id: string;
  film_id: string;
  profile_id: string | null;
  progress_seconds: number;
  completed: boolean;
  watched_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  avatar_color: string;
  avatar_letter: string;
  avatar_icon: string | null;
  avatar_url: string | null;
  is_child: boolean;
  max_rating: string;
  pin_hash: string | null;
  bio: string | null;
  social_instagram: string | null;
  social_tiktok: string | null;
  social_youtube: string | null;
  social_x: string | null;
  social_facebook: string | null;
  preferred_genres: string[];
  notify_new_films: boolean;
  created_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'creator';
  granted_by: string | null;
  granted_at: string;
}

export interface Series {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  backdrop_url: string;
  rating: string;
  language: string;
  country_of_origin: string;
  status: 'draft' | 'pending' | 'published' | 'rejected';
  creator_id: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface FilmWithCategory extends Film {
  categories?: Category[];
}

export interface Ad {
  id: string;
  title: string;
  advertiser: string;
  tagline: string;
  type: 'pre-roll' | 'mid-roll' | 'both';
  duration_seconds: number;
  image_url: string;
  accent_color: string;
  active: boolean;
  created_at: string;
}

export interface AdImpression {
  id: string;
  ad_id: string;
  film_id: string;
  user_id: string | null;
  placement: 'pre-roll' | 'mid-roll';
  completed: boolean;
  viewed_at: string;
}

export const CONTENT_RATINGS = ['G', 'PG', 'PG-13', 'R', 'NC-17'] as const;
export type ContentRating = typeof CONTENT_RATINGS[number];

export const RATING_ORDER: Record<string, number> = {
  'G': 0,
  'PG': 1,
  'PG-13': 2,
  'R': 3,
  'NC-17': 4,
};

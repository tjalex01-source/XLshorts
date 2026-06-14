/*
  # Xandland+ Streaming Platform Schema

  ## Overview
  Full schema for the XL+ short film streaming platform.

  ## New Tables

  ### `categories`
  - `id` (uuid, PK) - Unique identifier
  - `name` (text) - Category display name
  - `slug` (text) - URL-safe identifier
  - `sort_order` (int) - Display ordering

  ### `films`
  - `id` (uuid, PK) - Unique identifier
  - `title` (text) - Film title
  - `description` (text) - Film synopsis
  - `director` (text) - Director name
  - `duration_seconds` (int) - Runtime in seconds
  - `release_year` (int) - Year of release
  - `rating` (text) - Content rating (G, PG, etc.)
  - `thumbnail_url` (text) - Poster/thumbnail image URL
  - `backdrop_url` (text) - Wide hero/backdrop image URL
  - `video_url` (text) - Streaming video URL
  - `featured` (boolean) - Whether to show in hero section
  - `featured_order` (int) - Hero display order
  - `imdb_score` (numeric) - IMDb-style rating out of 10
  - `tags` (text[]) - Array of genre/mood tags
  - `created_at` (timestamptz)

  ### `film_categories`
  - `film_id` (uuid, FK) - Reference to films
  - `category_id` (uuid, FK) - Reference to categories
  (composite PK)

  ### `watchlist`
  - `id` (uuid, PK)
  - `user_id` (uuid) - Auth user
  - `film_id` (uuid, FK)
  - `added_at` (timestamptz)

  ### `watch_history`
  - `id` (uuid, PK)
  - `user_id` (uuid) - Auth user
  - `film_id` (uuid, FK)
  - `progress_seconds` (int) - Playback position
  - `completed` (boolean) - Whether fully watched
  - `watched_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Films and categories are publicly readable
  - Watchlist and watch_history are private to each user
*/

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  sort_order int DEFAULT 0
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are publicly readable"
  ON categories FOR SELECT
  TO anon, authenticated
  USING (true);

-- Films table
CREATE TABLE IF NOT EXISTS films (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  director text DEFAULT '',
  duration_seconds int DEFAULT 0,
  release_year int DEFAULT 2024,
  rating text DEFAULT 'PG',
  thumbnail_url text DEFAULT '',
  backdrop_url text DEFAULT '',
  video_url text DEFAULT '',
  featured boolean DEFAULT false,
  featured_order int DEFAULT 0,
  imdb_score numeric(3,1) DEFAULT 7.0,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE films ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Films are publicly readable"
  ON films FOR SELECT
  TO anon, authenticated
  USING (true);

-- Film categories junction
CREATE TABLE IF NOT EXISTS film_categories (
  film_id uuid REFERENCES films(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (film_id, category_id)
);

ALTER TABLE film_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Film categories are publicly readable"
  ON film_categories FOR SELECT
  TO anon, authenticated
  USING (true);

-- Watchlist table
CREATE TABLE IF NOT EXISTS watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  film_id uuid NOT NULL REFERENCES films(id) ON DELETE CASCADE,
  added_at timestamptz DEFAULT now(),
  UNIQUE (user_id, film_id)
);

ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own watchlist"
  ON watchlist FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to watchlist"
  ON watchlist FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from watchlist"
  ON watchlist FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Watch history table
CREATE TABLE IF NOT EXISTS watch_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  film_id uuid NOT NULL REFERENCES films(id) ON DELETE CASCADE,
  progress_seconds int DEFAULT 0,
  completed boolean DEFAULT false,
  watched_at timestamptz DEFAULT now(),
  UNIQUE (user_id, film_id)
);

ALTER TABLE watch_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own watch history"
  ON watch_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert watch history"
  ON watch_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own watch history"
  ON watch_history FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_films_featured ON films(featured, featured_order);
CREATE INDEX IF NOT EXISTS idx_watchlist_user ON watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_history_user ON watch_history(user_id);
CREATE INDEX IF NOT EXISTS idx_film_categories_category ON film_categories(category_id);
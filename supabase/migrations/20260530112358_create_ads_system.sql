/*
  # Ad Monetization System for Xandland+

  ## Overview
  Implements the AVOD (Ad-Supported Video on Demand) monetization layer.

  ## Ad Break Rules (enforced in the player):
  - Films < 5 minutes: 30 seconds of pre-roll ads
  - Films 5–15 minutes: 60 seconds of pre-roll ads
  - Films > 15 minutes: 60 seconds of pre-roll ads + 30–60 seconds mid-roll ads

  ## New Tables

  ### `ads`
  Stores individual ad creatives shown during playback.
  - `id` (uuid, PK)
  - `title` (text) - Internal ad name
  - `advertiser` (text) - Brand/company name shown to viewer
  - `tagline` (text) - Short ad copy shown on screen
  - `type` (text) - 'pre-roll', 'mid-roll', or 'both'
  - `duration_seconds` (int) - How long the ad runs
  - `image_url` (text) - Ad creative image (Pexels URL)
  - `accent_color` (text) - Brand color hex for styled display
  - `active` (boolean) - Whether this ad is currently live
  - `created_at` (timestamptz)

  ### `ad_impressions`
  Tracks every ad view for reporting and billing.
  - `id` (uuid, PK)
  - `ad_id` (uuid, FK → ads)
  - `film_id` (uuid, FK → films)
  - `user_id` (uuid, nullable) - Auth user if signed in, null for anonymous
  - `placement` (text) - 'pre-roll' or 'mid-roll'
  - `completed` (boolean) - Whether viewer watched through the full ad
  - `viewed_at` (timestamptz)

  ## Security
  - `ads` table is publicly readable (needed by player)
  - `ad_impressions` inserts allowed for authenticated AND anonymous (anon role)
    so impression data is captured even for logged-out users
  - Impressions are read-only after insert (no updates/deletes by clients)
*/

CREATE TABLE IF NOT EXISTS ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  advertiser text NOT NULL DEFAULT '',
  tagline text DEFAULT '',
  type text NOT NULL DEFAULT 'both' CHECK (type IN ('pre-roll', 'mid-roll', 'both')),
  duration_seconds int NOT NULL DEFAULT 30,
  image_url text DEFAULT '',
  accent_color text DEFAULT '#e8a020',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ads are publicly readable"
  ON ads FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE TABLE IF NOT EXISTS ad_impressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  film_id uuid NOT NULL REFERENCES films(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  placement text NOT NULL CHECK (placement IN ('pre-roll', 'mid-roll')),
  completed boolean DEFAULT false,
  viewed_at timestamptz DEFAULT now()
);

ALTER TABLE ad_impressions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record ad impressions"
  ON ad_impressions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_ad_impressions_ad ON ad_impressions(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_film ON ad_impressions(film_id);
CREATE INDEX IF NOT EXISTS idx_ads_active ON ads(active);
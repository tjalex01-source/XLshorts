/*
  # Fix XLShorts creator uploads

  The Creator upload form (src/pages/Creator.tsx) was shipped ahead of the
  database: it inserts/updates several columns that never existed on the live
  `films` / `series` tables, so EVERY film and series save failed with
  PostgREST error 42703 ("column ... does not exist") and no content was ever
  created. This migration reconciles the schema with the code.

  Confirmed missing (probed against the live DB):
    films.video_storage_path, films.country_of_origin
    series.creator_id, series.rating, series.language, series.country_of_origin
    tables `genres` and `film_genres` (GenrePicker + genre tagging)

  Everything here is additive and idempotent — safe to run more than once.
*/

-- ─────────────────────────────────────────────────────────────
-- 1. Missing columns
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.films  ADD COLUMN IF NOT EXISTS video_storage_path text DEFAULT '';
ALTER TABLE public.films  ADD COLUMN IF NOT EXISTS country_of_origin  text DEFAULT '';

ALTER TABLE public.series ADD COLUMN IF NOT EXISTS creator_id        uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.series ADD COLUMN IF NOT EXISTS rating            text DEFAULT 'PG';
ALTER TABLE public.series ADD COLUMN IF NOT EXISTS language          text DEFAULT 'English';
ALTER TABLE public.series ADD COLUMN IF NOT EXISTS country_of_origin text DEFAULT '';
ALTER TABLE public.series ADD COLUMN IF NOT EXISTS updated_at        timestamptz DEFAULT now();
ALTER TABLE public.series ADD COLUMN IF NOT EXISTS rejection_reason  text DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_films_uploaded_by ON public.films(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_series_creator    ON public.series(creator_id);

-- ─────────────────────────────────────────────────────────────
-- 2. Role helper (mirrors the app's checkAccess: creator OR admin)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_creator_user(uid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = uid AND role IN ('creator', 'admin')
  );
$$;

-- ─────────────────────────────────────────────────────────────
-- 3. RLS so approved creators can write their own films/series.
--    Policies are uniquely named and dropped-then-created, so this
--    never disturbs any existing policy. All are permissive (OR'd).
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.films  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.series ENABLE ROW LEVEL SECURITY;

-- Films: owner = uploaded_by
DROP POLICY IF EXISTS "xlshorts_creators_insert_films" ON public.films;
CREATE POLICY "xlshorts_creators_insert_films" ON public.films
  FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = auth.uid() AND public.is_creator_user(auth.uid()));

DROP POLICY IF EXISTS "xlshorts_creators_update_films" ON public.films;
CREATE POLICY "xlshorts_creators_update_films" ON public.films
  FOR UPDATE TO authenticated
  USING (uploaded_by = auth.uid()) WITH CHECK (uploaded_by = auth.uid());

DROP POLICY IF EXISTS "xlshorts_creators_delete_films" ON public.films;
CREATE POLICY "xlshorts_creators_delete_films" ON public.films
  FOR DELETE TO authenticated
  USING (uploaded_by = auth.uid());

-- Series: owner = creator_id
DROP POLICY IF EXISTS "xlshorts_series_public_read" ON public.series;
CREATE POLICY "xlshorts_series_public_read" ON public.series
  FOR SELECT TO anon, authenticated
  USING (status = 'published' OR creator_id = auth.uid() OR public.is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "xlshorts_creators_insert_series" ON public.series;
CREATE POLICY "xlshorts_creators_insert_series" ON public.series
  FOR INSERT TO authenticated
  WITH CHECK (creator_id = auth.uid() AND public.is_creator_user(auth.uid()));

DROP POLICY IF EXISTS "xlshorts_creators_update_series" ON public.series;
CREATE POLICY "xlshorts_creators_update_series" ON public.series
  FOR UPDATE TO authenticated
  USING (creator_id = auth.uid()) WITH CHECK (creator_id = auth.uid());

DROP POLICY IF EXISTS "xlshorts_creators_delete_series" ON public.series;
CREATE POLICY "xlshorts_creators_delete_series" ON public.series
  FOR DELETE TO authenticated
  USING (creator_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- 4. Genres + film_genres (GenrePicker reads `genres`; save writes `film_genres`)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.genres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  parent_id uuid REFERENCES public.genres(id) ON DELETE CASCADE,
  sort_order int DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.film_genres (
  film_id  uuid REFERENCES public.films(id)  ON DELETE CASCADE,
  genre_id uuid REFERENCES public.genres(id) ON DELETE CASCADE,
  PRIMARY KEY (film_id, genre_id)
);

ALTER TABLE public.genres      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.film_genres ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "xlshorts_genres_public_read" ON public.genres;
CREATE POLICY "xlshorts_genres_public_read" ON public.genres
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "xlshorts_film_genres_public_read" ON public.film_genres;
CREATE POLICY "xlshorts_film_genres_public_read" ON public.film_genres
  FOR SELECT TO anon, authenticated USING (true);

-- A creator manages the genre rows of films they own.
DROP POLICY IF EXISTS "xlshorts_film_genres_owner_write" ON public.film_genres;
CREATE POLICY "xlshorts_film_genres_owner_write" ON public.film_genres
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.films f WHERE f.id = film_id AND f.uploaded_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.films f WHERE f.id = film_id AND f.uploaded_by = auth.uid()));

-- Seed a starter genre tree (parents + a few subgenres). Safe to re-run.
INSERT INTO public.genres (name, slug, parent_id, sort_order) VALUES
  ('Drama',        'drama',        NULL, 10),
  ('Comedy',       'comedy',       NULL, 20),
  ('Horror',       'horror',       NULL, 30),
  ('Thriller',     'thriller',     NULL, 40),
  ('Sci-Fi',       'sci-fi',       NULL, 50),
  ('Fantasy',      'fantasy',      NULL, 60),
  ('Action',       'action',       NULL, 70),
  ('Romance',      'romance',      NULL, 80),
  ('Documentary',  'documentary',  NULL, 90),
  ('Animation',    'animation',    NULL, 100),
  ('Mystery',      'mystery',      NULL, 110),
  ('Western',      'western',      NULL, 120),
  ('Musical',      'musical',      NULL, 130),
  ('Experimental', 'experimental', NULL, 140)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.genres (name, slug, parent_id, sort_order)
SELECT v.name, v.slug, p.id, v.sort_order
FROM (VALUES
  ('Dark Comedy',      'dark-comedy',      'comedy', 21),
  ('Romantic Comedy',  'romantic-comedy',  'comedy', 22),
  ('Psychological Horror','psychological-horror','horror', 31),
  ('Found Footage',    'found-footage',    'horror', 32),
  ('Crime Thriller',   'crime-thriller',   'thriller', 41),
  ('Coming of Age',    'coming-of-age',    'drama', 11),
  ('Neo-Noir',         'neo-noir',         'drama', 12)
) AS v(name, slug, parent_slug, sort_order)
JOIN public.genres p ON p.slug = v.parent_slug
ON CONFLICT (slug) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 5. Create the film-uploads / film-thumbnails buckets (they never
--    existed — only `avatars` did, so every file upload failed with
--    "Bucket not found"). Public so the <video> player, which streams
--    from films.video_url, can load uploaded files.
-- ─────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit) VALUES
  ('film-uploads',    'film-uploads',    true, 5368709120),  -- 5 GB video
  ('film-thumbnails', 'film-thumbnails', true, 52428800)     -- 50 MB images
ON CONFLICT (id) DO UPDATE
  SET public = excluded.public, file_size_limit = excluded.file_size_limit;

-- Storage write policies: a creator may upload into their own uid folder.
DROP POLICY IF EXISTS "xlshorts_film_uploads_insert" ON storage.objects;
CREATE POLICY "xlshorts_film_uploads_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'film-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "xlshorts_film_uploads_read" ON storage.objects;
CREATE POLICY "xlshorts_film_uploads_read" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'film-uploads');

DROP POLICY IF EXISTS "xlshorts_film_thumbs_insert" ON storage.objects;
CREATE POLICY "xlshorts_film_thumbs_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'film-thumbnails' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "xlshorts_film_thumbs_read" ON storage.objects;
CREATE POLICY "xlshorts_film_thumbs_read" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'film-thumbnails');

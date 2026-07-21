/*
  # Admin moderation RLS for films & series

  The earlier upload fix (20260714120000) added creator-scoped write policies
  (uploaded_by / creator_id = auth.uid()) but no ADMIN policy. Result: an admin
  approving/removing/featuring/deleting a film uploaded by a DIFFERENT creator
  hit RLS, the UPDATE matched 0 rows, and the action silently did nothing
  ("the Approve button didn't work").

  This grants admins (is_admin_user) full UPDATE/DELETE over all films & series
  so moderation works. Additive and idempotent.
*/

-- Films — admin can moderate any row
DROP POLICY IF EXISTS "xlshorts_admin_update_films" ON public.films;
CREATE POLICY "xlshorts_admin_update_films" ON public.films
  FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "xlshorts_admin_delete_films" ON public.films;
CREATE POLICY "xlshorts_admin_delete_films" ON public.films
  FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- Series — admin can moderate any row
DROP POLICY IF EXISTS "xlshorts_admin_update_series" ON public.series;
CREATE POLICY "xlshorts_admin_update_series" ON public.series
  FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "xlshorts_admin_delete_series" ON public.series;
CREATE POLICY "xlshorts_admin_delete_series" ON public.series
  FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

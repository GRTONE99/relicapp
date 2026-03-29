
CREATE POLICY "Authenticated users can check for duplicate usernames"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

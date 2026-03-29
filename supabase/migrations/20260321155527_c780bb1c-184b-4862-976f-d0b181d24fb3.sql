-- Create security definer function for checking username uniqueness
CREATE OR REPLACE FUNCTION public.check_username_available(check_username text, current_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE username = check_username
      AND user_id != current_user_id
  )
$$;

-- Create security definer function for checking display name uniqueness
CREATE OR REPLACE FUNCTION public.check_display_name_available(check_display_name text, current_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE display_name = check_display_name
      AND user_id != current_user_id
  )
$$;

-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Authenticated users can check for duplicate usernames" ON public.profiles;

-- Create restricted SELECT policy - users can only read their own profile
CREATE POLICY "Users can read their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
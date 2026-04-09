/*
  # Fix RLS Policies and Auth Security

  ## Summary
  Fixes several security and correctness issues in the existing RLS policies:

  ## Changes

  ### profiles table
  1. DROP the overly permissive SELECT policy that uses `USING (true)`
  2. ADD a proper SELECT policy: users can read their own profile, admins can read all
  3. ADD WITH CHECK to the "Users can update their own profile" UPDATE policy
  4. ADD missing DELETE policy for admins

  ### user_roles table
  1. FIX the "Admins can manage all roles" ALL policy - split into separate policies
     per best practice (no FOR ALL)
  2. ADD INSERT policy so the trigger (handle_new_user) can write roles via SECURITY DEFINER functions

  ## Security Notes
  - Profiles are now only readable by the owner or admins
  - All UPDATE policies have proper WITH CHECK clauses
  - No USING(true) policies remain
*/

-- ============================================================
-- profiles: drop bad SELECT policy and replace with secure one
-- ============================================================
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;

-- Users can read their own profile; admins can read all profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'hod'::app_role)
  );

-- ============================================================
-- profiles: fix UPDATE policies - add WITH CHECK
-- ============================================================
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- profiles: add DELETE for admins
-- ============================================================
CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- user_roles: replace FOR ALL with separate policies
-- ============================================================
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- SELECT: users can see their own role; admins/HODs can see all
CREATE POLICY "Users can view own role"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'hod'::app_role)
  );

-- INSERT: only admins can directly insert roles (trigger uses SECURITY DEFINER)
CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- UPDATE: only admins can change roles
CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- DELETE: only admins can remove roles
CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

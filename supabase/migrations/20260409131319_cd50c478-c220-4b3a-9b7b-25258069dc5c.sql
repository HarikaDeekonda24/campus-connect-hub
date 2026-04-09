
-- Add approved column to profiles
ALTER TABLE public.profiles ADD COLUMN approved BOOLEAN NOT NULL DEFAULT true;

-- Allow admins to view all roles (needed for admin dashboard)
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

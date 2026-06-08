-- ============================================================
-- GNITS Campus Connect — Run this in your Supabase SQL Editor
-- Dashboard → SQL Editor → New query → paste → Run
-- ============================================================

-- 1. PROFILES (extended user info linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'student',
  department TEXT NOT NULL DEFAULT 'General',
  branches   TEXT[] NOT NULL DEFAULT '{}',
  roll_number TEXT,
  phone      TEXT,
  section    TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. EVENTS
CREATE TABLE IF NOT EXISTS public.events (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  date        DATE NOT NULL,
  time        TEXT,
  location    TEXT,
  branch      TEXT,
  status      TEXT NOT NULL DEFAULT 'pending',
  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. ATTENDANCE REQUESTS
CREATE TABLE IF NOT EXISTS public.attendance_requests (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id     UUID REFERENCES public.events(id) ON DELETE SET NULL,
  student_name TEXT NOT NULL,
  roll_number  TEXT NOT NULL,
  branch       TEXT NOT NULL,
  department   TEXT NOT NULL,
  proof        TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. HOD INVITES (admin pre-registers an email → system assigns HOD role on signup)
CREATE TABLE IF NOT EXISTS public.hod_invites (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email      TEXT NOT NULL UNIQUE,
  branches   TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hod_invites       ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated USING (true);
CREATE POLICY "profiles_delete" ON public.profiles FOR DELETE TO authenticated USING (true);

-- Events
CREATE POLICY "events_select" ON public.events FOR SELECT TO authenticated USING (true);
CREATE POLICY "events_insert" ON public.events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "events_update" ON public.events FOR UPDATE TO authenticated USING (true);

-- Attendance
CREATE POLICY "attendance_select" ON public.attendance_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "attendance_insert" ON public.attendance_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
CREATE POLICY "attendance_update" ON public.attendance_requests FOR UPDATE TO authenticated USING (true);

-- HOD invites
CREATE POLICY "hod_invites_select" ON public.hod_invites FOR SELECT TO authenticated USING (true);
CREATE POLICY "hod_invites_insert" ON public.hod_invites FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "hod_invites_delete" ON public.hod_invites FOR DELETE TO authenticated USING (true);

-- Add approved column if running against an existing table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT true;

-- ============================================================
-- SEED DATA — sample approved events
-- ============================================================
INSERT INTO public.events (title, description, date, time, location, branch, status) VALUES
  ('HackCampus 2026', 'Annual 48-hour hackathon with prizes worth Rs.5L. Build innovative solutions for real-world problems.', '2026-04-15', '09:00 AM', 'Main Auditorium', 'CSE', 'approved'),
  ('AI/ML Workshop', 'Hands-on workshop on building machine learning models with TensorFlow and PyTorch.', '2026-04-10', '02:00 PM', 'Lab Block C', 'CSM', 'approved'),
  ('Research Symposium', 'Presentations of cutting-edge research from faculty and graduate students.', '2026-04-20', '10:00 AM', 'Seminar Hall B', 'ECE', 'approved'),
  ('Cultural Night', 'Annual cultural fest featuring music, dance, and theater performances.', '2026-04-25', '06:00 PM', 'Open Air Theater', NULL, 'approved')
ON CONFLICT DO NOTHING;

-- ============================================================
-- NOTE: To create the first Admin account:
-- 1. Register in the app with admin@gnits.ac.in
-- 2. Then run: UPDATE public.profiles SET role='admin', approved=true WHERE email='admin@gnits.ac.in';
-- ============================================================

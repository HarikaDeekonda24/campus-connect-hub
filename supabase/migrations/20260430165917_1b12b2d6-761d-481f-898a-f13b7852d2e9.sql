
-- Events table
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  date date NOT NULL,
  time text,
  location text,
  branch app_branch,
  status text NOT NULL DEFAULT 'pending',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View approved or own events" ON public.events
  FOR SELECT TO authenticated
  USING (
    status = 'approved'
    OR created_by = auth.uid()
    OR public.has_role(auth.uid(), 'hod')
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Faculty/HOD/Admin can create events" ON public.events
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND (
      public.has_role(auth.uid(), 'faculty')
      OR public.has_role(auth.uid(), 'hod')
      OR public.has_role(auth.uid(), 'admin')
    )
  );

CREATE POLICY "Creator/HOD/Admin can update events" ON public.events
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR public.has_role(auth.uid(), 'hod')
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Creator/HOD/Admin can delete events" ON public.events
  FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    OR public.has_role(auth.uid(), 'hod')
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Attendance requests table
CREATE TABLE IF NOT EXISTS public.attendance_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  student_name text NOT NULL,
  roll_number text NOT NULL,
  branch app_branch NOT NULL,
  department text NOT NULL,
  proof text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.attendance_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view own requests; staff view all" ON public.attendance_requests
  FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()
    OR public.has_role(auth.uid(), 'faculty')
    OR public.has_role(auth.uid(), 'hod')
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Students create own requests" ON public.attendance_requests
  FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Staff can update requests" ON public.attendance_requests
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'faculty')
    OR public.has_role(auth.uid(), 'hod')
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE TRIGGER update_attendance_requests_updated_at
  BEFORE UPDATE ON public.attendance_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

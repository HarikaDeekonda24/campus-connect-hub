/*
  # Create Events and Attendance Requests Tables

  ## New Tables

  ### events
  - `id` (uuid, primary key)
  - `title` (text) - event name
  - `description` (text) - event details
  - `date` (date) - event date
  - `time` (text) - event time string
  - `venue` (text) - location
  - `organizer` (text) - organizing club/person
  - `category` (text) - hackathon, workshop, seminar, club-event
  - `status` (text) - pending, approved, rejected
  - `branch` (app_branch, nullable) - relevant branch or null for all
  - `registration_link` (text, nullable)
  - `featured` (boolean, default false)
  - `submitted_by` (uuid, fk to auth.users) - who submitted the event
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### attendance_requests
  - `id` (uuid, primary key)
  - `student_id` (uuid, fk to auth.users) - the student requesting
  - `event_id` (uuid, fk to events) - which event
  - `student_name` (text) - snapshot of student name
  - `roll_number` (text) - snapshot of roll number
  - `branch` (app_branch) - snapshot of student branch
  - `department` (text) - snapshot of student department
  - `proof` (text) - registration proof or link
  - `status` (text) - pending, approved, rejected
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - RLS enabled on both tables
  - Students can view approved events
  - Students can submit events and attendance requests
  - HODs/admins can approve/reject
  - Faculty can view attendance requests for their branches
*/

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  date date NOT NULL,
  time text NOT NULL DEFAULT '09:00 AM',
  venue text NOT NULL DEFAULT '',
  organizer text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'workshop',
  status text NOT NULL DEFAULT 'pending',
  branch app_branch NULL,
  registration_link text NULL,
  featured boolean NOT NULL DEFAULT false,
  submitted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read approved events
CREATE POLICY "Authenticated users can view approved events"
  ON events FOR SELECT
  TO authenticated
  USING (status = 'approved');

-- HODs and admins can view all events (including pending)
CREATE POLICY "HODs and admins can view all events"
  ON events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('hod', 'admin')
    )
  );

-- Students can insert events (submit for approval)
CREATE POLICY "Students and faculty can submit events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (
    submitted_by = auth.uid()
  );

-- HODs and admins can update events (approve/reject)
CREATE POLICY "HODs and admins can update events"
  ON events FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('hod', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('hod', 'admin')
    )
  );

-- Admins can delete events
CREATE POLICY "Admins can delete events"
  ON events FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Create attendance_requests table
CREATE TABLE IF NOT EXISTS attendance_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  student_name text NOT NULL DEFAULT '',
  roll_number text NOT NULL DEFAULT '',
  branch app_branch NOT NULL,
  department text NOT NULL DEFAULT '',
  proof text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE attendance_requests ENABLE ROW LEVEL SECURITY;

-- Students can view their own attendance requests
CREATE POLICY "Students can view own attendance requests"
  ON attendance_requests FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

-- Students can insert their own attendance requests
CREATE POLICY "Students can submit attendance requests"
  ON attendance_requests FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

-- HODs and admins can view all attendance requests
CREATE POLICY "HODs and admins can view all attendance requests"
  ON attendance_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('hod', 'admin')
    )
  );

-- Faculty can view attendance requests for their branches
CREATE POLICY "Faculty can view attendance requests for their branches"
  ON attendance_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.branches::text[] @> ARRAY[branch::text]
      AND EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'faculty'
      )
    )
  );

-- HODs and admins can update attendance requests (approve/reject)
CREATE POLICY "HODs and admins can update attendance requests"
  ON attendance_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('hod', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('hod', 'admin')
    )
  );

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_events_updated_at') THEN
    CREATE TRIGGER update_events_updated_at
      BEFORE UPDATE ON events
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_attendance_requests_updated_at') THEN
    CREATE TRIGGER update_attendance_requests_updated_at
      BEFORE UPDATE ON attendance_requests
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Seed some approved events for testing
INSERT INTO events (title, description, date, time, venue, organizer, category, status, branch, featured)
VALUES
  ('HackCampus 2026', 'Annual 48-hour hackathon with prizes worth Rs.5L. Build innovative solutions for real-world problems.', '2026-04-15', '09:00 AM', 'Main Auditorium', 'Tech Club', 'hackathon', 'approved', 'CSE', true),
  ('AI/ML Workshop', 'Hands-on workshop on building machine learning models with TensorFlow and PyTorch.', '2026-04-10', '02:00 PM', 'Lab Block C', 'AI Society', 'workshop', 'approved', 'CSM', true),
  ('Research Symposium', 'Presentations of cutting-edge research from faculty and graduate students.', '2026-04-20', '10:00 AM', 'Seminar Hall B', 'Research Dept', 'seminar', 'approved', 'ECE', false),
  ('Cultural Night', 'Annual cultural fest featuring music, dance, and theater performances.', '2026-04-25', '06:00 PM', 'Open Air Theater', 'Cultural Committee', 'club-event', 'approved', NULL, true),
  ('Web Dev Bootcamp', 'A 3-day intensive bootcamp on full-stack web development.', '2026-05-01', '09:00 AM', 'Computer Lab A', 'Dev Club', 'workshop', 'pending', 'CSE', false),
  ('Startup Pitch Night', 'Present your startup ideas to real investors and mentors.', '2026-05-05', '05:00 PM', 'Innovation Hub', 'E-Cell', 'seminar', 'pending', 'IT', false)
ON CONFLICT DO NOTHING;

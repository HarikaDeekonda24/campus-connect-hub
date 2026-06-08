import { pool } from './db';
import bcrypt from 'bcryptjs';
import type { UserRole, Branch, User, Event, AttendanceRequest } from '../shared/schema';

export async function initDb() {
  const client = await pool.connect();
  try {
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
          CREATE TYPE app_role AS ENUM ('student', 'faculty', 'hod', 'admin');
        END IF;
      END $$;

      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_branch') THEN
          CREATE TYPE app_branch AS ENUM ('CSE', 'CSM', 'CSD', 'ECE', 'IT', 'EVM', 'EEE');
        END IF;
      END $$;

      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role app_role NOT NULL DEFAULT 'student',
        department TEXT NOT NULL DEFAULT 'General',
        branches TEXT[] NOT NULL DEFAULT '{}',
        roll_number TEXT,
        phone TEXT,
        section TEXT,
        approved BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        description TEXT,
        date DATE NOT NULL,
        time TEXT,
        location TEXT,
        branch TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS attendance_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        event_id UUID REFERENCES events(id) ON DELETE SET NULL,
        student_name TEXT NOT NULL,
        roll_number TEXT NOT NULL,
        branch TEXT NOT NULL,
        department TEXT NOT NULL,
        proof TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    const adminCheck = await client.query(`SELECT id FROM users WHERE email = 'admin@gnits.ac.in'`);
    if (adminCheck.rows.length === 0) {
      const hash = await bcrypt.hash('Admin@2026', 10);
      await client.query(
        `INSERT INTO users (id, name, email, password_hash, role, department, branches, approved)
         VALUES (gen_random_uuid(), 'Admin', 'admin@gnits.ac.in', $1, 'admin', 'Administration', $2, true)`,
        [hash, ['CSE', 'CSM', 'CSD', 'ECE', 'IT', 'EVM', 'EEE']]
      );
      console.log('[DB] Default admin created: admin@gnits.ac.in / Admin@2026');
    }

    const eventsCheck = await client.query(`SELECT COUNT(*) FROM events`);
    if (parseInt(eventsCheck.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO events (title, description, date, time, location, branch, status) VALUES
        ('HackCampus 2026', 'Annual 48-hour hackathon with prizes worth Rs.5L. Build innovative solutions for real-world problems.', '2026-04-15', '09:00 AM', 'Main Auditorium', 'CSE', 'approved'),
        ('AI/ML Workshop', 'Hands-on workshop on building machine learning models with TensorFlow and PyTorch.', '2026-04-10', '02:00 PM', 'Lab Block C', 'CSM', 'approved'),
        ('Research Symposium', 'Presentations of cutting-edge research from faculty and graduate students.', '2026-04-20', '10:00 AM', 'Seminar Hall B', 'ECE', 'approved'),
        ('Cultural Night', 'Annual cultural fest featuring music, dance, and theater performances.', '2026-04-25', '06:00 PM', 'Open Air Theater', NULL, 'approved'),
        ('Web Dev Bootcamp', 'A 3-day intensive bootcamp on full-stack web development.', '2026-05-01', '09:00 AM', 'Computer Lab A', 'CSE', 'pending'),
        ('Startup Pitch Night', 'Present your startup ideas to real investors and mentors.', '2026-05-05', '05:00 PM', 'Innovation Hub', 'IT', 'pending')
      `);
      console.log('[DB] Seed events inserted');
    }
  } finally {
    client.release();
  }
}

function rowToUser(row: any): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role as UserRole,
    department: row.department || 'General',
    branches: (row.branches || []) as Branch[],
    rollNumber: row.roll_number || undefined,
    phone: row.phone || undefined,
    section: row.section || undefined,
    approved: row.approved,
    createdAt: row.created_at,
  };
}

function rowToEvent(row: any): Event {
  return {
    id: row.id,
    title: row.title,
    description: row.description || null,
    date: typeof row.date === 'string' ? row.date.slice(0, 10) : row.date?.toISOString?.().slice(0, 10) ?? row.date,
    time: row.time || null,
    location: row.location || null,
    branch: row.branch || null,
    status: row.status,
    createdBy: row.created_by || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToAttendance(row: any): AttendanceRequest {
  return {
    id: row.id,
    studentId: row.student_id,
    eventId: row.event_id || null,
    studentName: row.student_name,
    rollNumber: row.roll_number,
    branch: row.branch as Branch,
    department: row.department,
    proof: row.proof,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getUserByEmail(email: string) {
  const res = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
  return res.rows[0] || null;
}

export async function getUserById(id: string): Promise<User | null> {
  const res = await pool.query(`SELECT * FROM users WHERE id = $1`, [id]);
  if (!res.rows[0]) return null;
  return rowToUser(res.rows[0]);
}

export async function createUser(data: {
  name: string; email: string; password: string; role: UserRole;
  department: string; branches: Branch[]; rollNumber?: string;
  phone?: string; section?: string; approved: boolean;
}): Promise<User> {
  const hash = await bcrypt.hash(data.password, 10);
  const res = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, department, branches, roll_number, phone, section, approved)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [data.name, data.email, hash, data.role, data.department, data.branches,
     data.rollNumber || null, data.phone || null, data.section || null, data.approved]
  );
  return rowToUser(res.rows[0]);
}

export async function verifyPassword(plaintext: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}

export async function getAllUsers(): Promise<User[]> {
  const res = await pool.query(`SELECT * FROM users ORDER BY created_at DESC`);
  return res.rows.map(rowToUser);
}

export async function approveUser(id: string): Promise<void> {
  await pool.query(`UPDATE users SET approved = true WHERE id = $1`, [id]);
}

export async function deleteUser(id: string): Promise<void> {
  await pool.query(`DELETE FROM users WHERE id = $1`, [id]);
}

export async function createHOD(data: { name: string; email: string; password: string; branches: Branch[] }): Promise<User> {
  return createUser({
    name: data.name,
    email: data.email,
    password: data.password,
    role: 'hod',
    department: data.branches[0] || 'General',
    branches: data.branches,
    approved: true,
  });
}

export async function getApprovedEvents(): Promise<Event[]> {
  const res = await pool.query(`SELECT * FROM events WHERE status = 'approved' ORDER BY date ASC`);
  return res.rows.map(rowToEvent);
}

export async function getPendingEvents(): Promise<Event[]> {
  const res = await pool.query(`SELECT * FROM events WHERE status = 'pending' ORDER BY created_at DESC`);
  return res.rows.map(rowToEvent);
}

export async function getAllEvents(): Promise<Event[]> {
  const res = await pool.query(`SELECT * FROM events ORDER BY created_at DESC`);
  return res.rows.map(rowToEvent);
}

export async function createEvent(data: {
  title: string; description?: string | null; date: string; time?: string | null;
  location?: string | null; branch?: string | null; status?: string; createdBy?: string;
}): Promise<Event> {
  const res = await pool.query(
    `INSERT INTO events (title, description, date, time, location, branch, status, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [data.title, data.description || null, data.date, data.time || null,
     data.location || null, data.branch || null, data.status || 'pending', data.createdBy || null]
  );
  return rowToEvent(res.rows[0]);
}

export async function updateEventStatus(id: string, status: string): Promise<Event | null> {
  const res = await pool.query(
    `UPDATE events SET status = $1, updated_at = now() WHERE id = $2 RETURNING *`,
    [status, id]
  );
  if (!res.rows[0]) return null;
  return rowToEvent(res.rows[0]);
}

export async function getAttendanceRequestsByStudent(studentId: string): Promise<AttendanceRequest[]> {
  const res = await pool.query(
    `SELECT * FROM attendance_requests WHERE student_id = $1 ORDER BY created_at DESC`,
    [studentId]
  );
  return res.rows.map(rowToAttendance);
}

export async function getAttendanceRequestsByBranch(branch: string): Promise<AttendanceRequest[]> {
  const res = await pool.query(
    `SELECT * FROM attendance_requests WHERE branch = $1 ORDER BY created_at DESC`,
    [branch]
  );
  return res.rows.map(rowToAttendance);
}

export async function getAllAttendanceRequests(): Promise<AttendanceRequest[]> {
  const res = await pool.query(`SELECT * FROM attendance_requests ORDER BY created_at DESC`);
  return res.rows.map(rowToAttendance);
}

export async function createAttendanceRequest(data: {
  studentId: string; eventId?: string | null; studentName: string;
  rollNumber: string; branch: string; department: string; proof: string;
}): Promise<AttendanceRequest> {
  const res = await pool.query(
    `INSERT INTO attendance_requests (student_id, event_id, student_name, roll_number, branch, department, proof)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [data.studentId, data.eventId || null, data.studentName, data.rollNumber,
     data.branch, data.department, data.proof]
  );
  return rowToAttendance(res.rows[0]);
}

export async function updateAttendanceStatus(id: string, status: string): Promise<AttendanceRequest | null> {
  const res = await pool.query(
    `UPDATE attendance_requests SET status = $1, updated_at = now() WHERE id = $2 RETURNING *`,
    [status, id]
  );
  if (!res.rows[0]) return null;
  return rowToAttendance(res.rows[0]);
}

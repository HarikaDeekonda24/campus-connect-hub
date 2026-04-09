# Campus Connect — GNITS

A college campus management app for GNITS (G. Narayanamma Institute of Technology & Science). Built with React, Vite, TypeScript, Tailwind CSS, and Supabase.

## Architecture

- **Frontend only** — pure React SPA, no separate backend server
- **Auth & Database** — Supabase (auth + PostgreSQL with RLS)
- **Routing** — React Router v6
- **UI** — shadcn/ui components + Tailwind CSS
- **State** — TanStack React Query + React Context for auth

## Key Features

- Role-based access: student, faculty, HOD, admin
- Events & hackathon listings (approved by HODs/admins)
- Attendance request submission and approval workflow
- Campus map and building directory
- Concerns/feedback submission
- Admin dashboard for user and faculty approval management

## Roles

| Role    | Access                                      |
|---------|---------------------------------------------|
| student | View events, submit attendance requests     |
| faculty | Pending approval; view branch attendance    |
| hod     | Approve events & attendance for branches    |
| admin   | Full access: approve faculty, manage users  |

## Database (Supabase)

Migrations are in `supabase/migrations/`. Tables:
- `profiles` — user profile data (linked to Supabase auth.users)
- `user_roles` — role assignments (student/faculty/hod/admin)
- `events` — campus events with approval workflow
- `attendance_requests` — student attendance requests for events

Supabase RLS policies enforce role-based data access.

## Environment Secrets

| Secret                        | Description                           |
|-------------------------------|---------------------------------------|
| VITE_SUPABASE_URL             | Supabase project URL                  |
| VITE_SUPABASE_PUBLISHABLE_KEY | Supabase anon/public key              |

## Dev Server

Runs on port 5000. Start with `npm run dev`.

## Email Domain

All user registrations require `@gnits.ac.in` email addresses.

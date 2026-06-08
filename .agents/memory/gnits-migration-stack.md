---
name: GNITS migration stack
description: Key decisions and quirks from migrating GNITS Campus Connect from Supabase to Replit-native stack.
---

## Stack
- Frontend: React + Vite (port 5000, dev mode proxies /api → 3001)
- Backend: Express (port 3001) run via `tsx server/index.ts` in "Backend Server" workflow
- DB: Replit PostgreSQL via `pg` Pool (DATABASE_URL env var)
- Auth: express-session + connect-pg-simple (sessions stored in DB)
- AI: /api/chat supports GEMINI_API_KEY or OPENAI_API_KEY secrets

## Critical quirks
- `vitest` is blocked by Replit security policy — removed from package.json entirely. Do not add it back.
- `postgres` npm package not available; use `pg` package instead.
- `uuid` package not available; use PostgreSQL's `gen_random_uuid()` for IDs.
- Two workflows needed: "Backend Server" (console, port 3001) + "Start application" (webview, port 5000).

## Default credentials
- Admin: admin@gnits.ac.in / Admin@2026 (created by initDb() on first run)
- HOD default password: gnits@hod2026 (set when admin creates HOD via /api/users/hod)

**Why:** Supabase Auth + Edge Functions replaced because Replit environment uses native PostgreSQL and server-side Express routes instead of Supabase cloud services.

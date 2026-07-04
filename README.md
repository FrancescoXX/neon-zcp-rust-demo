# Neon + Rust + Next.js Tasks Demo (built with Zerops ZCP)

A full-stack tasks app built **step by step, chapter by chapter** for a technical
video series. A Next.js frontend talks to a Rust Axum API, authentication is
handled by **Neon Auth**, tasks live in **Neon Postgres**, and everything is
built, deployed and operated on **Zerops** through the **Zerops Control Plane
(ZCP)** — an AI-agent-driven control plane that provisioned, deployed and
verified each chapter of this project.

> Public demo repository — there are no secrets in this repo. All credentials
> live in Zerops environment variables and are referenced by name only.

## Overview

The app is a minimal authenticated tasks dashboard:

- Sign up / sign in / sign out via Neon Auth (email + password).
- A protected `/dashboard` route that shows the signed-in account.
- A tasks panel on the dashboard: list, create, complete, delete.
- Tasks are stored in Neon Postgres, scoped to the Neon Auth user id.
- The frontend never talks to the database — all data flows through the
  Rust API.

## Architecture

```
                 browser
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌───────────────┐  HTTPS  ┌───────────────┐
│  web (Zerops) │         │  api (Zerops) │
│  Next.js 16   │────────▶│  Rust Axum    │
│  port 3000    │  fetch  │  port 8080    │
└───────┬───────┘         └───────┬───────┘
        │                         │
        ▼                         ▼
┌───────────────┐         ┌───────────────┐
│   Neon Auth   │         │ Neon Postgres │
│ (hosted auth) │         │ (tasks table) │
└───────────────┘         └───────────────┘
```

- The **web** service renders the UI and owns the auth session (server
  components + a Neon Auth proxy route). The tasks panel is a client
  component that calls the Rust API directly from the browser.
- The **api** service exposes the tasks CRUD endpoints and is the only
  component holding a database connection.
- **Neon Auth** is a hosted auth server; the session user id is the
  `user_id` for every task.
- Both runtime services are containers managed by **Zerops**.

## Tech stack

| Layer     | Technology                                              |
|-----------|---------------------------------------------------------|
| Frontend  | Next.js 16 (App Router, standalone output), React 19    |
| Auth      | Neon Auth (`@neondatabase/auth`)                        |
| Backend   | Rust, Axum 0.8, sqlx 0.8 (tokio + rustls), chrono       |
| Database  | Neon Postgres (serverless, branchable)                  |
| Platform  | Zerops (build + runtime containers), driven by ZCP      |

## Repository structure

```
.
├── api/                  # Rust Axum backend service
│   ├── src/main.rs       # entry: tracing, PgPool (lazy), bind 0.0.0.0:8080
│   ├── src/routes.rs     # router, CORS, health/status + tasks CRUD handlers
│   ├── migrations/       # tasks table schema (+ updated_at trigger)
│   └── zerops.yaml       # Zerops build + run config for the api service
├── web/                  # Next.js frontend service
│   ├── app/              # App Router pages: home, auth, protected dashboard
│   ├── components/       # ApiStatus, AuthForm, AuthNav, TasksPanel
│   ├── lib/auth/         # Neon Auth server + client instances
│   ├── proxy.ts          # middleware gating /dashboard
│   └── zerops.yaml       # Zerops build + run config for the web service
├── AGENTS.md             # ZCP agent instructions for this workspace
├── CLAUDE.md             # points at AGENTS.md
└── README.md             # this file
```

Each service keeps its own `zerops.yaml` (build commands, deploy files, run
config, health check) and its own more detailed `README.md`.

## Environment variables

Names only — values are set as Zerops service environment variables and never
committed:

**api service**

| Variable       | Purpose                                              |
|----------------|------------------------------------------------------|
| `DATABASE_URL` | Neon Postgres connection string (secret)             |

**web service**

| Variable                  | Purpose                                                        |
|---------------------------|----------------------------------------------------------------|
| `NEON_AUTH_BASE_URL`      | Hosted Neon Auth server URL (from Neon Console)                |
| `NEON_AUTH_COOKIE_SECRET` | Session-cookie signing secret, 32+ chars (secret)              |
| `BETTER_AUTH_URL`         | The web app's own public URL (TLS terminates at the balancer)  |
| `NEXT_PUBLIC_API_URL`     | Public URL of the Rust API, inlined at build time              |

## Features

- Email + password sign-up, sign-in, sign-out.
- Protected dashboard (middleware redirect + server-side session check).
- Account card: name, email, user id, verification state, created date.
- Tasks panel: create, list (newest first), toggle completed, delete —
  with open/total counters and loading/empty/error states.
- Live API status card (latency ping from the browser).

## Neon Auth

- `web/lib/auth/server.ts` creates the server-side auth instance;
  `web/app/api/auth/[...path]/route.ts` proxies auth calls.
- Auth pages use React server actions (`web/app/auth/actions.ts`).
- The dashboard reads the session server-side and passes `user.id` into the
  tasks panel as a prop — the user never types or picks a user id.
- Deployment gotchas (both required in production): set `BETTER_AUTH_URL` to
  the public URL, and allowlist that URL in Neon Console → Auth →
  Configuration → Domains. Missing either causes 403 "Invalid origin".

## Neon Postgres

- One table, `tasks`: `id`, `user_id` (Neon Auth user id, no FK — auth users
  live in the managed `neon_auth` schema), `title`, `completed`,
  `created_at`, `updated_at`. See `api/migrations/001_create_tasks.sql`.
- `updated_at` is maintained by a database trigger, so the API never has to
  remember to set it.
- The Rust API connects through a lazy sqlx pool — Neon scales to zero, and
  the lazy pool lets the service start instantly while the first query wakes
  the database.

Endpoints (all JSON):

| Method | Path                    | Action                                    |
|--------|-------------------------|-------------------------------------------|
| GET    | `/api/tasks?user_id=…`  | List a user's tasks, newest first          |
| POST   | `/api/tasks`            | Create `{user_id, title}` → 201 + row      |
| PATCH  | `/api/tasks/:id`        | Partial update `{title?, completed?}`      |
| DELETE | `/api/tasks/:id`        | Delete → 204 (404 if missing)              |
| GET    | `/health`               | Platform health check                      |
| GET    | `/api/status`           | Service metadata                           |

## Neon Branching

Neon can branch a database like git branches code: a branch is an instant
copy-on-write clone of the data. In this demo's workflow it is used for safe
development iterations:

1. Create a branch in the Neon Console (or CLI) from the main database.
2. Point a development environment's `DATABASE_URL` at the branch's
   connection string (as a Zerops env var — never committed).
3. Test schema changes or destructive operations against production-shaped
   data with zero risk to the main branch.
4. Merge the schema change forward (re-run the migration on main) and delete
   the branch.

The `tasks` migration in `api/migrations/` is written to be idempotent
(`IF NOT EXISTS` / `OR REPLACE`), so it can be replayed on any branch.

## Zerops and ZCP workflow

The project runs as two Zerops runtime services, **web** (`nodejs@24`) and
**api** (`rust@stable`), each defined by its own `zerops.yaml`:

- **api**: build container runs `cargo build --release` (registry + target
  cached between builds); runtime starts the compiled binary and is
  health-checked on `/health`.
- **web**: build container runs `npm ci && next build` (standalone output +
  static assets copied in); runtime starts the standalone server on port 3000.

The whole project was built through **ZCP (Zerops Control Plane)** — an
MCP-based control plane that an AI agent drives end to end: bootstrap
provisioned the services, each chapter ran as a tracked develop session
(edit → deploy → verify → auto-close), env vars and secrets were referenced
by name only, and every deploy was verified with health checks, log
inspection and a real browser session against the live app.

## Local development notes

This repo is normally developed *inside* the Zerops project (each service's
code is the service's runtime filesystem), but it is a standard Next.js app
and a standard Cargo project:

- `api`: `cargo check` / `cargo build --release`; run with `DATABASE_URL`
  exported and reach it on `http://localhost:8080`.
- `web`: `npm install && npm run dev`; needs the Neon Auth variables and
  `NEXT_PUBLIC_API_URL` pointing at the API. `localhost` is pre-approved in
  the Neon Auth domain allowlist.
- Apply `api/migrations/001_create_tasks.sql` to your database (or a Neon
  branch) once before first use.

## Deployment notes

- Deploys are per service: the build runs in a disposable Zerops build
  container defined by that service's `zerops.yaml`, and the artifact
  replaces the runtime container.
- `NEXT_PUBLIC_*` values are inlined at build time, so changing the API URL
  requires a web rebuild, not just a restart.
- The Neon Auth env vars live in the web service's run config and are lifted
  into the build container by reference (never as literals in the yaml).

## Security notes

- No secrets in the repo: connection strings and cookie secrets exist only
  as Zerops env vars; this README lists variable **names** only.
- The session user id comes from the server-side Neon Auth session, never
  from user input.
- Demo-grade trade-offs, on purpose: the API's CORS is currently open and it
  trusts the `user_id` sent by the client. Production hardening would narrow
  CORS to the web origin and verify the Neon Auth token in the API (or proxy
  API calls through a Next.js route handler).

## License / demo note

This is an educational demo built for a video series — use it, fork it,
break it. No warranty of any kind. If you reuse it, create your own Neon
project and Zerops project; nothing in this repo grants access to the
originals.

# web — Next.js frontend

Frontend for the tasks demo. Chapter 3 scope: Neon Auth is wired in —
email + password sign-up / sign-in / sign-out, a protected `/dashboard`
showing the signed-in account, and a middleware redirect for anonymous
visitors. Neon Postgres and tasks land in later chapters.

## Structure

```
web/
├── package.json          # next 16, react 19, @neondatabase/auth
├── next.config.mjs       # output: "standalone"
├── zerops.yaml           # build + run config for Zerops
├── proxy.ts              # Next 16 middleware: gates /dashboard only
├── app/
│   ├── layout.tsx        # nav (session-aware AuthNav), footer, shell
│   ├── globals.css       # demo design system + auth form styles
│   ├── page.tsx          # home: hero + ApiStatus card
│   ├── api/auth/[...path]/route.ts   # Neon Auth proxy route (GET/POST)
│   ├── auth/
│   │   ├── actions.ts    # server actions: sign up / sign in / sign out
│   │   ├── sign-in/page.tsx
│   │   └── sign-up/page.tsx
│   └── dashboard/
│       └── page.tsx      # protected server component: account card
├── components/
│   ├── ApiStatus.tsx     # client: GET $NEXT_PUBLIC_API_URL/api/status
│   ├── AuthForm.tsx      # client form for both auth pages (useActionState)
│   └── AuthNav.tsx       # client nav: useSession + sign out
└── lib/auth/
    ├── server.ts         # createNeonAuth — server instance
    └── client.ts         # createAuthClient — browser instance
```

## Neon Auth

`lib/auth/server.ts` reads two env vars — values never appear in code:

- `NEON_AUTH_BASE_URL` — hosted Neon Auth server URL (from Neon Console)
- `NEON_AUTH_COOKIE_SECRET` — 32+ char session-cookie signing secret

Both live in `run.envVariables` (zerops.yaml). `build.envVariables` lifts
them into the build container via `${RUNTIME_*}` references, because
`lib/auth/server.ts` is evaluated at module scope during `next build`.

Two deployment requirements beyond the quickstart:

1. **`BETTER_AUTH_URL`** — service env var set to the app's own public
   URL. TLS terminates at the Zerops balancer, so without it the SDK's
   embedded better-auth derives `http://…` as its own origin and rejects
   the browser's `https://…` Origin header (403 `Invalid origin`).
2. **Domain allowlist** — the app's public URL must be added in
   Neon Console → Auth → Configuration → Domains. `localhost` is
   pre-approved; deployed domains are not. Missing entry ⇒ cookie-bearing
   sign-up/sign-in calls fail with the same 403 `Invalid origin`, this
   time from the hosted auth server.

## Test the auth flow

Open the deployed frontend (see `zerops_discover` for the URL):

1. Visit `/dashboard` signed out → redirected to `/auth/sign-in`.
2. Create an account on `/auth/sign-up` → lands on `/dashboard`; the
   account card shows name, email, user id, created date.
3. Sign out (dashboard button or nav) → back home, nav shows Sign in.
4. Sign in on `/auth/sign-in` → `/dashboard` again.

## Backend URL

`NEXT_PUBLIC_API_URL` points at the Rust API's public URL — the status
check runs in the browser, so the internal `http://api:8080` name would
not resolve. Set in `zerops.yaml` `build.envVariables` (Next.js inlines
`NEXT_PUBLIC_*` at build time).

## Local iteration inside the container

```sh
ssh web "npm install"        # once
ssh web "npx tsc --noEmit"   # type-check
ssh web "npm run build"      # full production build
```

Deploys happen via `zerops_deploy targetService="web"` — the build container
runs `npm ci` (clean install from the lockfile), then the runtime starts
`.next/standalone/server.js` on port 3000.

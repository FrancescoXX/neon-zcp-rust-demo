# api — Rust Axum backend

Backend API for the tasks demo. Chapter 1 scope: health + status endpoints and
CORS wiring for the future Next.js frontend. Neon Auth and Neon Postgres land
in later chapters.

## Structure

```
api/
├── Cargo.toml        # axum, tokio, tower-http (CORS), serde
├── zerops.yaml       # build + run config for Zerops
└── src/
    ├── main.rs       # entry point: tracing, bind 0.0.0.0:8080, serve
    └── routes.rs     # router, CORS layer, /health and /api/status handlers
```

## Endpoints

| Method | Path          | Response                                              |
|--------|---------------|-------------------------------------------------------|
| GET    | `/health`     | `{"status":"ok"}` — used by the platform health check |
| GET    | `/api/status` | service metadata JSON (name, version, timestamp)      |

## Test it

Against the public URL (see `zerops_discover` / the Zerops dashboard for the
exact subdomain):

```sh
curl https://<api-subdomain>.zerops.app/health
curl https://<api-subdomain>.zerops.app/api/status
```

Verify the CORS preflight the Next.js frontend will rely on:

```sh
curl -i -X OPTIONS https://<api-subdomain>.zerops.app/api/status \
  -H "Origin: https://example.com" \
  -H "Access-Control-Request-Method: GET"
# expect: access-control-allow-origin: *
```

From inside the project network (e.g. the future `web` service):

```sh
curl http://api:8080/api/status
```

## Local iteration inside the container

```sh
ssh api "cd /var/www && cargo check"     # fast type-check
ssh api "cd /var/www && cargo build --release"
```

Deploys happen via `zerops_deploy targetService="api"` — the build runs in a
separate build container and the compiled binary is started as
`./target/release/api`.

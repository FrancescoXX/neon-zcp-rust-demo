mod routes;

use sqlx::postgres::PgPoolOptions;
use std::net::SocketAddr;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt().init();

    let port: u16 = std::env::var("PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(8080);

    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL is not set");

    // connect_lazy: don't block startup on Neon (it scales to zero and can
    // take a few seconds to wake) — the first query opens the connection.
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect_lazy(&database_url)
        .expect("invalid DATABASE_URL");

    let app = routes::router(pool);

    // Bind on 0.0.0.0 — the Zerops balancer reaches the container over the
    // private network, so loopback-only binds would 502.
    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .expect("failed to bind");

    tracing::info!("api listening on {addr}");
    axum::serve(listener, app).await.expect("server error");
}

use axum::{
    extract::{Path, Query, State},
    http::{header, Method, StatusCode},
    response::Json,
    routing::{get, patch},
    Router,
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sqlx::PgPool;
use std::time::{SystemTime, UNIX_EPOCH};
use tower_http::cors::{Any, CorsLayer};

pub fn router(pool: PgPool) -> Router {
    // Wide-open CORS while there is no frontend yet; once the Next.js app
    // is live this narrows to its exact origin.
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::GET, Method::POST, Method::PATCH, Method::DELETE])
        .allow_headers([header::CONTENT_TYPE, header::AUTHORIZATION]);

    Router::new()
        .route("/health", get(health))
        .route("/api/status", get(status))
        .route("/api/tasks", get(list_tasks).post(create_task))
        .route("/api/tasks/{id}", patch(update_task).delete(delete_task))
        .layer(cors)
        .with_state(pool)
}

#[derive(Serialize, sqlx::FromRow)]
struct Task {
    id: i64,
    user_id: String,
    title: String,
    completed: bool,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

#[derive(Deserialize)]
struct ListTasksParams {
    user_id: String,
}

#[derive(Deserialize)]
struct CreateTask {
    user_id: String,
    title: String,
}

#[derive(Deserialize)]
struct UpdateTask {
    title: Option<String>,
    completed: Option<bool>,
}

type ApiError = (StatusCode, Json<Value>);

fn db_error(err: sqlx::Error) -> ApiError {
    tracing::error!("database error: {err}");
    (
        StatusCode::INTERNAL_SERVER_ERROR,
        Json(json!({ "error": "database error" })),
    )
}

fn not_found() -> ApiError {
    (
        StatusCode::NOT_FOUND,
        Json(json!({ "error": "task not found" })),
    )
}

async fn list_tasks(
    State(pool): State<PgPool>,
    Query(params): Query<ListTasksParams>,
) -> Result<Json<Vec<Task>>, ApiError> {
    let tasks = sqlx::query_as::<_, Task>(
        "SELECT id, user_id, title, completed, created_at, updated_at
         FROM tasks WHERE user_id = $1 ORDER BY created_at DESC",
    )
    .bind(&params.user_id)
    .fetch_all(&pool)
    .await
    .map_err(db_error)?;

    Ok(Json(tasks))
}

async fn create_task(
    State(pool): State<PgPool>,
    Json(body): Json<CreateTask>,
) -> Result<(StatusCode, Json<Task>), ApiError> {
    let title = body.title.trim();
    if title.is_empty() {
        return Err((
            StatusCode::UNPROCESSABLE_ENTITY,
            Json(json!({ "error": "title must not be empty" })),
        ));
    }

    let task = sqlx::query_as::<_, Task>(
        "INSERT INTO tasks (user_id, title) VALUES ($1, $2)
         RETURNING id, user_id, title, completed, created_at, updated_at",
    )
    .bind(&body.user_id)
    .bind(title)
    .fetch_one(&pool)
    .await
    .map_err(db_error)?;

    Ok((StatusCode::CREATED, Json(task)))
}

async fn update_task(
    State(pool): State<PgPool>,
    Path(id): Path<i64>,
    Json(body): Json<UpdateTask>,
) -> Result<Json<Task>, ApiError> {
    // COALESCE keeps the current value for fields the client omitted;
    // updated_at is bumped by the tasks_set_updated_at trigger.
    let task = sqlx::query_as::<_, Task>(
        "UPDATE tasks
         SET title = COALESCE($2, title), completed = COALESCE($3, completed)
         WHERE id = $1
         RETURNING id, user_id, title, completed, created_at, updated_at",
    )
    .bind(id)
    .bind(body.title.as_deref().map(str::trim))
    .bind(body.completed)
    .fetch_optional(&pool)
    .await
    .map_err(db_error)?
    .ok_or_else(not_found)?;

    Ok(Json(task))
}

async fn delete_task(
    State(pool): State<PgPool>,
    Path(id): Path<i64>,
) -> Result<StatusCode, ApiError> {
    let result = sqlx::query("DELETE FROM tasks WHERE id = $1")
        .bind(id)
        .execute(&pool)
        .await
        .map_err(db_error)?;

    if result.rows_affected() == 0 {
        return Err(not_found());
    }
    Ok(StatusCode::NO_CONTENT)
}

async fn health() -> Json<Value> {
    Json(json!({ "status": "ok" }))
}

async fn status() -> Json<Value> {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);

    Json(json!({
        "service": "api",
        "framework": "axum",
        "version": env!("CARGO_PKG_VERSION"),
        "status": "ok",
        "timestamp": now,
    }))
}

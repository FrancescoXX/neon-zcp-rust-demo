"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

type Task = {
  id: number;
  user_id: string;
  title: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
};

// userId comes from the server-side Neon Auth session (passed as a prop by
// the dashboard page) — it is never typed or chosen in the UI.
export default function TasksPanel({ userId }: { userId: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(
        `${API_URL}/api/tasks?user_id=${encodeURIComponent(userId)}`,
        { cache: "no-store" },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setTasks((await res.json()) as Task[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createTask(e: FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, title: trimmed }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const created = (await res.json()) as Task;
      setTasks((prev) => [created, ...prev]);
      setTitle("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function toggleTask(task: Task) {
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !task.completed }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = (await res.json()) as Task;
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function deleteTask(id: number) {
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/tasks/${id}`, {
        method: "DELETE",
      });
      if (!res.ok && res.status !== 404) throw new Error(`HTTP ${res.status}`);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  const remaining = tasks.filter((t) => !t.completed).length;

  return (
    <div className="card">
      <h2>
        <span className={`dot ${error ? "err" : loading ? "loading" : "ok"}`} />
        Your tasks
        {!loading && (
          <span className="muted task-count">
            {remaining} open · {tasks.length} total
          </span>
        )}
      </h2>

      <form className="task-form" onSubmit={createTask}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs doing?"
          aria-label="New task title"
          maxLength={200}
        />
        <button
          className="btn btn-primary"
          type="submit"
          disabled={saving || !title.trim()}
        >
          {saving ? "Adding…" : "Add task"}
        </button>
      </form>

      {error && <p className="error-text">API error: {error}</p>}

      {loading ? (
        <p className="muted">Loading tasks…</p>
      ) : tasks.length === 0 ? (
        <p className="muted">No tasks yet — add your first one above.</p>
      ) : (
        <ul className="task-list">
          {tasks.map((task) => (
            <li key={task.id} className="task-item">
              <label className="task-main">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => void toggleTask(task)}
                />
                <span className={task.completed ? "task-title done" : "task-title"}>
                  {task.title}
                </span>
              </label>
              <span className="muted task-date">
                {new Date(task.created_at).toLocaleDateString()}
              </span>
              <button
                className="task-delete"
                onClick={() => void deleteTask(task.id)}
                aria-label={`Delete task: ${task.title}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="muted" style={{ marginTop: "0.75rem", fontSize: "0.8rem" }}>
        Stored in Neon Postgres via the Rust API — scoped to your Neon Auth
        user id.
      </p>
    </div>
  );
}

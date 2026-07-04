"use client";

import { useCallback, useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

type ApiStatusPayload = {
  service: string;
  framework: string;
  version: string;
  status: string;
  timestamp: number;
};

type State =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "ok"; data: ApiStatusPayload; latencyMs: number };

export default function ApiStatus() {
  const [state, setState] = useState<State>({ phase: "loading" });

  const check = useCallback(async () => {
    setState({ phase: "loading" });
    const started = performance.now();
    try {
      const res = await fetch(`${API_URL}/api/status`, { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data: ApiStatusPayload = await res.json();
      setState({
        phase: "ok",
        data,
        latencyMs: Math.round(performance.now() - started),
      });
    } catch (err) {
      setState({
        phase: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }, []);

  useEffect(() => {
    void check();
  }, [check]);

  return (
    <div className="card">
      <h2>
        <span
          className={`dot ${
            state.phase === "ok" ? "ok" : state.phase === "error" ? "err" : "loading"
          }`}
        />
        Rust backend status
      </h2>

      {state.phase === "loading" && <p className="muted">Contacting the API…</p>}

      {state.phase === "error" && (
        <p className="error-text">
          Could not reach the backend: {state.message}
        </p>
      )}

      {state.phase === "ok" && (
        <div className="status-grid">
          <div className="stat">
            <div className="label">Service</div>
            <div className="value">{state.data.service}</div>
          </div>
          <div className="stat">
            <div className="label">Framework</div>
            <div className="value">{state.data.framework}</div>
          </div>
          <div className="stat">
            <div className="label">Version</div>
            <div className="value">{state.data.version}</div>
          </div>
          <div className="stat">
            <div className="label">Status</div>
            <div className="value">{state.data.status}</div>
          </div>
          <div className="stat">
            <div className="label">Latency</div>
            <div className="value">{state.latencyMs} ms</div>
          </div>
        </div>
      )}

      <button className="btn" onClick={() => void check()}>
        Ping again
      </button>
      <p className="muted" style={{ marginTop: "0.75rem", fontSize: "0.8rem" }}>
        GET {API_URL}/api/status — called from your browser
      </p>
    </div>
  );
}

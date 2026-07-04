import Link from "next/link";
import ApiStatus from "@/components/ApiStatus";

export default function Home() {
  return (
    <>
      <section className="hero">
        <h1>
          A full-stack tasks app,
          <br />
          built <em>layer by layer</em>
        </h1>
        <p>
          Next.js frontend · Rust Axum API · Neon Postgres &amp; Neon Auth
        </p>
        <div className="badges">
          <span className="badge">Next.js 16</span>
          <span className="badge">Rust · Axum</span>
          <span className="badge">Neon Auth</span>
          <span className="badge">Neon Postgres — soon</span>
        </div>
      </section>

      <ApiStatus />

      <div className="card">
        <h2>Next stop</h2>
        <p className="muted">
          The <Link href="/dashboard" style={{ textDecoration: "underline" }}>dashboard</Link>{" "}
          is now protected by Neon Auth — sign up and it shows your account.
          Next chapter: Neon Postgres and per-user tasks.
        </p>
      </div>
    </>
  );
}

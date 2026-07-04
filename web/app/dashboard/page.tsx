import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { signOut } from "@/app/auth/actions";
import ApiStatus from "@/components/ApiStatus";
import TasksPanel from "@/components/TasksPanel";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const { data: session } = await auth.getSession();

  // The middleware already gates /dashboard; this is the server-side backstop
  // so the page is safe even if the matcher changes.
  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const { user } = session;
  const created = user.createdAt ? new Date(user.createdAt) : null;

  return (
    <>
      <section className="hero">
        <h1>Dashboard</h1>
        <p>Signed in — this session comes from Neon Auth.</p>
        <div className="badges">
          <span className="badge">Chapter 3 · Neon Auth ✓</span>
          <span className="badge">Chapter 4 · Neon Postgres ✓</span>
          <span className="badge">Chapter 5 · Tasks CRUD ✓</span>
          <span className="badge">Chapter 6 · Tasks UI</span>
        </div>
      </section>

      <div className="card">
        <h2>
          <span className="dot ok" /> Your account
        </h2>
        <div className="status-grid">
          <div className="stat">
            <div className="label">Name</div>
            <div className="value">{user.name || "—"}</div>
          </div>
          <div className="stat">
            <div className="label">Email</div>
            <div className="value">{user.email}</div>
          </div>
          <div className="stat">
            <div className="label">User ID</div>
            <div className="value">{user.id}</div>
          </div>
          <div className="stat">
            <div className="label">Email verified</div>
            <div className="value">{user.emailVerified ? "yes" : "no"}</div>
          </div>
          <div className="stat">
            <div className="label">Created</div>
            <div className="value">
              {created ? created.toISOString().slice(0, 10) : "—"}
            </div>
          </div>
        </div>

        <form action={signOut}>
          <button className="btn" type="submit">
            Sign out
          </button>
        </form>
      </div>

      <TasksPanel userId={user.id} />

      <ApiStatus />
    </>
  );
}

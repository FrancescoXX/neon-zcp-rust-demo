"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

export default function AuthNav() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <span className="muted">…</span>;
  }

  if (!session?.user) {
    return (
      <>
        <Link href="/auth/sign-in">Sign in</Link>
        <Link href="/auth/sign-up">Sign up</Link>
      </>
    );
  }

  return (
    <>
      <span className="nav-user" title={session.user.email}>
        {session.user.name || session.user.email}
      </span>
      <button
        className="nav-signout"
        onClick={() => {
          void authClient.signOut().then(() => {
            router.push("/");
            router.refresh();
          });
        }}
      >
        Sign out
      </button>
    </>
  );
}

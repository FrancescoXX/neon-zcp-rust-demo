"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signInWithEmail, signUpWithEmail } from "@/app/auth/actions";

export default function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const isSignUp = mode === "sign-up";
  const [state, formAction, isPending] = useActionState(
    isSignUp ? signUpWithEmail : signInWithEmail,
    null,
  );

  return (
    <section className="auth-panel card">
      <h2>{isSignUp ? "Create your account" : "Sign in"}</h2>

      <form action={formAction} className="auth-form">
        {isSignUp && (
          <label>
            Name
            <input name="name" type="text" autoComplete="name" required />
          </label>
        )}
        <label>
          Email
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            minLength={isSignUp ? 8 : undefined}
            required
          />
        </label>

        {state?.error && <p className="error-text">{state.error}</p>}

        <button className="btn btn-primary" type="submit" disabled={isPending}>
          {isPending
            ? isSignUp
              ? "Creating account…"
              : "Signing in…"
            : isSignUp
              ? "Create account"
              : "Sign in"}
        </button>
      </form>

      <p className="muted auth-alt">
        {isSignUp ? (
          <>
            Already have an account?{" "}
            <Link href="/auth/sign-in">Sign in</Link>
          </>
        ) : (
          <>
            No account yet? <Link href="/auth/sign-up">Create one</Link>
          </>
        )}
      </p>
    </section>
  );
}

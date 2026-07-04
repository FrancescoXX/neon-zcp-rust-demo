"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";

type AuthFormState = { error: string } | null;

export async function signUpWithEmail(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const name = ((formData.get("name") as string) ?? "").trim();
  const email = ((formData.get("email") as string) ?? "").trim();
  const password = (formData.get("password") as string) ?? "";

  if (!name || !email || !password) {
    return { error: "Name, email and password are required." };
  }

  const { error } = await auth.signUp.email({ name, email, password });
  if (error) {
    return { error: error.message || "Failed to create the account." };
  }

  redirect("/dashboard");
}

export async function signInWithEmail(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = ((formData.get("email") as string) ?? "").trim();
  const password = (formData.get("password") as string) ?? "";

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const { error } = await auth.signIn.email({ email, password });
  if (error) {
    return { error: error.message || "Invalid email or password." };
  }

  redirect("/dashboard");
}

export async function signOut(): Promise<void> {
  await auth.signOut();
  redirect("/");
}

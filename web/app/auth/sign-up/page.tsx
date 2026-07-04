import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import AuthForm from "@/components/AuthForm";

export const dynamic = "force-dynamic";

export default async function SignUpPage() {
  const { data: session } = await auth.getSession();
  if (session?.user) {
    redirect("/dashboard");
  }

  return <AuthForm mode="sign-up" />;
}

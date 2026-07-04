import { auth } from "@/lib/auth/server";

export default auth.middleware({ loginUrl: "/auth/sign-in" });

// Only the dashboard is gated. Home and the /auth pages stay public, so the
// matcher — not the middleware itself — decides what requires a session.
export const config = {
  matcher: ["/dashboard/:path*"],
};

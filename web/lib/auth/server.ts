import { createNeonAuth } from "@neondatabase/auth/next/server";

// Server-side Neon Auth instance. Reads the hosted auth server URL and the
// session-cookie signing secret from the environment — never hardcode either.
export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET!,
  },
});

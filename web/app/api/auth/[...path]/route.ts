import { auth } from "@/lib/auth/server";

// Proxies sign-in/sign-up/session traffic between the browser and the hosted
// Neon Auth server; session cookies are set on our own domain.
export const { GET, POST } = auth.handler();

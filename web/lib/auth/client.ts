"use client";

import { createAuthClient } from "@neondatabase/auth/next";

// Browser-side client. Talks to our own /api/auth/* proxy route — no auth
// server URL or secret ever reaches the client bundle.
export const authClient = createAuthClient();

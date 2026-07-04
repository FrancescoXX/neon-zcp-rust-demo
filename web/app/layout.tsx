import type { Metadata } from "next";
import Link from "next/link";
import AuthNav from "@/components/AuthNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tasks Demo — Next.js + Rust + Neon",
  description:
    "Full-stack demo: Next.js frontend, Rust Axum backend, Neon Postgres + Neon Auth",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="nav">
          <Link href="/" className="brand">
            <span className="brand-dot" /> tasks<span className="brand-thin">demo</span>
          </Link>
          <nav>
            <Link href="/">Home</Link>
            <Link href="/dashboard">Dashboard</Link>
            <AuthNav />
          </nav>
        </header>
        <main className="container">{children}</main>
        <footer className="footer">
          Next.js · Rust Axum · Neon — demo build
        </footer>
      </body>
    </html>
  );
}

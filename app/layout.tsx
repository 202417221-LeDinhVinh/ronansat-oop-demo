import type { Metadata } from "next";
import AuthProvider from "@/components/AuthProvider";
import AppShell from "@/components/AppShell";
import "katex/dist/katex.min.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ronan SAT (OOP Edition)",
  description: "Master the Digital SAT with Ronan SAT - Built with clean Object-Oriented Architecture.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)]">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}

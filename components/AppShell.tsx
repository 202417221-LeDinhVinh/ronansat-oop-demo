"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Home,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Languages,
  ShieldCheck,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { name: "Home", href: "/", icon: Home },
  { name: "Practice", href: "/practice", icon: BookOpen },
  { name: "Results", href: "/results", icon: CheckCircle2 },
  { name: "Error Log", href: "/error-log", icon: AlertCircle },
  { name: "Statistics", href: "/statistics", icon: BarChart3 },
  { name: "Vocab", href: "/vocab", icon: Languages },
  { name: "Admin", href: "/admin", icon: ShieldCheck, adminOnly: true },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Hide App Shell on Test Room (/test/[id]) and Auth (/auth)
  const isHiddenRoute = pathname.startsWith("/test/") || pathname === "/auth";

  if (isHiddenRoute) {
    return <main className="min-h-screen bg-[var(--bg-canvas)]">{children}</main>;
  }

  const isAdmin = session?.user?.role === "admin";
  const userInitials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "ST";

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] flex flex-col lg:flex-row">
      {/* -------------------------------------------------------------------
          DESKTOP SIDEBAR (lg and above)
      -------------------------------------------------------------------- */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 z-40 bg-[var(--bg-surface)] border-r border-[var(--border-subtle)]">
        {/* Sidebar Header / Logo */}
        <div className="h-16 flex items-center px-6 border-b border-[var(--border-subtle)]">
          <BrandLogo />
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            if (item.adminOnly && !isAdmin) return null;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-[var(--ui-radius-sm)] text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? "bg-[var(--accent-brand-tint)] text-[var(--text-primary)] border-l-2 border-[var(--accent-brand)] shadow-[var(--ui-shadow-xs)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-canvas)]"
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? "text-[var(--accent-brand-strong)]" : "text-[var(--text-muted)]"
                  }`}
                />
                <span className="flex-1 truncate">{item.name}</span>
                {item.adminOnly && (
                  <Badge variant="brand" size="sm">
                    Admin
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile & Logout Bottom Bar */}
        <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          {session ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2 rounded-[var(--ui-radius-sm)] bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
                <div className="w-8 h-8 rounded-full bg-[var(--accent-brand)] text-[var(--text-on-brand)] font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                  {userInitials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                      {session.user?.name || "Student"}
                    </p>
                    <Badge variant={isAdmin ? "brand" : "info"} size="sm">
                      {session.user?.role || "student"}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] truncate">
                    {session.user?.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Link
                  href="/settings"
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] rounded-[var(--ui-radius-sm)] transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Settings</span>
                </Link>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/auth" })}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-[var(--state-danger)] hover:bg-[#fdede8] rounded-[var(--ui-radius-sm)] transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          ) : (
            <Link href="/auth" className="block">
              <Button variant="primary" size="sm" className="w-full">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </aside>

      {/* -------------------------------------------------------------------
          MOBILE TOP BAR (< lg)
      -------------------------------------------------------------------- */}
      <header className="lg:hidden sticky top-0 z-30 h-14 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] px-4 flex items-center justify-between">
        <BrandLogo size="sm" />
        <div className="flex items-center gap-2">
          {session ? (
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex items-center gap-2 p-1.5 rounded-[var(--ui-radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-[var(--accent-brand)] text-[var(--text-on-brand)] font-bold flex items-center justify-center text-xs">
                {userInitials}
              </div>
              <Menu className="w-4 h-4 text-[var(--text-primary)]" />
            </button>
          ) : (
            <Link href="/auth">
              <Button variant="primary" size="sm">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* -------------------------------------------------------------------
          MOBILE SLIDE-OVER DRAWER FOR ADDITIONAL LINKS
      -------------------------------------------------------------------- */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-[#1c1917]/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative ml-auto w-72 max-w-[80vw] bg-[var(--bg-surface)] h-full shadow-[var(--ui-shadow-lg)] flex flex-col p-5">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[var(--accent-brand)] text-[var(--text-on-brand)] font-bold flex items-center justify-center text-xs">
                  {userInitials}
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--text-primary)] leading-tight">
                    {session?.user?.name || "Student"}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] truncate max-w-[140px]">
                    {session?.user?.email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-[var(--ui-radius-sm)] text-[var(--text-muted)] hover:bg-[var(--bg-canvas)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
              {NAV_ITEMS.map((item) => {
                if (item.adminOnly && !isAdmin) return null;
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-[var(--ui-radius-sm)] text-sm font-semibold ${
                      isActive
                        ? "bg-[var(--accent-brand-tint)] text-[var(--text-primary)]"
                        : "text-[var(--text-muted)] hover:bg-[var(--bg-canvas)]"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0 text-[var(--accent-brand-strong)]" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              <Link
                href="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-[var(--ui-radius-sm)] text-sm font-semibold text-[var(--text-muted)] hover:bg-[var(--bg-canvas)]"
              >
                <Settings className="w-4 h-4 shrink-0" />
                <span>Settings</span>
              </Link>
            </nav>

            <div className="pt-4 border-t border-[var(--border-subtle)]">
              <Button
                variant="danger"
                size="sm"
                className="w-full"
                onClick={() => {
                  setMobileMenuOpen(false);
                  signOut({ callbackUrl: "/auth" });
                }}
              >
                <LogOut className="w-4 h-4 mr-1.5" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------
          MAIN CONTENT AREA
      -------------------------------------------------------------------- */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      {/* -------------------------------------------------------------------
          MOBILE BOTTOM TAB BAR (fixed at bottom for screens < lg)
      -------------------------------------------------------------------- */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 h-16 bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] flex items-center justify-around px-2 shadow-[0_-1px_3px_rgba(28,25,23,0.04)]">
        {[
          { name: "Home", href: "/", icon: Home },
          { name: "Practice", href: "/practice", icon: BookOpen },
          { name: "Results", href: "/results", icon: CheckCircle2 },
          { name: "Vocab", href: "/vocab", icon: Languages },
        ].map((tab) => {
          const isActive =
            tab.href === "/"
              ? pathname === "/"
              : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 text-xs font-semibold transition-colors ${
                isActive
                  ? "text-[var(--accent-brand-strong)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{tab.name}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center flex-1 py-1 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
        >
          <MoreHorizontal className="w-5 h-5 mb-0.5" />
          <span>More</span>
        </button>
      </nav>
    </div>
  );
}

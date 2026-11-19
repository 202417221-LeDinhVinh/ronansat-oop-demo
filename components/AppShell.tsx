"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  ChevronsUpDown,
  Settings,
  LogOut,
  Menu,
  X,
  MoreHorizontal,
  ChevronRight,
} from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import UserAvatar from "@/components/ui/UserAvatar";
import {
  NavHomeIcon,
  NavPracticeIcon,
  NavResultsIcon,
  NavErrorLogIcon,
  NavStatisticsIcon,
  NavVocabIcon,
  NavAdminIcon,
  type NavIcon,
} from "@/components/NavIcons";

interface NavItemConfig {
  name: string;
  href: string;
  icon: NavIcon;
  adminOnly?: boolean;
}

interface NavSection {
  heading: string | null;
  items: NavItemConfig[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    heading: null,
    items: [{ name: "Home", href: "/", icon: NavHomeIcon }],
  },
  {
    heading: "Study",
    items: [
      { name: "Practice", href: "/practice", icon: NavPracticeIcon },
      { name: "Vocab", href: "/vocab", icon: NavVocabIcon },
    ],
  },
  {
    heading: "Progress",
    items: [
      { name: "Results", href: "/results", icon: NavResultsIcon },
      { name: "Error Log", href: "/error-log", icon: NavErrorLogIcon },
      { name: "Statistics", href: "/statistics", icon: NavStatisticsIcon },
    ],
  },
  {
    heading: "Manage",
    items: [
      { name: "Admin", href: "/admin", icon: NavAdminIcon, adminOnly: true },
    ],
  },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  // Close user menu on outside click
  useEffect(() => {
    if (!userMenuOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [userMenuOpen]);

  // Hide App Shell on Test Room (/test/[id]) and Auth (/auth)
  const isHiddenRoute = pathname.startsWith("/test/") || pathname === "/auth";

  if (isHiddenRoute) {
    return <main className="min-h-screen bg-[var(--bg-canvas)]">{children}</main>;
  }

  const isAdmin = session?.user?.role === "admin";
  const userName = session?.user?.name || "Student";
  const userEmail = session?.user?.email || "";
  const avatarSeed = userName || userEmail || "Student";

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] flex flex-col lg:flex-row text-ink-fg">
      {/* -------------------------------------------------------------------
          DESKTOP SIDEBAR (lg and above)
      -------------------------------------------------------------------- */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:fixed lg:inset-y-0 z-40 bg-surface-white border-r border-border">
        {/* Sidebar Header / Logo */}
        <div className="h-[var(--app-bar-h)] flex items-center px-4 border-b border-border">
          <BrandLogo size="md" />
        </div>

        {/* Navigation Sections */}
        <div className="workbook-scrollbar flex-1 overflow-y-auto px-2.5 py-4 space-y-4">
          {NAV_SECTIONS.map((section, sIndex) => {
            const filteredItems = section.items.filter((item) => !item.adminOnly || isAdmin);
            if (filteredItems.length === 0) return null;

            return (
              <div key={section.heading ?? `sec-${sIndex}`} className="space-y-1">
                {section.heading && (
                  <p className="px-2.5 pb-1 text-[0.62rem] font-bold uppercase tracking-[0.08em] text-ink-muted">
                    {section.heading}
                  </p>
                )}
                {filteredItems.map((item) => {
                  const isActive =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`relative flex items-center gap-2.5 px-2.5 py-2 rounded-[var(--ui-radius-sm)] text-[0.88rem] font-semibold transition-all duration-150 workbook-press ${
                        isActive
                          ? "nav-icon-host-active border border-transparent bg-brand-tint text-ink-fg shadow-[var(--ui-shadow-xs)]"
                          : "border border-transparent text-ink-muted hover:text-ink-fg hover:bg-paper-bg"
                      }`}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      <span className="flex-1 truncate">{item.name}</span>
                      {item.adminOnly && (
                        <Badge variant="brand" size="sm">
                          Admin
                        </Badge>
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Collapsed User Card with Menu */}
        <div className="border-t border-border p-2.5 relative" ref={userMenuRef}>
          {session ? (
            <>
              <button
                type="button"
                onClick={() => setUserMenuOpen((prev) => !prev)}
                className="workbook-press flex w-full items-center gap-2.5 rounded-[var(--ui-radius-sm)] border border-transparent px-2 py-1.5 text-left hover:bg-paper-bg transition-colors"
                aria-expanded={userMenuOpen}
                aria-label="User account menu"
              >
                <UserAvatar seed={avatarSeed} className="h-8 w-8 text-xs" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-[0.9rem] font-bold leading-tight tracking-tight text-ink-fg">
                    {userName}
                  </p>
                  <p className="mt-0.5 text-[0.72rem] text-ink-muted truncate">
                    {isAdmin ? "Admin Role" : "Student"}
                  </p>
                </div>
                <ChevronsUpDown className="h-4 w-4 shrink-0 text-ink-muted" />
              </button>

              {/* Popover Menu */}
              {userMenuOpen && (
                <div className="absolute bottom-full left-2.5 right-2.5 mb-2 rounded-[var(--ui-radius)] border border-border bg-surface-white p-1.5 shadow-[var(--ui-shadow-lg)] z-50">
                  <div className="flex items-center gap-2.5 border-b border-border px-2 pb-2.5 pt-1.5">
                    <UserAvatar seed={avatarSeed} className="h-9 w-9 text-xs" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-[0.9rem] font-bold leading-tight tracking-tight text-ink-fg">
                        {userName}
                      </p>
                      <p className="text-[0.72rem] text-ink-muted truncate">{userEmail}</p>
                    </div>
                  </div>

                  <div className="pt-1.5 space-y-0.5">
                    <Link
                      href="/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="workbook-press flex w-full items-center gap-2.5 rounded-[var(--ui-radius-sm)] px-2 py-2 text-xs font-semibold text-ink-fg hover:bg-paper-bg transition-colors"
                    >
                      <Settings className="h-4 w-4 shrink-0 text-ink-muted" />
                      <span>Settings</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        signOut({ callbackUrl: "/auth" });
                      }}
                      className="workbook-press flex w-full items-center gap-2.5 rounded-[var(--ui-radius-sm)] px-2 py-2 text-xs font-semibold text-[var(--state-danger)] hover:bg-[#fdede8] transition-colors cursor-pointer"
                    >
                      <LogOut className="h-4 w-4 shrink-0" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </>
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
      <header className="lg:hidden sticky top-0 z-30 h-14 bg-surface-white border-b border-border px-4 flex items-center justify-between">
        <BrandLogo size="sm" />
        <div className="flex items-center gap-2">
          {session ? (
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex items-center gap-2 p-1.5 rounded-[var(--ui-radius-sm)] border border-border bg-paper-bg cursor-pointer workbook-press"
              aria-label="Toggle navigation menu"
            >
              <UserAvatar seed={avatarSeed} className="h-6 w-6 text-[10px]" />
              <Menu className="w-4 h-4 text-ink-fg" />
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
          MOBILE SLIDE-OVER DRAWER
      -------------------------------------------------------------------- */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-[#1c1917]/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative ml-auto w-72 max-w-[80vw] bg-surface-white h-full shadow-[var(--ui-shadow-lg)] flex flex-col p-5">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2.5">
                <UserAvatar seed={avatarSeed} className="h-8 w-8 text-xs" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-ink-fg leading-tight truncate">
                    {userName}
                  </p>
                  <p className="text-xs text-ink-muted truncate max-w-[140px]">{userEmail}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-[var(--ui-radius-sm)] text-ink-muted hover:bg-paper-bg cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
              {NAV_SECTIONS.flatMap((s) => s.items)
                .filter((item) => !item.adminOnly || isAdmin)
                .map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-[var(--ui-radius-sm)] text-sm font-semibold transition ${
                        isActive
                          ? "bg-brand-tint text-ink-fg"
                          : "text-ink-muted hover:bg-paper-bg hover:text-ink-fg"
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0 text-brand-strong" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              <Link
                href="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-[var(--ui-radius-sm)] text-sm font-semibold text-ink-muted hover:bg-paper-bg"
              >
                <Settings className="w-4 h-4 shrink-0" />
                <span>Settings</span>
              </Link>
            </nav>

            <div className="pt-4 border-t border-border">
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
          MAIN CONTENT AREA (with subtle page fade)
      -------------------------------------------------------------------- */}
      <div className="flex-1 lg:pl-60 flex flex-col min-h-screen">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-8 transition-opacity duration-200">
          {children}
        </main>
      </div>

      {/* -------------------------------------------------------------------
          MOBILE BOTTOM TAB BAR
      -------------------------------------------------------------------- */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 h-16 bg-surface-white border-t border-border flex items-center justify-around px-2 shadow-[0_-1px_3px_rgba(28,25,23,0.04)]">
        {[
          { name: "Home", href: "/", icon: NavHomeIcon },
          { name: "Practice", href: "/practice", icon: NavPracticeIcon },
          { name: "Results", href: "/results", icon: NavResultsIcon },
          { name: "Vocab", href: "/vocab", icon: NavVocabIcon },
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
              className={`flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-semibold transition-colors ${
                isActive ? "text-brand-strong" : "text-ink-muted hover:text-ink-fg"
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
          className="flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-semibold text-ink-muted hover:text-ink-fg cursor-pointer"
        >
          <MoreHorizontal className="w-5 h-5 mb-0.5" />
          <span>More</span>
        </button>
      </nav>
    </div>
  );
}

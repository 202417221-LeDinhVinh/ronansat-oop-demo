"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import BrandLogo from "@/components/BrandLogo";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import api from "@/lib/axios";
import { API_PATHS } from "@/lib/apiPaths";

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        const res = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (res?.error) {
          setError(res.error);
        } else {
          router.push("/");
          router.refresh();
        }
      } else {
        const regRes = await api.post(API_PATHS.AUTH_REGISTER, {
          email,
          password,
          name,
        });

        if (regRes.status === 200 || regRes.status === 201) {
          const loginRes = await signIn("credentials", {
            email,
            password,
            redirect: false,
          });
          if (loginRes?.error) {
            setError(loginRes.error);
          } else {
            router.push("/");
            router.refresh();
          }
        } else {
          setError(regRes.data?.message || "Registration failed");
        }
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "An unexpected authentication error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setIsLogin(true);
    setError("");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-canvas">
      <div className="w-full max-w-md">
        {/* Brand Logo Header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <BrandLogo size="lg" />
          <p className="mt-2.5 text-xs text-ink-muted">
            The studio platform for Digital SAT practice and diagnostics.
          </p>
        </div>

        {/* Main Auth Card */}
        <div className="workbook-panel p-6 sm:p-8 brutal-shadow-md">
          <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
            <div>
              <h2 className="text-xl font-black text-ink-fg font-display tracking-tight">
                {isLogin ? "Sign in to RonanSAT" : "Create your account"}
              </h2>
              <p className="text-xs text-ink-muted mt-0.5">
                {isLogin
                  ? "Enter your credentials to continue"
                  : "Join to practice and track mistakes"}
              </p>
            </div>
            <Badge variant="brand">{isLogin ? "Login" : "Register"}</Badge>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-[var(--ui-radius-sm)] bg-[#fdede8] border border-[#f8c4b4] text-[#ab3d19] text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Mercer"
                  className="workbook-input w-full bg-surface-white"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@ronansat.com"
                className="workbook-input w-full bg-surface-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="workbook-input w-full bg-surface-white"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full mt-2"
            >
              {isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          {/* Toggle Login / Register */}
          <div className="mt-6 pt-4 border-t border-border text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
              }}
              className="text-xs font-semibold text-brand-strong hover:underline cursor-pointer"
            >
              {isLogin
                ? "Don't have an account? Create one now"
                : "Already have an account? Sign in here"}
            </button>
          </div>
        </div>

        {/* Demo Accounts Quick-Fill Helper */}
        <div className="mt-4 p-4 rounded-[var(--ui-radius)] border border-border bg-surface-white brutal-shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted mb-2.5 text-center">
            Quick-Fill Demo Credentials
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleFillDemo("student@ronansat.com", "StudentPassword123!")}
              className="p-2.5 rounded-[var(--ui-radius-sm)] border border-border bg-canvas hover:border-brand hover:bg-brand-tint/40 text-left transition-colors cursor-pointer workbook-press"
            >
              <div className="text-xs font-bold text-ink-fg">Demo Student</div>
              <div className="text-[11px] text-ink-muted font-mono">student@ronansat.com</div>
            </button>
            <button
              type="button"
              onClick={() => handleFillDemo("admin@ronansat.com", "AdminPassword123!")}
              className="p-2.5 rounded-[var(--ui-radius-sm)] border border-border bg-canvas hover:border-brand hover:bg-brand-tint/40 text-left transition-colors cursor-pointer workbook-press"
            >
              <div className="text-xs font-bold text-ink-fg">Demo Admin</div>
              <div className="text-[11px] text-ink-muted font-mono">admin@ronansat.com</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

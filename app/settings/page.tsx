"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { User, Lock, Save, CheckCircle2, AlertCircle, Shield } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Loading from "@/components/Loading";
import api from "@/lib/axios";
import { API_PATHS } from "@/lib/apiPaths";

export default function SettingsPage() {
  const { data: session, status, update } = useSession();

  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (session?.user?.name) {
      setName(session.user.name);
    }
  }, [session]);

  if (status === "loading") {
    return <Loading message="Loading profile settings..." />;
  }

  if (status === "unauthenticated" || !session) {
    return (
      <div className="py-16 text-center space-y-4 max-w-md mx-auto">
        <div className="w-14 h-14 rounded-full bg-[#fdede8] border border-[#f8c4b4] text-[var(--state-danger)] flex items-center justify-center mx-auto shadow-sm">
          <AlertCircle className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-black text-ink-fg font-display">Please Sign In</h2>
          <p className="text-sm text-ink-muted leading-relaxed">
            You must be signed in to manage your account settings.
          </p>
        </div>
        <Link href="/auth">
          <Button variant="primary" size="sm">
            Sign In
          </Button>
        </Link>
      </div>
    );
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setProfileMessage(null);

    try {
      const res = await api.put(API_PATHS.USER_SETTINGS, { name });
      if (res.status === 200) {
        setProfileMessage({ type: "success", text: "Profile name updated successfully!" });
        await update({ name });
      } else {
        setProfileMessage({
          type: "error",
          text: res.data?.error || "Failed to update profile name.",
        });
      }
    } catch (err: any) {
      setProfileMessage({
        type: "error",
        text: err.response?.data?.error || "Failed to update profile.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "New passwords do not match." });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({
        type: "error",
        text: "New password must be at least 6 characters.",
      });
      return;
    }

    try {
      setIsPasswordSaving(true);
      const res = await api.post(API_PATHS.USER_PASSWORD, {
        currentPassword,
        newPassword,
      });

      if (res.status === 200) {
        setPasswordMessage({ type: "success", text: "Password changed successfully!" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordMessage({
          type: "error",
          text: res.data?.error || "Failed to update password.",
        });
      }
    } catch (err: any) {
      setPasswordMessage({
        type: "error",
        text: err.response?.data?.error || "Failed to change password.",
      });
    } finally {
      setIsPasswordSaving(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-3xl mx-auto">
      <PageHeader
        title="Account &amp; Security Settings"
        description="Manage your profile name, account credentials, and platform role."
        badge={
          <Badge variant={session.user?.role === "admin" ? "brand" : "info"}>
            {session.user?.role || "student"} role
          </Badge>
        }
      />

      {/* Profile Details Card */}
      <div className="workbook-panel p-5 sm:p-6 space-y-5">
        <div className="pb-3 border-b border-border">
          <h3 className="text-base font-bold text-ink-fg font-display flex items-center gap-2">
            <User className="w-4 h-4 text-brand-strong" />
            Profile Details
          </h3>
          <p className="text-xs text-ink-muted mt-0.5">
            Update your public display name.
          </p>
        </div>

        {profileMessage && (
          <div
            className={`p-3 rounded-[var(--ui-radius-sm)] text-xs font-semibold flex items-center gap-2 ${
              profileMessage.type === "success"
                ? "bg-[#e8f7f0] border border-[#b2e5ce] text-[#166e4b]"
                : "bg-[#fdede8] border border-[#f8c4b4] text-[#ab3d19]"
            }`}
          >
            {profileMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{profileMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
              Email Address (Fixed)
            </label>
            <input
              type="email"
              disabled
              value={session.user?.email || ""}
              className="workbook-input w-full bg-canvas text-ink-muted cursor-not-allowed font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className="workbook-input w-full bg-surface-white"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <Button variant="primary" size="sm" type="submit" loading={isSaving}>
              <Save className="w-3.5 h-3.5 mr-1.5" />
              <span>Save Profile Name</span>
            </Button>
          </div>
        </form>
      </div>

      {/* Change Password Card */}
      <div className="workbook-panel p-5 sm:p-6 space-y-5">
        <div className="pb-3 border-b border-border">
          <h3 className="text-base font-bold text-ink-fg font-display flex items-center gap-2">
            <Lock className="w-4 h-4 text-brand-strong" />
            Security &amp; Password
          </h3>
          <p className="text-xs text-ink-muted mt-0.5">
            Change your account password.
          </p>
        </div>

        {passwordMessage && (
          <div
            className={`p-3 rounded-[var(--ui-radius-sm)] text-xs font-semibold flex items-center gap-2 ${
              passwordMessage.type === "success"
                ? "bg-[#e8f7f0] border border-[#b2e5ce] text-[#166e4b]"
                : "bg-[#fdede8] border border-[#f8c4b4] text-[#ab3d19]"
            }`}
          >
            {passwordMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{passwordMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
              Current Password
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••••••"
              className="workbook-input w-full bg-surface-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="workbook-input w-full bg-surface-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="workbook-input w-full bg-surface-white"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              variant="secondary"
              size="sm"
              type="submit"
              loading={isPasswordSaving}
            >
              Update Password
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

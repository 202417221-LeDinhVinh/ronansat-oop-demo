"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { User, Lock, Save, CheckCircle2, AlertCircle, Shield } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
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
      <div className="py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-[var(--state-danger)] mx-auto" />
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Please Sign In</h2>
        <p className="text-sm text-[var(--text-muted)]">
          You must be signed in to manage your account settings.
        </p>
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
    <div className="space-y-6 sm:space-y-8 max-w-3xl">
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
      <Card>
        <div className="pb-3 border-b border-[var(--border-subtle)] mb-5">
          <h3 className="text-base font-bold text-[var(--text-primary)] font-display flex items-center gap-2">
            <User className="w-4 h-4 text-[var(--accent-brand-strong)]" />
            Profile Details
          </h3>
          <p className="text-xs text-[var(--text-muted)]">
            Update your public display name.
          </p>
        </div>

        {profileMessage && (
          <div
            className={`mb-4 p-3 rounded-[var(--ui-radius-sm)] text-xs font-semibold flex items-center gap-2 ${
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
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
              Email Address (Fixed)
            </label>
            <input
              type="email"
              disabled
              value={session.user?.email || ""}
              className="workbook-input bg-[var(--bg-canvas)] text-[var(--text-muted)] cursor-not-allowed font-mono"
            />
          </div>

          <div>
            <Input
              label="Full Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <Button variant="primary" size="sm" type="submit" loading={isSaving}>
              <Save className="w-3.5 h-3.5 mr-1" />
              <span>Save Profile Name</span>
            </Button>
          </div>
        </form>
      </Card>

      {/* Change Password Card */}
      <Card>
        <div className="pb-3 border-b border-[var(--border-subtle)] mb-5">
          <h3 className="text-base font-bold text-[var(--text-primary)] font-display flex items-center gap-2">
            <Lock className="w-4 h-4 text-[var(--accent-brand-strong)]" />
            Security &amp; Password
          </h3>
          <p className="text-xs text-[var(--text-muted)]">
            Change your account password.
          </p>
        </div>

        {passwordMessage && (
          <div
            className={`mb-4 p-3 rounded-[var(--ui-radius-sm)] text-xs font-semibold flex items-center gap-2 ${
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
          <Input
            label="Current Password"
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••••••••"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="New Password"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••••••"
            />
            <Input
              label="Confirm New Password"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
            />
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
      </Card>
    </div>
  );
}

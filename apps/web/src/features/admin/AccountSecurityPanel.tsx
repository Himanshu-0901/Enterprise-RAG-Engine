"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SectionPanel } from "@/components/ui/SectionPanel";
import { authClient } from "@/lib/auth-client";
import type { ApiSession } from "@/lib/api-client";

type AccountSecurityPanelProps = {
  session: ApiSession;
};

export function AccountSecurityPanel({ session }: AccountSecurityPanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  return (
    <SectionPanel
      title="Account security"
      description="Update the password for the currently signed-in account."
    >
      {error ? (
        <p className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {success}
        </p>
      ) : null}

      <form
        className="grid gap-3 lg:grid-cols-[1fr_1fr_auto]"
        onSubmit={async (event) => {
          event.preventDefault();
          setError(null);
          setSuccess(null);
          setIsSaving(true);
          const form = event.currentTarget;
          const data = Object.fromEntries(new FormData(form));

          try {
            await authClient.changePassword(session, {
              currentPassword: String(data.currentPassword),
              newPassword: String(data.newPassword)
            });
            form.reset();
            setSuccess("Password updated.");
          } catch (caughtError) {
            setError(
              caughtError instanceof Error
                ? caughtError.message
                : "Password update failed"
            );
          } finally {
            setIsSaving(false);
          }
        }}
      >
        <PasswordField label="Current password" name="currentPassword" />
        <PasswordField label="New password" name="newPassword" />
        <div className="flex items-end">
          <Button disabled={isSaving} type="submit">
            <KeyRound aria-hidden className="h-4 w-4" />
            {isSaving ? "Saving..." : "Change"}
          </Button>
        </div>
      </form>
    </SectionPanel>
  );
}

function PasswordField({ label, name }: { label: string; name: string }) {
  return (
    <label className="grid gap-1 text-sm font-medium text-zinc-700">
      {label}
      <input
        required
        className="h-9 rounded-md border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-500"
        minLength={8}
        name={name}
        type="password"
      />
    </label>
  );
}

"use client";

import { useState } from "react";
import { KeyRound, LogIn, RotateCcw, UserPlus, Wrench } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { authClient, type AuthResult } from "@/lib/auth-client";
import type { ApiSession } from "@/lib/api-client";

export type AuthMode = "login" | "signup" | "invite" | "reset" | "dev";

export function ModeButton({
  active,
  children,
  onClick
}: {
  active: boolean;
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={
        active
          ? "rounded-md bg-white px-3 py-2 text-sm font-medium text-zinc-950 shadow-sm"
          : "rounded-md px-3 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-950"
      }
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function AuthForm({
  inviteToken,
  mode,
  onError,
  onSuccess
}: {
  inviteToken: string;
  mode: Exclude<AuthMode, "dev" | "reset">;
  onError: (message: string | null) => void;
  onSuccess: (result: AuthResult) => void;
}) {
  return (
    <form
      className="grid gap-3"
      onSubmit={async (event) => {
        event.preventDefault();
        onError(null);
        const data = Object.fromEntries(new FormData(event.currentTarget));

        try {
          const result =
            mode === "signup"
              ? await authClient.signup({
                  email: String(data.email),
                  name: String(data.name),
                  password: String(data.password),
                  plan: "starter",
                  tenantName: String(data.tenantName),
                  tenantSlug: String(data.tenantSlug)
                })
              : mode === "invite"
                ? await authClient.acceptInvite({
                    name: String(data.name || ""),
                    password: String(data.password),
                    token: String(data.token)
                  })
                : await authClient.login({
                    email: String(data.email),
                    password: String(data.password),
                    tenantSlug: String(data.tenantSlug)
                  });
          onSuccess(result);
        } catch (caughtError) {
          onError(caughtError instanceof Error ? caughtError.message : "Auth failed");
        }
      }}
    >
      {mode !== "invite" ? <TextField label="Tenant slug" name="tenantSlug" /> : null}
      {mode === "signup" ? <TextField label="Tenant name" name="tenantName" /> : null}
      {mode !== "login" ? <TextField label="Name" name="name" /> : null}
      {mode !== "invite" ? <TextField label="Email" name="email" type="email" /> : null}
      {mode === "invite" ? (
        <TextField defaultValue={inviteToken} label="Invite token" name="token" />
      ) : null}
      <TextField label="Password" name="password" type="password" />
      <Button type="submit" className="mt-2">
        {mode === "signup" ? (
          <UserPlus aria-hidden className="h-4 w-4" />
        ) : mode === "invite" ? (
          <KeyRound aria-hidden className="h-4 w-4" />
        ) : (
          <LogIn aria-hidden className="h-4 w-4" />
        )}
        Continue
      </Button>
    </form>
  );
}

export function PasswordResetForm({
  onError
}: {
  onError: (message: string | null) => void;
}) {
  const [resetToken, setResetToken] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  return (
    <form
      className="grid gap-3"
      onSubmit={async (event) => {
        event.preventDefault();
        onError(null);
        const data = Object.fromEntries(new FormData(event.currentTarget));

        try {
          if (resetToken) {
            await authClient.confirmPasswordReset({
              password: String(data.password),
              token: String(data.token)
            });
            setStatus("Password changed. You can now log in.");
            setResetToken("");
            return;
          }

          const result = await authClient.requestPasswordReset({
            email: String(data.email)
          });
          setResetToken(result.resetToken ?? "");
          setStatus("Reset token generated for this local environment.");
        } catch (caughtError) {
          onError(caughtError instanceof Error ? caughtError.message : "Reset failed");
        }
      }}
    >
      {status ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {status}
        </p>
      ) : null}
      {resetToken ? (
        <>
          <TextField defaultValue={resetToken} label="Reset token" name="token" />
          <TextField label="New password" name="password" type="password" />
        </>
      ) : (
        <TextField label="Email" name="email" type="email" />
      )}
      <Button type="submit" className="mt-2">
        <RotateCcw aria-hidden className="h-4 w-4" />
        {resetToken ? "Set password" : "Request reset"}
      </Button>
    </form>
  );
}

export function DevSessionForm({
  defaultSession,
  onSuccess
}: {
  defaultSession: ApiSession;
  onSuccess: (session: ApiSession) => void;
}) {
  return (
    <form
      className="grid gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(event.currentTarget));
        onSuccess({
          tenantId: String(data.tenantId),
          userId: String(data.userId)
        });
      }}
    >
      <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
        Local development only. This uses tenant/user headers for seeded demo data.
      </p>
      <TextField
        defaultValue={defaultSession.tenantId}
        label="Tenant ID"
        name="tenantId"
      />
      <TextField defaultValue={defaultSession.userId} label="User ID" name="userId" />
      <Button type="submit" className="mt-2">
        <Wrench aria-hidden className="h-4 w-4" />
        Open workspace
      </Button>
    </form>
  );
}

function TextField({
  label,
  name,
  defaultValue,
  type = "text"
}: {
  defaultValue?: string;
  label: string;
  name: string;
  type?: string;
}) {
  return (
    <label className="grid gap-1 text-sm font-medium text-zinc-700">
      {label}
      <input
        required
        className="h-10 rounded-md border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-400"
        defaultValue={defaultValue}
        name={name}
        type={type}
      />
    </label>
  );
}

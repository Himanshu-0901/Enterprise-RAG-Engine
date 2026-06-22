"use client";

import { useEffect, useState } from "react";
import { AdminDashboard } from "@/features/admin/AdminDashboard";
import {
  AuthForm,
  DevSessionForm,
  ModeButton,
  PasswordResetForm,
  type AuthMode
} from "@/features/auth/AuthForms";
import { authClient, type AuthResult } from "@/lib/auth-client";
import type { ApiSession } from "@/lib/api-client";
import { EndUserPortal } from "@/features/portal/EndUserPortal";
import { useAppDispatch, useAppSelector } from "@/hooks/store";
import { setSession as setReduxSession, logout as reduxLogout } from "@/store/slices/authSlice";

const authStorageKey = "rag-llm-auth-session";
const demoSession: ApiSession = {
  tenantId: "e4aa1e75-fb92-462f-abbe-a6f366556c2a",
  userId: "876c4449-1c1d-43c8-8031-35845e95313f"
};

export function AuthGateway() {
  const [error, setError] = useState<string | null>(null);
  const [inviteToken, setInviteToken] = useState("");
  const [mode, setMode] = useState<AuthMode>("login");
  
  const dispatch = useAppDispatch();
  const session = useAppSelector((state) => state.auth.session);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("inviteToken");
    if (token) {
      setInviteToken(token);
      setMode("invite");
    }

    const stored = window.localStorage.getItem(authStorageKey);
    if (stored) {
      dispatch(setReduxSession(JSON.parse(stored) as ApiSession));
    }
  }, [dispatch]);

  const completeAuth = (result: AuthResult) => {
    window.localStorage.setItem(authStorageKey, JSON.stringify(result.session));
    dispatch(setReduxSession(result.session));
  };

  const completeDevSession = (nextSession: ApiSession) => {
    window.localStorage.setItem(authStorageKey, JSON.stringify(nextSession));
    dispatch(setReduxSession(nextSession));
  };

  const signOut = async () => {
    const currentSession = session;
    window.localStorage.removeItem(authStorageKey);
    dispatch(reduxLogout());

    if (!currentSession?.token) {
      return;
    }

    try {
      await authClient.logout(currentSession);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Session revoke failed"
      );
    }
  };

  if (session) {
    if (session.role === "end_user") {
      return <EndUserPortal session={session} onLogout={() => void signOut()} />;
    }

    return (
      <AdminDashboard
        initialSession={session}
        onLogout={() => {
          void signOut();
        }}
      />
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-10">
      <section className="w-full max-w-4xl rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-medium text-zinc-500">
              White-label RAG SaaS
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-zinc-950">
              Sign in or create a tenant workspace
            </h1>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              Use a tenant slug and password to access a real session. Admins can
              invite end users, and invitees can activate their account here.
            </p>
          </div>
          <div>
            <div className="mb-5 grid grid-cols-5 rounded-lg bg-zinc-100 p-1">
              <ModeButton active={mode === "login"} onClick={() => setMode("login")}>
                Login
              </ModeButton>
              <ModeButton active={mode === "signup"} onClick={() => setMode("signup")}>
                Signup
              </ModeButton>
              <ModeButton active={mode === "invite"} onClick={() => setMode("invite")}>
                Invite
              </ModeButton>
              <ModeButton active={mode === "reset"} onClick={() => setMode("reset")}>
                Reset
              </ModeButton>
              <ModeButton active={mode === "dev"} onClick={() => setMode("dev")}>
                Dev
              </ModeButton>
            </div>
            {error ? (
              <p className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </p>
            ) : null}
            {mode === "dev" ? (
              <DevSessionForm
                defaultSession={demoSession}
                onSuccess={completeDevSession}
              />
            ) : mode === "reset" ? (
              <PasswordResetForm onError={setError} />
            ) : (
              <AuthForm
                inviteToken={inviteToken}
                mode={mode}
                onError={setError}
                onSuccess={completeAuth}
              />
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

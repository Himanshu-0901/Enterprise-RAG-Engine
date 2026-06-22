import type { ApiSession } from "@/lib/api-client";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

type ApiEnvelope<T> = { data: T };

export type AuthResult = {
  session: ApiSession & {
    expiresAt: string;
    role: string;
    token: string;
  };
  tenant?: {
    id: string;
    name: string;
    slug: string;
  };
  user: {
    email: string;
    id: string;
    name: string;
  };
};

const requestAuth = async <T>(path: string, body: unknown): Promise<T> => {
  const response = await fetch(`${API_URL}${path}`, {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
    method: "POST"
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error?.message ?? `Request failed: ${response.status}`);
  }

  const envelope = (await response.json()) as ApiEnvelope<T>;
  return envelope.data;
};

const requestSessionAuth = async <T>(
  path: string,
  session: ApiSession,
  body: unknown
): Promise<T> => {
  const response = await fetch(`${API_URL}${path}`, {
    body: JSON.stringify(body),
    headers: {
      authorization: session.token ? `Bearer ${session.token}` : "",
      "content-type": "application/json",
      "x-tenant-id": session.tenantId,
      "x-user-id": session.userId
    },
    method: "POST"
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error?.message ?? `Request failed: ${response.status}`);
  }

  const envelope = (await response.json()) as ApiEnvelope<T>;
  return envelope.data;
};

const requestLogout = async (session: ApiSession): Promise<void> => {
  if (!session.token) {
    return;
  }

  const response = await fetch(`${API_URL}/auth/logout`, {
    headers: { authorization: `Bearer ${session.token}` },
    method: "POST"
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error?.message ?? `Request failed: ${response.status}`);
  }
};

export const authClient = {
  acceptInvite: (input: { name?: string; password: string; token: string }) =>
    requestAuth<AuthResult>("/auth/invites/accept", input),
  changePassword: (
    session: ApiSession,
    input: { currentPassword: string; newPassword: string }
  ) =>
    requestSessionAuth<{ changed: boolean }>(
      "/auth/password/change",
      session,
      input
    ),
  confirmPasswordReset: (input: { password: string; token: string }) =>
    requestAuth<{ changed: boolean }>("/auth/password/reset/confirm", input),
  login: (input: { email: string; password: string; tenantSlug: string }) =>
    requestAuth<AuthResult>("/auth/login", input),
  logout: requestLogout,
  requestPasswordReset: (input: { email: string }) =>
    requestAuth<{
      expiresAt: string | null;
      resetToken: string | null;
      sent: boolean;
    }>("/auth/password/reset/request", input),
  signup: (input: {
    email: string;
    name: string;
    password: string;
    plan: "starter" | "pro" | "enterprise";
    tenantName: string;
    tenantSlug: string;
  }) => requestAuth<AuthResult>("/auth/signup", input)
};

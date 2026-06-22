import type { ApiMemberRole, ApiSession } from "@/lib/api-client";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

type ApiEnvelope<T> = { data: T };

export type ApiProfile = {
  email: string;
  id: string;
  name: string;
  role: ApiMemberRole | "platform_admin";
  tenantId: string;
  userId: string;
};

export type ApiAuthSession = {
  createdAt: string;
  expiresAt: string;
  id: string;
  isCurrent: boolean;
};

const authHeaders = (session: ApiSession): HeadersInit => ({
  ...(session.token ? { authorization: `Bearer ${session.token}` } : {}),
  "x-tenant-id": session.tenantId,
  "x-user-id": session.userId
});

export const getProfile = async (session: ApiSession): Promise<ApiProfile> => {
  const response = await fetch(`${API_URL}/auth/profile`, {
    headers: authHeaders(session)
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error?.message ?? `Request failed: ${response.status}`);
  }

  const envelope = (await response.json()) as ApiEnvelope<ApiProfile>;
  return envelope.data;
};

export const listAuthSessions = async (
  session: ApiSession
): Promise<ApiAuthSession[]> => {
  const response = await fetch(`${API_URL}/auth/profile/sessions`, {
    headers: authHeaders(session)
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error?.message ?? `Request failed: ${response.status}`);
  }

  const envelope = (await response.json()) as ApiEnvelope<ApiAuthSession[]>;
  return envelope.data;
};

export const revokeOtherSessions = async (
  session: ApiSession
): Promise<{ revoked: boolean }> => {
  const response = await fetch(`${API_URL}/auth/profile/sessions/revoke-others`, {
    headers: authHeaders(session),
    method: "POST"
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error?.message ?? `Request failed: ${response.status}`);
  }

  const envelope = (await response.json()) as ApiEnvelope<{ revoked: boolean }>;
  return envelope.data;
};

import type {
  ApiMember,
  ApiMemberRole,
  ApiMemberStatus,
  ApiSession
} from "@/lib/api-client";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

type ApiEnvelope<T> = { data: T };

export type ApiInviteResult = {
  inviteToken: string;
  inviteUrl: string;
  membership: unknown;
  user: unknown;
};

export type ApiEmailMessage = {
  body: string;
  createdAt: string;
  id: string;
  recipientEmail: string;
  subject: string;
};

const authHeaders = (session: ApiSession): HeadersInit => ({
  ...(session.token ? { authorization: `Bearer ${session.token}` } : {}),
  "x-tenant-id": session.tenantId,
  "x-user-id": session.userId
});

const request = async <T>(
  session: ApiSession,
  path: string,
  init: RequestInit = {}
): Promise<T> => {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...authHeaders(session),
      ...init.headers
    }
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error?.message ?? `Request failed: ${response.status}`);
  }

  const envelope = (await response.json()) as ApiEnvelope<T>;
  return envelope.data;
};

export const memberClient = {
  invite: (
    session: ApiSession,
    input: { email: string; name: string; role: ApiMemberRole }
  ) =>
    request<ApiInviteResult>(session, "/users", {
      body: JSON.stringify(input),
      method: "POST"
    }),
  list: (session: ApiSession) => request<ApiMember[]>(session, "/users"),
  listEmailMessages: (session: ApiSession) =>
    request<ApiEmailMessage[]>(session, "/users/email-messages"),
  resendInvite: (session: ApiSession, userId: string) =>
    request<ApiInviteResult>(session, `/users/${userId}/resend-invite`, {
      method: "POST"
    }),
  revokeInvite: (session: ApiSession, userId: string) =>
    request<unknown>(session, `/users/${userId}/revoke-invite`, {
      method: "POST"
    }),
  update: (
    session: ApiSession,
    userId: string,
    input: { role?: ApiMemberRole; status?: ApiMemberStatus }
  ) =>
    request<unknown>(session, `/users/${userId}`, {
      body: JSON.stringify(input),
      method: "PATCH"
    })
};

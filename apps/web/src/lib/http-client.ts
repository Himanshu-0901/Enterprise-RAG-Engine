import type { ApiSession } from "./api-client";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

type ApiEnvelope<T> = { data: T };

const authHeaders = (session: ApiSession): HeadersInit => ({
  ...(session.token ? { authorization: `Bearer ${session.token}` } : {}),
  "x-tenant-id": session.tenantId,
  "x-user-id": session.userId
});

export const request = async <T>(
  path: string,
  init: RequestInit = {},
  session?: ApiSession
): Promise<T> => {
  const isFormData = init.body instanceof FormData;
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init.body && !isFormData ? { "content-type": "application/json" } : {}),
      ...(session ? authHeaders(session) : {}),
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

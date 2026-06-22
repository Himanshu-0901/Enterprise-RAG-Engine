import type { ApiCitation, ApiSession } from "@/lib/api-client";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

type ApiEnvelope<T> = { data: T };

export type ApiCitationSource = {
  canOpenSource?: boolean;
  citation: ApiCitation;
  content: string | null;
  fileName: string;
};

const authHeaders = (session: ApiSession): HeadersInit => ({
  ...(session.token ? { authorization: `Bearer ${session.token}` } : {}),
  "x-tenant-id": session.tenantId,
  "x-user-id": session.userId
});

export const getCitationSource = async (
  session: ApiSession,
  citationId: string
): Promise<ApiCitationSource> => {
  const response = await fetch(`${API_URL}/chat/citations/${citationId}/source`, {
    headers: authHeaders(session)
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error?.message ?? `Request failed: ${response.status}`);
  }

  const envelope = (await response.json()) as ApiEnvelope<ApiCitationSource>;
  return envelope.data;
};

export const getViewerCitationSource = async (
  session: ApiSession,
  citationId: string
): Promise<ApiCitationSource> => {
  const response = await fetch(`${API_URL}/viewer/citations/${citationId}`, {
    headers: authHeaders(session)
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error?.message ?? `Request failed: ${response.status}`);
  }

  const envelope = (await response.json()) as ApiEnvelope<ApiCitationSource>;
  return envelope.data;
};

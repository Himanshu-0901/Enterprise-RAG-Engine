import type { ApiSession } from "@/lib/api-client";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

type ApiEnvelope<T> = { data: T };

export type ApiConversationExport = {
  content: string;
  contentType: "text/markdown";
  fileName: string;
};

const authHeaders = (session: ApiSession): HeadersInit => ({
  ...(session.token ? { authorization: `Bearer ${session.token}` } : {}),
  "x-tenant-id": session.tenantId,
  "x-user-id": session.userId
});

export const exportConversation = async (
  session: ApiSession,
  conversationId: string
): Promise<ApiConversationExport> => {
  const response = await fetch(
    `${API_URL}/conversations/${conversationId}/export`,
    { headers: authHeaders(session) }
  );

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error?.message ?? `Request failed: ${response.status}`);
  }

  const envelope = (await response.json()) as ApiEnvelope<ApiConversationExport>;
  return envelope.data;
};

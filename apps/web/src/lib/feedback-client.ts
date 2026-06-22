import type { ApiSession } from "@/lib/api-client";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

type ApiEnvelope<T> = { data: T };

export type ApiMessageFeedback = {
  comment: string | null;
  createdAt: string;
  id: string;
  messageId: string;
  rating: "up" | "down";
  tenantId: string;
  updatedAt: string;
  userId: string;
};

export type ApiFeedbackInsights = {
  recentNegative: Array<{
    comment: string | null;
    conversationTitle: string;
    createdAt: string;
    messageContent: string;
    messageId: string;
    rating: "up" | "down";
    userEmail: string;
  }>;
  summary: {
    down: number;
    up: number;
  };
};

const authHeaders = (session: ApiSession): HeadersInit => ({
  ...(session.token ? { authorization: `Bearer ${session.token}` } : {}),
  "x-tenant-id": session.tenantId,
  "x-user-id": session.userId
});

export const submitMessageFeedback = async (
  session: ApiSession,
  input: { comment?: string; messageId: string; rating: "up" | "down" }
): Promise<ApiMessageFeedback> => {
  const response = await fetch(`${API_URL}/feedback`, {
    body: JSON.stringify(input),
    headers: {
      "content-type": "application/json",
      ...authHeaders(session)
    },
    method: "POST"
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error?.message ?? `Request failed: ${response.status}`);
  }

  const envelope = (await response.json()) as ApiEnvelope<ApiMessageFeedback>;
  return envelope.data;
};

export const listFeedbackInsights = async (
  session: ApiSession
): Promise<ApiFeedbackInsights> => {
  const response = await fetch(`${API_URL}/analytics/feedback`, {
    headers: authHeaders(session)
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error?.message ?? `Request failed: ${response.status}`);
  }

  const envelope = (await response.json()) as ApiEnvelope<ApiFeedbackInsights>;
  return envelope.data;
};

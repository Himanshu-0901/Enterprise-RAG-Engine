import type { ApiSession, ApiTenantBranding, ApiTenantSettings } from "@/lib/api-client";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

type ApiEnvelope<T> = { data: T };

export type ApiPortalConfig = {
  branding: ApiTenantBranding;
  settings: ApiTenantSettings;
  tenant: {
    id: string;
    name: string;
    slug: string;
    status: string;
  };
};

const authHeaders = (session: ApiSession): HeadersInit => ({
  ...(session.token ? { authorization: `Bearer ${session.token}` } : {}),
  "x-tenant-id": session.tenantId,
  "x-user-id": session.userId
});

export const getPortalConfig = async (
  session: ApiSession
): Promise<ApiPortalConfig> => {
  const response = await fetch(`${API_URL}/portal/current`, {
    headers: authHeaders(session)
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error?.message ?? `Request failed: ${response.status}`);
  }

  const envelope = (await response.json()) as ApiEnvelope<ApiPortalConfig>;
  return envelope.data;
};

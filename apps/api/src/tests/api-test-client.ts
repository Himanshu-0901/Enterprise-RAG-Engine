import assert from "node:assert/strict";
import { createDatabaseClient, deleteTenant } from "@rag-llm/db";
import { createApiServer } from "../lib/server";

type JsonObject = Record<string, unknown>;

export type TestSession = {
  expiresAt: string;
  role: string;
  tenantId: string;
  token: string;
  userId: string;
};

export type SignupResult = {
  membership: JsonObject;
  session: TestSession;
  tenant: { id: string; name: string; slug: string };
  user: { email: string; id: string; name: string };
};

export type TestServer = ReturnType<typeof createApiServer>;
export type ApiEnvelope<T> =
  | { data: T }
  | { error: { code: string; message: string } };

const testEnv: Record<string, string> = {
  ANTHROPIC_API_KEY: "test-key",
  API_PORT: "4000",
  DATABASE_URL: "postgres://rag:rag@localhost:55432/rag_llm",
  EMBEDDING_PROVIDER: "deterministic",
  LLM_PROVIDER: "deterministic",
  NODE_ENV: "test",
  OPENAI_API_KEY: "test-key",
  REDIS_URL: "redis://localhost:6379",
  S3_ACCESS_KEY_ID: "rag",
  S3_BUCKET: "rag-documents",
  S3_ENDPOINT: "http://localhost:9000",
  S3_REGION: "us-east-1",
  S3_SECRET_ACCESS_KEY: "rag-password"
};

export const ensureTestEnv = () => {
  for (const [key, value] of Object.entries(testEnv)) {
    process.env[key] ??= value;
  }
};

export const createTestServer = (): TestServer => {
  ensureTestEnv();
  return createApiServer();
};

const authHeaders = (session: TestSession): HeadersInit => ({
  authorization: `Bearer ${session.token}`,
  "x-tenant-id": session.tenantId,
  "x-user-id": session.userId
});

export const jsonRequest = async (
  server: TestServer,
  path: string,
  input: { body?: unknown; method?: string; session?: TestSession } = {}
): Promise<Response> =>
  server.app.request(path, {
    body: input.body === undefined ? undefined : JSON.stringify(input.body),
    headers: {
      ...(input.body === undefined ? {} : { "content-type": "application/json" }),
      ...(input.session ? authHeaders(input.session) : {})
    },
    method: input.method ?? "GET"
  });

export const expectData = async <T>(
  response: Response,
  status = 200
): Promise<T> => {
  assert.equal(response.status, status);
  const envelope = (await response.json()) as ApiEnvelope<T>;
  assert.ok("data" in envelope);
  return envelope.data;
};

export const expectError = async (
  response: Response,
  status: number
): Promise<string> => {
  assert.equal(response.status, status);
  const envelope = (await response.json()) as ApiEnvelope<unknown>;
  assert.ok("error" in envelope);
  return envelope.error.message;
};

export const uniqueSlug = (prefix: string): string =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const signupTenant = async (
  server: TestServer,
  prefix: string
): Promise<SignupResult> => {
  const slug = uniqueSlug(prefix);
  const response = await jsonRequest(server, "/auth/signup", {
    body: {
      email: `${slug}@example.com`,
      name: "Test Admin",
      password: "password123",
      plan: "starter",
      tenantName: `Test ${prefix}`,
      tenantSlug: slug
    },
    method: "POST"
  });

  return expectData<SignupResult>(response, 201);
};

export const deleteTenantById = async (tenantId: string): Promise<void> => {
  ensureTestEnv();
  const client = createDatabaseClient(process.env.DATABASE_URL ?? "");

  try {
    await deleteTenant(client.db, tenantId).catch(() => undefined);
  } finally {
    await client.close();
  }
};
